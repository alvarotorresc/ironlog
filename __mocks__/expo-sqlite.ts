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
    // Use better-sqlite3's native multi-statement exec which handles
    // semicolons inside strings/expressions correctly
    this.db.exec(sql);
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

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await callback();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

export async function openDatabaseAsync(dbPath: string): Promise<MockSQLiteDatabase> {
  return new MockSQLiteDatabase(dbPath);
}

export type SQLiteDatabase = MockSQLiteDatabase;
