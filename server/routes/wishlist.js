import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as wishlistService from '../services/wishlistService.js';

const router = express.Router();

// Get user's wishlist
router.get('/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    res.json(wishlist);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add item to wishlist
router.post('/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const { medicine_id } = req.body;
    
    if (!medicine_id) {
      return res.status(400).json({ error: 'Medicine ID is required' });
    }

    const item = await wishlistService.addToWishlist(req.user.id, medicine_id);
    res.status(201).json(item);
  } catch (err) {
    if (err.message === 'Item already in wishlist') {
      return res.status(409).json({ error: err.message });
    }
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/user/wishlist/:medicineId', authenticateToken, async (req, res) => {
  try {
    await wishlistService.removeFromWishlist(req.user.id, req.params.medicineId);
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Item not found in wishlist') {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Get wishlist count
router.get('/user/wishlist/count', authenticateToken, async (req, res) => {
  try {
    const count = await wishlistService.getWishlistCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('Error getting wishlist count:', err);
    res.status(500).json({ error: 'Failed to get wishlist count' });
  }
});

// Check if item is in wishlist
router.get('/user/wishlist/check/:medicineId', authenticateToken, async (req, res) => {
  try {
    const isInWishlist = await wishlistService.isInWishlist(req.user.id, req.params.medicineId);
    res.json({ isInWishlist });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

export default router; 