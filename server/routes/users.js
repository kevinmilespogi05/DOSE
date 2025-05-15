import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { body } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [[profile]] = await pool.query(
      'SELECT u.email, u.name, p.* FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?',
      [req.user.id]
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    let profilePicturePath = null;
    if (req.file) {
      // Process and save profile picture
      const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
      profilePicturePath = `/uploads/profiles/${filename}`;
      
      await sharp(req.file.buffer)
        .resize(300, 300)
        .jpeg({ quality: 90 })
        .toFile(`./public${profilePicturePath}`);
    }

    const { phone_number, address } = req.body;
    
    // Upsert profile data
    await pool.query(`
      INSERT INTO user_profiles (user_id, profile_picture, phone_number, address)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        profile_picture = COALESCE(?, profile_picture),
        phone_number = ?,
        address = ?
    `, [
      req.user.id,
      profilePicturePath,
      phone_number,
      address,
      profilePicturePath,
      phone_number,
      address
    ]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Wishlist routes
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await pool.query(`
      SELECT p.*, w.created_at as added_at
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

router.post('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Product added to wishlist' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Product already in wishlist' });
    } else {
      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  }
});

router.delete('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Review routes
router.post('/reviews/:productId', [
  authenticateToken,
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').isString().trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Check for verified purchase
    const [[order]] = await pool.query(`
      SELECT 1 FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'completed'
      LIMIT 1
    `, [req.user.id, req.params.productId]);

    const isVerifiedPurchase = !!order;

    await pool.query(`
      INSERT INTO reviews (user_id, product_id, rating, comment, is_verified_purchase)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, req.params.productId, rating, comment, isVerifiedPurchase]);

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.get('/reviews/:productId', async (req, res) => {
  try {
    const reviews = await pool.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [req.params.productId]);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Admin route for review moderation
router.put('/reviews/:reviewId/moderate', [
  authenticateToken,
  body('status').isIn(['approved', 'rejected'])
], async (req, res) => {
  try {
    // Check if user is admin
    const [[user]] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query(
      'UPDATE reviews SET status = ? WHERE id = ?',
      [req.body.status, req.params.reviewId]
    );

    res.json({ message: 'Review moderated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

export default router; 