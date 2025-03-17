import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get chat messages
router.get('/room/:roomId', async (req, res) => {
  try {
    const [messages] = await pool.query(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_room_id = ?
      ORDER BY m.created_at ASC
    `, [req.params.roomId]);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send message
router.post('/room/:roomId/messages', async (req, res) => {
  try {
    const { message } = req.body;
    
    const [result] = await pool.query(`
      INSERT INTO messages (chat_room_id, sender_id, message)
      VALUES (?, ?, ?)
    `, [req.params.roomId, req.user.userId, message]);

    const [newMessage] = await pool.query(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

export default router;