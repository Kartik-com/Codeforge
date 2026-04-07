import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(id, name, email, passwordHash);

    const token = jwt.sign({ userId: id }, config.jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id, name, email, xp: 0, level: 1, streak: 0 },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longest_streak: user.longest_streak,
        avatar: user.avatar,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    if (name) {
      db.prepare('UPDATE users SET name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, req.user.id);
    }
    if (avatar !== undefined) {
      db.prepare('UPDATE users SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?').run(avatar, req.user.id);
    }

    const updatedUser = db.prepare('SELECT id, name, email, xp, level, streak, longest_streak, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

export default router;
