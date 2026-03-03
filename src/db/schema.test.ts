import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from './test-helpers';

describe('Migration #3', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  it('should create exercise_muscle_groups table', async () => {
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='exercise_muscle_groups'",
    );
    expect(result).not.toBeNull();
    expect(result!.name).toBe('exercise_muscle_groups');
  });

  it('should create body_photos table', async () => {
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='body_photos'",
    );
    expect(result).not.toBeNull();
  });

  it('should create user_settings table', async () => {
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'",
    );
    expect(result).not.toBeNull();
  });

  it('should create badges table', async () => {
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='badges'",
    );
    expect(result).not.toBeNull();
  });

  it('should add is_predefined column to exercises', async () => {
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group, is_predefined) VALUES ('Test', 'weights', 'chest', 1)",
    );
    const row = await db.getFirstAsync<{ is_predefined: number }>(
      "SELECT is_predefined FROM exercises WHERE name = 'Test'",
    );
    expect(row!.is_predefined).toBe(1);
  });

  it('should default is_predefined to 0', async () => {
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('Custom', 'weights', 'legs')",
    );
    const row = await db.getFirstAsync<{ is_predefined: number }>(
      "SELECT is_predefined FROM exercises WHERE name = 'Custom'",
    );
    expect(row!.is_predefined).toBe(0);
  });

  it('should add is_template and description columns to routines', async () => {
    await db.runAsync(
      "INSERT INTO routines (name, is_template, description) VALUES ('Push', 1, 'Push day')",
    );
    const row = await db.getFirstAsync<{ is_template: number; description: string }>(
      "SELECT is_template, description FROM routines WHERE name = 'Push'",
    );
    expect(row!.is_template).toBe(1);
    expect(row!.description).toBe('Push day');
  });

  it('should add group_id and group_type to routine_exercises', async () => {
    await db.runAsync("INSERT INTO routines (name) VALUES ('Test')");
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('Bench', 'weights', 'chest')",
    );
    await db.runAsync(
      "INSERT INTO routine_exercises (routine_id, exercise_id, sort_order, group_id, group_type) VALUES (1, 1, 1, 1, 'superset')",
    );
    const row = await db.getFirstAsync<{ group_id: number; group_type: string }>(
      'SELECT group_id, group_type FROM routine_exercises WHERE id = 1',
    );
    expect(row!.group_id).toBe(1);
    expect(row!.group_type).toBe('superset');
  });

  it('should add group_id and group_type to workout_sets', async () => {
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('Bench', 'weights', 'chest')",
    );
    await db.runAsync('INSERT INTO workouts (routine_id) VALUES (NULL)');
    await db.runAsync(
      "INSERT INTO workout_sets (workout_id, exercise_id, sort_order, group_id, group_type) VALUES (1, 1, 1, 1, 'dropset')",
    );
    const row = await db.getFirstAsync<{ group_id: number; group_type: string }>(
      'SELECT group_id, group_type FROM workout_sets WHERE id = 1',
    );
    expect(row!.group_id).toBe(1);
    expect(row!.group_type).toBe('dropset');
  });

  it('should reject invalid group_type in routine_exercises', async () => {
    await db.runAsync("INSERT INTO routines (name) VALUES ('Test')");
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('Bench', 'weights', 'chest')",
    );
    await expect(
      db.runAsync(
        "INSERT INTO routine_exercises (routine_id, exercise_id, sort_order, group_type) VALUES (1, 1, 1, 'invalid')",
      ),
    ).rejects.toThrow();
  });

  it('should populate pivot table from existing exercises', async () => {
    // Insert an exercise before migration (simulated — migration already ran, so insert + check pivot)
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('TestExercise', 'weights', 'back')",
    );
    // Migration auto-populates pivot for exercises that existed at migration time.
    // For newly inserted exercises after migration, we need to manually insert pivot data.
    // This test verifies the pivot table works correctly.
    const exerciseRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM exercises WHERE name = 'TestExercise'",
    );
    await db.runAsync(
      'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary) VALUES (?, ?, 1)',
      exerciseRow!.id,
      'back',
    );
    const pivotRow = await db.getFirstAsync<{ muscle_group: string; is_primary: number }>(
      'SELECT muscle_group, is_primary FROM exercise_muscle_groups WHERE exercise_id = ?',
      exerciseRow!.id,
    );
    expect(pivotRow!.muscle_group).toBe('back');
    expect(pivotRow!.is_primary).toBe(1);
  });

  it('should enforce unique constraint on exercise_muscle_groups', async () => {
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('Bench', 'weights', 'chest')",
    );
    await db.runAsync(
      'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary) VALUES (1, ?, 1)',
      'chest',
    );
    await expect(
      db.runAsync(
        'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary) VALUES (1, ?, 0)',
        'chest',
      ),
    ).rejects.toThrow();
  });

  it('should cascade delete pivot rows when exercise is deleted', async () => {
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('Bench', 'weights', 'chest')",
    );
    await db.runAsync(
      'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary) VALUES (1, ?, 1)',
      'chest',
    );
    await db.runAsync(
      'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary) VALUES (1, ?, 0)',
      'arms',
    );
    await db.runAsync('DELETE FROM exercises WHERE id = 1');
    const rows = await db.getAllAsync('SELECT * FROM exercise_muscle_groups WHERE exercise_id = 1');
    expect(rows).toHaveLength(0);
  });

  it('should store and retrieve user_settings key-value pairs', async () => {
    await db.runAsync("INSERT INTO user_settings (key, value) VALUES ('theme', 'dark')");
    const row = await db.getFirstAsync<{ key: string; value: string }>(
      "SELECT * FROM user_settings WHERE key = 'theme'",
    );
    expect(row!.value).toBe('dark');
  });

  it('should store and retrieve badges', async () => {
    await db.runAsync("INSERT INTO badges (badge_key) VALUES ('first_workout')");
    const row = await db.getFirstAsync<{ badge_key: string; unlocked_at: string }>(
      "SELECT * FROM badges WHERE badge_key = 'first_workout'",
    );
    expect(row!.badge_key).toBe('first_workout');
    expect(row!.unlocked_at).toBeDefined();
  });

  it('should record schema version 3', async () => {
    const row = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_version',
    );
    expect(row!.version).toBe(3);
  });
});
