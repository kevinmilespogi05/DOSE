import { query, execute, withTransaction } from '../../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Rating extends RowDataPacket {
  id: number;
  user_id: number;
  medicine_id: number;
  rating: number;
  review: string | null;
  created_at: Date;
}

export const ratingService = {
  // Create a new rating
  createRating: async (userId: number, medicineId: number, rating: number, review: string | null) => {
    try {
      return await withTransaction(async (connection) => {
        // Create new rating
        await connection.execute(
          'INSERT INTO ratings (user_id, medicine_id, rating, review) VALUES (?, ?, ?, ?)',
          [userId, medicineId, rating, review]
        );

        // Get all ratings for this medicine and calculate average
        const [allRatings] = await connection.execute<Rating[]>(
          'SELECT rating FROM ratings WHERE medicine_id = ?',
          [medicineId]
        );

        const averageRating = allRatings.reduce((acc, curr) => acc + curr.rating, 0) / allRatings.length;

        // Update average rating in medicines table
        await connection.execute(
          'UPDATE medicines SET average_rating = ? WHERE id = ?',
          [averageRating, medicineId]
        );

        return { success: true };
      });
    } catch (error) {
      console.error('Error in createRating:', error);
      throw error;
    }
  },

  // Get ratings for a medicine
  getMedicineRatings: async (medicineId: number) => {
    try {
      const ratings = await query<Rating>(`
        SELECT r.*, u.first_name, u.last_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.medicine_id = ?
        ORDER BY r.created_at DESC
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
  }
}; 