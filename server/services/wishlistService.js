import pool from '../config/database.js';

class WishlistService {
  async getWishlist(userId) {
    const [rows] = await pool.query(
      `SELECT wi.id, wi.created_at, m.*
       FROM wishlist_items wi
       JOIN medicines m ON wi.medicine_id = m.id
       WHERE wi.user_id = ?
       ORDER BY wi.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async addToWishlist(userId, medicineId) {
    try {
      const [result] = await pool.query(
        `INSERT INTO wishlist_items (user_id, medicine_id)
         VALUES (?, ?)`,
        [userId, medicineId]
      );
      
      return this.getWishlistItem(result.insertId);
    } catch (error) {
      // Check if it's a duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Item already in wishlist');
      }
      throw error;
    }
  }

  async removeFromWishlist(userId, medicineId) {
    const [result] = await pool.query(
      `DELETE FROM wishlist_items
       WHERE user_id = ? AND medicine_id = ?`,
      [userId, medicineId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Item not found in wishlist');
    }
  }

  async getWishlistItem(itemId) {
    const [[item]] = await pool.query(
      `SELECT wi.id, wi.created_at, m.*
       FROM wishlist_items wi
       JOIN medicines m ON wi.medicine_id = m.id
       WHERE wi.id = ?`,
      [itemId]
    );
    
    return item;
  }

  async isInWishlist(userId, medicineId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM wishlist_items
       WHERE user_id = ? AND medicine_id = ?
       LIMIT 1`,
      [userId, medicineId]
    );

    return rows.length > 0;
  }

  async getWishlistCount(userId) {
    const [[result]] = await pool.query(
      `SELECT COUNT(id) as count
       FROM wishlist_items
       WHERE user_id = ?`,
      [userId]
    );

    return parseInt(result.count);
  }
}

const wishlistService = new WishlistService();
export { wishlistService as default };
export function getWishlist(userId) { return wishlistService.getWishlist(userId); }
export function addToWishlist(userId, medicineId) { return wishlistService.addToWishlist(userId, medicineId); }
export function removeFromWishlist(userId, medicineId) { return wishlistService.removeFromWishlist(userId, medicineId); }
export function isInWishlist(userId, medicineId) { return wishlistService.isInWishlist(userId, medicineId); }
export function getWishlistCount(userId) { return wishlistService.getWishlistCount(userId); } 