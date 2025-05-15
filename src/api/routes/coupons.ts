import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { pool } from '../../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Validate coupon
router.post('/validate',
  authenticateToken,
  body('code').isString().trim(),
  body('total_amount').isNumeric(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code, total_amount } = req.body;
      
      const [coupon] = await pool.query(
        'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= NOW() AND end_date >= NOW() AND (usage_limit IS NULL OR used_count < usage_limit)',
        [code]
      );

      if (coupon.length === 0) {
        return res.status(404).json({ message: 'Invalid or expired coupon code' });
      }

      const couponData = coupon[0];
      
      // Check minimum purchase amount
      if (couponData.min_purchase_amount && total_amount < couponData.min_purchase_amount) {
        return res.status(400).json({ 
          message: `Minimum purchase amount of ${couponData.min_purchase_amount} required for this coupon`,
          min_purchase_amount: couponData.min_purchase_amount
        });
      }

      // Calculate discount
      let discountAmount = couponData.discount_type === 'percentage'
        ? (total_amount * couponData.discount_value) / 100
        : couponData.discount_value;

      // Apply maximum discount limit if set
      if (couponData.max_discount_amount && discountAmount > couponData.max_discount_amount) {
        discountAmount = couponData.max_discount_amount;
      }

      // Return coupon details and calculated discount
      return res.json({
        valid: true,
        coupon: {
          id: couponData.id,
          code: couponData.code,
          discount_type: couponData.discount_type,
          discount_value: couponData.discount_value,
          max_discount_amount: couponData.max_discount_amount,
          discount_amount: discountAmount
        }
      });
    } catch (err) {
      console.error('Error validating coupon:', err);
      return res.status(500).json({ message: 'Failed to validate coupon' });
    }
  }
);

// Get available coupons for user
router.get('/available',
  authenticateToken,
  async (req, res) => {
    try {
      const [coupons] = await pool.query(
        'SELECT id, code, discount_type, discount_value, min_purchase_amount, max_discount_amount, end_date ' +
        'FROM coupons WHERE is_active = 1 AND start_date <= NOW() AND end_date >= NOW() ' +
        'AND (usage_limit IS NULL OR used_count < usage_limit) ' +
        'ORDER BY min_purchase_amount ASC, end_date ASC'
      );
      
      return res.json(coupons);
    } catch (err) {
      console.error('Error fetching available coupons:', err);
      return res.status(500).json({ message: 'Failed to fetch available coupons' });
    }
  }
);

export default router; 