import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { db } from '../../src/database/connection';
import { Parser } from 'json2csv';
import QRCode from 'qrcode';

const router = express.Router();

// Get inventory status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const inventory = await db.query(`
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
    
    await db.query(`
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
    const alerts = await db.query(`
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
    const [product] = await db.query(
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
    const inventory = await db.query(`
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
    await db.query('START TRANSACTION');

    for (const product of products) {
      await db.query(`
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

    await db.query('COMMIT');
    res.json({ message: 'Inventory imported successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to import inventory' });
  }
});

// Get sales analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Top selling products
    const topSelling = await db.query(`
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    // Sales trends
    const salesTrends = await db.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity) as total_items_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `);

    // Inventory levels
    const inventoryLevels = await db.query(`
      SELECT 
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock_quantity <= reorder_threshold THEN 1 END) as low_stock,
        COUNT(CASE WHEN stock_quantity > reorder_threshold THEN 1 END) as healthy_stock
      FROM products
    `);

    res.json({
      topSelling,
      salesTrends,
      inventoryLevels
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router; 