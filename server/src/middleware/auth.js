import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import db from '../config/database.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.prepare('SELECT id, name, email, xp, level, streak, longest_streak, avatar, created_at FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = db.prepare('SELECT id, name, email, xp, level, streak FROM users WHERE id = ?').get(decoded.userId);
      req.user = user;
    } catch (e) {
      // token invalid, continue without user
    }
  }
  next();
}
