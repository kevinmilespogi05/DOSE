import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Verify payment
router.post('/verify', async (req, res) => {
  let connection;
  try {
    console.log('Received payment verification request:', req.body);
    const { orderId, sourceId } = req.body;

    // Validate required fields
    if (!orderId || !sourceId) {
      console.log('Missing required fields:', { orderId, sourceId });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'orderId and sourceId are required'
      });
    }

    // Get connection from pool
    connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    try {
      // Update order status to 'paid'
      const [result] = await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['paid', orderId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Order not found');
      }

      // Commit transaction
      await connection.commit();

      res.json({
        message: 'Payment verified successfully',
        orderId
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      details: error.message
    });
  } finally {
    // Release connection back to pool
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

export default router; 