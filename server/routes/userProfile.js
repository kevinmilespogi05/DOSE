import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { UserProfileService } from '../services/userProfileService.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
    const profile = await UserProfileService.getProfile(req.user.id);
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
    body('first_name').trim().isLength({ min: 1, max: 50 }).optional(),
    body('last_name').trim().isLength({ min: 1, max: 50 }).optional(),
    body('phone_number').trim().matches(/^\+?[\d\s-]{8,20}$/).optional(),
    body('address').trim().isLength({ max: 255 }).optional(),
    body('city').trim().isLength({ max: 100 }).optional(),
    body('state').trim().isLength({ max: 100 }).optional(),
    body('country').trim().isLength({ max: 100 }).optional(),
    body('postal_code').trim().isLength({ max: 20 }).optional(),
    body('bio').trim().isLength({ max: 500 }).optional(),
    body('date_of_birth').isDate().optional(),
    body('gender').isIn(['male', 'female', 'other', 'prefer_not_to_say']).optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const profile = await UserProfileService.updateProfile(req.user.id, req.body);
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
    await UserProfileService.deleteProfile(req.user.id);
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Error deleting profile' });
  }
});

export default router; 