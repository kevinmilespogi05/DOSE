const db = require('../config/db');

class ReviewService {
  async getReviewsByMedicineId(medicineId) {
    return db('reviews')
      .select(
        'reviews.*',
        'users.first_name',
        'users.last_name'
      )
      .join('users', 'reviews.user_id', 'users.id')
      .where('medicine_id', medicineId)
      .orderBy('created_at', 'desc');
  }

  async createReview(userId, medicineId, rating, comment) {
    // Check if user has purchased the medicine
    const hasPurchased = await this.hasUserPurchasedMedicine(userId, medicineId);

    const [review] = await db('reviews')
      .insert({
        user_id: userId,
        medicine_id: medicineId,
        rating,
        comment,
        is_verified_purchase: hasPurchased
      })
      .returning('*');

    // Update medicine's average rating
    await this.updateMedicineAverageRating(medicineId);

    return this.getReviewWithUserDetails(review.id);
  }

  async updateReview(reviewId, userId, rating, comment) {
    const [review] = await db('reviews')
      .where({ id: reviewId, user_id: userId })
      .update({ rating, comment })
      .returning('*');

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    // Update medicine's average rating
    await this.updateMedicineAverageRating(review.medicine_id);

    return this.getReviewWithUserDetails(review.id);
  }

  async deleteReview(reviewId, userId) {
    const review = await db('reviews')
      .where({ id: reviewId, user_id: userId })
      .first();

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    await db('reviews')
      .where({ id: reviewId })
      .delete();

    // Update medicine's average rating
    await this.updateMedicineAverageRating(review.medicine_id);
  }

  async hasUserPurchasedMedicine(userId, medicineId) {
    const purchase = await db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where({
        'orders.user_id': userId,
        'order_items.medicine_id': medicineId,
        'orders.status': 'completed'
      })
      .first();

    return !!purchase;
  }

  async updateMedicineAverageRating(medicineId) {
    const result = await db('reviews')
      .where('medicine_id', medicineId)
      .avg('rating as average_rating')
      .first();

    await db('medicines')
      .where('id', medicineId)
      .update({
        average_rating: result.average_rating || 0
      });
  }

  async getReviewWithUserDetails(reviewId) {
    return db('reviews')
      .select(
        'reviews.*',
        'users.first_name',
        'users.last_name'
      )
      .join('users', 'reviews.user_id', 'users.id')
      .where('reviews.id', reviewId)
      .first();
  }
}

module.exports = new ReviewService(); 