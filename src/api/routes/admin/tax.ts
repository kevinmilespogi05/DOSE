import { Router } from 'express';
import { authenticateToken, isAdmin } from '../../middleware/auth';
import { body, validationResult } from 'express-validator';
import { execute } from '../../../utils/db';

const router = Router();

// Get all tax rates
router.get('/', async (req, res) => {
  try {
    const taxRates = await execute(
      `SELECT id, country, state, rate, is_active, created_at, updated_at
       FROM tax_rates
       ORDER BY country ASC, state ASC`
    );
    
    res.json(taxRates);
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    res.status(500).json({ message: 'Error fetching tax rates' });
  }
});

// Get a single tax rate
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [taxRate] = await execute(
      `SELECT id, country, state, rate, is_active, created_at, updated_at
       FROM tax_rates
       WHERE id = ?`,
      [id]
    );
    
    if (!taxRate) {
      return res.status(404).json({ message: 'Tax rate not found' });
    }
    
    res.json(taxRate);
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    res.status(500).json({ message: 'Error fetching tax rate' });
  }
});

// Create a new tax rate
router.post('/', [
  body('country').isString().trim().notEmpty().withMessage('Country is required'),
  body('state').optional({ nullable: true }).isString(),
  body('rate').isFloat({ min: 0, max: 100 }).withMessage('Rate must be a number between 0 and 100'),
  body('is_active').isBoolean().withMessage('Is active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { country, state, rate, is_active } = req.body;
    
    // Check for duplicate country/state combination
    const [existingTaxRate] = await execute(
      'SELECT id FROM tax_rates WHERE country = ? AND (state = ? OR (state IS NULL AND ? IS NULL))',
      [country, state, state]
    );
    
    if (existingTaxRate) {
      return res.status(400).json({ 
        message: `A tax rate already exists for ${country}${state ? `, ${state}` : ' (all regions)'}`
      });
    }
    
    const result = await execute(
      `INSERT INTO tax_rates (country, state, rate, is_active)
       VALUES (?, ?, ?, ?)`,
      [country, state, rate, is_active]
    );
    
    const newTaxRateId = result.insertId;
    
    res.status(201).json({
      id: newTaxRateId,
      country,
      state,
      rate,
      is_active
    });
  } catch (error) {
    console.error('Error creating tax rate:', error);
    res.status(500).json({ message: 'Error creating tax rate' });
  }
});

// Update a tax rate
router.put('/:id', [
  body('country').isString().trim().notEmpty().withMessage('Country is required'),
  body('state').optional({ nullable: true }).isString(),
  body('rate').isFloat({ min: 0, max: 100 }).withMessage('Rate must be a number between 0 and 100'),
  body('is_active').isBoolean().withMessage('Is active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { country, state, rate, is_active } = req.body;
    
    const [existingRate] = await execute(
      'SELECT id FROM tax_rates WHERE id = ?',
      [id]
    );
    
    if (!existingRate) {
      return res.status(404).json({ message: 'Tax rate not found' });
    }
    
    // Check for duplicate country/state combination (excluding current record)
    const [duplicateRate] = await execute(
      'SELECT id FROM tax_rates WHERE country = ? AND (state = ? OR (state IS NULL AND ? IS NULL)) AND id != ?',
      [country, state, state, id]
    );
    
    if (duplicateRate) {
      return res.status(400).json({ 
        message: `A tax rate already exists for ${country}${state ? `, ${state}` : ' (all regions)'}`
      });
    }
    
    await execute(
      `UPDATE tax_rates
       SET country = ?, state = ?, rate = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [country, state, rate, is_active, id]
    );
    
    res.json({
      id: parseInt(id),
      country,
      state,
      rate,
      is_active
    });
  } catch (error) {
    console.error('Error updating tax rate:', error);
    res.status(500).json({ message: 'Error updating tax rate' });
  }
});

// Delete a tax rate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existingRate] = await execute(
      'SELECT id FROM tax_rates WHERE id = ?',
      [id]
    );
    
    if (!existingRate) {
      return res.status(404).json({ message: 'Tax rate not found' });
    }
    
    await execute(
      'DELETE FROM tax_rates WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Tax rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax rate:', error);
    res.status(500).json({ message: 'Error deleting tax rate' });
  }
});

export default router; 