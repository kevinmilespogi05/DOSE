import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../config/database.js';

export const MFAService = {
  // Generate new MFA secret for a user
  async generateSecret(userId) {
    const secret = speakeasy.generateSecret({
      name: process.env.APP_NAME || 'DOSE App'
    });

    try {
      // Store the secret in the database
      await pool.query(
        'INSERT INTO mfa_settings (user_id, mfa_secret) VALUES (?, ?) ON DUPLICATE KEY UPDATE mfa_secret = ?',
        [userId, secret.base32, secret.base32]
      );

      // Generate QR code
      const otpauthUrl = secret.otpauth_url;
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl
      };
    } catch (error) {
      console.error('Error generating MFA secret:', error);
      throw new Error('Database error when generating MFA secret');
    }
  },

  // Verify MFA token
  verifyToken(secret, token) {
    try {
      return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 30 seconds window
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  },

  // Enable MFA for a user
  async enableMFA(userId, token) {
    try {
      const [rows] = await pool.query(
        'SELECT mfa_secret FROM mfa_settings WHERE user_id = ?',
        [userId]
      );

      if (!rows || rows.length === 0) {
        throw new Error('MFA secret not found');
      }

      const isValid = this.verifyToken(rows[0].mfa_secret, token);
      if (!isValid) {
        throw new Error('Invalid MFA token');
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      await pool.query(
        'UPDATE mfa_settings SET is_enabled = TRUE, backup_codes = ? WHERE user_id = ?',
        [JSON.stringify(backupCodes), userId]
      );

      return backupCodes;
    } catch (error) {
      console.error('Error enabling MFA:', error);
      throw error;
    }
  },

  // Disable MFA for a user
  async disableMFA(userId, token) {
    const [settings] = await pool.query(
      'SELECT mfa_secret FROM mfa_settings WHERE user_id = ? AND is_enabled = TRUE',
      [userId]
    );

    if (settings.length === 0) {
      throw new Error('MFA not enabled');
    }

    const isValid = this.verifyToken(settings[0].mfa_secret, token);
    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    await pool.query(
      'UPDATE mfa_settings SET is_enabled = FALSE WHERE user_id = ?',
      [userId]
    );
  },

  // Verify backup code
  async verifyBackupCode(userId, code) {
    const [settings] = await pool.query(
      'SELECT backup_codes FROM mfa_settings WHERE user_id = ? AND is_enabled = TRUE',
      [userId]
    );

    if (settings.length === 0) {
      return false;
    }

    const backupCodes = JSON.parse(settings[0].backup_codes);
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await pool.query(
      'UPDATE mfa_settings SET backup_codes = ? WHERE user_id = ?',
      [JSON.stringify(backupCodes), userId]
    );

    return true;
  },

  // Get MFA status for a user
  async getMFAStatus(userId) {
    const [settings] = await pool.query(
      'SELECT is_enabled FROM mfa_settings WHERE user_id = ?',
      [userId]
    );

    return settings.length > 0 ? settings[0].is_enabled : false;
  }
}; 