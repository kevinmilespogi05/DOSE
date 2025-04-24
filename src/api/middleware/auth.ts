import jwt from 'jsonwebtoken';
import CONFIG from '../../config/config';
import { query } from '../../utils/db';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Authentication middleware
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, CONFIG.JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin middleware
export const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const users = await query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 