import * as SQLite from 'expo-sqlite';
import { runMigrations } from './schema';

/**
 * Creates an in-memory SQLite database for testing.
 * Each call returns a fresh, isolated database with migrations applied.
 */
export async function createTestDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(':memory:');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}
