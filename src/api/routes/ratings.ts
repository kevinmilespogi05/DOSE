import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
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

      await ratingService.createRating(userId, medicine_id, rating, review);
      res.json({ message: 'Rating submitted successfully' });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ message: 'Failed to submit rating' });
    }
  }
);

// Get ratings for a medicine
router.get('/medicine/:medicineId',
  [
    body('medicineId').isInt().withMessage('Medicine ID must be an integer')
  ],
  async (req, res) => {
    try {
      const { medicineId } = req.params;
      const ratings = await ratingService.getMedicineRatings(parseInt(medicineId));
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
  [
    body('medicineId').isInt().withMessage('Medicine ID must be an integer')
  ],
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

export default router; 