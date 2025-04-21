import express from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create a new order
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('Received order request:', req.body);

    // Get connection from pool
    connection = await pool.getConnection();
    console.log('Database connection established');

    const { items, total_amount, user_id } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Invalid items',
        details: 'Items array is required and must not be empty'
      });
    }

    if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
      return res.status(400).json({
        error: 'Invalid total amount',
        details: 'Total amount must be a positive number'
      });
    }

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        details: 'User ID is required and must be a number'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.medicine_id || !item.quantity || !item.price_per_unit) {
        return res.status(400).json({
          error: 'Invalid item data',
          details: 'Each item must have medicine_id, quantity, and price_per_unit'
        });
      }
    }

    // Generate a unique order ID
    const orderId = uuidv4();
    console.log('Generated order ID:', orderId);

    // Start transaction
    await connection.beginTransaction();
    console.log('Transaction started');

    try {
      // Insert order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (id, user_id, total_amount, status) VALUES (?, ?, ?, ?)',
        [orderId, user_id, total_amount, 'pending_payment']
      );
      console.log('Order inserted:', orderResult);

      // Insert order items
      for (const item of items) {
        const [itemResult] = await connection.execute(
          'INSERT INTO order_items (order_id, medicine_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, item.medicine_id, item.quantity, item.price_per_unit]
        );
        console.log('Order item inserted:', itemResult);
      }

      // Commit transaction
      await connection.commit();
      console.log('Transaction committed successfully');

      res.status(201).json({
        orderId,
        message: 'Order created successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error during transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Release connection back to pool
    if (connection) {
      try {
        await connection.release();
        console.log('Connection released back to pool');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const [result] = await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Get order history for the authenticated user
router.get('/history', async (req, res) => {
  let connection;
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'User ID not found in request'
      });
    }

    const userId = req.user.id;
    console.log('Fetching order history for user:', userId);

    connection = await pool.getConnection();

    // Get orders with their items
    const [orders] = await connection.execute(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        oi.medicine_id,
        oi.quantity,
        oi.unit_price,
        m.name as medicine_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN medicines m ON oi.medicine_id = m.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    console.log('Found orders:', orders.length);

    // Group orders and their items
    const groupedOrders = orders.reduce((acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
          items: []
        };
      }
      
      if (row.medicine_id) {
        acc[row.id].items.push({
          medicine_id: row.medicine_id,
          quantity: row.quantity,
          unit_price: row.unit_price,
          medicine_name: row.medicine_name
        });
      }
      
      return acc;
    }, {});

    res.json(Object.values(groupedOrders));
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      error: 'Failed to fetch order history',
      details: error.message
    });
  } finally {
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