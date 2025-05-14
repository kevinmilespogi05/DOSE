const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { authenticateToken } = require('../middleware/auth');

// Get reviews for a medicine
router.get('/medicines/:medicineId/reviews', async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsByMedicineId(req.params.medicineId);
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review
router.post('/medicines/:medicineId/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    const review = await reviewService.createReview(
      req.user.id,
      req.params.medicineId,
      rating,
      comment
    );
    
    res.status(201).json(review);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/medicines/:medicineId/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    const review = await reviewService.updateReview(
      req.params.reviewId,
      req.user.id,
      rating,
      comment
    );
    
    res.json(review);
  } catch (err) {
    if (err.message === 'Review not found or unauthorized') {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/medicines/:medicineId/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.reviewId, req.user.id);
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Review not found or unauthorized') {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router; 