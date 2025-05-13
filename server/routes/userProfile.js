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
    body('bio').trim().isLength({ max: 500 }).optional()
  ],
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: errors.array() 
        });
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