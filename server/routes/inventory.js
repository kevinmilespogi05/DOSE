import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import { Parser } from 'json2csv';
import QRCode from 'qrcode';

const router = express.Router();

// Get inventory status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const [inventory] = await pool.query(`
      SELECT 
        p.*,
        CASE
          WHEN p.stock_quantity <= p.reorder_threshold THEN 'LOW_STOCK'
          WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM products p
      ORDER BY p.stock_quantity ASC
    `);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory status' });
  }
});

// Update product stock
router.put('/stock/:productId', [
  authenticateToken,
  body('quantity').isInt({ min: 0 }),
  body('reorder_threshold').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const { quantity, reorder_threshold } = req.body;
    
    await pool.query(`
      UPDATE products 
      SET 
        stock_quantity = ?,
        reorder_threshold = COALESCE(?, reorder_threshold)
      WHERE id = ?
    `, [quantity, reorder_threshold, req.params.productId]);

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Get low stock alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await pool.query(`
      SELECT *
      FROM products
      WHERE stock_quantity <= reorder_threshold
      ORDER BY stock_quantity ASC
    `);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Generate barcode/QR code for product
router.get('/barcode/:productId', authenticateToken, async (req, res) => {
  try {
    const [product] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.productId]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const qrCode = await QRCode.toDataURL(JSON.stringify({
      id: product.id,
      name: product.name,
      sku: product.sku
    }));

    res.json({ qrCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate barcode' });
  }
});

// Export inventory
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const inventory = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price,
        stock_quantity,
        reorder_threshold,
        sku,
        created_at,
        updated_at
      FROM products
    `);

    const parser = new Parser();
    const csv = parser.parse(inventory);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export inventory' });
  }
});

// Import inventory
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const products = req.body.products;

    // Start a transaction
    await pool.query('START TRANSACTION');

    for (const product of products) {
      await pool.query(`
        INSERT INTO products (
          name, description, price, stock_quantity, 
          reorder_threshold, sku
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          price = VALUES(price),
          stock_quantity = VALUES(stock_quantity),
          reorder_threshold = VALUES(reorder_threshold)
      `, [
        product.name,
        product.description,
        product.price,
        product.stock_quantity,
        product.reorder_threshold,
        product.sku
      ]);
    }

    await pool.query('COMMIT');
    res.json({ message: 'Inventory imported successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to import inventory' });
  }
});

// Get sales analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Top selling products with trend analysis
    const topSelling = await pool.query(`
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT o.user_id) as unique_customers,
        AVG(oi.quantity) as avg_quantity_per_order,
        MIN(o.created_at) as first_sale,
        MAX(o.created_at) as last_sale
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    // Sales trends with forecasting
    const salesTrends = await pool.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity) as total_items_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(oi.quantity * oi.price) / COUNT(DISTINCT o.id) as avg_order_value,
        DAYNAME(o.created_at) as day_of_week,
        HOUR(o.created_at) as hour_of_day
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(o.created_at), DAYNAME(o.created_at), HOUR(o.created_at)
      ORDER BY date DESC
    `);

    // Inventory intelligence
    const inventoryAnalytics = await pool.query(`
      WITH inventory_metrics AS (
        SELECT 
          p.id,
          p.name,
          p.stock_quantity,
          p.reorder_threshold,
          COALESCE(SUM(oi.quantity), 0) as total_sold_30_days,
          COUNT(DISTINCT o.id) as order_count_30_days
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
          AND o.status = 'completed' 
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY p.id, p.name, p.stock_quantity, p.reorder_threshold
      )
      SELECT 
        id,
        name,
        stock_quantity,
        reorder_threshold,
        total_sold_30_days,
        CASE 
          WHEN total_sold_30_days > 0 
          THEN ROUND(stock_quantity / (total_sold_30_days / 30), 1)
          ELSE NULL 
        END as days_of_inventory_left,
        CASE 
          WHEN total_sold_30_days > 0 
          THEN ROUND((total_sold_30_days / 30) * 1.5) 
          ELSE reorder_threshold
        END as suggested_reorder_point,
        ROUND(total_sold_30_days / 30, 1) as avg_daily_sales
      FROM inventory_metrics
      ORDER BY total_sold_30_days DESC
    `);

    // Customer insights
    const customerInsights = await pool.query(`
      WITH customer_metrics AS (
        SELECT 
          u.id,
          COUNT(DISTINCT o.id) as order_count,
          SUM(o.total_amount) as total_spent,
          MIN(o.created_at) as first_order_date,
          MAX(o.created_at) as last_order_date,
          COUNT(DISTINCT oi.product_id) as unique_products_bought
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        GROUP BY u.id
      )
      SELECT 
        COUNT(*) as total_customers,
        ROUND(AVG(order_count), 1) as avg_orders_per_customer,
        ROUND(AVG(total_spent), 2) as avg_customer_lifetime_value,
        ROUND(AVG(DATEDIFF(last_order_date, first_order_date)), 0) as avg_customer_lifespan_days,
        ROUND(AVG(unique_products_bought), 1) as avg_unique_products_per_customer,
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as returning_customers,
        ROUND(COUNT(CASE WHEN order_count > 1 THEN 1 END) * 100.0 / COUNT(*), 1) as customer_retention_rate
      FROM customer_metrics
    `);

    res.json({
      topSelling,
      salesTrends,
      inventoryAnalytics,
      customerInsights
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router; 