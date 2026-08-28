// db/schema.ts
import { db } from './client'

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      meanings TEXT NOT NULL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      searchedAt INTEGER NOT NULL
    );
  `)
}