import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import pool from './config/database.js';
import mfaRoutes from './routes/mfa.js';
import { authenticateToken } from './middleware/auth.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';

// Load environment variables first
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Test database connection before loading routes
const initializeServer = async () => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();

    // Import routes after database is initialized
    const authRoutes = await import('./routes/auth.js');
    const orderRoutes = await import('./routes/orders.js');
    const paymentRoutes = await import('./routes/payments.js');
    const userProfileRoutes = await import('./routes/userProfile.js');
    const usersRoutes = await import('./routes/users.js');
    const inventoryRoutes = await import('./routes/inventory.js');
    const chatRoutes = await import('./routes/chat.js');

    // Routes
    app.use('/api/auth', authRoutes.default);
    app.use('/api/mfa', mfaRoutes);
    app.use('/api/user-profile', authenticateToken, userProfileRoutes.default);
    app.use('/api/users', authenticateToken, usersRoutes.default);
    app.use('/api/chat', authenticateToken, chatRoutes.default);
    app.use('/api/orders', authenticateToken, orderRoutes.default);
    app.use('/api/payments', authenticateToken, paymentRoutes.default);
    app.use('/api/inventory', authenticateToken, inventoryRoutes.default);
    app.use('/api', reviewRoutes);
    app.use('/api', wishlistRoutes);

    // Serve uploaded files
    app.use('/uploads', express.static('public/uploads'));
    app.use(express.static('public'));

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join_room', (roomId) => {
        socket.join(roomId);
      });

      socket.on('send_message', (data) => {
        io.to(data.roomId).emit('receive_message', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer();