import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'codeforge.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    level_id TEXT DEFAULT '',
    topic_id TEXT DEFAULT '',
    constraints TEXT DEFAULT '',
    examples TEXT DEFAULT '[]',
    hidden_test_cases TEXT DEFAULT '[]',
    starter_code TEXT DEFAULT '{}',
    solution TEXT DEFAULT '',
    generated_by TEXT DEFAULT 'ai',
    logic_signature TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,
    runtime INTEGER DEFAULT 0,
    memory INTEGER DEFAULT 0,
    tests_passed INTEGER DEFAULT 0,
    total_tests INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0,
    ai_review TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge TEXT NOT NULL,
    earned_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_activity (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    problems INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
  );

  -- Curriculum progress tracking per topic
  CREATE TABLE IF NOT EXISTS user_topic_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    level_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    attempted INTEGER DEFAULT 0,
    solved INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    mastery REAL DEFAULT 0,
    last_attempted_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, level_id, topic_id)
  );

  -- Curriculum progress tracking per level
  CREATE TABLE IF NOT EXISTS user_level_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    level_id TEXT NOT NULL,
    completion_pct REAL DEFAULT 0,
    unlocked INTEGER DEFAULT 0,
    unlocked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, level_id)
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
  CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_problems_topic ON problems(topic);
  CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
  CREATE INDEX IF NOT EXISTS idx_problems_level ON problems(level_id);
  CREATE INDEX IF NOT EXISTS idx_problems_topic_id ON problems(topic_id);
  CREATE INDEX IF NOT EXISTS idx_user_topic_progress ON user_topic_progress(user_id, level_id);
  CREATE INDEX IF NOT EXISTS idx_user_level_progress ON user_level_progress(user_id);
`);

// ─── Migration: Add level_id/topic_id columns if missing ───────────────────
try {
  db.exec(`ALTER TABLE problems ADD COLUMN level_id TEXT DEFAULT ''`);
} catch (e) { if (!e.message.includes('duplicate column')) console.error('Migration error level_id:', e); }
try {
  db.exec(`ALTER TABLE problems ADD COLUMN topic_id TEXT DEFAULT ''`);
} catch (e) { if (!e.message.includes('duplicate column')) console.error('Migration error topic_id:', e); }
try {
  db.exec(`ALTER TABLE problems ADD COLUMN logic_signature TEXT DEFAULT ''`);
} catch (e) { if (!e.message.includes('duplicate column')) console.error('Migration error logic_signature:', e); }
try {
  db.exec(`ALTER TABLE problems ADD COLUMN content_hash TEXT DEFAULT ''`);
} catch (e) { if (!e.message.includes('duplicate column')) console.error('Migration error content_hash:', e); }
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_problems_content_hash ON problems(content_hash)`);
} catch (e) { console.error('Index creation error content_hash:', e); }

// ─── Migration: Map old topics to curriculum IDs ───────────────────────────
import { LEGACY_TOPIC_MAP } from '../data/curriculum.js';

const unmapped = db.prepare("SELECT id, topic FROM problems WHERE level_id = '' OR level_id IS NULL").all();
if (unmapped.length > 0) {
  const updateStmt = db.prepare("UPDATE problems SET level_id = ?, topic_id = ? WHERE id = ?");
  const tx = db.transaction(() => {
    for (const row of unmapped) {
      const mapping = LEGACY_TOPIC_MAP[row.topic];
      if (mapping) {
        updateStmt.run(mapping.levelId, mapping.topicId, row.id);
      }
    }
  });
  tx();
  console.log(`[DB] Migrated ${unmapped.length} problems to curriculum IDs`);
}

export default db;
