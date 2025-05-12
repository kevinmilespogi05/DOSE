import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../server';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [profiles] = await pool.query(
      'SELECT up.*, u.email, u.name FROM user_profiles up JOIN users u ON up.user_id = u.id WHERE up.user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile',
  authenticateToken,
  body('phone_number').optional().isMobilePhone('any'),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('state').optional().isString(),
  body('country').optional().isString(),
  body('postal_code').optional().isPostalCode('any'),
  body('preferred_payment_method').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const {
        phone_number,
        address,
        city,
        state,
        country,
        postal_code,
        preferred_payment_method
      } = req.body;

      await pool.query(
        `INSERT INTO user_profiles (
          user_id, phone_number, address, city, state, country, postal_code, preferred_payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          phone_number = VALUES(phone_number),
          address = VALUES(address),
          city = VALUES(city),
          state = VALUES(state),
          country = VALUES(country),
          postal_code = VALUES(postal_code),
          preferred_payment_method = VALUES(preferred_payment_method)`,
        [userId, phone_number, address, city, state, country, postal_code, preferred_payment_method]
      );

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get wishlist
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [items] = await pool.query(
      `SELECT m.*, w.created_at as added_at
       FROM wishlist w
       JOIN medicines m ON w.medicine_id = m.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json(items);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add to wishlist
router.post('/wishlist/:medicineId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId } = req.params;

    await pool.query(
      'INSERT IGNORE INTO wishlist (user_id, medicine_id) VALUES (?, ?)',
      [userId, medicineId]
    );

    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/:medicineId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId } = req.params;

    await pool.query(
      'DELETE FROM wishlist WHERE user_id = ? AND medicine_id = ?',
      [userId, medicineId]
    );

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order history
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [orders] = await pool.query(
      `SELECT o.*, 
              GROUP_CONCAT(
                JSON_OBJECT(
                  'id', oi.id,
                  'medicine_id', oi.medicine_id,
                  'name', oi.name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Parse the items JSON string
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      items: JSON.parse(`[${order.items}]`)
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order details
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const [orders] = await pool.query(
      `SELECT o.*, 
              GROUP_CONCAT(
                JSON_OBJECT(
                  'id', oi.id,
                  'medicine_id', oi.medicine_id,
                  'name', oi.name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = ? AND o.user_id = ?
       GROUP BY o.id`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = {
      ...orders[0],
      items: JSON.parse(`[${orders[0].items}]`)
    };

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 