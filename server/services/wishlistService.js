const db = require('../config/db');

class WishlistService {
  async getWishlist(userId) {
    return db('wishlist_items')
      .select(
        'wishlist_items.id',
        'wishlist_items.created_at',
        'medicines.*'
      )
      .join('medicines', 'wishlist_items.medicine_id', 'medicines.id')
      .where('wishlist_items.user_id', userId)
      .orderBy('wishlist_items.created_at', 'desc');
  }

  async addToWishlist(userId, medicineId) {
    const [item] = await db('wishlist_items')
      .insert({
        user_id: userId,
        medicine_id: medicineId
      })
      .onConflict(['user_id', 'medicine_id'])
      .ignore()
      .returning('*');

    if (!item) {
      throw new Error('Item already in wishlist');
    }

    return this.getWishlistItem(item.id);
  }

  async removeFromWishlist(userId, medicineId) {
    const deleted = await db('wishlist_items')
      .where({
        user_id: userId,
        medicine_id: medicineId
      })
      .delete();

    if (!deleted) {
      throw new Error('Item not found in wishlist');
    }
  }

  async getWishlistItem(itemId) {
    return db('wishlist_items')
      .select(
        'wishlist_items.id',
        'wishlist_items.created_at',
        'medicines.*'
      )
      .join('medicines', 'wishlist_items.medicine_id', 'medicines.id')
      .where('wishlist_items.id', itemId)
      .first();
  }

  async isInWishlist(userId, medicineId) {
    const item = await db('wishlist_items')
      .where({
        user_id: userId,
        medicine_id: medicineId
      })
      .first();

    return !!item;
  }

  async getWishlistCount(userId) {
    const result = await db('wishlist_items')
      .where('user_id', userId)
      .count('id as count')
      .first();

    return parseInt(result.count);
  }
}

module.exports = new WishlistService(); 