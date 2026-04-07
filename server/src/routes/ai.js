import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { reviewCode, solveDoubt } from '../services/aiReviewer.js';
import db from '../config/database.js';

const router = Router();

// AI Code Review
router.post('/review', authenticateToken, async (req, res) => {
  try {
    const { code, language, problemId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    let problemDescription = 'General code review';
    if (problemId) {
      const problem = db.prepare('SELECT description FROM problems WHERE id = ?').get(problemId);
      if (problem) problemDescription = problem.description;
    }

    const review = await reviewCode(code, language, problemDescription);

    // Save review to submission if problemId provided
    if (problemId) {
      const lastSubmission = db.prepare(
        'SELECT id FROM submissions WHERE user_id = ? AND problem_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(req.user.id, problemId);

      if (lastSubmission) {
        db.prepare('UPDATE submissions SET ai_review = ? WHERE id = ?')
          .run(JSON.stringify(review), lastSubmission.id);
      }
    }

    res.json({ review });
  } catch (error) {
    console.error('AI review error:', error);
    res.status(500).json({ error: 'AI review failed' });
  }
});

// AI Doubt Solver
router.post('/doubt', authenticateToken, async (req, res) => {
  try {
    const { question, code, language, problemId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let problemDescription = '';
    if (problemId) {
      const problem = db.prepare('SELECT description FROM problems WHERE id = ?').get(problemId);
      if (problem) problemDescription = problem.description;
    }

    const response = await solveDoubt(question, code || '', language || 'python', problemDescription);
    res.json({ response });
  } catch (error) {
    console.error('Doubt solver error:', error);
    res.status(500).json({ error: 'Doubt solving failed' });
  }
});

export default router;
