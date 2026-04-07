import db from '../config/database.js';

const BADGES = {
  FIRST_SOLVE: { id: 'first_solve', name: 'First Blood', description: 'Solved your first problem', icon: '🎯' },
  STREAK_3: { id: 'streak_3', name: 'On Fire', description: '3-day streak', icon: '🔥' },
  STREAK_7: { id: 'streak_7', name: 'Unstoppable', description: '7-day streak', icon: '⚡' },
  STREAK_30: { id: 'streak_30', name: 'Legendary', description: '30-day streak', icon: '🏆' },
  PROBLEMS_10: { id: 'problems_10', name: 'Getting Started', description: 'Solved 10 problems', icon: '📚' },
  PROBLEMS_50: { id: 'problems_50', name: 'Problem Crusher', description: 'Solved 50 problems', icon: '💪' },
  PROBLEMS_100: { id: 'problems_100', name: 'Centurion', description: 'Solved 100 problems', icon: '💯' },
  EASY_MASTER: { id: 'easy_master', name: 'Easy Peasy', description: 'Solved 20 easy problems', icon: '🟢' },
  MEDIUM_MASTER: { id: 'medium_master', name: 'Medium Rare', description: 'Solved 20 medium problems', icon: '🟡' },
  HARD_MASTER: { id: 'hard_master', name: 'Hardcore', description: 'Solved 10 hard problems', icon: '🔴' },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', description: 'Solved a problem in under 2 minutes', icon: '⏱️' },
  PERFECTIONIST: { id: 'perfectionist', name: 'Perfectionist', description: '10 submissions with all tests passed on first try', icon: '✨' },
  POLYGLOT: { id: 'polyglot', name: 'Polyglot', description: 'Used all 4 programming languages', icon: '🌐' },
};

const XP_REWARDS = {
  easy: 50,
  medium: 100,
  hard: 200,
  streak_bonus: 25,
  first_try_bonus: 50,
};

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
  10000, 13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
];

export function calculateLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXpForNextLevel(xp) {
  const level = calculateLevel(xp);
  if (level >= LEVEL_THRESHOLDS.length) return { current: xp, needed: xp, progress: 100 };
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 10000;
  return {
    current: xp - currentThreshold,
    needed: nextThreshold - currentThreshold,
    progress: Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100),
  };
}

export function awardXP(userId, difficulty, isFirstTry = false) {
  const baseXP = XP_REWARDS[difficulty] || 50;
  let totalXP = baseXP;

  const user = db.prepare('SELECT streak FROM users WHERE id = ?').get(userId);
  if (user && user.streak > 0) {
    totalXP += XP_REWARDS.streak_bonus;
  }
  if (isFirstTry) {
    totalXP += XP_REWARDS.first_try_bonus;
  }

  const currentUser = db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
  const newXP = (currentUser?.xp || 0) + totalXP;
  const newLevel = calculateLevel(newXP);

  db.prepare('UPDATE users SET xp = ?, level = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newXP, newLevel, userId);

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT id, problems, xp_earned FROM daily_activity WHERE user_id = ? AND date = ?').get(userId, today);
  
  if (existing) {
    db.prepare('UPDATE daily_activity SET problems = problems + 1, xp_earned = xp_earned + ? WHERE id = ?')
      .run(totalXP, existing.id);
  } else {
    db.prepare('INSERT INTO daily_activity (id, user_id, date, problems, xp_earned) VALUES (?, ?, ?, 1, ?)')
      .run(crypto.randomUUID(), userId, today, totalXP);
  }

  return { xpEarned: totalXP, totalXP: newXP, level: newLevel, leveledUp: newLevel > (currentUser ? calculateLevel(currentUser.xp) : 1) };
}

export function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];
  const user = db.prepare('SELECT streak, longest_streak, last_active_at FROM users WHERE id = ?').get(userId);
  
  if (!user) return { streak: 0 };

  const lastActive = user.last_active_at ? user.last_active_at.split('T')[0] : null;
  let newStreak = user.streak;

  if (lastActive === today) {
    // Already active today
    return { streak: newStreak, extended: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (lastActive === yesterday) {
    newStreak += 1;
  } else if (lastActive !== today) {
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, user.longest_streak);

  db.prepare('UPDATE users SET streak = ?, longest_streak = ?, last_active_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?')
    .run(newStreak, longestStreak, userId);

  return { streak: newStreak, longestStreak, extended: true };
}

export function checkAndAwardBadges(userId) {
  const awarded = [];
  const existingBadges = db.prepare('SELECT badge FROM user_badges WHERE user_id = ?').all(userId).map(b => b.badge);

  const totalSolved = db.prepare('SELECT COUNT(DISTINCT problem_id) as count FROM submissions WHERE user_id = ? AND status = ?').get(userId, 'accepted')?.count || 0;
  const user = db.prepare('SELECT streak FROM users WHERE id = ?').get(userId);

  const checks = [
    { badge: BADGES.FIRST_SOLVE, condition: totalSolved >= 1 },
    { badge: BADGES.PROBLEMS_10, condition: totalSolved >= 10 },
    { badge: BADGES.PROBLEMS_50, condition: totalSolved >= 50 },
    { badge: BADGES.PROBLEMS_100, condition: totalSolved >= 100 },
    { badge: BADGES.STREAK_3, condition: user?.streak >= 3 },
    { badge: BADGES.STREAK_7, condition: user?.streak >= 7 },
    { badge: BADGES.STREAK_30, condition: user?.streak >= 30 },
  ];

  // Check difficulty-specific badges
  const easySolved = db.prepare('SELECT COUNT(DISTINCT s.problem_id) as count FROM submissions s JOIN problems p ON s.problem_id = p.id WHERE s.user_id = ? AND s.status = ? AND p.difficulty = ?').get(userId, 'accepted', 'easy')?.count || 0;
  const mediumSolved = db.prepare('SELECT COUNT(DISTINCT s.problem_id) as count FROM submissions s JOIN problems p ON s.problem_id = p.id WHERE s.user_id = ? AND s.status = ? AND p.difficulty = ?').get(userId, 'accepted', 'medium')?.count || 0;
  const hardSolved = db.prepare('SELECT COUNT(DISTINCT s.problem_id) as count FROM submissions s JOIN problems p ON s.problem_id = p.id WHERE s.user_id = ? AND s.status = ? AND p.difficulty = ?').get(userId, 'accepted', 'hard')?.count || 0;

  checks.push(
    { badge: BADGES.EASY_MASTER, condition: easySolved >= 20 },
    { badge: BADGES.MEDIUM_MASTER, condition: mediumSolved >= 20 },
    { badge: BADGES.HARD_MASTER, condition: hardSolved >= 10 },
  );

  // Check polyglot badge
  const languages = db.prepare('SELECT DISTINCT language FROM submissions WHERE user_id = ? AND status = ?').all(userId, 'accepted').map(l => l.language);
  checks.push({ badge: BADGES.POLYGLOT, condition: languages.length >= 4 });

  for (const { badge, condition } of checks) {
    if (condition && !existingBadges.includes(badge.id)) {
      db.prepare('INSERT INTO user_badges (id, user_id, badge) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), userId, badge.id);
      awarded.push(badge);
    }
  }

  return awarded;
}

export function getAllBadges() {
  return Object.values(BADGES);
}

export function getUserBadges(userId) {
  const earned = db.prepare('SELECT badge, earned_at FROM user_badges WHERE user_id = ?').all(userId);
  const earnedMap = new Map(earned.map(e => [e.badge, e.earned_at]));
  
  return Object.values(BADGES).map(badge => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) || null,
  }));
}
