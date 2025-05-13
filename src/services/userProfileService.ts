import { query, execute } from '../utils/db';

interface UserProfile {
  id?: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state_province: string | null;
  country: string | null;
  postal_code: string | null;
  bio: string | null;
  created_at?: Date;
  updated_at?: Date;
}

class UserProfileService {
  static async getProfile(userId: number): Promise<UserProfile | null> {
    try {
      const profiles = await query(
        `SELECT * FROM user_profiles WHERE user_id = ?`,
        [userId]
      );
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  static async ensureProfileExists(userId: number): Promise<void> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        await execute(
          `INSERT INTO user_profiles (
            user_id, 
            first_name,
            last_name,
            phone_number,
            address,
            city,
            state_province,
            country,
            postal_code,
            bio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, null, null, null, null, null, null, null, null, null]
        );
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      throw error;
    }
  }

  static async updateProfile(userId: number, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const allowedFields = [
        'first_name',
        'last_name',
        'phone_number',
        'address',
        'city',
        'state_province',
        'country',
        'postal_code',
        'bio'
      ];

      const updates = Object.entries(profileData)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key, value]) => `${key} = ?`);

      const values = Object.entries(profileData)
        .filter(([key]) => allowedFields.includes(key))
        .map(([_, value]) => value === undefined ? null : value);

      if (updates.length === 0) {
        return;
      }

      await execute(
        `UPDATE user_profiles 
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [...values, userId]
      );
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export default UserProfileService; 