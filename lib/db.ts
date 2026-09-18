import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'closet.db');

let db: Database.Database;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
    migrateSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      product_image_url TEXT,
      product_url TEXT,
      name TEXT,
      type TEXT,
      color TEXT,
      brand TEXT,
      price_estimate REAL,
      season TEXT,
      occasion TEXT,
      ranking INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outfit_items (
      outfit_id INTEGER REFERENCES outfits(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
      PRIMARY KEY (outfit_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function migrateSchema(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(items)").all() as { name: string }[]).map(c => c.name);
  if (!cols.includes('product_image_url')) db.exec('ALTER TABLE items ADD COLUMN product_image_url TEXT');
  if (!cols.includes('product_url')) db.exec('ALTER TABLE items ADD COLUMN product_url TEXT');
  if (!cols.includes('is_favorite')) db.exec('ALTER TABLE items ADD COLUMN is_favorite INTEGER DEFAULT 0');
}

export default getDb;
