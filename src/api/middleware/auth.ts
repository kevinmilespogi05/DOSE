import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import CONFIG from '../../config/config';
import { query } from '../../utils/db';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
    id: number;
    email: string;
    role: string;
}

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email?: string;
        role?: string;
    };
}

// Authentication middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { 
            userId: number;
            role?: string;
        };
        
        if (!decoded || !decoded.userId) {
            return res.status(403).json({ message: 'Invalid token structure' });
        }

        console.log('Token decoded successfully:', decoded);

        // Set user data from token
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };

        try {
            // Verify user still exists and has correct role
            const users = await query<UserRow>(
                'SELECT id, email, role FROM users WHERE id = ?',
                [decoded.userId]
            );

            console.log('Database query result:', users);

            if (!users || users.length === 0) {
                console.error('User not found in database:', decoded.userId);
                return res.status(404).json({ message: 'User not found' });
            }

            const user = users[0];

            // Update user data with current information from database
            req.user.email = user.email;
            req.user.role = user.role;

            console.log('User data set:', req.user);
            
            next();
        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ message: 'Database error occurred' });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Admin middleware
export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log('Checking admin role for user:', req.user);

        if (req.user.role !== 'admin') {
            console.error('Non-admin user attempted to access admin route:', req.user);
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Error checking admin status' });
    }
}; 