import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/database';
import { sendEmail } from '../utils/email';
import { generateOTP, verifyOTP } from '../utils/otp';
import { authenticateToken } from '../middleware/auth';
import { query, execute } from '../../utils/db';
import CONFIG from '../../config/config';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import googleConfig from '../../config/google';

interface User extends RowDataPacket {
  id: number;
  email: string;
  role: string;
  mfa_secret: string;
}

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const router = Router();

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: googleConfig.clientID,
  clientSecret: googleConfig.clientSecret,
  callbackURL: googleConfig.callbackURL,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [profile.id, profile.emails?.[0]?.value]
    );

    if (users.length > 0) {
      // Update existing user
      const user = users[0];
      await pool.query(
        `UPDATE users SET 
         google_id = ?,
         google_access_token = ?,
         google_refresh_token = ?,
         google_profile_picture = ?,
         is_google_account = 1
         WHERE id = ?`,
        [
          profile.id,
          accessToken,
          refreshToken,
          profile.photos?.[0]?.value,
          user.id
        ]
      );
      return done(null, user);
    }

    // Create new user
    const [result] = await pool.query(
      `INSERT INTO users (
        username,
        email,
        google_id,
        google_access_token,
        google_refresh_token,
        google_profile_picture,
        is_google_account,
        role
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 'user')`,
      [
        profile.displayName || profile.emails?.[0]?.value?.split('@')[0],
        profile.emails?.[0]?.value,
        profile.id,
        accessToken,
        refreshToken,
        profile.photos?.[0]?.value
      ]
    );

    const newUser = {
      id: result.insertId,
      email: profile.emails?.[0]?.value,
      role: 'user'
    };

    return done(null, newUser);
  } catch (error) {
    return done(error as Error);
  }
}));

// Google Auth Routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        CONFIG.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token
      res.redirect(`${CONFIG.FRONTEND_URL}/auth/google/success?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${CONFIG.FRONTEND_URL}/auth/google/error`);
    }
  }
);

// Forgot password request
router.post('/forgot-password', 
  body('email').isEmail().withMessage('Please enter a valid email'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if user exists
      const users = await query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

      try {
        // Update user with reset token
        await execute(
          'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
          [resetToken, resetTokenExpires, email]
        );
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        // If columns don't exist, create them
        if (dbError.code === 'ER_BAD_FIELD_ERROR') {
          await execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL
          `);
          // Retry the update
          await execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [resetToken, resetTokenExpires, email]
          );
        } else {
          throw dbError;
        }
      }

      try {
        // Send reset email
        const resetUrl = `${CONFIG.PAYMONGO.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendEmail({
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `
        });

        // Send success response without exposing the token
        res.json({ 
          message: 'If an account exists with this email, you will receive password reset instructions.'
        });
      } catch (emailError: any) {
        console.error('Email sending error:', emailError);
        res.status(500).json({ 
          message: 'Error sending email. Please try again later.',
          error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        });
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        message: 'Error processing request. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Reset password
router.post('/reset-password',
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Find user with valid reset token
      const users = await query(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
        [token]
      );

      if (users.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await execute(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashedPassword, users[0].id]
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  }
);

// Setup MFA
router.post('/setup-mfa',
  authenticateToken,
  body('mfaType').isIn(['email', 'sms', 'authenticator']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mfaType } = req.body;
      const userId = req.user.id;

      // Generate and store MFA secret
      const mfaSecret = generateOTP();
      await pool.query(
        'INSERT INTO mfa_settings (user_id, mfa_type, mfa_secret, is_enabled) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE mfa_type = ?, mfa_secret = ?, is_enabled = 0',
        [userId, mfaType, mfaSecret, mfaType, mfaSecret]
      );

      // Send OTP to user
      if (mfaType === 'email') {
        const [user] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
        await sendEmail(user[0].email, 'MFA Setup', `Your MFA code is: ${mfaSecret}`);
      } else if (mfaType === 'sms') {
        const [user] = await pool.query('SELECT phone_number FROM user_profiles WHERE user_id = ?', [userId]);
        // Implement SMS sending logic here
      }

      res.json({ message: 'MFA setup initiated', mfaType });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Verify and Enable MFA
router.post('/verify-mfa',
  authenticateToken,
  body('otp').isLength({ min: 6, max: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { otp } = req.body;
      const userId = req.user.id;

      const [mfaSettings] = await pool.query(
        'SELECT mfa_secret, mfa_type FROM mfa_settings WHERE user_id = ? AND is_enabled = 0',
        [userId]
      );

      if (mfaSettings.length === 0) {
        return res.status(400).json({ message: 'No pending MFA setup found' });
      }

      if (verifyOTP(otp, mfaSettings[0].mfa_secret)) {
        await pool.query(
          'UPDATE mfa_settings SET is_enabled = 1 WHERE user_id = ?',
          [userId]
        );
        res.json({ message: 'MFA enabled successfully' });
      } else {
        res.status(400).json({ message: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Verify MFA during login
router.post('/verify-mfa-login',
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ 
          message: 'Invalid input',
          errors: errors.array() 
        });
      }

      const { email, otp } = req.body;
      console.log('Processing MFA verification for email:', email.slice(0, 3) + '...');

      // First check if the user exists and has MFA enabled
      const [users] = await pool.query(
        'SELECT u.id, u.email, u.password_hash, u.role, m.mfa_secret FROM users u ' +
        'LEFT JOIN user_mfa m ON u.id = m.user_id ' +
        'WHERE u.email = ? AND m.is_enabled = 1',
        [email]
      );

      if (!users || users.length === 0) {
        return res.status(400).json({ message: 'User not found or MFA not enabled' });
      }

      const user = users[0];
      
      if (!user.mfa_secret) {
        return res.status(400).json({ message: 'MFA not set up for this user' });
      }

      // Verify the OTP
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: otp,
        window: 2 // Allow 1 minute window (30 seconds before and after)
      });

      console.log('MFA verification result:', verified);

      if (verified) {
        const token = jwt.sign(
          { userId: user.id, role: user.role },
          CONFIG.JWT_SECRET,
          { expiresIn: '24h' }
        );
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        });
      } else {
        res.status(400).json({ message: 'Invalid verification code' });
      }
    } catch (error) {
      console.error('MFA login verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Get user from database with MFA info
    const [users] = await pool.query(
      'SELECT u.id, u.email, u.password_hash, u.role, m.is_enabled as mfa_enabled, m.mfa_secret ' +
      'FROM users u ' +
      'LEFT JOIN user_mfa m ON u.id = m.user_id ' +
      'WHERE u.email = ?',
      [email]
    );

    if (!users || users.length === 0) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if MFA is enabled for this user
    if (user.mfa_enabled) {
      console.log('MFA is enabled for user:', email);
      return res.json({
        requiresMFA: true,
        email: user.email,
        message: 'MFA verification required'
      });
    }

    // If MFA is not enabled, create token and proceed with login
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role
      }, 
      CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Verify MFA token
router.post('/verify-mfa', async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log('Processing standalone MFA verification for email:', email.slice(0, 3) + '...');

        // Get user and MFA details
        const [users] = await pool.query(
            'SELECT u.id, u.email, u.role, m.mfa_secret FROM users u ' +
            'JOIN user_mfa m ON u.id = m.user_id ' +
            'WHERE u.email = ? AND m.is_enabled = 1',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid user or MFA not enabled' });
        }

        const user = users[0];

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: otp,
            window: 2 // Allow 1 minute window
        });

        console.log('Standalone MFA verification result:', verified);

        if (!verified) {
            return res.status(400).json({ message: 'Invalid MFA token' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            CONFIG.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({ message: 'Error verifying MFA token' });
    }
});

// Verify backup code
router.post('/verify-backup', async (req, res) => {
    try {
        const { email, code } = req.body;

        // Get user and MFA details
        const [users] = await pool.query(
            'SELECT u.id, u.email, u.role, m.backup_codes FROM users u JOIN user_mfa m ON u.id = m.user_id WHERE u.email = ? AND m.is_enabled = true',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid user or MFA not enabled' });
        }

        const user = users[0];
        const backupCodes = JSON.parse(user.backup_codes || '[]');

        // Check if the code exists in backup codes
        const codeIndex = backupCodes.indexOf(code);
        if (codeIndex === -1) {
            return res.status(400).json({ message: 'Invalid backup code' });
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await pool.query(
            'UPDATE user_mfa SET backup_codes = ? WHERE user_id = ?',
            [JSON.stringify(backupCodes), user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret'
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Backup code verification error:', error);
        res.status(500).json({ message: 'Error verifying backup code' });
    }
});

export default router; 