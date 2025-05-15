import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { pool } from '../../config/database';
import { sendEmail } from '../utils/email';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all returns (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    // First get all returns
    const [returns] = await pool.query(`
      SELECT * FROM returns
      ORDER BY created_at DESC
    `);

    // For each return, get its items
    const returnsWithItems = await Promise.all(returns.map(async (returnObj) => {
      const [items] = await pool.query(`
        SELECT 
          id,
          return_id,
          order_item_id,
          quantity,
          reason,
          item_condition as item_status,
          refund_amount
        FROM return_items
        WHERE return_id = ?
      `, [returnObj.id]);

      return {
        ...returnObj,
        items: items || []
      };
    }));

    res.json(returnsWithItems);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Get user's returns
router.get('/my-returns', authenticateToken, async (req, res) => {
  try {
    // First get user's returns
    const [returns] = await pool.query(`
      SELECT * FROM returns
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    // For each return, get its items
    const returnsWithItems = await Promise.all(returns.map(async (returnObj) => {
      const [items] = await pool.query(`
        SELECT 
          id,
          return_id,
          order_item_id,
          quantity,
          reason,
          item_condition as item_status,
          refund_amount
        FROM return_items
        WHERE return_id = ?
      `, [returnObj.id]);

      return {
        ...returnObj,
        items: items || []
      };
    }));

    res.json(returnsWithItems);
  } catch (error) {
    console.error('Error fetching user returns:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Create return request
router.post('/orders/:orderId/returns',
  authenticateToken,
  [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.order_item_id').notEmpty().withMessage('Order item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.reason').isIn(['wrong_item', 'damaged', 'defective', 'not_as_described', 'other'])
      .withMessage('Invalid reason provided'),
    body('items.*.condition').isIn(['new', 'opened', 'damaged'])
      .withMessage('Invalid condition provided')
  ],
  async (req, res) => {
    try {
      // Log request data for debugging
      console.log('Return request payload:', req.body);
      console.log('Order ID:', req.params.orderId);
      console.log('User ID:', req.user.id);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: errors.array()
        });
      }

      const { orderId } = req.params;
      const { items } = req.body;
      const userId = req.user.id;

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Verify order belongs to user and is eligible for return
        const [orders] = await connection.query(
          `SELECT o.*, 
            DATEDIFF(CURRENT_TIMESTAMP, o.created_at) as days_since_order
          FROM orders o
          WHERE o.id = ? AND o.user_id = ? AND o.status = 'completed'`,
          [orderId, userId]
        );

        console.log('Found orders:', orders);

        if (!orders.length) {
          throw new Error('Order not found or not eligible for return');
        }

        const order = orders[0];
        if (order.days_since_order > 7) {
          throw new Error('Return period has expired (7 days)');
        }

        // Check if return request already exists
        const [existingReturns] = await connection.query(
          'SELECT id FROM returns WHERE order_id = ? AND user_id = ? AND status != ?',
          [orderId, userId, 'rejected']
        );

        if (existingReturns.length > 0) {
          throw new Error('A return request already exists for this order');
        }

        // Verify return items belong to order and quantities are valid
        for (const item of items) {
          const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE id = ? AND order_id = ?',
            [item.order_item_id, orderId]
          );

          console.log('Checking order item:', item.order_item_id, 'Found:', orderItems);

          if (!orderItems.length) {
            throw new Error(`Invalid order item: ${item.order_item_id}`);
          }

          const orderItem = orderItems[0];
          if (item.quantity > orderItem.quantity) {
            throw new Error(`Invalid return quantity for item: ${item.order_item_id}`);
          }
        }

        // Calculate total refund amount
        let totalRefundAmount = 0;
        for (const item of items) {
          const [orderItems] = await connection.query(
            'SELECT unit_price FROM order_items WHERE id = ?',
            [item.order_item_id]
          );
          totalRefundAmount += orderItems[0].unit_price * item.quantity;
        }

        console.log('Total refund amount:', totalRefundAmount);

        // Create return request
        const [returnResult] = await connection.query(
          `INSERT INTO returns (
            order_id, user_id, status, total_refund_amount
          ) VALUES (?, ?, 'pending', ?)`,
          [orderId, userId, totalRefundAmount]
        );

        const returnId = returnResult.insertId;
        console.log('Created return request:', returnId);

        // Create return items
        for (const item of items) {
          const [orderItems] = await connection.query(
            'SELECT unit_price FROM order_items WHERE id = ?',
            [item.order_item_id]
          );

          await connection.query(
            `INSERT INTO return_items (
              return_id, order_item_id, quantity, reason,
              item_condition, refund_amount
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              returnId,
              item.order_item_id,
              item.quantity,
              item.reason,
              item.condition,
              orderItems[0].unit_price * item.quantity
            ]
          );
        }

        await connection.commit();

        // Send email notification
        try {
          const [users] = await connection.query(
            'SELECT email, username as name FROM users WHERE id = ?',
            [userId]
          );

          if (users.length > 0 && users[0].email) {
            await sendEmail(
              users[0].email,
              'Return Request Received',
              `Dear ${users[0].name || 'Valued Customer'},

Your return request for order #${orderId} has been received and is being reviewed.
Return Request ID: #${returnId}
Total Refund Amount: ₱${totalRefundAmount.toFixed(2)}

We will process your return request within 1-2 business days.

Thank you for your patience.`
            );
          } else {
            console.log('Email notification skipped: No valid email address found for user:', userId);
          }
        } catch (emailError) {
          // Log the email error but don't fail the request
          console.error('Failed to send email notification:', emailError);
        }

        res.status(201).json({
          message: 'Return request created successfully',
          returnId,
          totalRefundAmount
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error('Error creating return request:', error);
      res.status(400).json({
        message: error.message || 'Failed to create return request'
      });
    }
  }
);

// Get returns for a specific order
router.get('/orders/:orderId/returns', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    // First, check if the return exists
    const [returns] = await pool.query(
      `SELECT * FROM returns 
       WHERE order_id = ? AND user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId, userId]
    );

    if (!returns || returns.length === 0) {
      return res.status(404).json({ error: 'No return request found for this order' });
    }

    // Then fetch the return items separately
    const [items] = await pool.query(
      `SELECT 
        id,
        return_id,
        order_item_id,
        quantity,
        reason,
        item_condition as item_status,
        refund_amount
       FROM return_items 
       WHERE return_id = ?`,
      [returns[0].id]
    );

    // Combine return data with items
    const returnData = {
      ...returns[0],
      items: items || []
    };

    res.json(returnData);
  } catch (error) {
    console.error('Error fetching order returns:', error);
    res.status(500).json({ error: 'Failed to fetch return request' });
  }
});

// Approve return request (admin only)
router.put('/:returnId/approve', authenticateToken, isAdmin, async (req, res) => {
  const { returnId } = req.params;

  try {
    await pool.query('START TRANSACTION');

    // Get return details
    const [returns] = await pool.query(
      'SELECT * FROM returns WHERE id = ?',
      [returnId]
    );

    if (!returns.length) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Return not found' });
    }

    const returnRequest = returns[0];

    if (returnRequest.status !== 'pending') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Return request is not pending' });
    }

    // Get return items
    const [returnItems] = await pool.query(
      'SELECT * FROM return_items WHERE return_id = ?',
      [returnId]
    );

    // Process each return item
    for (const item of returnItems) {
      // Get order item details
      const [orderItems] = await pool.query(
        'SELECT * FROM order_items WHERE id = ?',
        [item.order_item_id]
      );

      if (orderItems.length) {
        const orderItem = orderItems[0];

        // Restore stock
        await pool.query(
          'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, orderItem.medicine_id]
        );

        // Record inventory transaction
        await pool.query(
          `INSERT INTO inventory_transactions 
          (medicine_id, quantity, type, batch_number, unit_price, user_id)
          VALUES (?, ?, 'return', ?, ?, ?)`,
          [
            orderItem.medicine_id,
            item.quantity,
            orderItem.batch_number,
            orderItem.unit_price,
            req.user.id
          ]
        );
      }
    }

    // Update return status
    await pool.query(
      'UPDATE returns SET status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', returnId]
    );

    // Process refund
    await pool.query(
      `INSERT INTO refunds 
      (return_id, amount, status, processed_by)
      VALUES (?, ?, 'completed', ?)`,
      [returnId, returnRequest.total_refund_amount, req.user.id]
    );

    await pool.query('COMMIT');

    // Send email notification
    const [user] = await pool.query(
      'SELECT email FROM users WHERE id = ?',
      [returnRequest.user_id]
    );

    if (user.length) {
      await sendEmail(
        user[0].email,
        'Return Request Approved',
        `Your return request #${returnId} has been approved. A refund of $${returnRequest.total_refund_amount.toFixed(2)} will be processed.`
      );
    }

    res.json({ message: 'Return request approved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error approving return:', error);
    res.status(500).json({ error: 'Failed to approve return request' });
  }
});

// Reject return request (admin only)
router.put('/:returnId/reject', authenticateToken, isAdmin, async (req, res) => {
  const { returnId } = req.params;
  const { reason } = req.body;

  try {
    // Update return status
    const [result] = await pool.query(
      'UPDATE returns SET status = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', reason, returnId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Send email notification
    const [returnData] = await pool.query(
      'SELECT user_id FROM returns WHERE id = ?',
      [returnId]
    );

    if (returnData.length) {
      const [user] = await pool.query(
        'SELECT email FROM users WHERE id = ?',
        [returnData[0].user_id]
      );

      if (user.length) {
        await sendEmail(
          user[0].email,
          'Return Request Rejected',
          `Your return request #${returnId} has been rejected. Reason: ${reason}`
        );
      }
    }

    res.json({ message: 'Return request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting return:', error);
    res.status(500).json({ error: 'Failed to reject return request' });
  }
});

export default router; 