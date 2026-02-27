/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from 'better-sqlite3';

/**
 * Mock of expo-sqlite using better-sqlite3 for Node.js test environment.
 * Implements the subset of expo-sqlite API used by our repositories.
 */

class MockSQLiteDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath === ':memory:' ? ':memory:' : dbPath);
  }

  async execAsync(sql: string): Promise<void> {
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      this.db.exec(statement);
    }
  }

  async runAsync(
    sql: string,
    ...params: any[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  }

  async getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return (row as T) ?? null;
  }

  async getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows as T[];
  }

  close(): void {
    this.db.close();
  }
}

export async function openDatabaseAsync(dbPath: string): Promise<MockSQLiteDatabase> {
  return new MockSQLiteDatabase(dbPath);
}

export type SQLiteDatabase = MockSQLiteDatabase;
