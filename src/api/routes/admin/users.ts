import { Router } from 'express';
import { query, execute } from '../../../utils/db';

const router = Router();

// Get all users (except admin)
router.get('/', async (req, res) => {
  try {
    const users = await query(
      `SELECT id, email, username, role, created_at 
       FROM users 
       WHERE role != 'admin'
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if trying to delete admin
    const users = await query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }

    await execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router; 