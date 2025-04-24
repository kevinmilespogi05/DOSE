import express from 'express';
import axios from 'axios';
import { execute, withTransaction } from '../../utils/db';
import { authenticateToken, isAdmin } from '../middleware/auth';
import SERVER_CONFIG from '../../config/server-config';

const router = express.Router();

// Initialize PayMongo client
const paymongoApi = axios.create({
  baseURL: 'https://api.paymongo.com/v1',
  auth: {
    username: SERVER_CONFIG.PAYMONGO.SECRET_KEY || '',
    password: ''
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create GCash payment source
router.post('/create-source', authenticateToken, async (req, res) => {
  const { orderId, amount } = req.body;
  const userId = req.user.userId;

  try {
    // Verify order belongs to user
    const orders = await execute(
      'SELECT id, total_amount, status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Order is not pending payment' });
    }

    // Create PayMongo source
    const sourceResponse = await paymongoApi.post('/sources', {
      data: {
        attributes: {
          amount: Math.round(amount * 100), // Convert to cents
          redirect: {
            success: `${SERVER_CONFIG.PAYMONGO.FRONTEND_URL}/payment/success`,
            failed: `${SERVER_CONFIG.PAYMONGO.FRONTEND_URL}/payment/failed`
          },
          type: 'gcash',
          currency: 'PHP'
        }
      }
    });

    const source = sourceResponse.data.data;

    // Create payment record
    await withTransaction(async () => {
      await execute(
        `INSERT INTO payments (
          id, order_id, amount, payment_method, source_id, status
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Date.now().toString(),
          orderId,
          amount,
          'gcash',
          source.id,
          'pending'
        ]
      );

      // Update order status
      await execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['payment_submitted', orderId]
      );
    });

    res.json({
      checkoutUrl: source.attributes.redirect.checkout_url,
      sourceId: source.id
    });
  } catch (error) {
    console.error('Error creating GCash source:', error);
    res.status(500).json({ message: 'Error creating GCash payment' });
  }
});

// Verify payment status
router.post('/verify', authenticateToken, async (req, res) => {
  const { sourceId, orderId } = req.body;
  const userId = req.user.userId;

  try {
    // Get payment record
    const payments = await execute(
      `SELECT p.*, o.user_id 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.source_id = ?${orderId ? ' AND p.order_id = ?' : ''}`,
      orderId ? [sourceId, orderId] : [sourceId]
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = payments[0];
    if (payment.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check PayMongo source status
    const sourceResponse = await paymongoApi.get(`/sources/${sourceId}`);
    const source = sourceResponse.data.data;

    if (source.attributes.status === 'chargeable') {
      // Create payment
      const paymentResponse = await paymongoApi.post('/payments', {
        data: {
          attributes: {
            amount: Math.round(payment.amount * 100),
            currency: 'PHP',
            source: {
              id: sourceId,
              type: 'source'
            }
          }
        }
      });

      const paymongoPayment = paymentResponse.data.data;

      await withTransaction(async () => {
        // Update payment record
        await execute(
          'UPDATE payments SET status = ?, payment_intent_id = ? WHERE id = ?',
          ['processing', paymongoPayment.id, payment.id]
        );

        // Update order status
        await execute(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['processing', payment.order_id]
        );
      });

      res.json({ status: 'processing' });
    } else {
      res.json({ status: source.attributes.status });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

// PayMongo webhook handler
router.post('/webhook', async (req, res) => {
  const event = req.body;

  try {
    switch (event.type) {
      case 'payment.paid':
        await handleSuccessfulPayment(event.data);
        break;
      case 'payment.failed':
        await handleFailedPayment(event.data);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleSuccessfulPayment(data: any) {
  const { id: paymentId } = data;
  
  await withTransaction(async () => {
    // Update payment status
    await execute(
      'UPDATE payments SET status = ? WHERE payment_intent_id = ?',
      ['paid', paymentId]
    );

    // Get order ID from payment
    const payments = await execute(
      'SELECT order_id FROM payments WHERE payment_intent_id = ?',
      [paymentId]
    );

    if (payments.length === 0) return;

    // Update order status
    await execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['completed', payments[0].order_id]
    );
  });
}

async function handleFailedPayment(data: any) {
  const { id: paymentId } = data;
  
  await withTransaction(async () => {
    // Update payment status
    await execute(
      'UPDATE payments SET status = ? WHERE payment_intent_id = ?',
      ['failed', paymentId]
    );

    // Get order ID from payment
    const payments = await execute(
      'SELECT order_id FROM payments WHERE payment_intent_id = ?',
      [paymentId]
    );

    if (payments.length === 0) return;

    // Update order status
    await execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['payment_failed', payments[0].order_id]
    );
  });
}

export default router; 