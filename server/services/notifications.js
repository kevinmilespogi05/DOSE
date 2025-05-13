import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { db } from '../../src/database/connection';

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class NotificationService {
  // Send order confirmation
  static async sendOrderConfirmation(orderId) {
    try {
      const [order] = await db.query(`
        SELECT 
          o.*,
          u.name as customer_name,
          u.email as customer_email,
          u.phone_number
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (!order) {
        throw new Error('Order not found');
      }

      // Send email
      await emailTransporter.sendMail({
        to: order.customer_email,
        subject: `Order Confirmation #${orderId}`,
        html: `
          <h1>Order Confirmation</h1>
          <p>Dear ${order.customer_name},</p>
          <p>Thank you for your order! Your order #${orderId} has been confirmed.</p>
          <p>Total Amount: $${order.total}</p>
          <p>You can track your order status <a href="${process.env.FRONTEND_URL}/orders/${orderId}/track">here</a>.</p>
        `
      });

      // Send SMS if phone number is available
      if (order.phone_number) {
        await twilioClient.messages.create({
          body: `Your order #${orderId} has been confirmed. Total: $${order.total}. Track at: ${process.env.FRONTEND_URL}/orders/${orderId}/track`,
          to: order.phone_number,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      }
    } catch (error) {
      console.error('Failed to send order confirmation:', error);
    }
  }

  // Send shipment notification
  static async sendShipmentNotification(orderId, trackingNumber) {
    try {
      const [order] = await db.query(`
        SELECT u.email, u.name, u.phone_number
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      // Send email
      await emailTransporter.sendMail({
        to: order.email,
        subject: `Order #${orderId} Shipped`,
        html: `
          <h1>Your Order Has Been Shipped</h1>
          <p>Dear ${order.name},</p>
          <p>Your order #${orderId} has been shipped!</p>
          <p>Tracking Number: ${trackingNumber}</p>
          <p>Track your shipment <a href="${process.env.FRONTEND_URL}/orders/${orderId}/track">here</a>.</p>
        `
      });

      // Send SMS
      if (order.phone_number) {
        await twilioClient.messages.create({
          body: `Your order #${orderId} has been shipped! Tracking #: ${trackingNumber}`,
          to: order.phone_number,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      }
    } catch (error) {
      console.error('Failed to send shipment notification:', error);
    }
  }

  // Send low stock alert to admin
  static async sendLowStockAlert(productId) {
    try {
      const [product] = await db.query(`
        SELECT *
        FROM products
        WHERE id = ?
      `, [productId]);

      const [admins] = await db.query(`
        SELECT email
        FROM users
        WHERE role = 'admin'
      `);

      const adminEmails = admins.map(admin => admin.email);

      // Send email to all admins
      await emailTransporter.sendMail({
        to: adminEmails,
        subject: 'Low Stock Alert',
        html: `
          <h1>Low Stock Alert</h1>
          <p>Product: ${product.name}</p>
          <p>Current Stock: ${product.stock_quantity}</p>
          <p>Reorder Threshold: ${product.reorder_threshold}</p>
          <p>Please restock this item soon.</p>
        `
      });
    } catch (error) {
      console.error('Failed to send low stock alert:', error);
    }
  }

  // Send promotion notification
  static async sendPromotionNotification(promotion) {
    try {
      const [users] = await db.query(`
        SELECT email, phone_number
        FROM users
        WHERE marketing_preferences = true
      `);

      // Send email to all subscribed users
      for (const user of users) {
        await emailTransporter.sendMail({
          to: user.email,
          subject: 'New Promotion!',
          html: `
            <h1>${promotion.title}</h1>
            <p>${promotion.description}</p>
            <p>Valid until: ${new Date(promotion.end_date).toLocaleDateString()}</p>
            <p>Shop now at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
          `
        });

        // Send SMS if user has phone number
        if (user.phone_number) {
          await twilioClient.messages.create({
            body: `${promotion.title}: ${promotion.description}. Valid until ${new Date(promotion.end_date).toLocaleDateString()}. Shop now!`,
            to: user.phone_number,
            from: process.env.TWILIO_PHONE_NUMBER
          });
        }
      }
    } catch (error) {
      console.error('Failed to send promotion notification:', error);
    }
  }

  // Send order status update
  static async sendOrderStatusUpdate(orderId, newStatus) {
    try {
      const [order] = await db.query(`
        SELECT 
          o.*,
          u.email,
          u.name,
          u.phone_number
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      const statusMessages = {
        processing: 'Your order is being processed',
        shipped: 'Your order has been shipped',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled',
        refunded: 'Your refund has been processed'
      };

      // Send email
      await emailTransporter.sendMail({
        to: order.email,
        subject: `Order #${orderId} Status Update`,
        html: `
          <h1>Order Status Update</h1>
          <p>Dear ${order.name},</p>
          <p>${statusMessages[newStatus]}</p>
          <p>Order #: ${orderId}</p>
          <p>Check your order details <a href="${process.env.FRONTEND_URL}/orders/${orderId}/track">here</a>.</p>
        `
      });

      // Send SMS
      if (order.phone_number) {
        await twilioClient.messages.create({
          body: `Order #${orderId} Update: ${statusMessages[newStatus]}`,
          to: order.phone_number,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      }
    } catch (error) {
      console.error('Failed to send order status update:', error);
    }
  }
}

export default NotificationService; 