import Database from 'better-sqlite3';
const db = new Database('./codeforge.db');

try {
  db.exec(`ALTER TABLE problems ADD COLUMN topic_id TEXT DEFAULT ''`);
  console.log("Successfully added topic_id");
} catch(e) {
  console.log("Failed to add topic_id:", e.message);
}
