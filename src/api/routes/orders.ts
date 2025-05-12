import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../server';
import { authenticateToken } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create order
router.post('/',
  authenticateToken,
  body('items').isArray(),
  body('items.*.medicine_id').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shipping_address').isString(),
  body('shipping_city').isString(),
  body('shipping_state').isString(),
  body('shipping_country').isString(),
  body('shipping_postal_code').isString(),
  body('shipping_method_id').isInt(),
  body('coupon_code').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        items,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country,
        shipping_postal_code,
        shipping_method_id,
        coupon_code
      } = req.body;

      const userId = req.user.id;
      const orderId = uuidv4();

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Calculate order total
        let totalAmount = 0;
        for (const item of items) {
          const [medicine] = await connection.query(
            'SELECT price, stock_quantity FROM medicines WHERE id = ?',
            [item.medicine_id]
          );

          if (medicine.length === 0) {
            throw new Error(`Medicine with ID ${item.medicine_id} not found`);
          }

          if (medicine[0].stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for medicine ID ${item.medicine_id}`);
          }

          totalAmount += medicine[0].price * item.quantity;
        }

        // Get shipping cost
        const [shippingMethod] = await connection.query(
          'SELECT base_cost FROM shipping_methods WHERE id = ?',
          [shipping_method_id]
        );

        if (shippingMethod.length === 0) {
          throw new Error('Invalid shipping method');
        }

        totalAmount += shippingMethod[0].base_cost;

        // Apply coupon if provided
        let discountAmount = 0;
        if (coupon_code) {
          const [coupon] = await connection.query(
            'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= NOW() AND end_date >= NOW() AND (usage_limit IS NULL OR used_count < usage_limit)',
            [coupon_code]
          );

          if (coupon.length > 0) {
            if (coupon[0].min_purchase_amount && totalAmount < coupon[0].min_purchase_amount) {
              throw new Error(`Minimum purchase amount of ${coupon[0].min_purchase_amount} required for this coupon`);
            }

            discountAmount = coupon[0].discount_type === 'percentage'
              ? (totalAmount * coupon[0].discount_value) / 100
              : coupon[0].discount_value;

            if (coupon[0].max_discount_amount && discountAmount > coupon[0].max_discount_amount) {
              discountAmount = coupon[0].max_discount_amount;
            }

            totalAmount -= discountAmount;

            // Record coupon usage
            await connection.query(
              'INSERT INTO order_coupons (order_id, coupon_id, discount_amount) VALUES (?, ?, ?)',
              [orderId, coupon[0].id, discountAmount]
            );

            await connection.query(
              'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
              [coupon[0].id]
            );
          }
        }

        // Calculate tax
        const [taxRate] = await connection.query(
          'SELECT rate FROM tax_rates WHERE country = ? AND (state = ? OR state IS NULL) AND is_active = 1 ORDER BY state IS NULL LIMIT 1',
          [shipping_country, shipping_state]
        );

        const taxAmount = taxRate.length > 0 ? (totalAmount * taxRate[0].rate) / 100 : 0;
        totalAmount += taxAmount;

        // Create order
        await connection.query(
          `INSERT INTO orders (
            id, user_id, total_amount, status, shipping_address,
            shipping_city, shipping_state, shipping_country,
            shipping_postal_code, shipping_method_id, shipping_cost,
            tax_amount
          ) VALUES (?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            userId,
            totalAmount,
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_country,
            shipping_postal_code,
            shipping_method_id,
            shippingMethod[0].base_cost,
            taxAmount
          ]
        );

        // Create order items and update stock
        for (const item of items) {
          await connection.query(
            'INSERT INTO order_items (order_id, medicine_id, name, unit, quantity, unit_price) SELECT ?, ?, name, unit, ?, price FROM medicines WHERE id = ?',
            [orderId, item.medicine_id, item.quantity, item.medicine_id]
          );

          await connection.query(
            'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.medicine_id]
          );
        }

        await connection.commit();

        // Send order confirmation email
        const [user] = await connection.query('SELECT email, name FROM users WHERE id = ?', [userId]);
        await sendEmail(
          user[0].email,
          'Order Confirmation',
          `Dear ${user[0].name},\n\nYour order has been placed successfully. Order ID: ${orderId}\nTotal Amount: $${totalAmount}\n\nThank you for your purchase!`
        );

        res.json({
          message: 'Order created successfully',
          orderId,
          totalAmount
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
);

// Cancel order
router.post('/:orderId/cancel',
  authenticateToken,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Check if order exists and belongs to user
        const [orders] = await connection.query(
          'SELECT status FROM orders WHERE id = ? AND user_id = ?',
          [orderId, userId]
        );

        if (orders.length === 0) {
          throw new Error('Order not found');
        }

        if (orders[0].status !== 'pending_payment') {
          throw new Error('Only pending orders can be cancelled');
        }

        // Get order items to restore stock
        const [orderItems] = await connection.query(
          'SELECT medicine_id, quantity FROM order_items WHERE order_id = ?',
          [orderId]
        );

        // Restore stock
        for (const item of orderItems) {
          await connection.query(
            'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.medicine_id]
          );
        }

        // Update order status
        await connection.query(
          'UPDATE orders SET status = "cancelled" WHERE id = ?',
          [orderId]
        );

        await connection.commit();

        // Send cancellation email
        const [user] = await connection.query('SELECT email, name FROM users WHERE id = ?', [userId]);
        await sendEmail(
          user[0].email,
          'Order Cancelled',
          `Dear ${user[0].name},\n\nYour order (${orderId}) has been cancelled successfully.\n\nThank you for using our service.`
        );

        res.json({ message: 'Order cancelled successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
);

// Create review
router.post('/:orderId/reviews',
  authenticateToken,
  body('medicine_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('review_text').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orderId } = req.params;
      const { medicine_id, rating, review_text } = req.body;
      const userId = req.user.id;

      // Verify that the user has purchased the medicine
      const [orderItems] = await pool.query(
        'SELECT 1 FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.id = ? AND o.user_id = ? AND oi.medicine_id = ? AND o.status = "completed"',
        [orderId, userId, medicine_id]
      );

      if (orderItems.length === 0) {
        return res.status(400).json({ message: 'You can only review medicines you have purchased' });
      }

      // Check if user has already reviewed this medicine
      const [existingReviews] = await pool.query(
        'SELECT 1 FROM product_reviews WHERE user_id = ? AND medicine_id = ?',
        [userId, medicine_id]
      );

      if (existingReviews.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this medicine' });
      }

      await pool.query(
        'INSERT INTO product_reviews (user_id, medicine_id, rating, review_text, is_verified_purchase) VALUES (?, ?, ?, ?, 1)',
        [userId, medicine_id, rating, review_text]
      );

      res.json({ message: 'Review submitted successfully' });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get medicine reviews
router.get('/reviews/:medicineId', async (req, res) => {
  try {
    const { medicineId } = req.params;
    const [reviews] = await pool.query(
      `SELECT 
        pr.*, u.name as reviewer_name,
        DATE_FORMAT(pr.created_at, '%Y-%m-%d') as review_date
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.medicine_id = ? AND pr.status = 'approved'
       ORDER BY pr.created_at DESC`,
      [medicineId]
    );

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Moderate review (admin only)
router.put('/reviews/:reviewId/moderate',
  authenticateToken,
  body('status').isIn(['approved', 'rejected']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;
      const { status } = req.body;

      // Check if user is admin
      const [user] = await pool.query(
        'SELECT role FROM users WHERE id = ?',
        [req.user.id]
      );

      if (user[0].role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can moderate reviews' });
      }

      await pool.query(
        'UPDATE product_reviews SET status = ? WHERE id = ?',
        [status, reviewId]
      );

      res.json({ message: 'Review moderated successfully' });
    } catch (error) {
      console.error('Moderate review error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router; 