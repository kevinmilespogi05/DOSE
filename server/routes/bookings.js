import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Create booking
router.post('/', async (req, res) => {
  try {
    const { car_id, start_date, end_date } = req.body;

    // Check if car is available
    const [cars] = await pool.query(
      'SELECT * FROM cars WHERE id = ? AND available = true',
      [car_id]
    );

    if (cars.length === 0) {
      return res.status(400).json({ message: 'Car is not available' });
    }

    const car = cars[0];
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const total_price = days * car.price_per_day;

    const [result] = await pool.query(`
      INSERT INTO bookings (
        car_id, renter_id, start_date, 
        end_date, total_price, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `, [car_id, req.user.userId, start_date, end_date, total_price]);

    // Create chat room for the booking
    await pool.query(
      'INSERT INTO chat_rooms (booking_id) VALUES (?)',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// Get user's bookings
router.get('/', async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT b.*, c.name as car_name, c.image_url,
             u.name as owner_name
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE b.renter_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.userId]);

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get single booking
router.get('/:id', async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT b.*, c.name as car_name, c.image_url,
             u.name as owner_name, u.email as owner_email,
             cr.id as chat_room_id
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN chat_rooms cr ON cr.booking_id = b.id
      WHERE b.id = ? AND (b.renter_id = ? OR c.owner_id = ?)
    `, [req.params.id, req.user.userId, req.user.userId]);

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(bookings[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking details' });
  }
});

// Update booking status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await pool.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

export default router;