import { query, execute, withTransaction } from '../../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Rating extends RowDataPacket {
  id: number;
  user_id: number;
  medicine_id: number;
  rating: number;
  review: string | null;
  created_at: Date;
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderated_by: number | null;
  moderation_date: Date | null;
  moderation_reason: string | null;
}

export const ratingService = {
  // Check if user has purchased the medicine
  hasUserPurchasedMedicine: async (userId: number, medicineId: number): Promise<boolean> => {
    try {
      const purchases = await query<RowDataPacket>(
        `SELECT 1 FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.medicine_id = ? AND o.status IN ('delivered', 'completed')
         LIMIT 1`,
        [userId, medicineId]
      );
      return purchases.length > 0;
    } catch (error) {
      console.error('Error in hasUserPurchasedMedicine:', error);
      throw error;
    }
  },

  // Create a new rating
  createRating: async (userId: number, medicineId: number, rating: number, review: string | null) => {
    try {
      return await withTransaction(async (connection) => {
        // Check if user has purchased the medicine
        const isVerifiedPurchase = await ratingService.hasUserPurchasedMedicine(userId, medicineId);

        // Create new rating
        await connection.execute(
          'INSERT INTO ratings (user_id, medicine_id, rating, review, is_verified_purchase, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, medicineId, rating, review, isVerifiedPurchase, isVerifiedPurchase ? 'approved' : 'pending']
        );

        // Only include approved ratings in the average
        const [allRatings] = await connection.execute<Rating[]>(
          'SELECT rating FROM ratings WHERE medicine_id = ? AND status = "approved"',
          [medicineId]
        );

        if (allRatings.length > 0) {
          const averageRating = allRatings.reduce((acc, curr) => acc + curr.rating, 0) / allRatings.length;

          // Update average rating in medicines table
          await connection.execute(
            'UPDATE medicines SET average_rating = ? WHERE id = ?',
            [averageRating, medicineId]
          );
        }

        return { success: true, isVerifiedPurchase };
      });
    } catch (error) {
      console.error('Error in createRating:', error);
      throw error;
    }
  },

  // Get ratings for a medicine
  getMedicineRatings: async (medicineId: number, includeAll: boolean = false) => {
    try {
      const statusFilter = includeAll ? '' : 'AND r.status = "approved"';
      const ratings = await query<Rating>(`
        SELECT r.*, u.username
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.medicine_id = ? ${statusFilter}
        ORDER BY r.is_verified_purchase DESC, r.created_at DESC
      `, [medicineId]);

      return ratings;
    } catch (error) {
      console.error('Error in getMedicineRatings:', error);
      throw error;
    }
  },

  // Get user's ratings for a medicine
  getUserRating: async (userId: number, medicineId: number) => {
    try {
      const ratings = await query<Rating>(
        'SELECT * FROM ratings WHERE user_id = ? AND medicine_id = ? ORDER BY created_at DESC',
        [userId, medicineId]
      );

      return ratings;
    } catch (error) {
      console.error('Error in getUserRating:', error);
      throw error;
    }
  },

  // Get all pending ratings
  getPendingRatings: async () => {
    try {
      const ratings = await query<Rating>(`
        SELECT r.*, u.username, m.name as medicine_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN medicines m ON r.medicine_id = m.id
        WHERE r.status = 'pending'
        ORDER BY r.created_at ASC
      `);

      return ratings;
    } catch (error) {
      console.error('Error in getPendingRatings:', error);
      throw error;
    }
  },

  // Moderate a rating
  moderateRating: async (ratingId: number, status: 'approved' | 'rejected', moderatorId: number, reason: string | null) => {
    try {
      return await withTransaction(async (connection) => {
        // Update rating status
        await connection.execute(
          `UPDATE ratings 
           SET status = ?, moderated_by = ?, moderation_date = NOW(), moderation_reason = ?
           WHERE id = ?`,
          [status, moderatorId, reason, ratingId]
        );

        // Get the rating to find out which medicine it's for
        const [ratings] = await connection.execute<Rating[]>(
          'SELECT * FROM ratings WHERE id = ?',
          [ratingId]
        );

        if (ratings.length === 0) {
          throw new Error('Rating not found');
        }

        const medicineId = ratings[0].medicine_id;

        // Only include approved ratings in the average
        const [allRatings] = await connection.execute<Rating[]>(
          'SELECT rating FROM ratings WHERE medicine_id = ? AND status = "approved"',
          [medicineId]
        );

        const averageRating = allRatings.length > 0
          ? allRatings.reduce((acc, curr) => acc + curr.rating, 0) / allRatings.length
          : 0;

        // Update average rating in medicines table
        await connection.execute(
          'UPDATE medicines SET average_rating = ? WHERE id = ?',
          [averageRating, medicineId]
        );

        return { success: true };
      });
    } catch (error) {
      console.error('Error in moderateRating:', error);
      throw error;
    }
  }
}; 