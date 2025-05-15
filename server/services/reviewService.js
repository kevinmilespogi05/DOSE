import pool from '../config/database.js';

class ReviewService {
  async getReviewsByMedicineId(medicineId) {
    return pool.query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.medicine_id = ?
       ORDER BY r.created_at DESC`,
      [medicineId]
    ).then(([rows]) => rows);
  }

  async createReview(userId, medicineId, rating, comment) {
    // Check if user has purchased the medicine
    const hasPurchased = await this.hasUserPurchasedMedicine(userId, medicineId);

    const [result] = await pool.query(
      `INSERT INTO reviews (user_id, medicine_id, rating, comment, is_verified_purchase)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, medicineId, rating, comment, hasPurchased]
    );

    // Update medicine's average rating
    await this.updateMedicineAverageRating(medicineId);

    return this.getReviewWithUserDetails(result.insertId);
  }

  async updateReview(reviewId, userId, rating, comment) {
    const [result] = await pool.query(
      `UPDATE reviews SET rating = ?, comment = ?
       WHERE id = ? AND user_id = ?`,
      [rating, comment, reviewId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Review not found or unauthorized');
    }

    // Get the medicine_id for the updated review
    const [[review]] = await pool.query(
      'SELECT medicine_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    // Update medicine's average rating
    await this.updateMedicineAverageRating(review.medicine_id);

    return this.getReviewWithUserDetails(reviewId);
  }

  async deleteReview(reviewId, userId) {
    // Get the review first to check authorization and get medicine_id
    const [[review]] = await pool.query(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    await pool.query(
      'DELETE FROM reviews WHERE id = ?',
      [reviewId]
    );

    // Update medicine's average rating
    await this.updateMedicineAverageRating(review.medicine_id);
  }

  async hasUserPurchasedMedicine(userId, medicineId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.medicine_id = ? AND o.status = 'completed'
       LIMIT 1`,
      [userId, medicineId]
    );

    return rows.length > 0;
  }

  async updateMedicineAverageRating(medicineId) {
    const [[result]] = await pool.query(
      `SELECT AVG(rating) as average_rating
       FROM reviews
       WHERE medicine_id = ?`,
      [medicineId]
    );

    await pool.query(
      `UPDATE medicines
       SET average_rating = ?
       WHERE id = ?`,
      [result.average_rating || 0, medicineId]
    );
  }

  async getReviewWithUserDetails(reviewId) {
    const [[review]] = await pool.query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [reviewId]
    );

    return review;
  }
}

const reviewService = new ReviewService();
export { reviewService as default };
export function getReviewsByMedicineId(medicineId) { return reviewService.getReviewsByMedicineId(medicineId); }
export function createReview(userId, medicineId, rating, comment) { return reviewService.createReview(userId, medicineId, rating, comment); }
export function updateReview(reviewId, userId, rating, comment) { return reviewService.updateReview(reviewId, userId, rating, comment); }
export function deleteReview(reviewId, userId) { return reviewService.deleteReview(reviewId, userId); } 