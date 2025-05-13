import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { db } from '../../src/database/connection';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Place order
router.post('/', [
  authenticateToken,
  body('items').isArray(),
  body('items.*.product_id').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shipping_address').isString(),
  body('payment_method').isString()
], async (req, res) => {
  try {
    const { items, shipping_address, payment_method } = req.body;

    // Start transaction
    await db.query('START TRANSACTION');

    // Check stock availability
    for (const item of items) {
      const [product] = await db.query(
        'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (!product || product.stock_quantity < item.quantity) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    }

    // Calculate total and tax
    let subtotal = 0;
    for (const item of items) {
      const [product] = await db.query(
        'SELECT price FROM products WHERE id = ?',
        [item.product_id]
      );
      subtotal += product.price * item.quantity;
    }

    const tax_rate = 0.1; // 10% tax rate
    const tax = subtotal * tax_rate;
    const shipping_cost = 10.00; // Fixed shipping cost for now
    const total = subtotal + tax + shipping_cost;

    // Create order
    const [orderResult] = await db.query(`
      INSERT INTO orders (
        user_id, status, subtotal, tax, shipping_cost, 
        total, shipping_address, payment_method
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, subtotal, tax, shipping_cost,
      total, shipping_address, payment_method
    ]);

    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of items) {
      const [product] = await db.query(
        'SELECT price FROM products WHERE id = ?',
        [item.product_id]
      );

      await db.query(`
        INSERT INTO order_items (
          order_id, product_id, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, product.price]);

      await db.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity - ?
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }

    await db.query('COMMIT');

    // Generate invoice
    await generateInvoice(orderId);

    res.json({
      message: 'Order placed successfully',
      order_id: orderId,
      total
    });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get order history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const orders = await db.query(`
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// Track order
router.get('/:orderId/track', authenticateToken, async (req, res) => {
  try {
    const [order] = await db.query(`
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND o.user_id = ?
      GROUP BY o.id
    `, [req.params.orderId, req.user.id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Cancel order
router.post('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    await db.query('START TRANSACTION');

    const [order] = await db.query(
      'SELECT status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [req.params.orderId, req.user.id]
    );

    if (!order) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    // Restore stock
    const orderItems = await db.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [req.params.orderId]
    );

    for (const item of orderItems) {
      await db.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity + ?
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }

    // Update order status
    await db.query(
      'UPDATE orders SET status = "cancelled" WHERE id = ?',
      [req.params.orderId]
    );

    await db.query('COMMIT');
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Request refund
router.post('/:orderId/refund', [
  authenticateToken,
  body('reason').isString()
], async (req, res) => {
  try {
    const { reason } = req.body;

    await db.query('START TRANSACTION');

    const [order] = await db.query(
      'SELECT status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [req.params.orderId, req.user.id]
    );

    if (!order) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'completed') {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Order is not eligible for refund' });
    }

    // Create refund request
    await db.query(`
      INSERT INTO refunds (
        order_id, reason, status
      ) VALUES (?, ?, 'pending')
    `, [req.params.orderId, reason]);

    // Update order status
    await db.query(
      'UPDATE orders SET status = "refund_requested" WHERE id = ?',
      [req.params.orderId]
    );

    await db.query('COMMIT');
    res.json({ message: 'Refund requested successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to request refund' });
  }
});

// Generate invoice
async function generateInvoice(orderId) {
  try {
    const [order] = await db.query(`
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    const orderItems = await db.query(`
      SELECT 
        oi.*,
        p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    const doc = new PDFDocument();
    const invoicePath = path.join(__dirname, '../../public/invoices', `invoice-${orderId}.pdf`);
    doc.pipe(fs.createWriteStream(invoicePath));

    // Add invoice content
    doc.fontSize(25).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order #: ${orderId}`);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
    doc.text(`Customer: ${order.customer_name}`);
    doc.text(`Email: ${order.customer_email}`);
    doc.moveDown();

    // Add items
    doc.text('Items:', { underline: true });
    orderItems.forEach(item => {
      doc.text(`${item.product_name} x ${item.quantity} @ $${item.price}`);
    });

    doc.moveDown();
    doc.text(`Subtotal: $${order.subtotal}`);
    doc.text(`Tax: $${order.tax}`);
    doc.text(`Shipping: $${order.shipping_cost}`);
    doc.text(`Total: $${order.total}`, { bold: true });

    doc.end();
  } catch (error) {
    console.error('Failed to generate invoice:', error);
  }
}

export default router; 