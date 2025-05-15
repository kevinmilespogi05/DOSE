import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../../config/database';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = Router();

// Get MFA status
router.get('/status', authenticateToken, async (req: any, res) => {
    try {
        const [settings] = await pool.query(
            'SELECT is_enabled FROM user_mfa WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            isEnabled: settings.length > 0 ? settings[0].is_enabled : false
        });
    } catch (error) {
        console.error('Error checking MFA status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Setup MFA (generate secret and QR code)
router.post('/setup', authenticateToken, async (req: any, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: 'DOSE Pharmacy'
        });

        const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

        // Store secret temporarily (not enabled yet)
        await pool.query(
            `INSERT INTO user_mfa (user_id, mfa_secret, is_enabled) 
             VALUES (?, ?, false)
             ON DUPLICATE KEY UPDATE mfa_secret = ?`,
            [req.user.id, secret.base32, secret.base32]
        );

        res.json({
            secret: secret.base32,
            qrCode
        });
    } catch (error) {
        console.error('Error setting up MFA:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Enable MFA
router.post('/enable', authenticateToken, async (req: any, res) => {
    try {
        const { token } = req.body;
        
        console.log('MFA enable request received:', { 
            userId: req.user?.id,
            requestBody: req.body,
            hasToken: !!token
        });

        // Validate token exists
        if (!token) {
            console.error('Token missing in request body for user:', req.user?.id);
            return res.status(400).json({ message: 'Token is required' });
        }

        // Get user's secret
        const [secrets] = await pool.query(
            'SELECT mfa_secret FROM user_mfa WHERE user_id = ?',
            [req.user.id]
        );

        console.log('MFA secrets query result:', { 
            secretsFound: secrets.length > 0,
            userId: req.user?.id
        });

        if (secrets.length === 0) {
            console.error('MFA not set up for user:', req.user?.id);
            return res.status(400).json({ message: 'MFA not set up' });
        }

        const secret = secrets[0].mfa_secret;

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        console.log('Token verification result:', { 
            verified, 
            tokenProvided: token,
            userId: req.user?.id
        });

        if (!verified) {
            console.error('Invalid token provided by user:', req.user?.id);
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
            Math.random().toString(36).substring(2, 10).toUpperCase()
        );

        // Enable MFA and store backup codes
        await pool.query(
            `UPDATE user_mfa 
             SET is_enabled = true,
                 backup_codes = ?
             WHERE user_id = ?`,
            [JSON.stringify(backupCodes), req.user.id]
        );

        console.log('MFA successfully enabled for user:', req.user?.id);

        res.json({
            message: 'MFA enabled successfully',
            backupCodes
        });
    } catch (error) {
        console.error('Error enabling MFA:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Disable MFA
router.post('/disable', authenticateToken, async (req: any, res) => {
    try {
        const { token } = req.body;

        // Get user's secret
        const [secrets] = await pool.query(
            'SELECT mfa_secret FROM user_mfa WHERE user_id = ?',
            [req.user.id]
        );

        if (secrets.length === 0) {
            return res.status(400).json({ message: 'MFA not enabled' });
        }

        const secret = secrets[0].mfa_secret;

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Disable MFA
        await pool.query(
            'UPDATE user_mfa SET is_enabled = false WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
        console.error('Error disabling MFA:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router; 