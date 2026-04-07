import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { generateProblem, generateSimilarProblem } from '../services/problemGenerator.js';
import { CURRICULUM, getLevelById, getTopicById, MASTERY_RULES } from '../data/curriculum.js';
import db from '../config/database.js';
import crypto from 'crypto';

const router = Router();

// ─── Get full curriculum structure ─────────────────────────────────────────
router.get('/curriculum', optionalAuth, (req, res) => {
  const userId = req.user?.id;

  const levels = CURRICULUM.map(level => {
    let levelProgress = null;
    let unlocked = level.levelNumber === 1; // Level 1 always unlocked

    if (userId) {
      levelProgress = db.prepare(
        'SELECT completion_pct, unlocked FROM user_level_progress WHERE user_id = ? AND level_id = ?'
      ).get(userId, level.levelId);

      if (levelProgress) {
        unlocked = !!levelProgress.unlocked;
      } else if (level.levelNumber === 1) {
        unlocked = true;
      }

      // Soft unlock: check if previous level meets mastery
      if (!unlocked && level.levelNumber > 1) {
        const prevLevelId = `level${level.levelNumber - 1}`;
        const prevProgress = db.prepare(
          'SELECT completion_pct, unlocked FROM user_level_progress WHERE user_id = ? AND level_id = ?'
        ).get(userId, prevLevelId);
        if (prevProgress && prevProgress.completion_pct >= MASTERY_RULES.completionThreshold * 100) {
          unlocked = true;
          // Auto-unlock in DB
          const id = crypto.randomUUID();
          db.prepare(`
            INSERT OR REPLACE INTO user_level_progress (id, user_id, level_id, completion_pct, unlocked, unlocked_at)
            VALUES (COALESCE((SELECT id FROM user_level_progress WHERE user_id = ? AND level_id = ?), ?), ?, ?, COALESCE((SELECT completion_pct FROM user_level_progress WHERE user_id = ? AND level_id = ?), 0), 1, datetime('now'))
          `).run(userId, level.levelId, id, userId, level.levelId, userId, level.levelId);
        }
      }
    }

    const topics = level.topics.map(topic => {
      let topicProgress = null;
      if (userId) {
        topicProgress = db.prepare(
          'SELECT attempted, solved, accuracy, mastery FROM user_topic_progress WHERE user_id = ? AND level_id = ? AND topic_id = ?'
        ).get(userId, level.levelId, topic.topicId);
      }
      return {
        ...topic,
        progress: topicProgress || { attempted: 0, solved: 0, accuracy: 0, mastery: 0 },
      };
    });

    return {
      levelId: level.levelId,
      levelNumber: level.levelNumber,
      name: level.name,
      description: level.description,
      color: level.color,
      icon: level.icon,
      unlocked,
      completionPct: levelProgress?.completion_pct || 0,
      topics,
    };
  });

  res.json({ levels });
});

// ─── Generate a new problem ───────────────────────────────────────────────
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { topic, difficulty = 'easy', language = 'python', levelId, topicId } = req.body;
    const userId = req.user?.id;

    let problem;
    if (levelId && topicId) {
      // New curriculum-based generation
      problem = await generateProblem({ levelId, topicId, difficulty, language, userId });
    } else if (topic) {
      // Legacy flat-topic generation (backward compat)
      problem = await generateProblem(topic, difficulty, language, userId);
    } else {
      return res.status(400).json({ error: 'Either topic or levelId+topicId required' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Problem generation error:', error);
    res.status(500).json({ error: 'Failed to generate problem' });
  }
});

// ─── Get a specific problem ───────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    res.json({
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        topic: problem.topic,
        levelId: problem.level_id || '',
        topicId: problem.topic_id || '',
        difficulty: problem.difficulty,
        constraints: problem.constraints,
        examples: JSON.parse(problem.examples || '[]'),
        hiddenTestCases: JSON.parse(problem.hidden_test_cases || '[]'),
        starterCode: JSON.parse(problem.starter_code || '{}'),
      },
    });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// ─── Generate a similar/variation problem ─────────────────────────────────
router.post('/:id/similar', optionalAuth, async (req, res) => {
  try {
    const { difficulty } = req.body;
    const userId = req.user?.id || '';
    const problemData = await generateSimilarProblem(req.params.id, difficulty, userId);
    res.json({ problem: { id: problemData.id, ...problemData } });
  } catch (error) {
    console.error('Similar problem error:', error);
    res.status(500).json({ error: 'Failed to generate similar problem. Please try again.' });
  }
});

export default router;
