import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { execute, query } from '../../utils/db';
import { generateInvoice } from '../../utils/invoiceGenerator';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import CONFIG from '../../config/config';

const router = express.Router();

// Generate invoice for an order
router.post('/:orderId/generate', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log(`Generating invoice for order ${orderId} requested by user ${userId}`);

    // Get order details with items and user information
    const [order] = await query(`
      SELECT 
        o.*,
        CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, '')) as customer_name,
        u.email as customer_email,
        COALESCE(o.shipping_address, '') as shipping_address,
        COALESCE(o.shipping_city, '') as shipping_city,
        COALESCE(o.shipping_state, '') as shipping_state,
        COALESCE(o.shipping_postal_code, '') as shipping_postal_code,
        COALESCE(o.shipping_country, '') as shipping_country
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      console.log(`Order ${orderId} not found or user ${userId} not authorized`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Convert numeric fields to numbers
    order.total_amount = Number(order.total_amount);
    order.shipping_cost = Number(order.shipping_cost || 0);
    order.tax_amount = Number(order.tax_amount || 0);

    console.log('Order details retrieved:', { 
      orderId: order.id, 
      customer: order.customer_name,
      status: order.status 
    });

    // Check if payment exists and is valid
    const [payment] = await query(
      `SELECT p.* 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.order_id = ? AND (p.status = 'paid' OR p.status = 'submitted' OR o.status = 'completed' OR o.status = 'payment_submitted')`,
      [orderId]
    );

    if (!payment) {
      console.log(`No valid payment found for order ${orderId}`);
      return res.status(400).json({ message: 'No valid payment found' });
    }

    // If order is completed or payment submitted but payment is not marked as paid, update it
    if (payment.status !== 'paid' && (order.status === 'completed' || order.status === 'payment_submitted')) {
      await query(
        'UPDATE payments SET status = ? WHERE id = ?',
        ['paid', payment.id]
      );
      payment.status = 'paid';
    }

    console.log('Payment details:', {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount
    });

    // Generate invoice number if not exists
    const invoiceNumber = payment.invoice_number || 
      `INV-${new Date(order.created_at).toISOString().slice(0, 7).replace('-', '')}-${String(payment.id).padStart(6, '0')}`;

    console.log(`Using invoice number: ${invoiceNumber}`);

    // Calculate totals
    const orderItems = await query(`
      SELECT 
        oi.*,
        m.name as product_name
      FROM order_items oi
      JOIN medicines m ON oi.medicine_id = m.id
      WHERE oi.order_id = ?
    `, [orderId]);

    const items = orderItems.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price)
    }));

    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0);

    console.log('Order items:', {
      count: items.length,
      subtotal,
      items: items.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price
      }))
    });

    // Generate invoice PDF
    const invoicePath = await generateInvoice({
      invoiceNumber,
      orderDate: new Date(order.created_at),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      shippingAddress: {
        address: order.shipping_address,
        city: order.shipping_city,
        state: order.shipping_state,
        postalCode: order.shipping_postal_code,
        country: order.shipping_country
      },
      items,
      subtotal,
      shippingCost: Number(order.shipping_cost || 0),
      taxAmount: Number(order.tax_amount || 0),
      totalAmount: Number(order.total_amount)
    });

    console.log(`Invoice PDF generated at: ${invoicePath}`);

    // Update payment record with invoice information
    await execute(
      `UPDATE payments 
       SET invoice_number = ?, 
           invoice_generated_at = CURRENT_TIMESTAMP,
           invoice_path = ?
       WHERE id = ?`,
      [invoiceNumber, invoicePath, payment.id]
    );

    console.log('Payment record updated with invoice information');

    res.json({ 
      message: 'Invoice generated successfully',
      invoiceNumber
    });
  } catch (error) {
    console.error('Error generating invoice:', {
      error,
      stack: error.stack,
      orderId: req.params.orderId,
      userId: req.user.id
    });
    res.status(500).json({ message: 'Error generating invoice' });
  }
});

// Download invoice route with enhanced error logging
router.get('/:orderId/download', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token as string, CONFIG.JWT_SECRET) as { userId: number };
    const userId = decoded.userId;

    console.log(`Downloading invoice for order ${orderId} requested by user ${userId}`);

    // Get payment with invoice information
    const [payment] = await query(`
      SELECT p.* 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.id = ? AND 
            p.status = 'paid' AND 
            p.invoice_path IS NOT NULL AND
            (o.user_id = ? OR ? IN (SELECT id FROM users WHERE role = 'admin'))
    `, [orderId, userId, userId]);

    if (!payment) {
      console.log(`Invoice not found for order ${orderId}`);
      return res.status(404).json({ message: 'Invoice not found' });
    }

    console.log('Payment details for invoice:', {
      paymentId: payment.id,
      invoiceNumber: payment.invoice_number,
      invoicePath: payment.invoice_path
    });

    // Check if file exists
    if (!fs.existsSync(payment.invoice_path)) {
      console.error(`Invoice file not found at path: ${payment.invoice_path}`);
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.invoice_number}.pdf`);

    console.log('Streaming invoice file to client');

    // Stream the file
    const fileStream = fs.createReadStream(payment.invoice_path);
    fileStream.on('error', (error) => {
      console.error('Error streaming invoice file:', error);
      res.status(500).json({ message: 'Error downloading invoice' });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading invoice:', {
      error,
      stack: error.stack,
      orderId: req.params.orderId,
      userId: req.user.id
    });
    res.status(500).json({ message: 'Error downloading invoice' });
  }
});

// Preview invoice route
router.get('/:orderId/preview', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token as string, CONFIG.JWT_SECRET) as { userId: number };
    const userId = decoded.userId;

    console.log(`Previewing invoice for order ${orderId} requested by user ${userId}`);

    // Get payment with invoice information
    const [payment] = await query(`
      SELECT p.* 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.id = ? AND 
            p.status = 'paid' AND 
            p.invoice_path IS NOT NULL AND
            (o.user_id = ? OR ? IN (SELECT id FROM users WHERE role = 'admin'))
    `, [orderId, userId, userId]);

    if (!payment) {
      console.log(`Invoice not found for order ${orderId}`);
      return res.status(404).json({ message: 'Invoice not found' });
    }

    console.log('Payment details for invoice:', {
      paymentId: payment.id,
      invoiceNumber: payment.invoice_number,
      invoicePath: payment.invoice_path
    });

    // Check if file exists
    if (!fs.existsSync(payment.invoice_path)) {
      console.error(`Invoice file not found at path: ${payment.invoice_path}`);
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    // Set headers for inline PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${payment.invoice_number}.pdf`);

    console.log('Streaming invoice file to client for preview');

    // Stream the file
    const fileStream = fs.createReadStream(payment.invoice_path);
    fileStream.on('error', (error) => {
      console.error('Error streaming invoice file:', error);
      res.status(500).json({ message: 'Error previewing invoice' });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error previewing invoice:', {
      error,
      stack: error.stack,
      orderId: req.params.orderId,
      userId: req.user?.id
    });
    res.status(500).json({ message: 'Error previewing invoice' });
  }
});

export default router; 