import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type RepairLineKind = 'fixed' | 'range_based' | 'plate';

export function openDatabase(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function ensureSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pricing_formulas (
      key TEXT PRIMARY KEY NOT NULL,
      value REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS repair_lines (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'fixed',
      price INTEGER NOT NULL DEFAULT 0,
      default_checked INTEGER NOT NULL DEFAULT 0,
      default_qty INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS repair_by_range (
      range_key TEXT PRIMARY KEY NOT NULL,
      label TEXT,
      price INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      price_ht INTEGER NOT NULL,
      range TEXT NOT NULL,
      dealership TEXT NOT NULL,
      UNIQUE(model, range, dealership, price_ht)
    );

    CREATE TABLE IF NOT EXISTS sync_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      started_at TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT
    );
  `);
}

export function isDatabaseEmpty(db: Database.Database): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM repair_lines').get() as { count: number };
  return row.count === 0;
}
