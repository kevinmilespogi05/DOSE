import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import wishlistService from '../services/wishlistService';

const router = Router();

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    res.json(wishlist);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add item to wishlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { medicine_id } = req.body;
    
    if (!medicine_id) {
      return res.status(400).json({ error: 'Medicine ID is required' });
    }

    const id = await wishlistService.addToWishlist(req.user.id, parseInt(medicine_id));
    res.status(201).json({ id, message: 'Added to wishlist' });
  } catch (err: any) {
    console.error('Error adding to wishlist:', err);
    if (err.message === 'Item already in wishlist') {
      return res.status(409).json({ error: err.message });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/:medicineId', authenticateToken, async (req, res) => {
  try {
    const { medicineId } = req.params;
    await wishlistService.removeFromWishlist(req.user.id, parseInt(medicineId));
    res.status(204).send();
  } catch (err: any) {
    console.error('Error removing from wishlist:', err);
    if (err.message === 'Item not found in wishlist') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Get wishlist count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const count = await wishlistService.getWishlistCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('Error getting wishlist count:', err);
    res.status(500).json({ error: 'Failed to get wishlist count' });
  }
});

// Check if item is in wishlist
router.get('/check/:medicineId', authenticateToken, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const isInWishlist = await wishlistService.isInWishlist(req.user.id, parseInt(medicineId));
    res.json({ isInWishlist });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

export default router; 