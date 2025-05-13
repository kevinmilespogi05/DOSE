import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email?: string;
        role?: string;
    };
}

const router = Router();

// Ensure uploads directory exists
const uploadDir = 'public/uploads/avatars';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
        }
    }
});

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

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        // Update user profile with new avatar URL
        await pool.query(
            `INSERT INTO user_profiles (user_id, avatar_url)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
             avatar_url = VALUES(avatar_url)`,
            [req.user.id, avatarUrl]
        );

        // Fetch updated profile
        const [rows] = await pool.query(
            `SELECT u.id, u.email, u.role, u.created_at,
                    COALESCE(p.first_name, '') as first_name,
                    COALESCE(p.last_name, '') as last_name,
                    COALESCE(p.phone_number, '') as phone_number,
                    COALESCE(p.address, '') as address,
                    p.avatar_url
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = ?`,
            [req.user.id]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ message: 'Error uploading avatar' });
    }
});

export default router; 