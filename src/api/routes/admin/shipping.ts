import { Router } from 'express';
import { authenticateToken, isAdmin } from '../../middleware/auth';
import { body, validationResult } from 'express-validator';
import { execute } from '../../../utils/db';

const router = Router();

// Get all shipping methods
router.get('/methods', authenticateToken, isAdmin, async (req, res) => {
  try {
    const shippingMethods = await execute(
      `SELECT id, name, base_cost, estimated_days, is_active, created_at, updated_at
       FROM shipping_methods
       ORDER BY name ASC`
    );
    
    res.json(shippingMethods);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ message: 'Error fetching shipping methods' });
  }
});

// Get a single shipping method
router.get('/methods/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [shippingMethod] = await execute(
      `SELECT id, name, base_cost, estimated_days, is_active, created_at, updated_at
       FROM shipping_methods
       WHERE id = ?`,
      [id]
    );
    
    if (!shippingMethod) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    
    res.json(shippingMethod);
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({ message: 'Error fetching shipping method' });
  }
});

// Create a new shipping method
router.post('/', [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('base_cost').isFloat({ min: 0 }).withMessage('Base cost must be a positive number'),
  body('estimated_days').isInt({ min: 1 }).withMessage('Estimated days must be a positive integer'),
  body('is_active').isBoolean().withMessage('Is active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, base_cost, estimated_days, is_active } = req.body;
    
    const result = await execute(
      `INSERT INTO shipping_methods (name, base_cost, estimated_days, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, base_cost, estimated_days, is_active]
    );
    
    const newShippingMethodId = result.insertId;
    
    res.status(201).json({
      id: newShippingMethodId,
      name,
      base_cost,
      estimated_days,
      is_active
    });
  } catch (error) {
    console.error('Error creating shipping method:', error);
    res.status(500).json({ message: 'Error creating shipping method' });
  }
});

// Update a shipping method
router.put('/:id', [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('base_cost').isFloat({ min: 0 }).withMessage('Base cost must be a positive number'),
  body('estimated_days').isInt({ min: 1 }).withMessage('Estimated days must be a positive integer'),
  body('is_active').isBoolean().withMessage('Is active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name, base_cost, estimated_days, is_active } = req.body;
    
    const [existingMethod] = await execute(
      'SELECT id FROM shipping_methods WHERE id = ?',
      [id]
    );
    
    if (!existingMethod) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    
    await execute(
      `UPDATE shipping_methods
       SET name = ?, base_cost = ?, estimated_days = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, base_cost, estimated_days, is_active, id]
    );
    
    res.json({
      id: parseInt(id),
      name,
      base_cost,
      estimated_days,
      is_active
    });
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ message: 'Error updating shipping method' });
  }
});

// Delete a shipping method
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existingMethod] = await execute(
      'SELECT id FROM shipping_methods WHERE id = ?',
      [id]
    );
    
    if (!existingMethod) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    
    await execute(
      'DELETE FROM shipping_methods WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Shipping method deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping method:', error);
    res.status(500).json({ message: 'Error deleting shipping method' });
  }
});

export default router; 