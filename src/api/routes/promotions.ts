import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, execute } from '../../utils/db';
import { isAdmin, isAuthenticated } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure storage for promotion images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/promotions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images only!'));
    }
  }
});

// Get all active promotions (public)
router.get('/public', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('Current date for promotions:', currentDate);
    
    // Debug: List all promotions before filtering
    const allPromotions = await query('SELECT id, title, is_active, start_date, end_date FROM promotions');
    console.log('All promotions before filtering:', allPromotions);
    
    // Temporarily modified to only check is_active
    const promotions = await query(
      `SELECT * FROM promotions 
       WHERE is_active = ? 
       ORDER BY is_featured DESC, created_at DESC`,
      [true]
    );
    
    console.log('Filtered promotions:', promotions);
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching public promotions:', error);
    res.status(500).json({ message: 'Failed to fetch promotions' });
  }
});

// Get featured promotions (public)
router.get('/featured', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const promotions = await query(
      `SELECT * FROM promotions 
       WHERE is_active = ? 
       AND is_featured = ?
       AND start_date <= ? 
       AND end_date >= ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [true, true, currentDate, currentDate]
    );
    
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching featured promotions:', error);
    res.status(500).json({ message: 'Failed to fetch featured promotions' });
  }
});

// Get promotion by ID (public)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentDate = new Date().toISOString().split('T')[0];
    
    const promotions = await query(
      `SELECT * FROM promotions 
       WHERE id = ? 
       AND is_active = ? 
       AND start_date <= ? 
       AND end_date >= ?
       LIMIT 1`,
      [id, true, currentDate, currentDate]
    );
    
    if (!promotions || promotions.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    
    res.json(promotions[0]);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ message: 'Failed to fetch promotion' });
  }
});

// ADMIN ROUTES
// Get all promotions (admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const promotions = await query(
      `SELECT * FROM promotions ORDER BY created_at DESC`
    );
    
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ message: 'Failed to fetch promotions' });
  }
});

// Get promotion by ID (admin only)
router.get('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const promotion = await query(
      `SELECT * FROM promotions WHERE id = ? LIMIT 1`,
      [id]
    );
    
    if (!promotion || promotion.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    
    res.json(promotion[0]);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ message: 'Failed to fetch promotion' });
  }
});

// Create new promotion (admin only)
router.post('/',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('promotion_type').notEmpty().withMessage('Promotion type is required'),
    body('start_date').notEmpty().withMessage('Start date is required'),
    body('end_date').notEmpty().withMessage('End date is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const promotionData = {
        ...req.body,
        image_url: files?.image?.[0]?.path || null,
        banner_url: files?.banner?.[0]?.path || null,
        applicable_products: req.body.applicable_products ? 
          (typeof req.body.applicable_products === 'string' && req.body.applicable_products.trim() !== '' ? 
            JSON.parse(req.body.applicable_products) : 
            null) : 
          null,
        terms_conditions: req.body.terms_conditions ? 
          (typeof req.body.terms_conditions === 'string' && req.body.terms_conditions.trim() !== '' ? 
            JSON.parse(req.body.terms_conditions) : 
            null) : 
          null,
        is_featured: req.body.is_featured === 'true',
        is_active: req.body.is_active === 'true',
        discount_percentage: req.body.discount_percentage || null,
        discount_amount: req.body.discount_amount || null,
      };
      
      const result = await execute(
        `INSERT INTO promotions (title, description, promotion_type, start_date, end_date, image_url, banner_url, applicable_products, terms_conditions, is_featured, is_active, discount_percentage, discount_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          promotionData.title,
          promotionData.description,
          promotionData.promotion_type,
          promotionData.start_date,
          promotionData.end_date,
          promotionData.image_url,
          promotionData.banner_url,
          promotionData.applicable_products ? JSON.stringify(promotionData.applicable_products) : null,
          promotionData.terms_conditions ? JSON.stringify(promotionData.terms_conditions) : null,
          promotionData.is_featured,
          promotionData.is_active,
          promotionData.discount_percentage,
          promotionData.discount_amount
        ]
      );
      
      res.status(201).json({ 
        id: result.insertId, 
        message: 'Promotion created successfully'
      });
    } catch (error) {
      console.error('Error creating promotion:', error);
      res.status(500).json({ message: 'Failed to create promotion' });
    }
  }
);

// Update promotion (admin only)
router.put('/:id',
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Get existing promotion
      const existingPromotion = await query(
        `SELECT * FROM promotions WHERE id = ? LIMIT 1`,
        [id]
      );
      
      if (!existingPromotion || existingPromotion.length === 0) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      
      const promotionData = {
        ...req.body,
        image_url: files?.image?.[0]?.path || existingPromotion[0].image_url,
        banner_url: files?.banner?.[0]?.path || existingPromotion[0].banner_url,
        applicable_products: req.body.applicable_products ? 
          (typeof req.body.applicable_products === 'string' && req.body.applicable_products.trim() !== '' ? 
            JSON.parse(req.body.applicable_products) : 
            existingPromotion[0].applicable_products) : 
          existingPromotion[0].applicable_products,
        terms_conditions: req.body.terms_conditions ? 
          (typeof req.body.terms_conditions === 'string' && req.body.terms_conditions.trim() !== '' ? 
            JSON.parse(req.body.terms_conditions) : 
            existingPromotion[0].terms_conditions) : 
          existingPromotion[0].terms_conditions,
        is_featured: req.body.is_featured === 'true',
        is_active: req.body.is_active === 'true',
        discount_percentage: req.body.discount_percentage || null,
        discount_amount: req.body.discount_amount || null,
      };
      
      await execute(
        `UPDATE promotions SET title = ?, description = ?, promotion_type = ?, start_date = ?, end_date = ?, image_url = ?, banner_url = ?, applicable_products = ?, terms_conditions = ?, is_featured = ?, is_active = ?, discount_percentage = ?, discount_amount = ? WHERE id = ?`,
        [
          promotionData.title,
          promotionData.description,
          promotionData.promotion_type,
          promotionData.start_date,
          promotionData.end_date,
          promotionData.image_url,
          promotionData.banner_url,
          promotionData.applicable_products ? JSON.stringify(promotionData.applicable_products) : null,
          promotionData.terms_conditions ? JSON.stringify(promotionData.terms_conditions) : null,
          promotionData.is_featured,
          promotionData.is_active,
          promotionData.discount_percentage,
          promotionData.discount_amount,
          id
        ]
      );
      
      res.json({ 
        message: 'Promotion updated successfully'
      });
    } catch (error) {
      console.error('Error updating promotion:', error);
      res.status(500).json({ message: 'Failed to update promotion' });
    }
  }
);

// Delete promotion (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const promotion = await query(
      `SELECT * FROM promotions WHERE id = ? LIMIT 1`,
      [id]
    );
    
    if (!promotion || promotion.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    
    // Delete associated files
    if (promotion[0].image_url && fs.existsSync(promotion[0].image_url)) {
      fs.unlinkSync(promotion[0].image_url);
    }
    
    if (promotion[0].banner_url && fs.existsSync(promotion[0].banner_url)) {
      fs.unlinkSync(promotion[0].banner_url);
    }
    
    await execute(
      `DELETE FROM promotions WHERE id = ?`,
      [id]
    );
    
    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ message: 'Failed to delete promotion' });
  }
});

export default router; 