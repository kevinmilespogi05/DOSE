const wishlistService = require('./wishlistService');

class MedicineService {
  async getMedicinesWithUserData(userId) {
    const medicines = await db('medicines')
      .select('*')
      .orderBy('name');

    if (userId) {
      // Get user's wishlist items
      const wishlistItems = await db('wishlist_items')
        .where('user_id', userId)
        .select('medicine_id');
      
      const wishlistSet = new Set(wishlistItems.map(item => item.medicine_id));

      // Add wishlist information to medicines
      medicines.forEach(medicine => {
        medicine.is_in_wishlist = wishlistSet.has(medicine.id);
      });
    }

    return medicines;
  }

  async getMedicineById(id, userId) {
    const medicine = await db('medicines')
      .where('medicines.id', id)
      .first();

    if (!medicine) return null;

    if (userId) {
      // Check if medicine is in user's wishlist
      medicine.is_in_wishlist = await wishlistService.isInWishlist(userId, id);
    }

    return medicine;
  }
}

module.exports = new MedicineService(); 