import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { query, execute } from '../../utils/db';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface CartItem extends RowDataPacket {
  id: number;
  medicine_id: number;
  quantity: number;
  name: string;
  price: number;
  unit: string;
  image_url: string;
}

// Get cart items
router.get('/', authenticateToken, async (req: any, res) => {
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
    const cartItems = await query<CartItem>(
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

// Add item to cart
router.post('/items', 
  authenticateToken,
  [
    body('medicine_id').isInt().withMessage('Medicine ID must be an integer'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

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
  }
);

// Update cart item quantity
router.put('/items/:id',
  authenticateToken,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

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
  }
);

// Remove item from cart
router.delete('/items/:id', authenticateToken, async (req: any, res) => {
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

// Clear cart
router.delete('/clear', authenticateToken, async (req: any, res) => {
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

export default router; 