import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'public',
    'public/images',
    'public/images/medicines'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Create directories on startup
createUploadDirs();

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'));
    }
  },
});

// Process and save image
const processImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const filename = `medicine-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join('public', 'images', 'medicines', filename);

    // Ensure the directory exists
    createUploadDirs();

    // Process image with sharp
    await sharp(file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(filepath);

    return `/images/medicines/${filename}`;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

export { upload, processImage }; 