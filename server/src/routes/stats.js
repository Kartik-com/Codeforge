import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getXpForNextLevel, getUserBadges } from '../services/gamification.js';
import { getRecommendations, getTopicPerformance } from '../services/adaptiveLearning.js';
import db from '../config/database.js';

const router = Router();

// Dashboard overview stats
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const totalSolved = db.prepare(
      'SELECT COUNT(DISTINCT problem_id) as count FROM submissions WHERE user_id = ? AND status = ?'
    ).get(userId, 'accepted')?.count || 0;

    const totalSubmissions = db.prepare(
      'SELECT COUNT(*) as count FROM submissions WHERE user_id = ?'
    ).get(userId)?.count || 0;

    const accuracy = totalSubmissions > 0 
      ? Math.round((db.prepare('SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND status = ?').get(userId, 'accepted')?.count || 0) / totalSubmissions * 100) 
      : 0;

    const avgTime = db.prepare(
      'SELECT AVG(time_taken) as avg FROM submissions WHERE user_id = ? AND time_taken > 0'
    ).get(userId)?.avg || 0;

    const user = db.prepare('SELECT xp, level, streak, longest_streak FROM users WHERE id = ?').get(userId);
    const xpProgress = getXpForNextLevel(user?.xp || 0);

    // Difficulty breakdown
    const difficultyStats = db.prepare(`
      SELECT p.difficulty, COUNT(DISTINCT s.problem_id) as count
      FROM submissions s JOIN problems p ON s.problem_id = p.id
      WHERE s.user_id = ? AND s.status = 'accepted'
      GROUP BY p.difficulty
    `).all(userId);

    const diffBreakdown = { easy: 0, medium: 0, hard: 0 };
    difficultyStats.forEach(d => { diffBreakdown[d.difficulty] = d.count; });

    res.json({
      totalSolved,
      totalSubmissions,
      accuracy,
      avgTime: Math.round(avgTime),
      xp: user?.xp || 0,
      level: user?.level || 1,
      streak: user?.streak || 0,
      longestStreak: user?.longest_streak || 0,
      xpProgress,
      difficultyBreakdown: diffBreakdown,
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Heatmap data (365 days)
router.get('/heatmap', authenticateToken, (req, res) => {
  try {
    const activities = db.prepare(`
      SELECT date, problems, xp_earned
      FROM daily_activity
      WHERE user_id = ? AND date >= date('now', '-365 days')
      ORDER BY date ASC
    `).all(req.user.id);

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Topic-wise performance
router.get('/topics', authenticateToken, (req, res) => {
  try {
    const topicStats = getTopicPerformance(req.user.id);
    res.json({ topics: topicStats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topic stats' });
  }
});

// AI recommendations
router.get('/recommendations', authenticateToken, (req, res) => {
  try {
    const recommendations = getRecommendations(req.user.id);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Badges
router.get('/badges', authenticateToken, (req, res) => {
  try {
    const badges = getUserBadges(req.user.id);
    res.json({ badges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Progress over time
router.get('/progress', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(`
      SELECT 
        date,
        SUM(problems) OVER (ORDER BY date) as cumulative_problems,
        SUM(xp_earned) OVER (ORDER BY date) as cumulative_xp,
        problems as daily_problems,
        xp_earned as daily_xp
      FROM daily_activity
      WHERE user_id = ? AND date >= date('now', '-30 days')
      ORDER BY date ASC
    `).all(req.user.id);

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Curriculum progress (level-by-level)
router.get('/curriculum-progress', authenticateToken, (req, res) => {
  try {
    const levels = db.prepare(`
      SELECT level_id, completion_pct, unlocked FROM user_level_progress WHERE user_id = ?
    `).all(req.user.id);

    const topics = db.prepare(`
      SELECT level_id, topic_id, attempted, solved, accuracy, mastery FROM user_topic_progress WHERE user_id = ?
    `).all(req.user.id);

    res.json({ levels, topics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch curriculum progress' });
  }
});

export default router;
