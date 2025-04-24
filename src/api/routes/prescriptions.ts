import express from 'express';
import { query, execute, withTransaction } from '../../utils/db';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { upload } from '../../utils/imageUpload';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

const router = express.Router();

// Create directory for prescription images
const createPrescriptionDir = () => {
  const dir = path.join('public', 'images', 'prescriptions');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Process and save prescription image
const processPrescriptionImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const filename = `prescription-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join('public', 'images', 'prescriptions', filename);

    // Ensure the directory exists
    createPrescriptionDir();

    // Process image with sharp
    await sharp(file.buffer)
      .resize(800, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(filepath);

    return `/images/prescriptions/${filename}`;
  } catch (error) {
    console.error('Error processing prescription image:', error);
    throw new Error('Failed to process prescription image');
  }
};

// Upload prescription image
router.post('/upload', authenticateToken, upload.single('prescription'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No prescription image provided' });
    }

    const imageUrl = await processPrescriptionImage(req.file);
    
    // Create prescription record
    const result = await execute(
      `INSERT INTO prescriptions 
       (user_id, image_url, status, notes) 
       VALUES (?, ?, ?, ?)`,
      [req.user.userId, imageUrl, 'pending', '']
    );

    res.status(201).json({ 
      id: result.insertId,
      imageUrl,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error uploading prescription:', error);
    res.status(500).json({ message: 'Error uploading prescription' });
  }
});

// Get user prescriptions
router.get('/user', authenticateToken, async (req: any, res) => {
  try {
    const prescriptions = await query(
      `SELECT p.id, p.image_url, p.status, p.created_at, p.updated_at, p.notes 
       FROM prescriptions p 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

// Get prescription details
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const prescriptions = await query(
      `SELECT p.id, p.user_id, p.image_url, p.status, p.created_at, p.updated_at, p.notes
       FROM prescriptions p
       WHERE p.id = ?`,
      [id]
    );
    
    if (prescriptions.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    const prescription = prescriptions[0];
    
    // Verify user is authorized to view this prescription
    if (prescription.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get prescription medicines if approved
    if (prescription.status === 'approved') {
      const items = await query(
        `SELECT pi.id, pi.medicine_id, m.name as medicine_name, pi.quantity, m.price
         FROM prescription_items pi
         JOIN medicines m ON pi.medicine_id = m.id
         WHERE pi.prescription_id = ?`,
        [id]
      );
      
      prescription.items = items;
    }
    
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription details:', error);
    res.status(500).json({ message: 'Error fetching prescription details' });
  }
});

// Admin routes for managing prescriptions
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const prescriptions = await query(
      `SELECT p.id, p.user_id, p.image_url, p.status, p.created_at, p.updated_at, p.notes,
              u.username, u.email
       FROM prescriptions p
       JOIN users u ON p.user_id = u.id
       ORDER BY FIELD(p.status, 'pending', 'approved', 'rejected'), p.created_at DESC`
    );
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching all prescriptions:', error);
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

// Update prescription status
router.put('/:id/status', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Update prescription status
    await execute(
      `UPDATE prescriptions SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, notes || null, id]
    );
    
    res.json({ message: 'Prescription status updated successfully' });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ message: 'Error updating prescription status' });
  }
});

// Add medicine to prescription (Admin only)
router.post('/:id/medicines', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { medicine_id, quantity } = req.body;
    
    if (!medicine_id || !quantity) {
      return res.status(400).json({ message: 'Medicine ID and quantity are required' });
    }
    
    // Verify prescription exists and is approved
    const prescriptions = await query(
      'SELECT id, status FROM prescriptions WHERE id = ?',
      [id]
    );
    
    if (prescriptions.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    if (prescriptions[0].status !== 'approved') {
      return res.status(400).json({ message: 'Cannot add medicines to a prescription that is not approved' });
    }
    
    // Add medicine to prescription
    await execute(
      'INSERT INTO prescription_items (prescription_id, medicine_id, quantity) VALUES (?, ?, ?)',
      [id, medicine_id, quantity]
    );
    
    res.status(201).json({ message: 'Medicine added to prescription' });
  } catch (error) {
    console.error('Error adding medicine to prescription:', error);
    res.status(500).json({ message: 'Error adding medicine to prescription' });
  }
});

// Get recommended medicines for a prescription
router.get('/admin/:id/recommendations', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Verify prescription exists and is approved
    const prescriptions = await query(
      'SELECT id, status FROM prescriptions WHERE id = ?',
      [id]
    );
    
    if (prescriptions.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Get medicines that match common prescription patterns
    // This is a placeholder implementation - in a real system, you might:
    // 1. Use OCR to extract medicine names from the prescription image
    // 2. Use a more sophisticated recommendation algorithm
    // 3. Check inventory for available medicines
    const recommendedMedicines = await query(
      `SELECT id, name, description, price
       FROM medicines 
       ORDER BY RAND()
       LIMIT 5`
    );
    
    res.json(recommendedMedicines);
  } catch (error) {
    console.error('Error fetching medicine recommendations:', error);
    res.status(500).json({ message: 'Error fetching medicine recommendations' });
  }
});

// Batch update prescription statuses (Admin only)
router.post('/admin/batch-update', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { prescriptionIds, status, notes } = req.body;
    
    if (!prescriptionIds || !Array.isArray(prescriptionIds) || prescriptionIds.length === 0) {
      return res.status(400).json({ message: 'Prescription IDs are required' });
    }
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const defaultNotes = `Batch ${status} by admin on ${timestamp}`;
    
    // Update prescriptions in a transaction
    await withTransaction(async (connection) => {
      for (const id of prescriptionIds) {
        await connection.query(
          `UPDATE prescriptions 
           SET status = ?, 
               notes = ?, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [status, notes || defaultNotes, id]
        );
      }
    });
    
    res.json({ 
      message: `Successfully updated ${prescriptionIds.length} prescriptions`,
      updated: prescriptionIds
    });
  } catch (error) {
    console.error('Error batch updating prescriptions:', error);
    res.status(500).json({ message: 'Error updating prescriptions' });
  }
});

export default router; 