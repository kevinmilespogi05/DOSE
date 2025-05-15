import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, isAdmin } from '../middleware/auth';
import pool from '../config/database';
import QRCode from 'qrcode';
import { Parser } from 'json2csv';

const router = express.Router();

// Get inventory status with detailed information
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const [inventory] = await pool.query(`
      SELECT 
        m.*,
        s.name as supplier_name,
        CASE
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          WHEN m.stock_quantity = 0 THEN 'out_of_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      ORDER BY 
        CASE
          WHEN m.stock_quantity <= m.min_stock_level THEN 1
          WHEN m.stock_quantity = 0 THEN 2
          ELSE 3
        END,
        m.name ASC
    `);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory status' });
  }
});

// Update stock levels for a medicine
router.put('/stock/:medicineId', [
  authenticateToken,
  isAdmin,
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('type').isIn(['add', 'remove']).withMessage('Type must be either add or remove'),
  body('batch_number').optional().isString(),
  body('unit_price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { medicineId } = req.params;
    const { quantity, type, batch_number, unit_price } = req.body;

    // Get current stock
    const [medicine] = await pool.query('SELECT stock_quantity FROM medicines WHERE id = ?', [medicineId]);
    
    if (!medicine.length) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const currentStock = medicine[0].stock_quantity;
    let newStock = currentStock;

    if (type === 'add') {
      newStock = currentStock + parseInt(quantity);
    } else if (type === 'remove') {
      if (currentStock < quantity) {
        return res.status(400).json({ error: 'Not enough stock available' });
      }
      newStock = currentStock - parseInt(quantity);
    }

    // Update the stock
    await pool.query('UPDATE medicines SET stock_quantity = ? WHERE id = ?', [newStock, medicineId]);

    // Record the transaction
    await pool.query(`
      INSERT INTO inventory_transactions (
        medicine_id, 
        type, 
        quantity, 
        batch_number, 
        unit_price, 
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      medicineId,
      type === 'add' ? 'IN' : 'OUT',
      quantity,
      batch_number || null,
      unit_price || null,
      req.user.id
    ]);

    res.json({ 
      message: 'Stock updated successfully',
      previous_stock: currentStock,
      new_stock: newStock
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Update thresholds for a medicine
router.put('/thresholds/:medicineId', [
  authenticateToken,
  isAdmin,
  body('min_stock_level').isInt({ min: 0 }).withMessage('Minimum stock level must be a positive integer'),
  body('max_stock_level').isInt({ min: 0 }).withMessage('Maximum stock level must be a positive integer')
    .custom((value, { req }) => {
      return value > req.body.min_stock_level;
    }).withMessage('Maximum stock level must be greater than minimum stock level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { medicineId } = req.params;
    const { min_stock_level, max_stock_level } = req.body;

    await pool.query(`
      UPDATE medicines 
      SET min_stock_level = ?, max_stock_level = ? 
      WHERE id = ?
    `, [min_stock_level, max_stock_level, medicineId]);

    res.json({ message: 'Thresholds updated successfully' });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
});

// Generate barcode/QR code
router.get('/barcode/:medicineId', authenticateToken, async (req, res) => {
  try {
    const [medicine] = await pool.query(
      'SELECT * FROM medicines WHERE id = ?',
      [req.params.medicineId]
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const barcodeData = {
      id: medicine.id,
      name: medicine.name,
      generic_name: medicine.generic_name,
      sku: medicine.sku
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(barcodeData));
    res.json({ qrCode });
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({ error: 'Failed to generate barcode' });
  }
});

// Update product barcode
router.put('/barcode/:medicineId', [
  authenticateToken,
  isAdmin,
  body('barcode').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { medicineId } = req.params;
    const { barcode } = req.body;

    // Check if barcode already exists
    const [existingMedicine] = await pool.query(
      'SELECT id FROM medicines WHERE barcode = ? AND id != ?',
      [barcode, medicineId]
    );

    if (existingMedicine.length > 0) {
      return res.status(400).json({ 
        error: 'Barcode already in use by another product' 
      });
    }

    await pool.query(
      'UPDATE medicines SET barcode = ? WHERE id = ?',
      [barcode, medicineId]
    );

    res.json({ 
      message: 'Barcode updated successfully',
      barcode
    });
  } catch (error) {
    console.error('Error updating barcode:', error);
    res.status(500).json({ error: 'Failed to update barcode' });
  }
});

// Import inventory from CSV or JSON
router.post('/import', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const { data, format = 'csv' } = req.body;
    const userId = req.user.id;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let importCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const item of data) {
        try {
          // Normalize field names based on format
          const name = item.Name || item.name;
          const genericName = item['Generic Name'] || item.generic_name;
          const stockQuantity = parseInt(item['Stock Quantity'] || item.stock_quantity);
          const minStockLevel = parseInt(item['Min Stock Level'] || item.min_stock_level);
          const maxStockLevel = parseInt(item['Max Stock Level'] || item.max_stock_level);
          const reorderPoint = parseInt(item['Reorder Point'] || item.reorder_point);
          const unit = item.Unit || item.unit;
          const supplierId = item.Supplier || item.supplier_id;
          const barcode = item.Barcode || item.barcode;
          const id = item.ID || item.id;

          // Validate required fields
          if (!name || isNaN(stockQuantity) || !unit) {
            throw new Error('Missing required fields: name, stock quantity, or unit');
          }

          // Check if item exists by ID or by name
          const [existing] = await connection.query(
            'SELECT id FROM medicines WHERE id = ? OR name = ?',
            [id || 0, name]
          );

          if (existing.length > 0) {
            // Update existing item
            await connection.query(`
              UPDATE medicines 
              SET 
                name = ?,
                generic_name = ?,
                stock_quantity = ?,
                min_stock_level = COALESCE(?, min_stock_level),
                max_stock_level = COALESCE(?, max_stock_level),
                reorder_point = COALESCE(?, reorder_point),
                unit = ?,
                supplier_id = COALESCE(?, supplier_id),
                barcode = COALESCE(?, barcode)
              WHERE id = ?
            `, [
              name,
              genericName,
              stockQuantity,
              minStockLevel || null,
              maxStockLevel || null,
              reorderPoint || null,
              unit,
              supplierId || null,
              barcode || null,
              existing[0].id
            ]);

            // Record transaction
            await connection.query(`
              INSERT INTO inventory_transactions (
                medicine_id, type, quantity, user_id, 
                transaction_date, notes
              ) VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
              existing[0].id,
              'IMPORT_UPDATE',
              stockQuantity,
              userId,
              `Imported from ${format}`
            ]);

            updateCount++;
          } else {
            // Insert new item
            const [result] = await connection.query(`
              INSERT INTO medicines (
                name, generic_name, stock_quantity, 
                min_stock_level, max_stock_level, reorder_point,
                unit, supplier_id, barcode
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              name,
              genericName || null,
              stockQuantity,
              minStockLevel || 10,  // Default values
              maxStockLevel || 100,
              reorderPoint || 20,
              unit,
              supplierId || null,
              barcode || null
            ]);

            // Record transaction
            await connection.query(`
              INSERT INTO inventory_transactions (
                medicine_id, type, quantity, user_id, 
                transaction_date, notes
              ) VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
              result.insertId,
              'IMPORT_NEW',
              stockQuantity,
              userId,
              `Imported from ${format}`
            ]);

            importCount++;
          }
        } catch (itemError) {
          errorCount++;
          errors.push({
            item: item.Name || item.name || 'Unknown item',
            error: itemError.message
          });
          // Continue with next item
        }
      }

      await connection.commit();
      res.json({ 
        message: `Inventory imported successfully. Added: ${importCount}, Updated: ${updateCount}, Errors: ${errorCount}`,
        stats: { importCount, updateCount, errorCount },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error importing inventory:', error);
    res.status(500).json({ error: 'Failed to import inventory' });
  }
});

// Export inventory to CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const [inventory] = await pool.query(`
      SELECT 
        m.*,
        s.name as supplier_name,
        CASE
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          WHEN m.stock_quantity = 0 THEN 'out_of_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
    `);

    const fields = [
      'id',
      'name',
      'generic_name',
      'stock_quantity',
      'min_stock_level',
      'max_stock_level',
      'reorder_point',
      'unit',
      'barcode',
      'supplier_name',
      'stock_status'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(inventory);

    res.header('Content-Type', 'text/csv');
    res.attachment(`inventory_export_${new Date().toISOString()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ error: 'Failed to export inventory' });
  }
});

// Export inventory to JSON
router.get('/export/json', authenticateToken, async (req, res) => {
  try {
    const [inventory] = await pool.query(`
      SELECT 
        m.*,
        s.name as supplier_name,
        CASE
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          WHEN m.stock_quantity = 0 THEN 'out_of_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
    `);

    res.header('Content-Type', 'application/json');
    res.attachment(`inventory_export_${new Date().toISOString()}.json`);
    res.send(JSON.stringify(inventory, null, 2));
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ error: 'Failed to export inventory' });
  }
});

// Get analytics data
router.get('/analytics', [authenticateToken, isAdmin], async (req, res) => {
  try {
    // Top selling products with trend analysis
    const [topSelling] = await pool.query(`
      SELECT 
        m.id,
        m.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT o.user_id) as unique_customers,
        AVG(oi.quantity) as avg_quantity_per_order,
        MIN(o.created_at) as first_sale,
        MAX(o.created_at) as last_sale
      FROM medicines m
      JOIN order_items oi ON m.id = oi.medicine_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY m.id, m.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    // Sales trends with forecasting
    const [salesTrends] = await pool.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity) as total_items_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(oi.quantity * oi.unit_price) / COUNT(DISTINCT o.id) as avg_order_value,
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
    const [inventoryAnalytics] = await pool.query(`
      WITH inventory_metrics AS (
        SELECT 
          m.id,
          m.name,
          m.stock_quantity,
          m.min_stock_level as reorder_threshold,
          COALESCE(SUM(oi.quantity), 0) as total_sold_30_days,
          COUNT(DISTINCT o.id) as order_count_30_days
        FROM medicines m
        LEFT JOIN order_items oi ON m.id = oi.medicine_id
        LEFT JOIN orders o ON oi.order_id = o.id 
          AND o.status = 'completed' 
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY m.id, m.name, m.stock_quantity, m.min_stock_level
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
    const [customerInsights] = await pool.query(`
      WITH customer_metrics AS (
        SELECT 
          u.id,
          COUNT(DISTINCT o.id) as order_count,
          SUM(o.total_amount) as total_spent,
          MIN(o.created_at) as first_order_date,
          MAX(o.created_at) as last_order_date,
          COUNT(DISTINCT oi.medicine_id) as unique_products_bought
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
      customerInsights: customerInsights[0]
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Scan barcode/QR code (for verifying products)
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { barcode } = req.body;
    
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }
    
    const [medicine] = await pool.query(`
      SELECT 
        m.*,
        s.name as supplier_name,
        CASE
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          WHEN m.stock_quantity = 0 THEN 'out_of_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.barcode = ?
    `, [barcode]);
    
    if (!medicine.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(medicine[0]);
  } catch (error) {
    console.error('Error scanning barcode:', error);
    res.status(500).json({ error: 'Failed to scan barcode' });
  }
});

export default router; 