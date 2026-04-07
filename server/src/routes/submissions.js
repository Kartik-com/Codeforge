import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { executeCode, runTestCases } from '../services/codeExecutor.js';
import { awardXP, updateStreak, checkAndAwardBadges } from '../services/gamification.js';
import { updateCurriculumProgress } from '../services/adaptiveLearning.js';
import db from '../config/database.js';
import crypto from 'crypto';

const router = Router();

// Run code (execute against stdin OR problem examples)
router.post('/run', async (req, res) => {
  try {
    const { code, language, stdin, problemId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    // If no custom stdin is provided, but problemId is, run against problem examples
    if (!stdin && problemId) {
      const problem = db.prepare('SELECT examples FROM problems WHERE id = ?').get(problemId);
      if (problem && problem.examples) {
        const examples = JSON.parse(problem.examples || '[]');
        if (examples.length > 0) {
          const allTestCases = examples.map(e => ({ input: e.input, expectedOutput: e.output }));
          const executionResult = await runTestCases(code, language, allTestCases);
          
          if (executionResult.status === 'Accepted') {
            return res.json({ 
              result: {
                success: true,
                stdout: `✅ All ${examples.length} example test cases passed!\n\nSubmit your code to test against the hidden test cases.`,
                stderr: '',
                time: executionResult.execution_time ? executionResult.execution_time.replace('s', '') : '0.00',
                memory: executionResult.memory
              }
            });
          } else {
            const failed = executionResult.failed_case;
            const isRuntimeErr = executionResult.status !== 'Wrong Answer';
            return res.json({
              result: {
                success: false,
                stdout: '',
                stderr: isRuntimeErr 
                  ? failed.error 
                  : `❌ Example Test Case Failed:\n\nInput:\n${failed.input}\n\nExpected Output:\n${failed.expected_output}\n\nActual Output:\n${failed.actual_output}`,
                time: executionResult.execution_time ? executionResult.execution_time.replace('s', '') : '0.00',
                memory: executionResult.memory
              }
            });
          }
        }
      }
    }

    const result = await executeCode(code, language, stdin || '');
    
    res.json({ 
      result: {
        success: result.success,
        stdout: result.rawOutput,
        stderr: result.errorOutput,
        compileOutput: '',
        time: result.execution_time ? result.execution_time.replace('s', '') : '0.00',
        memory: result.memory
      }
    });
  } catch (error) {
    console.error('Run error:', error);
    res.status(500).json({ error: 'Code execution failed' });
  }
});

// Submit code (save + test against hidden test cases)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { problemId, code, language, timeTaken } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({ error: 'Problem ID, code, and language are required' });
    }

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const hiddenTestCases = JSON.parse(problem.hidden_test_cases || '[]');
    const examples = JSON.parse(problem.examples || '[]');
    
    // Combine examples and hidden tests
    const allTestCases = [
      ...examples.map(e => ({ input: e.input, expectedOutput: e.output })),
      ...hiddenTestCases,
    ];

    // Run all test cases
    const executionResult = await runTestCases(code, language, allTestCases);
    
    // executionResult format: { status, passed, total, failed_case, execution_time, memory }
    const status = executionResult.status;
    const passed = executionResult.passed;
    const total = executionResult.total;

    // Check if simulated (Now always false since we removed simulation wrapper)
    const isSimulated = false;

    // Save submission
    const submissionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO submissions (id, user_id, problem_id, language, code, status, tests_passed, total_tests, time_taken)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(submissionId, req.user.id, problemId, language, code, status, passed, total, timeTaken || 0);

    // Update curriculum progress tracking
    try { updateCurriculumProgress(req.user.id, problemId, status === 'Accepted'); } catch (e) { console.error('Progress update error:', e); }

    let gamification = null;
    let badges = [];

    if (status === 'Accepted') {
      // Check if first attempt for this problem
      const previousAccepted = db.prepare(
        'SELECT id FROM submissions WHERE user_id = ? AND problem_id = ? AND status = ? AND id != ?'
      ).get(req.user.id, problemId, 'Accepted', submissionId);
      
      const isFirstSolve = !previousAccepted;
      
      if (isFirstSolve) {
        gamification = awardXP(req.user.id, problem.difficulty, true);
        updateStreak(req.user.id);
        badges = checkAndAwardBadges(req.user.id);
      }
    }

    res.json({
      submission: {
        id: submissionId,
        status,
        testsPassed: passed,
        totalTests: total,
        failedCase: executionResult.failed_case,
        executionTime: executionResult.execution_time,
        memory: executionResult.memory
      },
      gamification,
      badges,
      simulated: isSimulated,
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// Submission history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const submissions = db.prepare(`
      SELECT s.*, p.title as problem_title, p.topic, p.difficulty
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(limit), parseInt(offset));

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
