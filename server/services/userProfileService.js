import pool from '../config/database.js';

export const UserProfileService = {
  // Get user profile by user ID
  async getProfile(userId) {
    const [rows] = await pool.query(
      `SELECT 
        u.email,
        u.role,
        up.*
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
      [userId]
    );

    return rows[0] || null;
  },

  // Create or update user profile
  async updateProfile(userId, profileData) {
    const {
      first_name,
      last_name,
      phone_number,
      address,
      city,
      state,
      country,
      postal_code,
      bio,
      date_of_birth,
      gender
    } = profileData;

    // Check if profile exists
    const [existing] = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new profile
      await pool.query(
        `INSERT INTO user_profiles (
          user_id,
          first_name,
          last_name,
          phone_number,
          address,
          city,
          state,
          country,
          postal_code,
          bio,
          date_of_birth,
          gender
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          first_name,
          last_name,
          phone_number,
          address,
          city,
          state,
          country,
          postal_code,
          bio,
          date_of_birth,
          gender
        ]
      );
    } else {
      // Update existing profile
      await pool.query(
        `UPDATE user_profiles SET
          first_name = ?,
          last_name = ?,
          phone_number = ?,
          address = ?,
          city = ?,
          state = ?,
          country = ?,
          postal_code = ?,
          bio = ?,
          date_of_birth = ?,
          gender = ?
        WHERE user_id = ?`,
        [
          first_name,
          last_name,
          phone_number,
          address,
          city,
          state,
          country,
          postal_code,
          bio,
          date_of_birth,
          gender,
          userId
        ]
      );
    }

    return this.getProfile(userId);
  },

  // Update avatar URL
  async updateAvatar(userId, avatarUrl) {
    await pool.query(
      'UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?',
      [avatarUrl, userId]
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