import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import pool from './config/database.js';

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
    const carRoutes = await import('./routes/cars.js');
    const bookingRoutes = await import('./routes/bookings.js');
    const chatRoutes = await import('./routes/chat.js');
    const orderRoutes = await import('./routes/orders.js');
    const paymentRoutes = await import('./routes/payments.js');
    const { authenticateToken } = await import('./middleware/auth.js');

    // Routes
    app.use('/api/auth', authRoutes.default);
    app.use('/api/cars', authenticateToken, carRoutes.default);
    app.use('/api/bookings', authenticateToken, bookingRoutes.default);
    app.use('/api/chat', authenticateToken, chatRoutes.default);
    app.use('/api/orders', authenticateToken, orderRoutes.default);
    app.use('/api/payments', authenticateToken, paymentRoutes.default);

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