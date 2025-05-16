import express from 'express';
import { pool } from '../database/connection';
import { authenticateToken } from '../middleware/auth';
import { OrderStatus } from '../types/order';

const router = express.Router();

// Get order history for authenticated user
router.get('/history', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const ordersQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'medicine_id', oi.medicine_id,
            'medicine_name', m.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN medicines m ON oi.medicine_id = m.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    const [orders] = await pool.execute(ordersQuery, [userId]);
    
    // Parse the JSON_ARRAYAGG result and ensure proper typing
    const formattedOrders = (orders as any[]).map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      // Ensure consistent status values
      status: order.status.toLowerCase().replace(' ', '_')
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Failed to fetch order history' });
  }
});

export default router; 