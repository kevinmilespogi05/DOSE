import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { pool } from '../../../config/database';
import { authenticateToken, isAdmin } from '../../middleware/auth';

const router = Router();

// Apply admin middleware to all routes
router.use(isAdmin);

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const [coupons] = await pool.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    
    res.json(coupons);
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
});

// Get single coupon
router.get('/:id', 
  param('id').isInt().withMessage('Invalid coupon ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const [coupons] = await pool.query(
        'SELECT * FROM coupons WHERE id = ?',
        [req.params.id]
      );
      
      if (coupons.length === 0) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
      
      res.json(coupons[0]);
    } catch (err) {
      console.error('Error fetching coupon:', err);
      res.status(500).json({ message: 'Failed to fetch coupon' });
    }
  }
);

// Create coupon
router.post('/',
  [
    body('code').isString().trim().notEmpty().withMessage('Coupon code is required'),
    body('discount_type').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
    body('discount_value').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
    body('min_purchase_amount').optional().isFloat({ min: 0 }).withMessage('Minimum purchase amount must be a positive number'),
    body('max_discount_amount').optional().isFloat({ min: 0 }).withMessage('Maximum discount amount must be a positive number'),
    body('start_date').isDate().withMessage('Start date must be a valid date'),
    body('end_date').isDate().withMessage('End date must be a valid date'),
    body('usage_limit').optional().isInt({ min: 1 }).withMessage('Usage limit must be a positive integer'),
    body('is_active').isBoolean().withMessage('Is active must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if code already exists
      const [existingCoupons] = await pool.query(
        'SELECT id FROM coupons WHERE code = ?',
        [req.body.code]
      );
      
      if (existingCoupons.length > 0) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }

      const {
        code,
        discount_type,
        discount_value,
        min_purchase_amount,
        max_discount_amount,
        start_date,
        end_date,
        usage_limit,
        is_active
      } = req.body;

      // Validate end date is after start date
      if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      const [result] = await pool.query(
        `INSERT INTO coupons (
          code, 
          discount_type, 
          discount_value, 
          min_purchase_amount, 
          max_discount_amount, 
          start_date, 
          end_date, 
          usage_limit, 
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code.toUpperCase(),
          discount_type,
          discount_value,
          min_purchase_amount || null,
          max_discount_amount || null,
          start_date,
          end_date,
          usage_limit || null,
          is_active
        ]
      );
      
      res.status(201).json({
        message: 'Coupon created successfully',
        coupon_id: result.insertId
      });
    } catch (err) {
      console.error('Error creating coupon:', err);
      res.status(500).json({ message: 'Failed to create coupon' });
    }
  }
);

// Update coupon
router.put('/:id',
  [
    param('id').isInt().withMessage('Invalid coupon ID'),
    body('code').isString().trim().notEmpty().withMessage('Coupon code is required'),
    body('discount_type').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
    body('discount_value').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
    body('min_purchase_amount').optional().isFloat({ min: 0 }).withMessage('Minimum purchase amount must be a positive number'),
    body('max_discount_amount').optional().isFloat({ min: 0 }).withMessage('Maximum discount amount must be a positive number'),
    body('start_date').isDate().withMessage('Start date must be a valid date'),
    body('end_date').isDate().withMessage('End date must be a valid date'),
    body('usage_limit').optional().isInt({ min: 1 }).withMessage('Usage limit must be a positive integer'),
    body('is_active').isBoolean().withMessage('Is active must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const couponId = req.params.id;
      
      // Check if coupon exists
      const [existingCoupons] = await pool.query(
        'SELECT id FROM coupons WHERE id = ?',
        [couponId]
      );
      
      if (existingCoupons.length === 0) {
        return res.status(404).json({ message: 'Coupon not found' });
      }

      // Check if code already exists for another coupon
      const [codeExists] = await pool.query(
        'SELECT id FROM coupons WHERE code = ? AND id != ?',
        [req.body.code, couponId]
      );
      
      if (codeExists.length > 0) {
        return res.status(400).json({ message: 'Coupon code already exists for another coupon' });
      }

      const {
        code,
        discount_type,
        discount_value,
        min_purchase_amount,
        max_discount_amount,
        start_date,
        end_date,
        usage_limit,
        is_active
      } = req.body;

      // Validate end date is after start date
      if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      await pool.query(
        `UPDATE coupons SET 
          code = ?, 
          discount_type = ?, 
          discount_value = ?, 
          min_purchase_amount = ?, 
          max_discount_amount = ?, 
          start_date = ?, 
          end_date = ?, 
          usage_limit = ?, 
          is_active = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          code.toUpperCase(),
          discount_type,
          discount_value,
          min_purchase_amount || null,
          max_discount_amount || null,
          start_date,
          end_date,
          usage_limit || null,
          is_active,
          couponId
        ]
      );
      
      res.json({ message: 'Coupon updated successfully' });
    } catch (err) {
      console.error('Error updating coupon:', err);
      res.status(500).json({ message: 'Failed to update coupon' });
    }
  }
);

// Delete coupon
router.delete('/:id',
  param('id').isInt().withMessage('Invalid coupon ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const couponId = req.params.id;
      
      // Check if coupon exists
      const [existingCoupons] = await pool.query(
        'SELECT id FROM coupons WHERE id = ?',
        [couponId]
      );
      
      if (existingCoupons.length === 0) {
        return res.status(404).json({ message: 'Coupon not found' });
      }

      await pool.query(
        'DELETE FROM coupons WHERE id = ?',
        [couponId]
      );
      
      res.json({ message: 'Coupon deleted successfully' });
    } catch (err) {
      console.error('Error deleting coupon:', err);
      res.status(500).json({ message: 'Failed to delete coupon' });
    }
  }
);

export default router; 