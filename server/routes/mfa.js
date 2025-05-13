import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { MFAService } from '../services/mfaService.js';

const router = express.Router();

// Generate MFA secret and QR code
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { secret, qrCode } = await MFAService.generateSecret(req.user.id);
    res.json({ secret, qrCode });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ message: 'Error setting up MFA' });
  }
});

// Enable MFA
router.post('/enable',
  authenticateToken,
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const backupCodes = await MFAService.enableMFA(req.user.id, req.body.token);
      res.json({ message: 'MFA enabled successfully', backupCodes });
    } catch (error) {
      console.error('MFA enable error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Disable MFA
router.post('/disable',
  authenticateToken,
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await MFAService.disableMFA(req.user.id, req.body.token);
      res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Verify backup code
router.post('/verify-backup',
  body('code').isLength({ min: 8, max: 8 }).isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isValid = await MFAService.verifyBackupCode(req.user.id, req.body.code);
      if (isValid) {
        res.json({ message: 'Backup code verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid backup code' });
      }
    } catch (error) {
      console.error('Backup code verification error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Get MFA status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const isEnabled = await MFAService.getMFAStatus(req.user.id);
    res.json({ isEnabled });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({ message: 'Error getting MFA status' });
  }
});

export default router; 