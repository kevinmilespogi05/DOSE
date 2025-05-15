import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../../config/database';
import { authenticateToken } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import { execute, withTransaction } from '../../utils/db';
import { query } from '../../utils/db';

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
  body('total_amount').isFloat(),
  body('tax_amount').isFloat(),
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
        coupon_code,
        total_amount,
        tax_amount
      } = req.body;

      const userId = req.user.id;
      const orderId = uuidv4();

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Validate items and check stock
        let calculatedSubtotal = 0;
        for (const item of items) {
          const [medicine] = await connection.query(
            'SELECT price, stock_quantity, name, unit FROM medicines WHERE id = ?',
            [item.medicine_id]
          );

          if (medicine.length === 0) {
            throw new Error(`Medicine with ID ${item.medicine_id} not found`);
          }

          if (medicine[0].stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for medicine ID ${item.medicine_id}`);
          }

          calculatedSubtotal += medicine[0].price * item.quantity;
        }

        // Get shipping cost
        const [shippingMethod] = await connection.query(
          'SELECT base_cost FROM shipping_methods WHERE id = ?',
          [shipping_method_id]
        );

        if (shippingMethod.length === 0) {
          throw new Error('Invalid shipping method');
        }

        const shippingCost = shippingMethod[0].base_cost;

        // Apply coupon if provided
        let discountAmount = 0;
        if (coupon_code) {
          const [coupon] = await connection.query(
            'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= NOW() AND end_date >= NOW() AND (usage_limit IS NULL OR used_count < usage_limit)',
            [coupon_code]
          );

          if (coupon.length > 0) {
            if (coupon[0].min_purchase_amount && calculatedSubtotal < coupon[0].min_purchase_amount) {
              throw new Error(`Minimum purchase amount of ${coupon[0].min_purchase_amount} required for this coupon`);
            }

            discountAmount = coupon[0].discount_type === 'percentage'
              ? (calculatedSubtotal * coupon[0].discount_value) / 100
              : coupon[0].discount_value;

            if (coupon[0].max_discount_amount && discountAmount > coupon[0].max_discount_amount) {
              discountAmount = coupon[0].max_discount_amount;
            }

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

        // Calculate expected total
        const expectedSubtotal = Number(calculatedSubtotal.toFixed(2));
        const expectedShippingCost = Number(Number(shippingMethod[0].base_cost).toFixed(2));
        const expectedDiscountAmount = Number((discountAmount || 0).toFixed(2));
        const expectedTaxAmount = Number(tax_amount.toFixed(2));
        const expectedTotal = Number((expectedSubtotal + expectedShippingCost - expectedDiscountAmount + expectedTaxAmount).toFixed(2));
        const receivedTotal = Number(total_amount.toFixed(2));

        console.log('Backend calculations:', {
          expectedSubtotal,
          expectedShippingCost,
          expectedDiscountAmount,
          expectedTaxAmount,
          expectedTotal,
          receivedTotal,
          difference: Math.abs(expectedTotal - receivedTotal)
        });

        // Verify total amount matches (allowing for small floating point differences)
        if (Math.abs(expectedTotal - receivedTotal) > 0.01) {
          throw new Error('Total amount mismatch');
        }

        // Create the order with the verified amounts
        await connection.query(
          `INSERT INTO orders (
            id, user_id, total_amount, shipping_cost, 
            tax_amount, shipping_address, shipping_city,
            shipping_state, shipping_country, shipping_postal_code,
            shipping_method_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            userId,
            total_amount,
            expectedShippingCost,
            tax_amount,
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_country,
            shipping_postal_code,
            shipping_method_id,
            'pending_payment'
          ]
        );

        // Create order items
        for (const item of items) {
          const [medicine] = await connection.query(
            'SELECT name, unit FROM medicines WHERE id = ?',
            [item.medicine_id]
          );

          await connection.query(
            'INSERT INTO order_items (order_id, medicine_id, name, unit, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
            [orderId, item.medicine_id, medicine[0].name, medicine[0].unit, item.quantity, item.price_per_unit]
          );

          // Update stock
          await connection.query(
            'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.medicine_id]
          );
        }

        await connection.commit();

        // Send order confirmation email
        const [user] = await connection.query(
          `SELECT u.email, u.username, COALESCE(up.first_name, u.username) as name 
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = ?`, 
          [userId]
        );
        
        try {
          // Only try to send email if there's a valid email address
          if (user[0]?.email) {
            await sendEmail(
              user[0].email,
              'Order Confirmation',
              `Dear ${user[0].name},\n\nYour order has been placed successfully. Order ID: ${orderId}\nTotal Amount: $${total_amount}\n\nThank you for your purchase!`
            );
          } else {
            console.warn(`No email found for user ${userId}, skipping order confirmation email`);
          }
        } catch (emailError) {
          // Log email error but don't fail the order creation
          console.error('Failed to send order confirmation email:', emailError);
        }

        res.status(201).json({ orderId });
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
        const [user] = await connection.query(
          `SELECT u.email, u.username, COALESCE(up.first_name, u.username) as name 
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = ?`, 
          [userId]
        );
        
        try {
          // Only try to send email if there's a valid email address
          if (user[0]?.email) {
            await sendEmail(
              user[0].email,
              'Order Cancelled',
              `Dear ${user[0].name},\n\nYour order (${orderId}) has been cancelled successfully.\n\nThank you for using our service.`
            );
          } else {
            console.warn(`No email found for user ${userId}, skipping order cancellation email`);
          }
        } catch (emailError) {
          // Log email error but don't fail the order cancellation
          console.error('Failed to send order cancellation email:', emailError);
        }

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

// Get order history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First get the orders
    const orders = await execute(
      `SELECT o.id, o.total_amount, o.status, o.created_at, o.updated_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Then get the order items for each order
    const processedOrders = await Promise.all(orders.map(async (order) => {
      const items = await execute(
        `SELECT 
          oi.medicine_id,
          oi.quantity,
          oi.unit_price,
          m.name as medicine_name
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      return {
        ...order,
        total_amount: Number(order.total_amount),
        items: items.map(item => ({
          ...item,
          unit_price: Number(item.unit_price)
        }))
      };
    }));

    res.json(processedOrders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Error fetching order history' });
  }
});

// Get order tracking history
router.get('/:orderId/tracking', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify order belongs to user
    const orders = await execute(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order status is payment_submitted, check and add tracking if not exists
    if (orders[0].status === 'payment_submitted') {
      const existingTracking = await execute(
        'SELECT id FROM order_tracking WHERE order_id = ?',
        [orderId]
      );

      if (existingTracking.length === 0) {
        // Add initial tracking status
        const trackingId = Date.now().toString();
        await execute(
          `INSERT INTO order_tracking (id, order_id, status, description)
           VALUES (?, ?, ?, ?)`,
          [
            trackingId,
            orderId,
            'processing',
            'Payment submitted and being verified.'
          ]
        );

        // Add delivery tracking status
        const deliveryTrackingId = (Date.now() + 1).toString();
        await execute(
          `INSERT INTO order_tracking (id, order_id, status, description, location)
           VALUES (?, ?, ?, ?, ?)`,
          [
            deliveryTrackingId,
            orderId,
            'shipping',
            'Your order is on the way!',
            'Dispatch Center'
          ]
        );
      }
    }

    // Get tracking history
    const tracking = await execute(
      `SELECT id, status, description, location, created_at 
       FROM order_tracking 
       WHERE order_id = ? 
       ORDER BY created_at DESC`,
      [orderId]
    );

    res.json({ tracking });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ message: 'Error fetching order tracking' });
  }
});

// Get single order details
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // First get the order details
    const orders = await execute(
      `SELECT o.* 
       FROM orders o
       WHERE o.id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Then get the order items
    const items = await execute(
      `SELECT 
        oi.id,
        m.name as product_name,
        oi.quantity,
        oi.unit_price as price
       FROM order_items oi
       INNER JOIN medicines m ON oi.medicine_id = m.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Combine order and items
    const formattedOrder = {
      ...orders[0],
      total_amount: Number(orders[0].total_amount),
      items: items.map(item => ({
        ...item,
        price: Number(item.price)
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

// Add tracking status
router.post('/:orderId/tracking', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description, location } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user or user is admin
    const orders = await execute(
      'SELECT id, status FROM orders WHERE id = ? AND (user_id = ? OR ? IN (SELECT user_id FROM admin_users))',
      [orderId, userId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order status is payment_submitted and no tracking exists, add initial tracking
    if (orders[0].status === 'payment_submitted') {
      const existingTracking = await execute(
        'SELECT id FROM order_tracking WHERE order_id = ?',
        [orderId]
      );

      if (existingTracking.length === 0) {
        // Add initial tracking status
        const trackingId = Date.now().toString();
        await execute(
          `INSERT INTO order_tracking (id, order_id, status, description)
           VALUES (?, ?, ?, ?)`,
          [
            trackingId,
            orderId,
            'processing',
            'Payment submitted and being verified.'
          ]
        );

        // Add delivery tracking status
        const deliveryTrackingId = (Date.now() + 1).toString();
        await execute(
          `INSERT INTO order_tracking (id, order_id, status, description, location)
           VALUES (?, ?, ?, ?, ?)`,
          [
            deliveryTrackingId,
            orderId,
            'shipping',
            'Your order is on the way!',
            'Dispatch Center'
          ]
        );
      }
    }

    // Add new tracking status if provided
    if (status && description) {
      const trackingId = Date.now().toString();
      await execute(
        `INSERT INTO order_tracking (id, order_id, status, description, location)
         VALUES (?, ?, ?, ?, ?)`,
        [trackingId, orderId, status, description, location]
      );

      // Update order status if needed
      if (status === 'delivered') {
        await execute(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['completed', orderId]
        );
      }
    }

    res.status(201).json({ message: 'Tracking status added successfully' });
  } catch (error) {
    console.error('Error adding tracking status:', error);
    res.status(500).json({ message: 'Error adding tracking status' });
  }
});

// Check if user has purchased a specific medicine
router.get('/has-purchased/:medicineId', 
  authenticateToken,
  async (req: any, res) => {
    try {
      const { medicineId } = req.params;
      const userId = req.user.id;
      
      const purchases = await query(
        `SELECT 1 FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.medicine_id = ? AND o.status IN ('delivered', 'completed')
         LIMIT 1`,
        [userId, medicineId]
      );
      
      res.json({ hasPurchased: purchases.length > 0 });
    } catch (error) {
      console.error('Error checking purchase status:', error);
      res.status(500).json({ message: 'Failed to check purchase status' });
    }
  }
);

export default router; 