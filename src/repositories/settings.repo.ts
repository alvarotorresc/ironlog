import { type SQLiteDatabase } from 'expo-sqlite';
import type { UnitSystem, UserSetting } from '../types';

export class SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO user_settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  }

  async getAll(): Promise<UserSetting[]> {
    return this.db.getAllAsync<UserSetting>('SELECT key, value FROM user_settings ORDER BY key');
  }

  async getUnitSystem(): Promise<UnitSystem> {
    const value = await this.get('unit_system');
    return value === 'imperial' ? 'imperial' : 'metric';
  }

  async setUnitSystem(system: UnitSystem): Promise<void> {
    await this.set('unit_system', system);
  }

  async getLanguage(): Promise<string | null> {
    return this.get('language');
  }

  async setLanguage(language: string): Promise<void> {
    await this.set('language', language);
  }

  async delete(key: string): Promise<void> {
    await this.db.runAsync('DELETE FROM user_settings WHERE key = ?', key);
  }
}
