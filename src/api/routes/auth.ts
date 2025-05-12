import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../server';
import { sendEmail } from '../utils/email';
import { generateOTP, verifyOTP } from '../utils/otp';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Password Reset Request
router.post('/forgot-password',
  body('email').isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      await pool.query(
        'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?',
        [resetToken, email]
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendEmail(email, 'Password Reset Request', `Click here to reset your password: ${resetLink}`);

      res.json({ message: 'Password reset instructions sent to your email' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Reset Password
router.post('/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };

      const [users] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
        [decoded.email, token]
      );

      if (users.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?',
        [hashedPassword, decoded.email]
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Internal server error' });
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