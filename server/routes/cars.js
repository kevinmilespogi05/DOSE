import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List all cars
router.get('/', async (req, res) => {
  try {
    const [cars] = await pool.query(`
      SELECT c.*, u.name as owner_name 
      FROM cars c 
      JOIN users u ON c.owner_id = u.id
      WHERE c.available = true
      ORDER BY c.created_at DESC
    `);
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Error fetching cars' });
  }
});

// Get single car
router.get('/:id', async (req, res) => {
  try {
    const [cars] = await pool.query(`
      SELECT c.*, u.name as owner_name, u.email as owner_email
      FROM cars c 
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (cars.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(cars[0]);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Error fetching car details' });
  }
});

// Create new car listing
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      price_per_day,
      location,
      image_url,
      seats,
      transmission
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO cars (
        owner_id, name, description, price_per_day, 
        location, image_url, seats, transmission
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.userId,
      name,
      description,
      price_per_day,
      location,
      image_url,
      seats,
      transmission
    ]);

    res.status(201).json({
      message: 'Car listed successfully',
      carId: result.insertId
    });
  } catch (error) {
    console.error('Error creating car listing:', error);
    res.status(500).json({ message: 'Error creating car listing' });
  }
});

// Update car listing
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      price_per_day,
      location,
      image_url,
      seats,
      transmission,
      available
    } = req.body;

    const [car] = await pool.query(
      'SELECT owner_id FROM cars WHERE id = ?',
      [req.params.id]
    );

    if (car.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car[0].owner_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query(`
      UPDATE cars 
      SET name = ?, description = ?, price_per_day = ?,
          location = ?, image_url = ?, seats = ?,
          transmission = ?, available = ?
      WHERE id = ? AND owner_id = ?
    `, [
      name,
      description,
      price_per_day,
      location,
      image_url,
      seats,
      transmission,
      available,
      req.params.id,
      req.user.userId
    ]);

    res.json({ message: 'Car updated successfully' });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ message: 'Error updating car listing' });
  }
});

// Delete car listing
router.delete('/:id', async (req, res) => {
  try {
    const [car] = await pool.query(
      'SELECT owner_id FROM cars WHERE id = ?',
      [req.params.id]
    );

    if (car.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car[0].owner_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query(
      'DELETE FROM cars WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Error deleting car listing' });
  }
});

export default router;