import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "inbox.db");

let db: Database.Database | null = null;

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      thread_id TEXT PRIMARY KEY,
      inbox_id TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      preview TEXT NOT NULL DEFAULT '',
      from_display TEXT NOT NULL DEFAULT '',
      time_display TEXT NOT NULL DEFAULT '',
      folder TEXT NOT NULL DEFAULT 'all',
      stages_json TEXT NOT NULL DEFAULT '["intro"]',
      goal TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      prospect_json TEXT,
      intro_sent INTEGER NOT NULL DEFAULT 0,
      message_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'received',
      last_action TEXT NOT NULL DEFAULT 'Inbound email',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      inbox_id TEXT NOT NULL,
      from_addr TEXT NOT NULL DEFAULT '',
      to_addrs_json TEXT NOT NULL DEFAULT '[]',
      cc_addrs_json TEXT NOT NULL DEFAULT '[]',
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      preview TEXT NOT NULL DEFAULT '',
      is_agent INTEGER NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'intro',
      time_display TEXT NOT NULL DEFAULT '',
      timestamp_iso TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (message_id, thread_id),
      FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);

    CREATE TABLE IF NOT EXISTS processed_events (
      event_id TEXT PRIMARY KEY,
      processed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS thread_inbox_links (
      logical_thread_id TEXT NOT NULL,
      inbox_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      PRIMARY KEY (logical_thread_id, inbox_id)
    );

    CREATE INDEX IF NOT EXISTS idx_thread_inbox_links_thread ON thread_inbox_links(thread_id);

    CREATE TABLE IF NOT EXISTS approval_drafts (
      draft_id TEXT PRIMARY KEY,
      logical_thread_id TEXT NOT NULL UNIQUE,
      whisperer_role TEXT NOT NULL,
      to_addrs_json TEXT NOT NULL DEFAULT '[]',
      cc_addrs_json TEXT NOT NULL DEFAULT '[]',
      bcc_addrs_json TEXT NOT NULL DEFAULT '[]',
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      subagent TEXT NOT NULL DEFAULT '',
      target_stage TEXT NOT NULL,
      pipeline_stage TEXT NOT NULL DEFAULT 'intro',
      previous_status TEXT NOT NULL DEFAULT '',
      previous_folder TEXT NOT NULL DEFAULT 'all',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_approval_drafts_logical ON approval_drafts(logical_thread_id);
  `);

  const threadCols = database.prepare("PRAGMA table_info(threads)").all() as { name: string }[];
  const threadColNames = new Set(threadCols.map((c) => c.name));
  if (!threadColNames.has("logical_thread_id")) {
    database.exec(`ALTER TABLE threads ADD COLUMN logical_thread_id TEXT`);
  }
  if (!threadColNames.has("thread_kind")) {
    database.exec(`ALTER TABLE threads ADD COLUMN thread_kind TEXT NOT NULL DEFAULT 'inbound'`);
  }
  if (!threadColNames.has("block_reason")) {
    database.exec(`ALTER TABLE threads ADD COLUMN block_reason TEXT`);
  }
  if (!threadColNames.has("candidate_email")) {
    database.exec(`ALTER TABLE threads ADD COLUMN candidate_email TEXT`);
  }

  const messageCols = database.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
  const messageColNames = new Set(messageCols.map((c) => c.name));
  if (!messageColNames.has("is_internal")) {
    database.exec(`ALTER TABLE messages ADD COLUMN is_internal INTEGER NOT NULL DEFAULT 0`);
  }
  if (!messageColNames.has("logical_thread_id")) {
    database.exec(`ALTER TABLE messages ADD COLUMN logical_thread_id TEXT`);
  }

  const messagePk = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'messages'")
    .get() as { sql: string } | undefined;
  if (messagePk?.sql.includes("message_id TEXT PRIMARY KEY")) {
    database.exec(`
      CREATE TABLE messages_migrated (
        message_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        inbox_id TEXT NOT NULL,
        from_addr TEXT NOT NULL DEFAULT '',
        to_addrs_json TEXT NOT NULL DEFAULT '[]',
        cc_addrs_json TEXT NOT NULL DEFAULT '[]',
        subject TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        preview TEXT NOT NULL DEFAULT '',
        is_agent INTEGER NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'intro',
        time_display TEXT NOT NULL DEFAULT '',
        timestamp_iso TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_internal INTEGER NOT NULL DEFAULT 0,
        logical_thread_id TEXT,
        PRIMARY KEY (message_id, thread_id),
        FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
      );
      INSERT INTO messages_migrated (
        message_id, thread_id, inbox_id, from_addr, to_addrs_json, cc_addrs_json,
        subject, body, preview, is_agent, stage, time_display, timestamp_iso,
        created_at, is_internal, logical_thread_id
      )
      SELECT
        message_id, thread_id, inbox_id, from_addr, to_addrs_json, cc_addrs_json,
        subject, body, preview, is_agent, stage, time_display, timestamp_iso,
        created_at, is_internal, logical_thread_id
      FROM messages;
      DROP TABLE messages;
      ALTER TABLE messages_migrated RENAME TO messages;
      CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
    `);
  }

  database.exec(`CREATE INDEX IF NOT EXISTS idx_threads_logical ON threads(logical_thread_id)`);
}

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}
