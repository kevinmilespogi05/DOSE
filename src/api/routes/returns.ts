import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { pool } from '../db';
import { sendEmail } from '../utils/email';

const router = express.Router();

// Get all returns (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [returns] = await pool.query(`
      SELECT r.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ri.id,
            'return_id', ri.return_id,
            'order_item_id', ri.order_item_id,
            'quantity', ri.quantity,
            'reason', ri.reason,
            'condition', ri.condition,
            'refund_amount', ri.refund_amount
          )
        ) as items
      FROM returns r
      LEFT JOIN return_items ri ON r.id = ri.return_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    res.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Get user's returns
router.get('/my-returns', authenticateToken, async (req, res) => {
  try {
    const [returns] = await pool.query(`
      SELECT r.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ri.id,
            'return_id', ri.return_id,
            'order_item_id', ri.order_item_id,
            'quantity', ri.quantity,
            'reason', ri.reason,
            'condition', ri.condition,
            'refund_amount', ri.refund_amount
          )
        ) as items
      FROM returns r
      LEFT JOIN return_items ri ON r.id = ri.return_id
      WHERE r.user_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(returns);
  } catch (error) {
    console.error('Error fetching user returns:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Create return request
router.post('/', authenticateToken, async (req, res) => {
  const { order_id, items } = req.body;

  try {
    // Start transaction
    await pool.query('START TRANSACTION');

    // Verify order exists and belongs to user
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, req.user.id]
    );

    if (!orders.length) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create return record
    const [result] = await pool.query(
      'INSERT INTO returns (order_id, user_id, status) VALUES (?, ?, ?)',
      [order_id, req.user.id, 'pending']
    );

    const returnId = result.insertId;
    let totalRefundAmount = 0;

    // Add return items
    for (const item of items) {
      // Verify order item exists and belongs to the order
      const [orderItems] = await pool.query(
        'SELECT * FROM order_items WHERE id = ? AND order_id = ?',
        [item.order_item_id, order_id]
      );

      if (!orderItems.length) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid order item' });
      }

      const orderItem = orderItems[0];

      // Calculate refund amount
      const refundAmount = orderItem.unit_price * item.quantity;
      totalRefundAmount += refundAmount;

      // Add return item
      await pool.query(
        `INSERT INTO return_items 
        (return_id, order_item_id, quantity, reason, condition, refund_amount)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          returnId,
          item.order_item_id,
          item.quantity,
          item.reason,
          item.condition,
          refundAmount
        ]
      );
    }

    // Update return with total refund amount
    await pool.query(
      'UPDATE returns SET total_refund_amount = ? WHERE id = ?',
      [totalRefundAmount, returnId]
    );

    // Commit transaction
    await pool.query('COMMIT');

    // Send email notification
    const [user] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (user.length) {
      await sendEmail(
        user[0].email,
        'Return Request Submitted',
        `Your return request for order #${order_id} has been submitted and is pending approval.`
      );
    }

    res.status(201).json({ message: 'Return request submitted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating return:', error);
    res.status(500).json({ error: 'Failed to create return request' });
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