import pool from '../config/database.js';

const UserProfileService = {
  // Get user profile
  async getProfile(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const profile = rows[0];
    
    // Format date_of_birth for client-side consumption
    if (profile.date_of_birth) {
      // Convert MySQL date format to consistent format for client
      try {
        // MySQL returns a Date object, convert it to a properly formatted string
        if (profile.date_of_birth instanceof Date) {
          const year = profile.date_of_birth.getFullYear();
          const month = String(profile.date_of_birth.getMonth() + 1).padStart(2, '0');
          const day = String(profile.date_of_birth.getDate()).padStart(2, '0');
          
          profile.date_of_birth = `${year}-${month}-${day}`;
          console.log('Formatted date from DB to YYYY-MM-DD:', profile.date_of_birth);
        }
      } catch (error) {
        console.error('Error formatting date in getProfile:', error);
        // Keep original format if there's an error
      }
    }
    
    return profile;
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
      bio = null,
      date_of_birth = null,
      gender = null
    } = profileData;

    await this.ensureProfileExists(userId);

    // Ensure date is in proper format for MySQL
    let formattedDateOfBirth = null;
    if (date_of_birth) {
      // Try to parse and format the date (YYYY-MM-DD)
      try {
        // Create a date object from the string
        let dateObj;
        
        // Check if the date string is in DD/MM/YYYY format
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date_of_birth)) {
          const [day, month, year] = date_of_birth.split('/').map(Number);
          // Note: JS months are 0-based, so subtract 1 from month
          dateObj = new Date(year, month - 1, day);
          console.log(`Parsed DD/MM/YYYY format: ${day}/${month}/${year} to:`, dateObj);
        } else {
          // Use standard Date parsing for other formats
          dateObj = new Date(date_of_birth);
        }
        
        if (!isNaN(dateObj.getTime())) {
          // Use local date methods to ensure correct values
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          
          formattedDateOfBirth = `${year}-${month}-${day}`;
          console.log('Parsed and formatted date for database:', formattedDateOfBirth);
        } else {
          console.log('Invalid date provided (NaN):', date_of_birth);
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

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
        date_of_birth = ?,
        gender = ?,
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
        formattedDateOfBirth,
        gender || null,
        userId
      ]
    );

    console.log('Update query result:', result);
    console.log('Used date value:', formattedDateOfBirth);
    console.log('Used gender value:', gender);

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