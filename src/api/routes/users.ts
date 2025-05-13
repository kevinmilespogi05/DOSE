import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/database';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email?: string;
        role?: string;
    };
}

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // First, ensure user profile exists
        await pool.query(
            `INSERT IGNORE INTO user_profiles (user_id) VALUES (?)`,
            [req.user.id]
        );

        // Then fetch the profile
        const [rows] = await pool.query(
            `SELECT u.id, u.email, u.role, u.created_at,
                    COALESCE(p.first_name, '') as first_name,
                    COALESCE(p.last_name, '') as last_name,
                    COALESCE(p.phone_number, '') as phone_number,
                    COALESCE(p.address, '') as address
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { first_name, last_name, phone_number, address } = req.body;

        await pool.query(
            `INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, address)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             first_name = VALUES(first_name),
             last_name = VALUES(last_name),
             phone_number = VALUES(phone_number),
             address = VALUES(address)`,
            [req.user.id, first_name, last_name, phone_number, address]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router; 