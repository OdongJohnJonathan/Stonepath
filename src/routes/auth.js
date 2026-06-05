import express from 'express';
import pool from '../db.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { generateToken } from '../../utils/jwt.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, phone_number, role } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Only allow roles 2 (Agent) and 3 (Buyer) on self-registration
  // Role 1 (Admin) can only be set directly in the database
  const assignedRole = role === 2 ? 2 : 3;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
       RETURNING *`,
      [first_name, last_name, email, password_hash, phone_number || null, assignedRole]
    );

    const user = result.rows[0];
    res.status(201).json({ token: generateToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({ token: generateToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;