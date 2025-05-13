import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import CONFIG from '../../config/config';
import { query } from '../../utils/db';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email?: string;
        role?: string;
    };
}

// Authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { userId: number };
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Admin middleware
export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Check if user is admin
        const [users] = await query(
            'SELECT role FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Error checking admin status' });
    }
}; 