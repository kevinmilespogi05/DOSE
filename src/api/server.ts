import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { testConnection } from '../config/database';
import { query, execute, withTransaction, queryPaginated } from '../utils/db';
import CONFIG from '../config/config';
import { upload, processImage } from '../utils/imageUpload';
import { RowDataPacket, Connection } from 'mysql2/promise';
import path from 'path';

// Initialize admin user
async function initializeAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123'; // Change this in production

    // Check if admin exists
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await execute(
        'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [adminEmail, 'admin', hashedPassword, 'admin']
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// In-memory storage (replace with a proper database in production)
const users: any[] = [];
const products: any[] = [];

// Use JWT_SECRET from config
const JWT_SECRET = CONFIG.JWT_SECRET;

// Test database connection on server start
testConnection();

// Initialize admin on startup
initializeAdmin();

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, CONFIG.JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const users = await query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await execute(
      'INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, email.split('@')[0], 'user']
    );

    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET);
    res.status(201).json({ 
      token,
      user: { 
        id: result.insertId,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Get user from database
    const users = await query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    console.log('Found users:', users.length);

    if (users.length === 0) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0];
    console.log('User role:', user.role);
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Admin user management routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await query(
      `SELECT id, email, username, role, created_at 
       FROM users 
       WHERE role != 'admin'
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if trying to delete admin
    const users = await query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }

    await execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Product routes
app.get('/api/products', authenticateToken, (req, res) => {
  res.json(products);
});

app.post('/api/products', authenticateToken, (req: any, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const product = { id: Date.now().toString(), ...req.body };
  products.push(product);
  res.status(201).json(product);
});

// Add medicines routes
app.get('/api/medicines', authenticateToken, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedSortFields = [
      'name',
      'generic_name',
      'brand',
      'price',
      'stock_quantity',
      'created_at'
    ];

    const baseSql = `
      SELECT 
        m.id,
        m.name,
        m.generic_name,
        m.brand,
        CAST(m.price AS DECIMAL(10,2)) as price,
        m.stock_quantity,
        m.unit,
        m.image_url,
        m.requires_prescription,
        mc.name as category_name,
        s.name as supplier_name,
        m.created_at
      FROM medicines m 
      LEFT JOIN medicine_categories mc ON m.category_id = mc.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
    `;

    const result = await queryPaginated(
      baseSql,
      { page, limit, sortBy, sortOrder },
      [],
      allowedSortFields
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Error fetching medicines' });
  }
});

app.get('/api/medicines/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const medicines = await query(
      `SELECT 
        m.id,
        m.name,
        m.generic_name,
        m.brand,
        m.description,
        CAST(m.price AS DECIMAL(10,2)) as price,
        m.stock_quantity,
        m.unit,
        m.image_url,
        m.requires_prescription,
        mc.name as category_name,
        s.name as supplier_name
       FROM medicines m 
       LEFT JOIN medicine_categories mc ON m.category_id = mc.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`,
      [id]
    );

    if (medicines.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(medicines[0]);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ message: 'Error fetching medicine' });
  }
});

// Add image upload endpoint
app.post('/api/medicines/upload', authenticateToken, isAdmin, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = await processImage(req.file);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Medicine Categories endpoints
app.get('/api/medicine-categories', authenticateToken, async (req: any, res) => {
  try {
    const categories = await query('SELECT * FROM medicine_categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching medicine categories:', error);
    res.status(500).json({ message: 'Error fetching medicine categories' });
  }
});

// Suppliers endpoints
app.get('/api/suppliers', authenticateToken, async (req: any, res) => {
  try {
    const suppliers = await query('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers' });
  }
});

// Update the medicine creation endpoint to handle all fields
app.post('/api/medicines', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const {
      name,
      generic_name,
      brand,
      category_id,
      description,
      price,
      stock_quantity,
      unit,
      supplier_id,
      requires_prescription,
      min_stock_level,
      max_stock_level,
      expiry_date,
      image_url
    } = req.body;

    console.log('Creating medicine with data:', req.body);

    // Validate required fields
    if (!name || !price || !stock_quantity || !unit) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'price', 'stock_quantity', 'unit']
      });
    }

    // Convert values to appropriate types
    const processedData = {
      name,
      generic_name: generic_name || null,
      brand: brand || null,
      category_id: category_id ? parseInt(category_id) : null,
      description: description || null,
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity),
      unit,
      supplier_id: supplier_id ? parseInt(supplier_id) : null,
      requires_prescription: requires_prescription || false,
      min_stock_level: min_stock_level ? parseInt(min_stock_level) : 10,
      max_stock_level: max_stock_level ? parseInt(max_stock_level) : 100,
      expiry_date: expiry_date || null,
      image_url: image_url || null
    };

    console.log('Processed data:', processedData);

    const result = await execute(
      `INSERT INTO medicines (
        name,
        generic_name,
        brand,
        category_id,
        description,
        price,
        stock_quantity,
        unit,
        supplier_id,
        requires_prescription,
        min_stock_level,
        max_stock_level,
        expiry_date,
        image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        processedData.name,
        processedData.generic_name,
        processedData.brand,
        processedData.category_id,
        processedData.description,
        processedData.price,
        processedData.stock_quantity,
        processedData.unit,
        processedData.supplier_id,
        processedData.requires_prescription,
        processedData.min_stock_level,
        processedData.max_stock_level,
        processedData.expiry_date,
        processedData.image_url
      ]
    );

    console.log('Medicine inserted, creating inventory transaction...');

    // Create an inventory transaction for the initial stock
    if (processedData.stock_quantity > 0) {
      await execute(
        `INSERT INTO inventory_transactions (
          medicine_id,
          type,
          quantity,
          user_id,
          supplier_id,
          unit_price
        ) VALUES (?, 'IN', ?, ?, ?, ?)`,
        [result.insertId, processedData.stock_quantity, req.user.userId, processedData.supplier_id, processedData.price]
      );
    }

    console.log('Medicine created successfully with ID:', result.insertId);

    res.status(201).json({
      id: result.insertId,
      message: 'Medicine created successfully'
    });
  } catch (error: any) {
    console.error('Error creating medicine:', error);
    
    // Check for specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: 'Invalid category_id or supplier_id provided'
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: 'A medicine with this name already exists'
      });
    }

    res.status(500).json({ 
      message: 'Error creating medicine',
      error: error.message 
    });
  }
});

// Add user profile endpoint
app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const users = await query(
      `SELECT id, username, email, role, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Cart endpoints
app.get('/api/cart', authenticateToken, async (req: any, res) => {
  try {
    // Get or create cart for user
    let cart = await query(
      'SELECT id FROM cart WHERE user_id = ?',
      [req.user.userId]
    );

    if (cart.length === 0) {
      const result = await execute(
        'INSERT INTO cart (user_id) VALUES (?)',
        [req.user.userId]
      );
      cart = await query(
        'SELECT id FROM cart WHERE id = ?',
        [result.insertId]
      );
    }

    // Get cart items with medicine details
    const cartItems = await query(
      `SELECT 
        ci.id,
        ci.medicine_id,
        ci.quantity,
        m.name,
        m.price,
        m.unit,
        m.image_url
       FROM cart_items ci
       JOIN medicines m ON ci.medicine_id = m.id
       WHERE ci.cart_id = ?`,
      [cart[0].id]
    );

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

app.post('/api/cart/items', authenticateToken, async (req: any, res) => {
  try {
    const { medicine_id, quantity } = req.body;

    // Get or create cart
    let cart = await query(
      'SELECT id FROM cart WHERE user_id = ?',
      [req.user.userId]
    );

    if (cart.length === 0) {
      const result = await execute(
        'INSERT INTO cart (user_id) VALUES (?)',
        [req.user.userId]
      );
      cart = await query(
        'SELECT id FROM cart WHERE id = ?',
        [result.insertId]
      );
    }

    // Check if item already exists in cart
    const existingItem = await query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND medicine_id = ?',
      [cart[0].id, medicine_id]
    );

    if (existingItem.length > 0) {
      // Update quantity if item exists
      await execute(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existingItem[0].id]
      );
    } else {
      // Add new item if it doesn't exist
      await execute(
        'INSERT INTO cart_items (cart_id, medicine_id, quantity) VALUES (?, ?, ?)',
        [cart[0].id, medicine_id, quantity]
      );
    }

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
});

app.put('/api/cart/items/:id', authenticateToken, async (req: any, res) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.id;

    // Verify item belongs to user's cart
    const cartItem = await query(
      `SELECT ci.id 
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [itemId, req.user.userId]
    );

    if (cartItem.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, itemId]
    );

    res.json({ message: 'Quantity updated' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Error updating cart item' });
  }
});

app.delete('/api/cart/items/:id', authenticateToken, async (req: any, res) => {
  try {
    const itemId = req.params.id;

    // Verify item belongs to user's cart
    const cartItem = await query(
      `SELECT ci.id 
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [itemId, req.user.userId]
    );

    if (cartItem.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await execute(
      'DELETE FROM cart_items WHERE id = ?',
      [itemId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Error removing cart item' });
  }
});

// Update medicine
app.put('/api/medicines/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      generic_name,
      brand,
      category_id,
      description,
      price,
      stock_quantity,
      unit,
      supplier_id,
      requires_prescription,
      min_stock_level,
      max_stock_level,
      expiry_date,
      image_url
    } = req.body;

    // Check if medicine exists
    const existingMedicine = await query(
      'SELECT id FROM medicines WHERE id = ?',
      [id]
    );

    if (existingMedicine.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Update medicine
    await execute(
      `UPDATE medicines SET
        name = ?,
        generic_name = ?,
        brand = ?,
        category_id = ?,
        description = ?,
        price = ?,
        stock_quantity = ?,
        unit = ?,
        supplier_id = ?,
        requires_prescription = ?,
        min_stock_level = ?,
        max_stock_level = ?,
        expiry_date = ?,
        image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        generic_name || null,
        brand || null,
        category_id || null,
        description || null,
        price,
        stock_quantity,
        unit,
        supplier_id || null,
        requires_prescription || false,
        min_stock_level || 10,
        max_stock_level || 100,
        expiry_date || null,
        image_url || null,
        id
      ]
    );

    res.json({ message: 'Medicine updated successfully' });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ message: 'Error updating medicine' });
  }
});

// Delete medicine
app.delete('/api/medicines/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if medicine exists
    const existingMedicine = await query(
      'SELECT id FROM medicines WHERE id = ?',
      [id]
    );

    if (existingMedicine.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    await withTransaction(async (connection: Connection) => {
      // Delete related records in the correct order
      // 1. Delete prescription items
      await connection.execute(
        'DELETE FROM prescription_items WHERE medicine_id = ?',
        [id]
      );

      // 2. Delete cart items
      await connection.execute(
        'DELETE FROM cart_items WHERE medicine_id = ?',
        [id]
      );

      // 3. Delete order items
      await connection.execute(
        'DELETE FROM order_items WHERE medicine_id = ?',
        [id]
      );

      // 4. Delete inventory transactions
      await connection.execute(
        'DELETE FROM inventory_transactions WHERE medicine_id = ?',
        [id]
      );

      // 5. Finally delete the medicine
      await connection.execute(
        'DELETE FROM medicines WHERE id = ?',
        [id]
      );
    });

    res.json({ message: 'Medicine deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting medicine:', err);
    res.status(500).json({ 
      message: 'Error deleting medicine',
      error: err.message || 'Unknown error occurred'
    });
  }
});

// Orders endpoints
app.post('/api/orders', authenticateToken, async (req: any, res) => {
  const { items } = req.body;
  const userId = req.user.userId;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid items' });
  }

  try {
    const result = await withTransaction(async () => {
      // Calculate total amount and verify stock
      let totalAmount = 0;
      const medicineIds = items.map(item => item.medicine_id);
      const placeholders = medicineIds.map(() => '?').join(',');
      const medicines = await query(
        `SELECT id, price, stock_quantity FROM medicines WHERE id IN (${placeholders})`,
        medicineIds
      );

      const medicineMap = new Map(medicines.map(m => [m.id, m]));

      for (const item of items) {
        const medicine = medicineMap.get(item.medicine_id);
        if (!medicine) {
          throw new Error(`Medicine with ID ${item.medicine_id} not found`);
        }
        if (medicine.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine ${item.medicine_id}`);
        }
        totalAmount += parseFloat(medicine.price) * item.quantity;
      }

      // Create order
      const orderId = Date.now().toString();
      await execute(
        'INSERT INTO orders (id, user_id, total_amount, status) VALUES (?, ?, ?, ?)',
        [orderId, userId, totalAmount, 'pending_payment']
      );

      // Create order items
      for (const item of items) {
        const medicine = medicineMap.get(item.medicine_id);
        if (medicine) {
          await execute(
            'INSERT INTO order_items (order_id, medicine_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
            [orderId, item.medicine_id, item.quantity, medicine.price]
          );

          // Update stock quantity
          await execute(
            'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.medicine_id]
          );
        }
      }

      return { orderId, totalAmount };
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Error creating order' });
  }
});

// Payment endpoints
app.post('/api/payments/gcash', authenticateToken, upload.single('paymentProof'), async (req: any, res) => {
  const { orderId, referenceNumber } = req.body;
  const userId = req.user.userId;

  if (!req.file) {
    return res.status(400).json({ message: 'Payment proof is required' });
  }

  try {
    // Verify order belongs to user and is in correct status
    const orders = await query(
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

    const paymentId = Date.now().toString();
    const paymentProofUrl = `/uploads/payments/${req.file.filename}`;

    await withTransaction(async () => {
      // Create payment record
      await execute(
        'INSERT INTO payments (id, order_id, amount, reference_number, payment_proof_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [paymentId, orderId, order.total_amount, referenceNumber, paymentProofUrl, 'pending']
      );

      // Update order status
      await execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['payment_submitted', orderId]
      );

      // Clear cart after payment is submitted
      await execute(
        'DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = ?)',
        [userId]
      );
    });

    res.status(201).json({ message: 'Payment submitted successfully' });
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Error submitting payment' });
  }
});

// Payment verification endpoint
app.post('/api/payments/verify', authenticateToken, async (req: any, res) => {
  try {
    const { orderId, sourceId } = req.body;
    const userId = req.user.userId;

    // Verify that the order belongs to the user
    const orders = await query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment already exists
    const existingPayment = await query(
      'SELECT * FROM payments WHERE order_id = ?',
      [orderId]
    );

    if (existingPayment.length > 0) {
      return res.status(400).json({ message: 'Payment already exists for this order' });
    }

    // Create payment record
    const paymentId = Date.now().toString();
    await execute(
      `INSERT INTO payments (id, order_id, amount, payment_method, source_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paymentId, orderId, orders[0].total_amount, 'gcash', sourceId, 'processing']
    );

    // Update order status
    await execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['payment_submitted', orderId]
    );

    res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

// Admin payment validation endpoints
app.get('/api/admin/payments/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payments = await query(`
      SELECT 
        p.*,
        o.total_amount as order_amount,
        u.id as user_id,
        u.email as user_email,
        u.username as user_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `);

    res.json(payments.map(payment => ({
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      referenceNumber: payment.reference_number,
      paymentProofUrl: payment.payment_proof_url,
      status: payment.status,
      createdAt: payment.created_at,
      user: {
        id: payment.user_id,
        name: payment.user_name,
        email: payment.user_email
      }
    })));
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ message: 'Error fetching pending payments' });
  }
});

app.post('/api/admin/payments/:id/validate', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    await withTransaction(async () => {
      // Update payment status
      await execute(
        'UPDATE payments SET status = ? WHERE id = ?',
        [status, id]
      );

      // Get order ID
      const payments = await query(
        'SELECT order_id FROM payments WHERE id = ?',
        [id]
      );

      if (payments.length === 0) {
        throw new Error('Payment not found');
      }

      // Update order status based on payment status
      const orderStatus = status === 'approved' ? 'payment_approved' : 'pending_payment';
      await execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [orderStatus, payments[0].order_id]
      );
    });

    res.json({ message: 'Payment validated successfully' });
  } catch (error) {
    console.error('Error validating payment:', error);
    res.status(500).json({ message: 'Error validating payment' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
});