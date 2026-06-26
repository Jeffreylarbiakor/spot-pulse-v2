import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'spot-pulse.db');

// Ensure the data directory exists
import { mkdirSync } from 'node:fs';
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);

// WAL mode for better concurrency
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id           TEXT PRIMARY KEY,
    spot_id      TEXT NOT NULL,
    month        TEXT NOT NULL,
    submitted_by TEXT,
    submitted_at TEXT NOT NULL,
    source       TEXT NOT NULL DEFAULT 'app',
    inputs       TEXT NOT NULL,
    received_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_spot_month
    ON submissions (spot_id, month);
`);

export default db;
