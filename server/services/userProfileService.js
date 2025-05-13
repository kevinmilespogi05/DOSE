import pool from '../config/database.js';

const UserProfileService = {
  // Get user profile
  async getProfile(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  // Ensure profile exists for user
  async ensureProfileExists(userId) {
    const [rows] = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO user_profiles (user_id) VALUES (?)',
        [userId]
      );
    }
  },

  // Create or update user profile
  async updateProfile(userId, profileData) {
    const {
      first_name = null,
      last_name = null,
      phone_number = null,
      address = null,
      city = null,
      state_province = null,
      country = null,
      postal_code = null,
      bio = null
    } = profileData;

    await this.ensureProfileExists(userId);

    // Update existing profile
    const [result] = await pool.query(
      `UPDATE user_profiles SET
        first_name = ?,
        last_name = ?,
        phone_number = ?,
        address = ?,
        city = ?,
        state_province = ?,
        country = ?,
        postal_code = ?,
        bio = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [
        first_name || null,
        last_name || null,
        phone_number || null,
        address || null,
        city || null,
        state_province || null,
        country || null,
        postal_code || null,
        bio || null,
        userId
      ]
    );

    return this.getProfile(userId);
  },

  // Update avatar URL
  async updateAvatar(userId, avatarUrl) {
    await this.ensureProfileExists(userId);
    
    await pool.query(
      'UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?',
      [avatarUrl || null, userId]
    );

    return this.getProfile(userId);
  },

  // Delete profile
  async deleteProfile(userId) {
    await pool.query(
      'DELETE FROM user_profiles WHERE user_id = ?',
      [userId]
    );
  }
};

export default UserProfileService; 