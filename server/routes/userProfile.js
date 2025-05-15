import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import UserProfileService from '../services/userProfileService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'public/uploads/avatars';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const profile = await UserProfileService.getProfile(req.user.id);
    if (!profile) {
      await UserProfileService.ensureProfileExists(req.user.id);
      const newProfile = await UserProfileService.getProfile(req.user.id);
      return res.json(newProfile);
    }
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be between 1 and 50 characters'),
    body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be between 1 and 50 characters'),
    body('phone_number').trim().matches(/^\+?[\d\s-]{8,20}$/).withMessage('Invalid phone number format'),
    body('address').trim().isLength({ max: 255 }).optional(),
    body('city').trim().isLength({ max: 100 }).optional(),
    body('state_province').trim().isLength({ max: 100 }).optional(),
    body('country').trim().isLength({ max: 100 }).optional(),
    body('postal_code').trim().isLength({ max: 20 }).optional(),
    body('bio').trim().isLength({ max: 500 }).optional(),
    body('date_of_birth').optional().custom(value => {
      if (!value) return true;
      
      console.log('Validating date_of_birth:', value);
      
      // Try to parse the date string to a valid Date object
      let dateObj;
      
      // Check if the date is in DD/MM/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        // Note: JS months are 0-based, so subtract 1 from month
        dateObj = new Date(year, month - 1, day);
        console.log(`Parsed DD/MM/YYYY format: ${day}/${month}/${year} to:`, dateObj);
      } else {
        // Use standard Date parsing for other formats
        dateObj = new Date(value);
      }
      
      if (isNaN(dateObj.getTime())) {
        console.log('Invalid date - parsing failed');
        throw new Error('Invalid date format');
      }
      
      // Format the date as YYYY-MM-DD for database storage
      // This is done in the service as well, but we validate it here first
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('Date validation passed:', value);
      console.log('Reformatted date:', formattedDate);
      
      return true;
    }),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Gender must be one of: male, female, other, prefer_not_to_say')
  ],
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      console.log('Profile update request received:');
      console.log('User ID:', req.user.id);
      console.log('Request body content type:', req.headers['content-type']);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Specifically log date and gender
      console.log('Date of birth in request:', req.body.date_of_birth);
      console.log('Gender in request:', req.body.gender);
      
      // Create explicit data object from request body
      const profileData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone_number: req.body.phone_number,
        address: req.body.address,
        city: req.body.city,
        state_province: req.body.state_province,
        country: req.body.country,
        postal_code: req.body.postal_code,
        bio: req.body.bio,
        date_of_birth: req.body.date_of_birth,
        gender: req.body.gender
      };
      
      console.log('Processed profile data:', JSON.stringify(profileData, null, 2));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
        return res.status(400).json({ 
          message: 'Validation error',
          errors: errors.array() 
        });
      }

      // Get current profile for comparison
      const currentProfile = await UserProfileService.getProfile(req.user.id);
      console.log('Current profile:', JSON.stringify(currentProfile, null, 2));

      const profile = await UserProfileService.updateProfile(req.user.id, profileData);
      console.log('Updated profile:', JSON.stringify(profile, null, 2));
      
      res.json(profile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  }
);

// Upload avatar
router.post('/avatar',
  authenticateToken,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const profile = await UserProfileService.updateAvatar(req.user.id, avatarUrl);
      res.json(profile);
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Error uploading avatar' });
    }
  }
);

// Delete profile
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    await UserProfileService.deleteProfile(req.user.id);
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Error deleting profile' });
  }
});

export default router; 