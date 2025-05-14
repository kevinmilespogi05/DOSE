import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface WishlistItem extends RowDataPacket {
  id: number;
  user_id: number;
  medicine_id: number;
  created_at: Date;
}

class WishlistService {
  async getWishlist(userId: number) {
    const [items] = await pool.query<WishlistItem[]>(
      `SELECT m.*, w.created_at as added_at
       FROM wishlist_items w
       JOIN medicines m ON w.medicine_id = m.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return items;
  }

  async addToWishlist(userId: number, medicineId: number) {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT IGNORE INTO wishlist_items (user_id, medicine_id) VALUES (?, ?)',
        [userId, medicineId]
      );
      
      // If no rows were affected, it means the item was already in the wishlist
      if (result.affectedRows === 0) {
        throw new Error('Item already in wishlist');
      }
      
      return result.insertId;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message === 'Item already in wishlist') {
        throw new Error('Item already in wishlist');
      }
      throw error;
    }
  }

  async removeFromWishlist(userId: number, medicineId: number) {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM wishlist_items WHERE user_id = ? AND medicine_id = ?',
      [userId, medicineId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Item not found in wishlist');
    }
  }

  async isInWishlist(userId: number, medicineId: number): Promise<boolean> {
    const [items] = await pool.query<WishlistItem[]>(
      'SELECT id FROM wishlist_items WHERE user_id = ? AND medicine_id = ?',
      [userId, medicineId]
    );
    return items.length > 0;
  }

  async getWishlistCount(userId: number): Promise<number> {
    const [result] = await pool.query<(WishlistItem & { count: number })[]>(
      'SELECT COUNT(*) as count FROM wishlist_items WHERE user_id = ?',
      [userId]
    );
    return result[0].count;
  }
}

export default new WishlistService(); 