import { Router } from 'express';
import { query } from '../../../utils/db';

const router = Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await query(`
      SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        u.email as user_email,
        u.username as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await query(`
        SELECT 
          oi.medicine_id,
          oi.quantity,
          oi.unit_price,
          m.name as medicine_name
        FROM order_items oi
        LEFT JOIN medicines m ON oi.medicine_id = m.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return {
        ...order,
        items,
        user: {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email
        }
      };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Update the order status
    const result = await query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Get sales reports
router.get('/reports/sales', async (req, res) => {
  try {
    // Get daily sales for the last 7 days
    const dailySales = await query(`
      SELECT 
        DATE(created_at) as period,
        SUM(total_amount) as total
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY period DESC
    `);

    // Get monthly sales for the last 6 months
    const monthlySales = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as period,
        SUM(total_amount) as total
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY period DESC
    `);

    // Get summary statistics
    const [summary] = await query(`
      SELECT 
        COUNT(*) as orderCount,
        SUM(CASE 
          WHEN created_at >= DATE_FORMAT(NOW() ,'%Y-%m-01') 
          THEN total_amount 
          ELSE 0 
        END) as monthlyRevenue,
        AVG(total_amount) as averageOrderValue
      FROM orders
    `);

    res.json({
      dailySales,
      monthlySales,
      summary: {
        orderCount: summary.orderCount,
        monthlyRevenue: summary.monthlyRevenue || 0,
        averageOrderValue: summary.averageOrderValue || 0
      }
    });
  } catch (error) {
    console.error('Error fetching sales reports:', error);
    res.status(500).json({ message: 'Error fetching sales reports' });
  }
});

export default router; 