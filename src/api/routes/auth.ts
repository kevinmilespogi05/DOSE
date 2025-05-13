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

const router = Router();

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
  body('otp').isLength({ min: 6, max: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;

      const [users] = await pool.query(
        'SELECT u.id, ms.mfa_secret FROM users u JOIN mfa_settings ms ON u.id = ms.user_id WHERE u.email = ? AND ms.is_enabled = 1',
        [email]
      );

      if (users.length === 0) {
        return res.status(400).json({ message: 'Invalid email or MFA not enabled' });
      }

      if (verifyOTP(otp, users[0].mfa_secret)) {
        const token = jwt.sign({ id: users[0].id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
        res.json({ token });
      } else {
        res.status(400).json({ message: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('MFA login verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router; 