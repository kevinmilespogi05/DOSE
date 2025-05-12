import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../server';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { createObjectCsvWriter } from 'csv-writer';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';

const router = Router();

// Get inventory status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const [inventory] = await pool.query(
      `SELECT 
        id, name, stock_quantity, min_stock_level, max_stock_level,
        CASE 
          WHEN stock_quantity <= 0 THEN 'out_of_stock'
          WHEN stock_quantity <= min_stock_level THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM medicines
       ORDER BY name`
    );

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update stock levels
router.put('/stock/:medicineId',
  authenticateToken,
  isAdmin,
  body('quantity').isInt({ min: 0 }),
  body('type').isIn(['IN', 'OUT']),
  body('batch_number').optional().isString(),
  body('unit_price').optional().isFloat({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { medicineId } = req.params;
      const { quantity, type, batch_number, unit_price } = req.body;
      const userId = req.user.id;

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Update stock quantity
        const updateQuery = type === 'IN' 
          ? 'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?'
          : 'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?';
        
        await connection.query(updateQuery, [quantity, medicineId]);

        // Record transaction
        await connection.query(
          `INSERT INTO inventory_transactions 
           (medicine_id, type, quantity, batch_number, user_id, unit_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [medicineId, type, quantity, batch_number, userId, unit_price]
        );

        // Check if stock level is below minimum
        const [medicine] = await connection.query(
          'SELECT name, stock_quantity, min_stock_level FROM medicines WHERE id = ?',
          [medicineId]
        );

        if (medicine[0].stock_quantity <= medicine[0].min_stock_level) {
          // Send low stock alert to admin
          const [admins] = await connection.query(
            'SELECT email FROM users WHERE role = "admin"'
          );
          
          for (const admin of admins) {
            await sendEmail(
              admin.email,
              'Low Stock Alert',
              `Medicine ${medicine[0].name} is running low on stock. Current quantity: ${medicine[0].stock_quantity}`
            );
          }
        }

        await connection.commit();
        res.json({ message: 'Stock updated successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Set reorder thresholds
router.put('/thresholds/:medicineId',
  authenticateToken,
  isAdmin,
  body('min_stock_level').isInt({ min: 0 }),
  body('max_stock_level').isInt({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { medicineId } = req.params;
      const { min_stock_level, max_stock_level } = req.body;

      if (min_stock_level >= max_stock_level) {
        return res.status(400).json({ message: 'Minimum stock level must be less than maximum stock level' });
      }

      await pool.query(
        'UPDATE medicines SET min_stock_level = ?, max_stock_level = ? WHERE id = ?',
        [min_stock_level, max_stock_level, medicineId]
      );

      res.json({ message: 'Reorder thresholds updated successfully' });
    } catch (error) {
      console.error('Update thresholds error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Export inventory to CSV
router.get('/export/csv', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [inventory] = await pool.query(
      `SELECT 
        m.id, m.name, m.generic_name, m.brand, m.category,
        m.stock_quantity, m.unit, m.price, m.min_stock_level,
        m.max_stock_level, m.expiry_date, m.barcode,
        CASE 
          WHEN m.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM medicines m
       ORDER BY m.name`
    );

    const csvWriter = createObjectCsvWriter({
      path: 'inventory.csv',
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'generic_name', title: 'Generic Name' },
        { id: 'brand', title: 'Brand' },
        { id: 'category', title: 'Category' },
        { id: 'stock_quantity', title: 'Stock Quantity' },
        { id: 'unit', title: 'Unit' },
        { id: 'price', title: 'Price' },
        { id: 'min_stock_level', title: 'Min Stock Level' },
        { id: 'max_stock_level', title: 'Max Stock Level' },
        { id: 'expiry_date', title: 'Expiry Date' },
        { id: 'barcode', title: 'Barcode' },
        { id: 'stock_status', title: 'Stock Status' }
      ]
    });

    await csvWriter.writeRecords(inventory);
    res.download('inventory.csv', 'inventory.csv', (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the file after download
      fs.unlinkSync('inventory.csv');
    });
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export inventory to JSON
router.get('/export/json', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [inventory] = await pool.query(
      `SELECT 
        m.id, m.name, m.generic_name, m.brand, m.category,
        m.stock_quantity, m.unit, m.price, m.min_stock_level,
        m.max_stock_level, m.expiry_date, m.barcode,
        CASE 
          WHEN m.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM medicines m
       ORDER BY m.name`
    );

    res.json(inventory);
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Import inventory from CSV
router.post('/import/csv',
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.files.file;
      const filePath = path.join(__dirname, 'temp', file.name);
      
      await file.mv(filePath);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      const parser = new Parser();
      const records = parser.parse(fileContent);

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        for (const record of records) {
          await connection.query(
            `INSERT INTO medicines (
              name, generic_name, brand, category, stock_quantity,
              unit, price, min_stock_level, max_stock_level,
              expiry_date, barcode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              generic_name = VALUES(generic_name),
              brand = VALUES(brand),
              category = VALUES(category),
              stock_quantity = VALUES(stock_quantity),
              unit = VALUES(unit),
              price = VALUES(price),
              min_stock_level = VALUES(min_stock_level),
              max_stock_level = VALUES(max_stock_level),
              expiry_date = VALUES(expiry_date)`,
            [
              record.name,
              record.generic_name,
              record.brand,
              record.category,
              record.stock_quantity,
              record.unit,
              record.price,
              record.min_stock_level,
              record.max_stock_level,
              record.expiry_date,
              record.barcode
            ]
          );
        }

        await connection.commit();
        res.json({ message: 'Inventory imported successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
        // Clean up the temporary file
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Import inventory error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get inventory transactions
router.get('/transactions',
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const [transactions] = await pool.query(
        `SELECT 
          it.*, m.name as medicine_name, u.name as user_name
         FROM inventory_transactions it
         JOIN medicines m ON it.medicine_id = m.id
         JOIN users u ON it.user_id = u.id
         ORDER BY it.transaction_date DESC`
      );

      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router; 