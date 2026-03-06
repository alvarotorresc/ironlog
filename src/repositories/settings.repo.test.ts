import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { SettingsRepository } from './settings.repo';

describe('SettingsRepository', () => {
  let db: SQLiteDatabase;
  let repo: SettingsRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new SettingsRepository(db);
  });

  describe('get and set', () => {
    it('should return null for a non-existent key', async () => {
      const value = await repo.get('non_existent');
      expect(value).toBeNull();
    });

    it('should store and retrieve a value', async () => {
      await repo.set('test_key', 'test_value');
      const value = await repo.get('test_key');
      expect(value).toBe('test_value');
    });

    it('should overwrite an existing value', async () => {
      await repo.set('key', 'first');
      await repo.set('key', 'second');
      const value = await repo.get('key');
      expect(value).toBe('second');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no settings exist', async () => {
      const all = await repo.getAll();
      expect(all).toEqual([]);
    });

    it('should return all settings ordered by key', async () => {
      await repo.set('z_key', 'z_value');
      await repo.set('a_key', 'a_value');
      await repo.set('m_key', 'm_value');

      const all = await repo.getAll();
      expect(all).toEqual([
        { key: 'a_key', value: 'a_value' },
        { key: 'm_key', value: 'm_value' },
        { key: 'z_key', value: 'z_value' },
      ]);
    });
  });

  describe('getUnitSystem', () => {
    it('should default to metric when no setting exists', async () => {
      const system = await repo.getUnitSystem();
      expect(system).toBe('metric');
    });

    it('should return metric when set to metric', async () => {
      await repo.setUnitSystem('metric');
      const system = await repo.getUnitSystem();
      expect(system).toBe('metric');
    });

    it('should return imperial when set to imperial', async () => {
      await repo.setUnitSystem('imperial');
      const system = await repo.getUnitSystem();
      expect(system).toBe('imperial');
    });

    it('should default to metric for invalid stored values', async () => {
      await repo.set('unit_system', 'invalid_value');
      const system = await repo.getUnitSystem();
      expect(system).toBe('metric');
    });
  });

  describe('setUnitSystem', () => {
    it('should persist unit system preference', async () => {
      await repo.setUnitSystem('imperial');
      const value = await repo.get('unit_system');
      expect(value).toBe('imperial');
    });

    it('should allow switching between systems', async () => {
      await repo.setUnitSystem('imperial');
      expect(await repo.getUnitSystem()).toBe('imperial');

      await repo.setUnitSystem('metric');
      expect(await repo.getUnitSystem()).toBe('metric');
    });
  });

  describe('language', () => {
    it('should return null when no language set', async () => {
      const language = await repo.getLanguage();
      expect(language).toBeNull();
    });

    it('should store and retrieve language preference', async () => {
      await repo.setLanguage('es');
      const language = await repo.getLanguage();
      expect(language).toBe('es');
    });
  });

  describe('delete', () => {
    it('should remove a setting', async () => {
      await repo.set('to_delete', 'value');
      expect(await repo.get('to_delete')).toBe('value');

      await repo.delete('to_delete');
      expect(await repo.get('to_delete')).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(repo.delete('non_existent')).resolves.toBeUndefined();
    });
  });
});
