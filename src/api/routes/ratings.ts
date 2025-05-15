import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { ratingService } from '../services/ratingService';

const router = Router();

// Create/Update rating
router.post('/',
  authenticateToken,
  [
    body('medicine_id').isInt().withMessage('Medicine ID must be an integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional({ nullable: true }).isString().trim()
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { medicine_id, rating, review } = req.body;
      const userId = req.user.id;

      const result = await ratingService.createRating(userId, medicine_id, rating, review);
      res.json({ 
        message: 'Rating submitted successfully',
        isVerifiedPurchase: result.isVerifiedPurchase,
        status: result.isVerifiedPurchase ? 'approved' : 'pending'
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ message: 'Failed to submit rating' });
    }
  }
);

// Get ratings for a medicine (public endpoint - only shows approved by default)
router.get('/medicine/:medicineId',
  async (req, res) => {
    try {
      const { medicineId } = req.params;
      const includeAll = req.query.all === 'true' && req.user?.role === 'admin';
      const ratings = await ratingService.getMedicineRatings(parseInt(medicineId), includeAll);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ message: 'Failed to fetch ratings' });
    }
  }
);

// Get user's rating for a medicine
router.get('/user/:medicineId',
  authenticateToken,
  async (req: any, res) => {
    try {
      const { medicineId } = req.params;
      const userId = req.user.id;
      const rating = await ratingService.getUserRating(userId, parseInt(medicineId));
      res.json(rating);
    } catch (error) {
      console.error('Error fetching user rating:', error);
      res.status(500).json({ message: 'Failed to fetch user rating' });
    }
  }
);

// Admin routes for rating moderation
// Get all pending ratings
router.get('/moderation/pending',
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const pendingRatings = await ratingService.getPendingRatings();
      res.json(pendingRatings);
    } catch (error) {
      console.error('Error fetching pending ratings:', error);
      res.status(500).json({ message: 'Failed to fetch pending ratings' });
    }
  }
);

// Approve or reject a rating
router.post('/moderation/:ratingId',
  authenticateToken,
  isAdmin,
  [
    param('ratingId').isInt().withMessage('Rating ID must be an integer'),
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be either approved or rejected'),
    body('reason').optional({ nullable: true }).isString().trim()
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ratingId } = req.params;
      const { status, reason } = req.body;
      const moderatorId = req.user.id;

      await ratingService.moderateRating(parseInt(ratingId), status, moderatorId, reason);
      res.json({ message: `Rating ${status} successfully` });
    } catch (error) {
      console.error('Error moderating rating:', error);
      res.status(500).json({ message: 'Failed to moderate rating' });
    }
  }
);

export default router; 