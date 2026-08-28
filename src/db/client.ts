// db/client.ts
import * as SQLite from 'expo-sqlite'

export const db = SQLite.openDatabaseSync('dictionary.db')