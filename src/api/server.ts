import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { testConnection, pool } from '../config/database';
import { query, execute, withTransaction, queryPaginated } from '../utils/db';
import CONFIG from '../config/config';
import { upload, processImage } from '../utils/imageUpload';
import { RowDataPacket, Connection } from 'mysql2/promise';
import path from 'path';
import paymongoRoutes from './routes/paymongo';
import prescriptionRoutes from './routes/prescriptions';
import authRoutes from './routes/auth';
import mfaRoutes from './routes/mfa';
import { v4 as uuidv4 } from 'uuid';
import userRoutes from './routes/users';
import wishlistRoutes from './routes/wishlist';
import UserProfileService from '../services/userProfileService';
import cartRoutes from './routes/cart';
import ratingRoutes from './routes/ratings';
import orderRoutes from './routes/orders';
import invoiceRoutes from './routes/invoices';
import returnsRouter from './routes/admin/returns';
import userReturnsRouter from './routes/returns';
import adminRoutes from './routes/admin';
import couponRoutes from './routes/coupons';
import promotionsRoutes from './routes/promotions';
import shippingRoutes from './routes/admin/shipping';
import inventoryRouter from './routes/inventory';

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, CONFIG.JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = {
      id: user.userId,
      email: user.email,
      role: user.role
    };
    next();
  });
};

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const users = await query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
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

// Initialize admin user
async function initializeAdmin() {
  try {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123'; // Change this in production

    // Check if admin with this email exists
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );
    
    // Check if admin with default username exists but with different email
    const adminByUsername = await query(
      'SELECT id, email FROM users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length === 0) {
      if (adminByUsername.length > 0) {
        // Admin username exists but with different email, update the email
        await execute(
          'UPDATE users SET email = ? WHERE username = ?',
          [adminEmail, 'admin']
        );
        console.log('Admin email updated successfully');
      } else {
        // No admin exists, create a new one
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await execute(
          'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
          [adminEmail, 'admin', hashedPassword, 'admin']
        );
        console.log('Admin user created successfully');
      }
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:5174', 
    'http://127.0.0.1:5174',
    'https://dosebsit.netlify.app'  // Add your Netlify domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Serve files from uploads directory
app.use('/uploads', express.static('public/uploads'));

// Special handling for order returns - this needs to be before the route declarations
app.use((req, res, next) => {
  // Check if the request URL matches the pattern /api/orders/:orderId/returns
  const match = req.url.match(/^\/api\/orders\/([^\/]+)\/returns$/);
  if (match && (req.method === 'POST' || req.method === 'GET')) {
    // Modify the URL to match the actual returns endpoint
    const orderId = match[1];
    req.url = `/api/returns/orders/${orderId}/returns`;
    console.log(`[Returns Redirect] Redirecting ${req.method} request to ${req.url}`);
  }
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin/returns', returnsRouter);
app.use('/api/returns', userReturnsRouter);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/shipping', shippingRoutes);
app.use('/api/inventory', inventoryRouter);

// In-memory storage (replace with a proper database in production)
const users: any[] = [];
const products: any[] = [];

// Use JWT_SECRET from config
const JWT_SECRET = CONFIG.JWT_SECRET;

// Initialize database and start server
async function initializeServer() {
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database after retries. Server will continue to run, but database features will be unavailable.');
    } else {
      // Only try to initialize database features if connection is successful
      try {
        await initializeAdmin();
        console.log('Admin initialization completed');

        // Create wishlist_items table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS wishlist_items (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            medicine_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_medicine (user_id, medicine_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
          )
        `);
        console.log('Wishlist table check completed');

        // Create review features if they don't exist
        await pool.query(`
          -- Check if columns exist
          SELECT COUNT(*) AS column_count
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE()
        `);
        console.log('Review features check completed');
      } catch (error) {
        console.error('Error during database initialization:', error);
        console.log('Server will continue to run, but some features may be unavailable');
      }
    }

    // Start the server regardless of database status
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Critical error during server initialization:', error);
    process.exit(1);
  }
}

// Initialize the server
initializeServer();

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

// Admin Orders routes
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await query(`
      SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        u.email as user_email,
        u.username as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await query(`
        SELECT 
          oi.medicine_id,
          oi.quantity,
          oi.unit_price,
          m.name as medicine_name
        FROM order_items oi
        LEFT JOIN medicines m ON oi.medicine_id = m.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return {
        ...order,
        items,
        user: {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email
        }
      };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status (admin)
app.put('/api/admin/orders/:orderId/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Update the order status
    const result = await execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
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
        m.min_stock_level,
        m.max_stock_level,
        m.reorder_point,
        CASE 
          WHEN m.stock_quantity = 0 THEN 'out_of_stock'
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        mc.name as category_name,
        s.name as supplier_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings
       FROM medicines m 
       LEFT JOIN medicine_categories mc ON m.category_id = mc.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       LEFT JOIN ratings r ON m.id = r.medicine_id
       GROUP BY m.id
       ORDER BY m.name ASC`,
      []
    );

    res.json(medicines);
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
        m.min_stock_level,
        m.max_stock_level,
        m.reorder_point,
        CASE 
          WHEN m.stock_quantity = 0 THEN 'out_of_stock'
          WHEN m.stock_quantity <= m.min_stock_level THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        mc.name as category_name,
        s.name as supplier_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings
       FROM medicines m 
       LEFT JOIN medicine_categories mc ON m.category_id = mc.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       LEFT JOIN ratings r ON m.id = r.medicine_id
       WHERE m.id = ?
       GROUP BY m.id`,
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

    // Convert values to appropriate types and process name
    const processedData = {
      name: name.replace(/\s+/g, ''),
      generic_name: generic_name ? generic_name.replace(/\s+/g, '') : null,
      brand: brand ? brand.replace(/\s+/g, '') : null,
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
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const profile = await UserProfileService.getProfile(req.user.id);
    if (!profile) {
      await UserProfileService.ensureProfileExists(req.user.id);
      const newProfile = await UserProfileService.getProfile(req.user.id);
      return res.json(newProfile);
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Add PUT endpoint for updating user profile
app.put('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const profileData = req.body;
    await UserProfileService.ensureProfileExists(req.user.id);
    await UserProfileService.updateProfile(req.user.id, profileData);

    const updatedProfile = await UserProfileService.getProfile(req.user.id);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Cart endpoints
app.get('/api/cart', authenticateToken, async (req: any, res) => {
  try {
    // Get or create cart for user
    let cart = await query(
      'SELECT id FROM cart WHERE user_id = ?',
      [req.user.id]
    );

    if (cart.length === 0) {
      const result = await execute(
        'INSERT INTO cart (user_id) VALUES (?)',
        [req.user.id]
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

// New endpoint to clear all cart items
app.delete('/api/cart/clear', authenticateToken, async (req: any, res) => {
  try {
    // Get cart for user
    const cart = await query(
      'SELECT id FROM cart WHERE user_id = ?',
      [req.user.id]
    );

    if (cart.length === 0) {
      return res.json({ message: 'Cart is already empty' });
    }

    // Clear all items from the cart
    await execute(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cart[0].id]
    );

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
});

app.post('/api/cart/items', authenticateToken, async (req: any, res) => {
  try {
    const { medicine_id, quantity } = req.body;

    // Get or create cart
    let cart = await query(
      'SELECT id FROM cart WHERE user_id = ?',
      [req.user.id]
    );

    if (cart.length === 0) {
      const result = await execute(
        'INSERT INTO cart (user_id) VALUES (?)',
        [req.user.id]
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
      [itemId, req.user.id]
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
      [itemId, req.user.id]
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

    // Update medicine with processed names
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
        name.replace(/\s+/g, ''),
        generic_name ? generic_name.replace(/\s+/g, '') : null,
        brand ? brand.replace(/\s+/g, '') : null,
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

// Orders routes
app.post('/api/orders', authenticateToken, async (req, res) => {
  let connection;
  try {
    console.log('Received order request:', req.body);
    console.log('User ID:', req.user.id);

    connection = await pool.getConnection();
    console.log('Database connection established');

    const { 
      items, 
      total_amount, 
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_country,
      shipping_postal_code,
      shipping_method_id,
      shipping_cost,
      tax_amount
    } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Invalid items',
        details: 'Items array is required and must not be empty'
      });
    }

    if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
      return res.status(400).json({
        error: 'Invalid total amount',
        details: 'Total amount must be a positive number'
      });
    }

    // Validate shipping information
    if (!shipping_address || !shipping_city || !shipping_state || !shipping_country || !shipping_postal_code) {
      return res.status(400).json({
        error: 'Invalid shipping information',
        details: 'Complete shipping information is required'
      });
    }

    // Validate shipping method
    if (!shipping_method_id) {
      return res.status(400).json({
        error: 'Invalid shipping method',
        details: 'A shipping method must be selected'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.medicine_id || !item.quantity || !item.price_per_unit) {
        return res.status(400).json({
          error: 'Invalid item data',
          details: 'Each item must have medicine_id, quantity, and price_per_unit'
        });
      }
    }

    // Generate a unique order ID
    const orderId = uuidv4();
    console.log('Generated order ID:', orderId);

    // Start transaction
    await connection.beginTransaction();
    console.log('Transaction started');

    // Verify the shipping method exists
    const [shippingMethod] = await connection.query(
      'SELECT id, name, base_cost FROM shipping_methods WHERE id = ? AND is_active = 1',
      [shipping_method_id]
    );

    if (!shippingMethod.length) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Invalid shipping method',
        details: 'The selected shipping method does not exist or is inactive'
      });
    }

    // Insert the order
    await connection.query(
      `INSERT INTO orders (
        id, user_id, total_amount, status, 
        shipping_address, shipping_city, shipping_state, 
        shipping_country, shipping_postal_code, 
        shipping_method_id, shipping_cost, tax_amount
      ) VALUES (?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 
        user_id, 
        total_amount, 
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country,
        shipping_postal_code,
        shipping_method_id,
        shipping_cost || shippingMethod[0].base_cost,
        tax_amount || 0
      ]
    );
    console.log('Order created in database');

    // Process each item
    for (const item of items) {
      // Check if medicine exists and has enough stock
      const [medicine] = await connection.query(
        'SELECT id, name, unit, price, stock_quantity FROM medicines WHERE id = ? FOR UPDATE',
        [item.medicine_id]
      );

      if (medicine.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Invalid medicine',
          details: `Medicine with ID ${item.medicine_id} does not exist`
        });
      }

      if (medicine[0].stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Insufficient stock',
          details: `Not enough stock for medicine: ${medicine[0].name}`
        });
      }

      // Insert order item
      await connection.query(
        'INSERT INTO order_items (order_id, medicine_id, name, unit, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
        [
          orderId,
          item.medicine_id,
          medicine[0].name,
          medicine[0].unit,
          item.quantity,
          item.price_per_unit
        ]
      );
      console.log(`Added item ${medicine[0].name} to order`);

      // Update stock
      await connection.query(
        'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.medicine_id]
      );
      console.log(`Updated stock for medicine ID ${item.medicine_id}`);
    }

    // Commit the transaction
    await connection.commit();
    console.log('Transaction committed successfully');

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
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
    const userId = req.user.id;

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
    await withTransaction(async () => {
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

      // Clear cart after payment is submitted
      await execute(
        'DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = ?)',
        [userId]
      );
    });

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

// PayMongo routes
app.use('/api/payments', paymongoRoutes);

// Order history endpoint
app.get('/api/orders/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // First get the orders
    const orders = await query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, o.updated_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Then get the order items for each order
    const processedOrders = await Promise.all(orders.map(async (order) => {
      const items = await query(
        `SELECT oi.medicine_id, oi.quantity, oi.unit_price, m.name as medicine_name
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      return {
        ...order,
        total_amount: Number(order.total_amount),
        items: items.map(item => ({
          ...item,
          unit_price: Number(item.unit_price)
        }))
      };
    }));

    res.json(processedOrders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Error fetching order history' });
  }
});

// Reports endpoints
app.get('/api/admin/reports/sales', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get daily sales for the last 7 days
    const dailySales = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as period,
        SUM(total_amount) as total
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY period
      ORDER BY period DESC
      LIMIT 7
    `);

    // Get monthly sales for the last 6 months
    const monthlySales = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as period,
        SUM(total_amount) as total
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY period
      ORDER BY period DESC
      LIMIT 6
    `);

    // Get order count
    const [orderCount] = await query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = 'completed'
    `);

    // Get total revenue
    const [totalRevenue] = await query(`
      SELECT SUM(total_amount) as total
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    // Get average order value
    const [avgOrderValue] = await query(`
      SELECT AVG(total_amount) as average
      FROM orders
      WHERE status = 'completed'
    `);

    // Format daily sales with readable period names
    const formattedDailySales = dailySales.map((day) => {
      const date = new Date(day.period);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let periodName;
      if (diffDays === 0) {
        periodName = 'Today';
      } else if (diffDays === 1) {
        periodName = 'Yesterday';
      } else {
        periodName = `${diffDays} days ago`;
      }
      
      return {
        period: periodName,
        total: Number(day.total) || 0
      };
    });

    // Format monthly sales with readable period names
    const formattedMonthlySales = monthlySales.map((month) => {
      const [year, monthNum] = month.period.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'];
      
      return {
        period: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        total: Number(month.total) || 0
      };
    });

    res.json({
      dailySales: formattedDailySales,
      monthlySales: formattedMonthlySales,
      summary: {
        orderCount: orderCount.count || 0,
        monthlyRevenue: Number(totalRevenue.total) || 0,
        averageOrderValue: Number(avgOrderValue.average) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching sales reports:', error);
    res.status(500).json({ message: 'Error fetching sales reports' });
  }
});

// Admin dashboard data
app.get('/api/admin/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Total sales
    const [totalSales] = await query(`
      SELECT SUM(total_amount) as value
      FROM orders
      WHERE status = 'completed'
    `);

    // Get percentage change in revenue compared to previous month
    const [currentMonthSales] = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as value
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_FORMAT(NOW() ,'%Y-%m-01')
    `);

    const [previousMonthSales] = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as value
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH) ,'%Y-%m-01')
      AND created_at < DATE_FORMAT(NOW() ,'%Y-%m-01')
    `);

    let revenueChange = 0;
    if (previousMonthSales.value > 0) {
      revenueChange = ((currentMonthSales.value - previousMonthSales.value) / previousMonthSales.value) * 100;
    }

    // Low stock items
    const lowStockItems = await query(`
      SELECT COUNT(*) as count, 
             SUM(CASE WHEN stock_quantity <= 5 THEN 1 ELSE 0 END) as critical
      FROM medicines
      WHERE stock_quantity <= min_stock_level
    `);

    // Total inventory
    const [totalInventory] = await query(`
      SELECT COUNT(*) as count, 
             COUNT(DISTINCT category_id) as categories
      FROM medicines
    `);

    // Monthly revenue (current month)
    const [monthlyRevenue] = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as value
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_FORMAT(NOW() ,'%Y-%m-01')
    `);

    // Get percentage change in monthly revenue compared to previous month
    let monthlyChange = 0;
    if (previousMonthSales.value > 0) {
      monthlyChange = ((currentMonthSales.value - previousMonthSales.value) / previousMonthSales.value) * 100;
    }

    // Active users
    const [activeUsers] = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'user'
    `);

    // New users this week
    const [newUsers] = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND role = 'user'
    `);

    // Orders data
    const [orders] = await query(`
      SELECT COUNT(*) as count
      FROM orders
    `);

    // Pending orders
    const [pendingOrders] = await query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = 'payment_submitted'
    `);

    // Recent orders
    const recentOrders = await query(`
      SELECT o.id, o.total_amount, o.status, o.created_at,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 4
    `);

    // Low stock medicines
    const lowStockMedicines = await query(`
      SELECT id, name, stock_quantity
      FROM medicines
      WHERE stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
      LIMIT 4
    `);

    res.json({
      stats: [
        {
          title: 'Total Sales',
          value: Number(totalSales.value) || 0,
          change: revenueChange.toFixed(1) + '%',
          isPositive: revenueChange >= 0
        },
        {
          title: 'Low Stock Items',
          value: lowStockItems[0].count || 0,
          change: (lowStockItems[0].critical || 0) + ' critical',
          isPositive: false
        },
        {
          title: 'Total Inventory',
          value: totalInventory.count || 0,
          change: (totalInventory.categories || 0) + ' categories',
          isPositive: true
        },
        {
          title: 'Monthly Revenue',
          value: Number(monthlyRevenue.value) || 0,
          change: monthlyChange.toFixed(1) + '%',
          isPositive: monthlyChange >= 0
        },
        {
          title: 'Active Users',
          value: activeUsers.count || 0,
          change: '+' + (newUsers.count || 0) + ' this week',
          isPositive: true
        },
        {
          title: 'Orders',
          value: orders.count || 0,
          change: (pendingOrders.count || 0) + ' pending',
          isPositive: pendingOrders.count > 0
        }
      ],
      recentOrders: recentOrders,
      lowStockMedicines: lowStockMedicines
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Shipping methods endpoint
app.get('/api/shipping-methods', authenticateToken, async (req, res) => {
  try {
    const shippingMethods = await query(
      `SELECT id, name, base_cost, estimated_days, is_active  
       FROM shipping_methods
       WHERE is_active = 1
       ORDER BY base_cost ASC`
    );
    
    res.json(shippingMethods);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ message: 'Error fetching shipping methods' });
  }
});

// Tax rates endpoint
app.get('/api/tax-rates', authenticateToken, async (req, res) => {
  try {
    const { country, state } = req.query;
    
    if (!country) {
      return res.status(400).json({ message: 'Country is required' });
    }
    
    // Get tax rate for the country and state (with fallback to country-wide rate)
    const taxRate = await query(
      `SELECT id, country, state, rate 
       FROM tax_rates
       WHERE country = ? 
       AND (state = ? OR state IS NULL)
       AND is_active = 1
       ORDER BY state IS NULL
       LIMIT 1`,
      [country, state || '']
    );
    
    if (taxRate.length === 0) {
      return res.json({ rate: 0 });
    }
    
    res.json(taxRate[0]);
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    res.status(500).json({ message: 'Error fetching tax rate' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});