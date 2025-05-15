import { Router } from 'express';
import { pool } from '../../../config/database';
import { isAdmin, authenticateToken } from '../../middleware/auth';
import { sendEmail } from '../../utils/email';

const router = Router();

// Get all return requests with optional status filter
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        r.id,
        r.order_id,
        r.status,
        r.created_at,
        r.total_refund_amount,
        u.email as user_email
      FROM returns r
      INNER JOIN orders o ON r.order_id = o.id
      INNER JOIN users u ON o.user_id = u.id
    `;

    if (status && status !== 'all') {
      query += ' WHERE r.status = ?';
    }

    query += ' ORDER BY r.created_at DESC';

    const [returns] = await pool.query(
      query,
      status && status !== 'all' ? [status] : []
    );

    // Fetch return items for each return request
    const returnsWithItems = await Promise.all(
      returns.map(async (returnRequest: any) => {
        const [items] = await pool.query(
          `SELECT 
            ri.id,
            ri.quantity,
            ri.reason,
            ri.item_condition as item_status,
            ri.refund_amount,
            m.name as product_name
          FROM return_items ri
          INNER JOIN order_items oi ON ri.order_item_id = oi.id
          INNER JOIN medicines m ON oi.medicine_id = m.id
          WHERE ri.return_id = ?`,
          [returnRequest.id]
        );

        return {
          ...returnRequest,
          user: {
            email: returnRequest.user_email
          },
          items
        };
      })
    );

    res.json(returnsWithItems);
  } catch (err) {
    console.error('Error fetching returns:', err);
    res.status(500).json({ error: 'Failed to fetch return requests' });
  }
});

// Process a return request (approve/reject)
router.post('/:returnId/:action', authenticateToken, isAdmin, async (req, res) => {
  const { returnId, action } = req.params;
  
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    // Start transaction
    await pool.query('START TRANSACTION');

    // Update return status
    await pool.query(
      'UPDATE returns SET status = ? WHERE id = ?',
      [action === 'approve' ? 'approved' : 'rejected', returnId]
    );

    // Get return details for email notification
    const [returnDetails] = await pool.query(
      `SELECT 
        r.*,
        u.email,
        u.username as name
      FROM returns r
      INNER JOIN orders o ON r.order_id = o.id
      INNER JOIN users u ON o.user_id = u.id
      WHERE r.id = ?`,
      [returnId]
    );

    if (!returnDetails[0]) {
      throw new Error('Return request not found');
    }

    // Send email notification
    const emailSubject = `Return Request ${action === 'approve' ? 'Approved' : 'Rejected'}`;
    const emailBody = `
      Dear ${returnDetails[0].name},

      Your return request for order ${returnDetails[0].order_id} has been ${action === 'approve' ? 'approved' : 'rejected'}.
      ${action === 'approve' ? `A refund of ₱${Number(returnDetails[0].total_refund_amount).toFixed(2)} will be processed.` : ''}

      Thank you for your patience.
    `;

    await sendEmail(returnDetails[0].email, emailSubject, emailBody);

    // Commit transaction
    await pool.query('COMMIT');

    res.json({ message: `Return request ${action}d successfully` });
  } catch (err) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    console.error(`Error ${action}ing return:`, err);
    res.status(500).json({ error: `Failed to ${action} return request` });
  }
});

export default router; 