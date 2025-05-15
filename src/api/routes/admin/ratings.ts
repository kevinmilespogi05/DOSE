import { Router } from 'express';
import { param, body, validationResult } from 'express-validator';
import { authenticateToken, isAdmin } from '../../middleware/auth';
import { ratingService } from '../../services/ratingService';
import { query } from '../../../utils/db';

const router = Router();

// Get all pending ratings
router.get('/pending', async (req: any, res) => {
  try {
    const pendingRatings = await ratingService.getPendingRatings();
    res.json(pendingRatings);
  } catch (error) {
    console.error('Error fetching pending ratings:', error);
    res.status(500).json({ message: 'Failed to fetch pending ratings' });
  }
});

// Get all ratings (admin can see all ratings including rejected ones)
router.get('/all', async (req, res) => {
  try {
    const ratings = await query(`
      SELECT r.*, u.first_name, u.last_name, m.name as medicine_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN medicines m ON r.medicine_id = m.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching all ratings:', error);
    res.status(500).json({ message: 'Failed to fetch ratings' });
  }
});

// Approve or reject a rating
router.post('/:ratingId/moderate', 
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

// Get statistics about ratings
router.get('/stats', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_ratings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_ratings,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_ratings,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_ratings,
        SUM(CASE WHEN is_verified_purchase = 1 THEN 1 ELSE 0 END) as verified_ratings,
        AVG(rating) as average_rating
      FROM ratings
    `);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching rating statistics:', error);
    res.status(500).json({ message: 'Failed to fetch rating statistics' });
  }
});

export default router; 