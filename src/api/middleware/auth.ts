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
export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            message: 'No token provided',
            details: 'Authentication token is missing'
        });
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { 
            userId: number;
            role?: string;
        };
        
        if (!decoded || !decoded.userId) {
            return res.status(403).json({ 
                message: 'Invalid token structure',
                details: 'Token payload is missing required fields'
            });
        }

        console.log('Token decoded successfully:', { userId: decoded.userId, role: decoded.role });

        // Set user data from token
        req.user = {
            id: decoded.userId, // Consistently use id instead of userId
            role: decoded.role
        };

        try {
            // Verify user still exists and has correct role
            const users = await query<UserRow>(
                'SELECT id, email, role FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!users || users.length === 0) {
                console.error('User not found in database:', decoded.userId);
                return res.status(404).json({ 
                    message: 'User not found',
                    details: 'The user associated with this token no longer exists'
                });
            }

            const user = users[0];

            // Update user data with current information from database
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            console.log('User data set:', req.user);
            
            next();
        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                message: 'Database error occurred',
                details: 'Error verifying user information'
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ 
            message: 'Invalid or expired token',
            details: 'Please log in again'
        });
    }
};

// For backward compatibility
export const authenticateToken = isAuthenticated;

// Admin middleware
export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'User not authenticated',
                details: 'Authentication required for admin access'
            });
        }

        console.log('Checking admin role for user:', req.user);

        if (req.user.role !== 'admin') {
            console.error('Non-admin user attempted to access admin route:', req.user);
            return res.status(403).json({ 
                message: 'Admin access required',
                details: 'You do not have permission to access this resource'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ 
            message: 'Error checking admin status',
            details: 'Internal server error occurred'
        });
    }
}; 