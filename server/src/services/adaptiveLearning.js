import db from '../config/database.js';
import { CURRICULUM, MASTERY_RULES, getAllTopicIds } from '../data/curriculum.js';
import crypto from 'crypto';

// ─── Update user progress after a submission ──────────────────────────────
export function updateCurriculumProgress(userId, problemId, isAccepted) {
  const problem = db.prepare('SELECT level_id, topic_id FROM problems WHERE id = ?').get(problemId);
  if (!problem || !problem.level_id || !problem.topic_id) return;

  const { level_id: levelId, topic_id: topicId } = problem;

  // Upsert topic progress
  const existing = db.prepare(
    'SELECT id, attempted, solved FROM user_topic_progress WHERE user_id = ? AND level_id = ? AND topic_id = ?'
  ).get(userId, levelId, topicId);

  if (existing) {
    const newAttempted = existing.attempted + 1;
    const newSolved = isAccepted ? existing.solved + 1 : existing.solved;
    const accuracy = newAttempted > 0 ? (newSolved / newAttempted) * 100 : 0;
    const mastery = Math.min(100, (newSolved / Math.max(MASTERY_RULES.minProblemsPerTopic, 3)) * 100);

    db.prepare(`
      UPDATE user_topic_progress SET attempted = ?, solved = ?, accuracy = ?, mastery = ?, last_attempted_at = datetime('now')
      WHERE id = ?
    `).run(newAttempted, newSolved, accuracy, mastery, existing.id);
  } else {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_topic_progress (id, user_id, level_id, topic_id, attempted, solved, accuracy, mastery, last_attempted_at)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))
    `).run(id, userId, levelId, topicId, isAccepted ? 1 : 0, isAccepted ? 100 : 0, isAccepted ? 33.3 : 0);
  }

  // Update level progress
  updateLevelProgress(userId, levelId);
}

function updateLevelProgress(userId, levelId) {
  const level = CURRICULUM.find(l => l.levelId === levelId);
  if (!level) return;

  const topicCount = level.topics.length;
  const topicProgresses = db.prepare(
    'SELECT topic_id, solved, accuracy FROM user_topic_progress WHERE user_id = ? AND level_id = ?'
  ).all(userId, levelId);

  // Completion = % of topics that have been attempted with at least minProblemsPerTopic solved
  const topicsMastered = topicProgresses.filter(
    t => t.solved >= MASTERY_RULES.minProblemsPerTopic && t.accuracy >= MASTERY_RULES.accuracyThreshold * 100
  ).length;

  const completionPct = topicCount > 0 ? (topicsMastered / topicCount) * 100 : 0;

  const existing = db.prepare(
    'SELECT id FROM user_level_progress WHERE user_id = ? AND level_id = ?'
  ).get(userId, levelId);

  if (existing) {
    db.prepare('UPDATE user_level_progress SET completion_pct = ? WHERE id = ?')
      .run(completionPct, existing.id);
  } else {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_level_progress (id, user_id, level_id, completion_pct, unlocked, unlocked_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).run(id, userId, levelId, completionPct);
  }

  // Check if next level should be unlocked
  if (completionPct >= MASTERY_RULES.completionThreshold * 100) {
    const nextLevelNum = level.levelNumber + 1;
    const nextLevelId = `level${nextLevelNum}`;
    const nextLevel = CURRICULUM.find(l => l.levelId === nextLevelId);
    if (nextLevel) {
      const nextExisting = db.prepare(
        'SELECT id FROM user_level_progress WHERE user_id = ? AND level_id = ?'
      ).get(userId, nextLevelId);

      if (!nextExisting) {
        const id = crypto.randomUUID();
        db.prepare(`
          INSERT INTO user_level_progress (id, user_id, level_id, completion_pct, unlocked, unlocked_at)
          VALUES (?, ?, ?, 0, 1, datetime('now'))
        `).run(id, userId, nextLevelId);
      } else {
        db.prepare('UPDATE user_level_progress SET unlocked = 1, unlocked_at = datetime(\'now\') WHERE id = ? AND unlocked = 0')
          .run(nextExisting.id);
      }
    }
  }
}

// ─── Get curriculum-based recommendations ──────────────────────────────────
export function getRecommendations(userId) {
  // Get all topic progress for this user
  const allProgress = db.prepare(
    'SELECT level_id, topic_id, attempted, solved, accuracy, mastery FROM user_topic_progress WHERE user_id = ?'
  ).all(userId);

  if (allProgress.length === 0) {
    return {
      recommendations: [
        { levelId: 'level1', topicId: 'variables', difficulty: 'easy', reason: 'Start with the basics — learn how variables work' },
        { levelId: 'level1', topicId: 'input_output', difficulty: 'easy', reason: 'Practice reading input and printing output' },
        { levelId: 'level1', topicId: 'data_types', difficulty: 'easy', reason: 'Understand different data types in Python' },
      ],
      weakTopics: [],
      strongTopics: [],
      nextLevel: { levelId: 'level1', name: 'Basics' },
    };
  }

  const progressMap = {};
  allProgress.forEach(p => { progressMap[`${p.level_id}_${p.topic_id}`] = p; });

  const recommendations = [];
  const weakTopics = [];
  const strongTopics = [];

  // Find weak areas (accuracy < 60%)
  allProgress.filter(p => p.accuracy < 60 && p.attempted >= 2).forEach(p => {
    weakTopics.push({ levelId: p.level_id, topicId: p.topic_id, accuracy: Math.round(p.accuracy) });
    recommendations.push({
      levelId: p.level_id, topicId: p.topic_id, difficulty: 'easy',
      reason: `Your accuracy in this topic is ${Math.round(p.accuracy)}% — practice more to improve`,
    });
  });

  // Strong topics
  allProgress.filter(p => p.accuracy >= 80 && p.attempted >= 3).forEach(p => {
    strongTopics.push({ levelId: p.level_id, topicId: p.topic_id, accuracy: Math.round(p.accuracy) });
  });

  // Find next unexplored topic in the current active level
  let currentLevel = null;
  for (const level of CURRICULUM) {
    const levelProgress = db.prepare(
      'SELECT completion_pct, unlocked FROM user_level_progress WHERE user_id = ? AND level_id = ?'
    ).get(userId, level.levelId);

    const isUnlocked = level.levelNumber === 1 || (levelProgress && levelProgress.unlocked);
    const isComplete = levelProgress && levelProgress.completion_pct >= 100;

    if (isUnlocked && !isComplete) {
      currentLevel = level;
      break;
    }
  }

  if (currentLevel) {
    for (const topic of currentLevel.topics) {
      const key = `${currentLevel.levelId}_${topic.topicId}`;
      if (!progressMap[key]) {
        recommendations.push({
          levelId: currentLevel.levelId, topicId: topic.topicId, difficulty: 'easy',
          reason: `Try "${topic.name}" — it's the next topic in ${currentLevel.name}`,
        });
        break;
      }
    }
  }

  return {
    recommendations: recommendations.slice(0, 5),
    weakTopics: weakTopics.slice(0, 5),
    strongTopics: strongTopics.slice(0, 5),
    nextLevel: currentLevel ? { levelId: currentLevel.levelId, name: currentLevel.name } : null,
  };
}

// ─── Topic performance (for dashboard) ─────────────────────────────────────
export function getTopicPerformance(userId) {
  const stats = db.prepare(`
    SELECT p.level_id, p.topic_id, p.topic,
      COUNT(DISTINCT s.problem_id) as problems_attempted,
      SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as solved,
      COUNT(*) as total_submissions,
      AVG(CASE WHEN s.time_taken > 0 THEN s.time_taken ELSE NULL END) as avg_time
    FROM submissions s
    JOIN problems p ON s.problem_id = p.id
    WHERE s.user_id = ?
    GROUP BY COALESCE(p.level_id, ''), COALESCE(p.topic_id, ''), p.topic
    ORDER BY solved DESC
  `).all(userId);

  return stats.map(s => ({
    topic: s.topic,
    levelId: s.level_id || '',
    topicId: s.topic_id || '',
    problemsAttempted: s.problems_attempted,
    solved: s.solved,
    totalSubmissions: s.total_submissions,
    accuracy: s.total_submissions > 0 ? Math.round((s.solved / s.total_submissions) * 100) : 0,
    avgTime: Math.round(s.avg_time || 0),
  }));
}
