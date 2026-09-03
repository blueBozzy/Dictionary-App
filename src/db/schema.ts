// db/schema.ts
import { db } from './client'

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      meanings TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      searchedAt INTEGER NOT NULL
    );
  `)

  const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(words)')
  if (!columns.some((column) => column.name === 'note')) {
    db.execSync("ALTER TABLE words ADD COLUMN note TEXT NOT NULL DEFAULT ''")
  }
}