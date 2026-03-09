import { type SQLiteDatabase } from 'expo-sqlite';
import type { IronLogBackup } from '../types';
import { BackupRepository } from './backup.repo';

function createMockDb() {
  return {
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
  } as unknown as SQLiteDatabase;
}

function makeEmptyBackup(overrides: Partial<IronLogBackup> = {}): IronLogBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: [],
    routines: [],
    workouts: [],
    bodyMeasurements: [],
    ...overrides,
  };
}

/**
 * Export queries getAllAsync in this order:
 * 1. exercises
 * 2. exercise_muscle_groups (pivot)
 * 3. routines
 * 4. routine_exercises
 * 5. workouts
 * 6. workout_sets
 * 7. body_measurements
 * 8. body_photos
 * 9. user_settings
 * 10. badges
 */
function mockEmptyExport(db: SQLiteDatabase) {
  (db.getAllAsync as jest.Mock).mockResolvedValue([]);
}

describe('BackupRepository', () => {
  let db: ReturnType<typeof createMockDb> & SQLiteDatabase;
  let repo: BackupRepository;

  beforeEach(() => {
    db = createMockDb() as ReturnType<typeof createMockDb> & SQLiteDatabase;
    repo = new BackupRepository(db);
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // exportData
  // ---------------------------------------------------------------------------
  describe('exportData', () => {
    it('should return empty arrays and version 2 when DB is empty', async () => {
      mockEmptyExport(db);

      const result = await repo.exportData();

      expect(result.version).toBe(2);
      expect(result.exercises).toEqual([]);
      expect(result.routines).toEqual([]);
      expect(result.workouts).toEqual([]);
      expect(result.bodyMeasurements).toEqual([]);
      expect(result.settings).toEqual([]);
      expect(result.badges).toEqual([]);
    });

    it('should return a valid ISO exportedAt timestamp when DB is empty', async () => {
      mockEmptyExport(db);

      const result = await repo.exportData();

      expect(() => new Date(result.exportedAt).toISOString()).not.toThrow();
      expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
    });

    it('should map exercise fields from snake_case to camelCase', async () => {
      (db.getAllAsync as jest.Mock)
        // exercises
        .mockResolvedValueOnce([
          {
            id: 1,
            name: 'Bench Press',
            type: 'weights',
            muscle_group: 'chest',
            illustration: 'bench.svg',
            rest_seconds: 90,
            notes: null,
            created_at: '2026-01-01T00:00:00.000Z',
            is_predefined: 1,
          },
        ])
        // exercise_muscle_groups
        .mockResolvedValueOnce([
          { exercise_id: 1, muscle_group: 'chest', is_primary: 1 },
          { exercise_id: 1, muscle_group: 'shoulders', is_primary: 0 },
        ])
        .mockResolvedValue([]);

      const result = await repo.exportData();

      expect(result.exercises).toEqual([
        {
          id: 1,
          name: 'Bench Press',
          type: 'weights',
          muscleGroup: 'chest',
          muscleGroups: ['chest', 'shoulders'],
          illustration: 'bench.svg',
          restSeconds: 90,
          notes: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          isPredefined: true,
        },
      ]);
    });

    it('should fall back to [muscleGroup] when no pivot data exists for an exercise', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            name: 'Old Exercise',
            type: 'weights',
            muscle_group: 'back',
            illustration: null,
            rest_seconds: 60,
            notes: null,
            created_at: '2026-01-01T00:00:00.000Z',
            is_predefined: 0,
          },
        ])
        // empty pivot table
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      const result = await repo.exportData();

      expect(result.exercises[0].muscleGroups).toEqual(['back']);
    });

    it('should group routine_exercises by routine_id correctly', async () => {
      (db.getAllAsync as jest.Mock)
        // exercises
        .mockResolvedValueOnce([])
        // exercise_muscle_groups
        .mockResolvedValueOnce([])
        // routines
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Push Day',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 0,
            description: null,
          },
          {
            id: 20,
            name: 'Pull Day',
            created_at: '2026-01-02T00:00:00.000Z',
            is_template: 1,
            description: 'Pull muscles',
          },
        ])
        // routine_exercises
        .mockResolvedValueOnce([
          { routine_id: 10, exercise_id: 1, sort_order: 0, group_id: null, group_type: null },
          { routine_id: 10, exercise_id: 2, sort_order: 1, group_id: 1, group_type: 'superset' },
          { routine_id: 20, exercise_id: 3, sort_order: 0, group_id: null, group_type: null },
        ])
        // workouts
        .mockResolvedValueOnce([])
        // workout_sets
        .mockResolvedValueOnce([])
        // body_measurements
        .mockResolvedValueOnce([])
        // body_photos
        .mockResolvedValueOnce([])
        // user_settings
        .mockResolvedValueOnce([])
        // badges
        .mockResolvedValueOnce([]);

      const result = await repo.exportData();

      expect(result.routines).toHaveLength(2);
      expect(result.routines[0]).toEqual({
        id: 10,
        name: 'Push Day',
        createdAt: '2026-01-01T00:00:00.000Z',
        isTemplate: false,
        description: null,
        exercises: [
          { exerciseId: 1, sortOrder: 0, groupId: null, groupType: null },
          { exerciseId: 2, sortOrder: 1, groupId: 1, groupType: 'superset' },
        ],
      });
      expect(result.routines[1]).toEqual({
        id: 20,
        name: 'Pull Day',
        createdAt: '2026-01-02T00:00:00.000Z',
        isTemplate: true,
        description: 'Pull muscles',
        exercises: [{ exerciseId: 3, sortOrder: 0, groupId: null, groupType: null }],
      });
    });

    it('should return empty exercises array for routine with no routine_exercises', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Empty Routine',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 0,
            description: null,
          },
        ])
        .mockResolvedValueOnce([]) // no routine_exercises
        .mockResolvedValueOnce([]) // workouts
        .mockResolvedValueOnce([]) // workout_sets
        .mockResolvedValueOnce([]) // body_measurements
        .mockResolvedValueOnce([]) // body_photos
        .mockResolvedValueOnce([]) // user_settings
        .mockResolvedValueOnce([]); // badges

      const result = await repo.exportData();

      expect(result.routines[0].exercises).toEqual([]);
    });

    it('should group workout_sets by workout_id correctly', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([]) // routines
        .mockResolvedValueOnce([]) // routine_exercises
        // workouts
        .mockResolvedValueOnce([
          {
            id: 100,
            routine_id: 10,
            started_at: '2026-01-10T08:00:00.000Z',
            finished_at: '2026-01-10T09:00:00.000Z',
          },
        ])
        // workout_sets
        .mockResolvedValueOnce([
          {
            workout_id: 100,
            exercise_id: 1,
            sort_order: 0,
            weight: 60,
            reps: 10,
            duration: null,
            distance: null,
            notes: null,
            group_id: null,
            group_type: null,
          },
          {
            workout_id: 100,
            exercise_id: 1,
            sort_order: 1,
            weight: 65,
            reps: 8,
            duration: null,
            distance: null,
            notes: null,
            group_id: 1,
            group_type: 'superset',
          },
        ])
        .mockResolvedValueOnce([]) // body_measurements
        .mockResolvedValueOnce([]) // body_photos
        .mockResolvedValueOnce([]) // user_settings
        .mockResolvedValueOnce([]); // badges

      const result = await repo.exportData();

      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0]).toEqual({
        id: 100,
        routineId: 10,
        startedAt: '2026-01-10T08:00:00.000Z',
        finishedAt: '2026-01-10T09:00:00.000Z',
        sets: [
          {
            exerciseId: 1,
            sortOrder: 0,
            weight: 60,
            reps: 10,
            duration: null,
            distance: null,
            notes: null,
            groupId: null,
            groupType: null,
          },
          {
            exerciseId: 1,
            sortOrder: 1,
            weight: 65,
            reps: 8,
            duration: null,
            distance: null,
            notes: null,
            groupId: 1,
            groupType: 'superset',
          },
        ],
      });
    });

    it('should map body measurement fields and preserve null values', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([]) // routines
        .mockResolvedValueOnce([]) // routine_exercises
        .mockResolvedValueOnce([]) // workouts
        .mockResolvedValueOnce([]) // workout_sets
        // body_measurements
        .mockResolvedValueOnce([
          {
            id: 1,
            weight: 80.5,
            body_fat: 15.0,
            chest: null,
            waist: 82,
            hips: null,
            biceps: null,
            thighs: null,
            notes: 'Morning',
            measured_at: '2026-02-01T08:00:00.000Z',
          },
        ])
        // body_photos
        .mockResolvedValueOnce([])
        // user_settings
        .mockResolvedValueOnce([])
        // badges
        .mockResolvedValueOnce([]);

      const result = await repo.exportData();

      expect(result.bodyMeasurements).toEqual([
        {
          weight: 80.5,
          bodyFat: 15.0,
          chest: null,
          waist: 82,
          hips: null,
          biceps: null,
          thighs: null,
          notes: 'Morning',
          measuredAt: '2026-02-01T08:00:00.000Z',
        },
      ]);
    });

    it('should return all sections populated when DB has full data', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            name: 'Squat',
            type: 'weights',
            muscle_group: 'legs',
            illustration: null,
            rest_seconds: 120,
            notes: null,
            created_at: '2026-01-01T00:00:00.000Z',
            is_predefined: 0,
          },
        ])
        .mockResolvedValueOnce([{ exercise_id: 1, muscle_group: 'legs', is_primary: 1 }])
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Leg Day',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 0,
            description: null,
          },
        ])
        .mockResolvedValueOnce([
          { routine_id: 10, exercise_id: 1, sort_order: 0, group_id: null, group_type: null },
        ])
        .mockResolvedValueOnce([
          { id: 100, routine_id: 10, started_at: '2026-01-10T08:00:00.000Z', finished_at: null },
        ])
        .mockResolvedValueOnce([
          {
            workout_id: 100,
            exercise_id: 1,
            sort_order: 0,
            weight: 100,
            reps: 5,
            duration: null,
            distance: null,
            notes: null,
            group_id: null,
            group_type: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 1,
            weight: 80,
            body_fat: null,
            chest: null,
            waist: null,
            hips: null,
            biceps: null,
            thighs: null,
            notes: null,
            measured_at: '2026-02-01T08:00:00.000Z',
          },
        ])
        // body_photos
        .mockResolvedValueOnce([])
        // user_settings
        .mockResolvedValueOnce([{ key: 'theme', value: 'dark' }])
        // badges
        .mockResolvedValueOnce([
          { badge_key: 'first_workout', unlocked_at: '2026-01-10T09:00:00.000Z' },
        ]);

      const result = await repo.exportData();

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].muscleGroups).toEqual(['legs']);
      expect(result.exercises[0].isPredefined).toBe(false);
      expect(result.routines).toHaveLength(1);
      expect(result.workouts).toHaveLength(1);
      expect(result.bodyMeasurements).toHaveLength(1);
      expect(result.settings).toEqual([{ key: 'theme', value: 'dark' }]);
      expect(result.badges).toEqual([
        { badgeKey: 'first_workout', unlockedAt: '2026-01-10T09:00:00.000Z' },
      ]);
      expect(result.version).toBe(2);
      expect(result.exportedAt).toBeDefined();
    });

    it('should propagate DB errors from exportData', async () => {
      (db.getAllAsync as jest.Mock).mockRejectedValueOnce(new Error('DB locked'));

      await expect(repo.exportData()).rejects.toThrow('DB locked');
    });
  });

  // ---------------------------------------------------------------------------
  // importData
  // ---------------------------------------------------------------------------
  describe('importData', () => {
    it('should complete without errors when backup is empty', async () => {
      await expect(repo.importData(makeEmptyBackup())).resolves.toBeUndefined();
    });

    it('should wrap all operations in withTransactionAsync', async () => {
      await repo.importData(makeEmptyBackup());

      expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
      expect(db.withTransactionAsync).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should INSERT OR IGNORE exercises by name and resolve local ID', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 50,
            name: 'Deadlift',
            type: 'weights',
            muscleGroup: 'back',
            illustration: null,
            restSeconds: 120,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 7 });

      await repo.importData(backup);

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE INTO exercises'),
        'Deadlift',
        'weights',
        'back',
        null,
        120,
        null,
        '2026-01-01T00:00:00.000Z',
        0,
      );
      expect(db.getFirstAsync).toHaveBeenCalledWith(
        'SELECT id FROM exercises WHERE name = ?',
        'Deadlift',
      );
    });

    it('should sync muscle groups pivot on import', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 50,
            name: 'Bench Press',
            type: 'weights',
            muscleGroup: 'chest',
            muscleGroups: ['chest', 'shoulders', 'arms'],
            illustration: null,
            restSeconds: 90,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 7 });

      await repo.importData(backup);

      // Should delete existing pivot rows and insert new ones
      const calls = (db.runAsync as jest.Mock).mock.calls;
      const pivotDelete = calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('DELETE FROM exercise_muscle_groups'),
      );
      expect(pivotDelete).toBeDefined();
      expect(pivotDelete![1]).toBe(7); // local exercise ID

      const pivotInserts = calls.filter(
        (c) =>
          typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO exercise_muscle_groups'),
      );
      expect(pivotInserts).toHaveLength(3);
      // First is primary
      expect(pivotInserts[0][2]).toBe('chest');
      expect(pivotInserts[0][3]).toBe(1); // is_primary
      // Others are secondary
      expect(pivotInserts[1][2]).toBe('shoulders');
      expect(pivotInserts[1][3]).toBe(0);
      expect(pivotInserts[2][2]).toBe('arms');
      expect(pivotInserts[2][3]).toBe(0);
    });

    it('should fall back to [muscleGroup] for pivot when muscleGroups is not in backup', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 50,
            name: 'Old Exercise',
            type: 'weights',
            muscleGroup: 'back',
            illustration: null,
            restSeconds: 60,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 7 });

      await repo.importData(backup);

      const pivotInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) =>
          typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO exercise_muscle_groups'),
      );
      expect(pivotInserts).toHaveLength(1);
      expect(pivotInserts[0][2]).toBe('back');
      expect(pivotInserts[0][3]).toBe(1); // is_primary
    });

    it('should map exported exercise ID to local ID for subsequent inserts', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 50,
            name: 'Bench Press',
            type: 'weights',
            muscleGroup: 'chest',
            illustration: null,
            restSeconds: 90,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        routines: [
          {
            id: 1,
            name: 'Push',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 50, sortOrder: 0 }],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 7 });

      await repo.importData(backup);

      // The routine_exercises INSERT should use local ID 7, not exported ID 50
      const routineExerciseInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO routine_exercises'),
      );
      expect(routineExerciseInsert).toBeDefined();
      expect(routineExerciseInsert![2]).toBe(7); // local exercise ID
    });

    it('should INSERT OR REPLACE routines and rebuild routine_exercises', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 1,
            name: 'Curl',
            type: 'weights',
            muscleGroup: 'arms',
            illustration: null,
            restSeconds: 60,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        routines: [
          {
            id: 10,
            name: 'Arms',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 1, sortOrder: 0 }],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const calls = (db.runAsync as jest.Mock).mock.calls.map((c) => c[0]);

      expect(calls).toContainEqual(expect.stringContaining('INSERT OR REPLACE INTO routines'));
      expect(calls).toContainEqual(
        expect.stringContaining('DELETE FROM routine_exercises WHERE routine_id'),
      );
      expect(calls).toContainEqual(expect.stringContaining('INSERT INTO routine_exercises'));
    });

    it('should skip routine_exercise and warn when exercise ID is not in map', async () => {
      const backup = makeEmptyBackup({
        exercises: [], // no exercises imported
        routines: [
          {
            id: 10,
            name: 'Ghost',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 999, sortOrder: 0 }],
          },
        ],
      });

      await repo.importData(backup);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('skipping routine_exercise'),
      );
      const routineExInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO routine_exercises'),
      );
      expect(routineExInserts).toHaveLength(0);
    });

    it('should INSERT OR REPLACE workouts and rebuild workout_sets', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 1,
            name: 'Squat',
            type: 'weights',
            muscleGroup: 'legs',
            illustration: null,
            restSeconds: 120,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        workouts: [
          {
            id: 100,
            routineId: null,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: '2026-01-10T09:00:00.000Z',
            sets: [
              { exerciseId: 1, sortOrder: 0, weight: 100, reps: 5, duration: null, distance: null },
            ],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const calls = (db.runAsync as jest.Mock).mock.calls.map((c) => c[0]);

      expect(calls).toContainEqual(expect.stringContaining('INSERT OR REPLACE INTO workouts'));
      expect(calls).toContainEqual(
        expect.stringContaining('DELETE FROM workout_sets WHERE workout_id'),
      );
      expect(calls).toContainEqual(expect.stringContaining('INSERT INTO workout_sets'));
    });

    it('should pass null for workout routineId and finishedAt when absent', async () => {
      const backup = makeEmptyBackup({
        workouts: [
          {
            id: 100,
            routineId: null,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: null,
            sets: [],
          },
        ],
      });

      await repo.importData(backup);

      const workoutInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('INSERT OR REPLACE INTO workouts'),
      );
      expect(workoutInsert).toBeDefined();
      expect(workoutInsert![2]).toBeNull(); // routineId
      expect(workoutInsert![4]).toBeNull(); // finishedAt
    });

    it('should skip workout_set and warn when exercise ID is not in map', async () => {
      const backup = makeEmptyBackup({
        exercises: [],
        workouts: [
          {
            id: 100,
            routineId: null,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: null,
            sets: [
              {
                exerciseId: 999,
                sortOrder: 0,
                weight: 50,
                reps: 10,
                duration: null,
                distance: null,
              },
            ],
          },
        ],
      });

      await repo.importData(backup);

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('skipping set'));
      const setInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO workout_sets'),
      );
      expect(setInserts).toHaveLength(0);
    });

    it('should INSERT OR IGNORE body measurements with all fields including nulls', async () => {
      const backup = makeEmptyBackup({
        bodyMeasurements: [
          {
            weight: 80.5,
            bodyFat: null,
            chest: 100,
            waist: null,
            hips: null,
            biceps: null,
            thighs: null,
            notes: null,
            measuredAt: '2026-02-01T08:00:00.000Z',
          },
        ],
      });

      await repo.importData(backup);

      const bmInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('INSERT OR IGNORE INTO body_measurements'),
      );
      expect(bmInsert).toBeDefined();
      expect(bmInsert![1]).toBe(80.5);
      expect(bmInsert![2]).toBeNull(); // bodyFat
      expect(bmInsert![3]).toBe(100); // chest
      expect(bmInsert![4]).toBeNull(); // waist
      expect(bmInsert![9]).toBe('2026-02-01T08:00:00.000Z');
    });

    it('should resolve correct IDs when importing multiple exercises', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 50,
            name: 'Bench Press',
            type: 'weights',
            muscleGroup: 'chest',
            illustration: null,
            restSeconds: 90,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 60,
            name: 'Deadlift',
            type: 'weights',
            muscleGroup: 'back',
            illustration: null,
            restSeconds: 120,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        workouts: [
          {
            id: 100,
            routineId: null,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: null,
            sets: [
              { exerciseId: 50, sortOrder: 0, weight: 80, reps: 5, duration: null, distance: null },
              {
                exerciseId: 60,
                sortOrder: 1,
                weight: 120,
                reps: 3,
                duration: null,
                distance: null,
              },
            ],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock)
        .mockResolvedValueOnce({ id: 7 })
        .mockResolvedValueOnce({ id: 12 });

      await repo.importData(backup);

      const setInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO workout_sets'),
      );
      expect(setInserts).toHaveLength(2);
      expect(setInserts[0][2]).toBe(7); // first set → local exercise ID 7
      expect(setInserts[1][2]).toBe(12); // second set → local exercise ID 12
    });

    it('should handle exercise where getFirstAsync returns null', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 50,
            name: 'Ghost Exercise',
            type: 'weights',
            muscleGroup: 'chest',
            illustration: null,
            restSeconds: 60,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        routines: [
          {
            id: 10,
            name: 'Routine',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 50, sortOrder: 0 }],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue(null);

      await repo.importData(backup);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('skipping routine_exercise'),
      );
    });

    it('should propagate DB errors from importData', async () => {
      (db.withTransactionAsync as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

      await expect(repo.importData(makeEmptyBackup())).rejects.toThrow('disk full');
    });
  });

  // ---------------------------------------------------------------------------
  // Roundtrip
  // ---------------------------------------------------------------------------
  describe('roundtrip', () => {
    it('should produce a backup shape that importData accepts without errors', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            name: 'Squat',
            type: 'weights',
            muscle_group: 'legs',
            illustration: null,
            rest_seconds: 120,
            notes: null,
            created_at: '2026-01-01T00:00:00.000Z',
            is_predefined: 0,
          },
        ])
        .mockResolvedValueOnce([
          { exercise_id: 1, muscle_group: 'legs', is_primary: 1 },
          { exercise_id: 1, muscle_group: 'core', is_primary: 0 },
        ])
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Leg Day',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 0,
            description: null,
          },
        ])
        .mockResolvedValueOnce([
          { routine_id: 10, exercise_id: 1, sort_order: 0, group_id: null, group_type: null },
        ])
        .mockResolvedValueOnce([
          {
            id: 100,
            routine_id: 10,
            started_at: '2026-01-10T08:00:00.000Z',
            finished_at: '2026-01-10T09:00:00.000Z',
          },
        ])
        .mockResolvedValueOnce([
          {
            workout_id: 100,
            exercise_id: 1,
            sort_order: 0,
            weight: 100,
            reps: 5,
            duration: null,
            distance: null,
            notes: null,
            group_id: null,
            group_type: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 1,
            weight: 80,
            body_fat: null,
            chest: null,
            waist: null,
            hips: null,
            biceps: null,
            thighs: null,
            notes: null,
            measured_at: '2026-02-01T08:00:00.000Z',
          },
        ])
        // body_photos
        .mockResolvedValueOnce([])
        // user_settings
        .mockResolvedValueOnce([{ key: 'unit', value: 'kg' }])
        // badges
        .mockResolvedValueOnce([
          { badge_key: 'first_workout', unlocked_at: '2026-01-10T09:00:00.000Z' },
        ]);

      const exported = await repo.exportData();

      // Verify muscleGroups are in the export
      expect(exported.exercises[0].muscleGroups).toEqual(['legs', 'core']);
      expect(exported.version).toBe(2);
      expect(exported.settings).toHaveLength(1);
      expect(exported.badges).toHaveLength(1);

      // Reset mocks for import phase
      (db.runAsync as jest.Mock).mockClear();
      (db.getFirstAsync as jest.Mock).mockReset().mockResolvedValue({ id: 1 });

      await expect(repo.importData(exported)).resolves.toBeUndefined();
    });

    it('should roundtrip all v2 fields including settings and badges', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            name: 'Bench Press',
            type: 'weights',
            muscle_group: 'chest',
            illustration: 'bench.svg',
            rest_seconds: 90,
            notes: 'Go deep',
            created_at: '2026-01-01T00:00:00.000Z',
            is_predefined: 1,
          },
        ])
        .mockResolvedValueOnce([
          { exercise_id: 1, muscle_group: 'chest', is_primary: 1 },
          { exercise_id: 1, muscle_group: 'shoulders', is_primary: 0 },
        ])
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Push Day',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 1,
            description: 'All push movements',
          },
        ])
        .mockResolvedValueOnce([
          {
            routine_id: 10,
            exercise_id: 1,
            sort_order: 0,
            group_id: 1,
            group_type: 'superset',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 100,
            routine_id: 10,
            started_at: '2026-01-10T08:00:00.000Z',
            finished_at: '2026-01-10T09:00:00.000Z',
          },
        ])
        .mockResolvedValueOnce([
          {
            workout_id: 100,
            exercise_id: 1,
            sort_order: 0,
            weight: 80,
            reps: 8,
            duration: null,
            distance: null,
            notes: 'Felt strong',
            group_id: 2,
            group_type: 'dropset',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 1,
            weight: 80,
            body_fat: 15,
            chest: 100,
            waist: 82,
            hips: null,
            biceps: 35,
            thighs: null,
            notes: 'Morning',
            measured_at: '2026-02-01T08:00:00.000Z',
          },
        ])
        .mockResolvedValueOnce([{ measurement_id: 1, photo_path: '/photos/front.jpg' }])
        .mockResolvedValueOnce([
          { key: 'theme', value: 'dark' },
          { key: 'unit', value: 'kg' },
        ])
        .mockResolvedValueOnce([
          { badge_key: 'first_workout', unlocked_at: '2026-01-10T09:00:00.000Z' },
          { badge_key: 'ten_workouts', unlocked_at: '2026-02-01T08:00:00.000Z' },
        ]);

      const exported = await repo.exportData();

      // Verify all v2 fields are present
      expect(exported.version).toBe(2);
      expect(exported.exercises[0].isPredefined).toBe(true);
      expect(exported.exercises[0].notes).toBe('Go deep');
      expect(exported.routines[0].isTemplate).toBe(true);
      expect(exported.routines[0].description).toBe('All push movements');
      expect(exported.routines[0].exercises[0].groupId).toBe(1);
      expect(exported.routines[0].exercises[0].groupType).toBe('superset');
      expect(exported.workouts[0].sets[0].groupId).toBe(2);
      expect(exported.workouts[0].sets[0].groupType).toBe('dropset');
      expect(exported.workouts[0].sets[0].notes).toBe('Felt strong');
      expect(exported.bodyMeasurements[0].photoPaths).toEqual(['/photos/front.jpg']);
      expect(exported.settings).toEqual([
        { key: 'theme', value: 'dark' },
        { key: 'unit', value: 'kg' },
      ]);
      expect(exported.badges).toEqual([
        { badgeKey: 'first_workout', unlockedAt: '2026-01-10T09:00:00.000Z' },
        { badgeKey: 'ten_workouts', unlockedAt: '2026-02-01T08:00:00.000Z' },
      ]);

      // Reset mocks for import phase
      (db.runAsync as jest.Mock).mockClear();
      (db.getFirstAsync as jest.Mock).mockReset().mockResolvedValue({ id: 1 });

      await expect(repo.importData(exported)).resolves.toBeUndefined();

      // Verify settings were imported with INSERT OR REPLACE
      const settingInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR REPLACE INTO user_settings'),
      );
      expect(settingInserts).toHaveLength(2);
      expect(settingInserts[0][1]).toBe('theme');
      expect(settingInserts[0][2]).toBe('dark');
      expect(settingInserts[1][1]).toBe('unit');
      expect(settingInserts[1][2]).toBe('kg');

      // Verify badges were imported with INSERT OR IGNORE
      const badgeInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO badges'),
      );
      expect(badgeInserts).toHaveLength(2);
      expect(badgeInserts[0][1]).toBe('first_workout');
      expect(badgeInserts[1][1]).toBe('ten_workouts');
    });
  });

  // ---------------------------------------------------------------------------
  // v2 fields export
  // ---------------------------------------------------------------------------
  describe('exportData v2 fields', () => {
    it('should export isPredefined as true when is_predefined is 1', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            name: 'Squat',
            type: 'weights',
            muscle_group: 'legs',
            illustration: null,
            rest_seconds: 120,
            notes: null,
            created_at: '2026-01-01T00:00:00.000Z',
            is_predefined: 1,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      const result = await repo.exportData();

      expect(result.exercises[0].isPredefined).toBe(true);
    });

    it('should export isTemplate and description for routines', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Template Routine',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 1,
            description: 'A template',
          },
        ])
        .mockResolvedValueOnce([]) // routine_exercises
        .mockResolvedValueOnce([]) // workouts
        .mockResolvedValueOnce([]) // workout_sets
        .mockResolvedValueOnce([]) // body_measurements
        .mockResolvedValueOnce([]) // body_photos
        .mockResolvedValueOnce([]) // user_settings
        .mockResolvedValueOnce([]); // badges

      const result = await repo.exportData();

      expect(result.routines[0].isTemplate).toBe(true);
      expect(result.routines[0].description).toBe('A template');
    });

    it('should export groupId and groupType for routine_exercises', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Superset Day',
            created_at: '2026-01-01T00:00:00.000Z',
            is_template: 0,
            description: null,
          },
        ])
        .mockResolvedValueOnce([
          { routine_id: 10, exercise_id: 1, sort_order: 0, group_id: 5, group_type: 'circuit' },
        ])
        .mockResolvedValueOnce([]) // workouts
        .mockResolvedValueOnce([]) // workout_sets
        .mockResolvedValueOnce([]) // body_measurements
        .mockResolvedValueOnce([]) // body_photos
        .mockResolvedValueOnce([]) // user_settings
        .mockResolvedValueOnce([]); // badges

      const result = await repo.exportData();

      expect(result.routines[0].exercises[0].groupId).toBe(5);
      expect(result.routines[0].exercises[0].groupType).toBe('circuit');
    });

    it('should export groupId and groupType for workout_sets', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([]) // routines
        .mockResolvedValueOnce([]) // routine_exercises
        .mockResolvedValueOnce([
          {
            id: 100,
            routine_id: null,
            started_at: '2026-01-10T08:00:00.000Z',
            finished_at: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            workout_id: 100,
            exercise_id: 1,
            sort_order: 0,
            weight: 50,
            reps: 10,
            duration: null,
            distance: null,
            notes: null,
            group_id: 3,
            group_type: 'dropset',
          },
        ])
        .mockResolvedValueOnce([]) // body_measurements
        .mockResolvedValueOnce([]) // body_photos
        .mockResolvedValueOnce([]) // user_settings
        .mockResolvedValueOnce([]); // badges

      const result = await repo.exportData();

      expect(result.workouts[0].sets[0].groupId).toBe(3);
      expect(result.workouts[0].sets[0].groupType).toBe('dropset');
    });

    it('should export settings and badges', async () => {
      (db.getAllAsync as jest.Mock)
        .mockResolvedValueOnce([]) // exercises
        .mockResolvedValueOnce([]) // exercise_muscle_groups
        .mockResolvedValueOnce([]) // routines
        .mockResolvedValueOnce([]) // routine_exercises
        .mockResolvedValueOnce([]) // workouts
        .mockResolvedValueOnce([]) // workout_sets
        .mockResolvedValueOnce([]) // body_measurements
        .mockResolvedValueOnce([]) // body_photos
        .mockResolvedValueOnce([
          { key: 'language', value: 'es' },
          { key: 'restTimer', value: 'true' },
        ])
        .mockResolvedValueOnce([
          { badge_key: 'streak_7', unlocked_at: '2026-03-01T00:00:00.000Z' },
        ]);

      const result = await repo.exportData();

      expect(result.settings).toEqual([
        { key: 'language', value: 'es' },
        { key: 'restTimer', value: 'true' },
      ]);
      expect(result.badges).toEqual([
        { badgeKey: 'streak_7', unlockedAt: '2026-03-01T00:00:00.000Z' },
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // v2 fields import
  // ---------------------------------------------------------------------------
  describe('importData v2 fields', () => {
    it('should import exercises with isPredefined flag', async () => {
      const backup = makeEmptyBackup({
        version: 2,
        exercises: [
          {
            id: 1,
            name: 'Predefined Exercise',
            type: 'weights',
            muscleGroup: 'chest',
            illustration: null,
            restSeconds: 90,
            createdAt: '2026-01-01T00:00:00.000Z',
            isPredefined: true,
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const exerciseInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO exercises'),
      );
      expect(exerciseInsert).toBeDefined();
      // Last param is is_predefined
      expect(exerciseInsert![8]).toBe(1);
    });

    it('should default isPredefined to 0 when absent in backup', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 1,
            name: 'Custom Exercise',
            type: 'weights',
            muscleGroup: 'back',
            illustration: null,
            restSeconds: 60,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const exerciseInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO exercises'),
      );
      expect(exerciseInsert![8]).toBe(0);
    });

    it('should import routines with isTemplate and description', async () => {
      const backup = makeEmptyBackup({
        version: 2,
        routines: [
          {
            id: 10,
            name: 'Template',
            createdAt: '2026-01-01T00:00:00.000Z',
            isTemplate: true,
            description: 'A push template',
            exercises: [],
          },
        ],
      });

      await repo.importData(backup);

      const routineInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR REPLACE INTO routines'),
      );
      expect(routineInsert).toBeDefined();
      expect(routineInsert![4]).toBe(1); // is_template
      expect(routineInsert![5]).toBe('A push template'); // description
    });

    it('should default isTemplate to 0 and description to null when absent', async () => {
      const backup = makeEmptyBackup({
        routines: [
          {
            id: 10,
            name: 'Simple Routine',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [],
          },
        ],
      });

      await repo.importData(backup);

      const routineInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR REPLACE INTO routines'),
      );
      expect(routineInsert![4]).toBe(0); // is_template defaults to 0
      expect(routineInsert![5]).toBeNull(); // description defaults to null
    });

    it('should import routine_exercises with groupId and groupType', async () => {
      const backup = makeEmptyBackup({
        version: 2,
        exercises: [
          {
            id: 1,
            name: 'Curl',
            type: 'weights',
            muscleGroup: 'arms',
            illustration: null,
            restSeconds: 60,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        routines: [
          {
            id: 10,
            name: 'Arms',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 1, sortOrder: 0, groupId: 1, groupType: 'superset' }],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const reInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO routine_exercises'),
      );
      expect(reInsert).toBeDefined();
      expect(reInsert![4]).toBe(1); // group_id
      expect(reInsert![5]).toBe('superset'); // group_type
    });

    it('should default groupId and groupType to null when absent in routine_exercises', async () => {
      const backup = makeEmptyBackup({
        exercises: [
          {
            id: 1,
            name: 'Curl',
            type: 'weights',
            muscleGroup: 'arms',
            illustration: null,
            restSeconds: 60,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        routines: [
          {
            id: 10,
            name: 'Arms',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 1, sortOrder: 0 }],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const reInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO routine_exercises'),
      );
      expect(reInsert![4]).toBeNull(); // group_id
      expect(reInsert![5]).toBeNull(); // group_type
    });

    it('should import workout_sets with groupId and groupType', async () => {
      const backup = makeEmptyBackup({
        version: 2,
        exercises: [
          {
            id: 1,
            name: 'Squat',
            type: 'weights',
            muscleGroup: 'legs',
            illustration: null,
            restSeconds: 120,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        workouts: [
          {
            id: 100,
            routineId: null,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: null,
            sets: [
              {
                exerciseId: 1,
                sortOrder: 0,
                weight: 100,
                reps: 5,
                duration: null,
                distance: null,
                groupId: 2,
                groupType: 'circuit',
              },
            ],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(backup);

      const setInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO workout_sets'),
      );
      expect(setInsert).toBeDefined();
      expect(setInsert![9]).toBe(2); // group_id
      expect(setInsert![10]).toBe('circuit'); // group_type
    });

    it('should import settings with INSERT OR REPLACE', async () => {
      const backup = makeEmptyBackup({
        version: 2,
        settings: [
          { key: 'theme', value: 'dark' },
          { key: 'unit', value: 'kg' },
        ],
      });

      await repo.importData(backup);

      const settingInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR REPLACE INTO user_settings'),
      );
      expect(settingInserts).toHaveLength(2);
      expect(settingInserts[0][1]).toBe('theme');
      expect(settingInserts[0][2]).toBe('dark');
      expect(settingInserts[1][1]).toBe('unit');
      expect(settingInserts[1][2]).toBe('kg');
    });

    it('should import badges with INSERT OR IGNORE', async () => {
      const backup = makeEmptyBackup({
        version: 2,
        badges: [
          { badgeKey: 'first_workout', unlockedAt: '2026-01-10T09:00:00.000Z' },
          { badgeKey: 'streak_7', unlockedAt: '2026-03-01T00:00:00.000Z' },
        ],
      });

      await repo.importData(backup);

      const badgeInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO badges'),
      );
      expect(badgeInserts).toHaveLength(2);
      expect(badgeInserts[0][1]).toBe('first_workout');
      expect(badgeInserts[0][2]).toBe('2026-01-10T09:00:00.000Z');
      expect(badgeInserts[1][1]).toBe('streak_7');
    });

    it('should import body measurement photo paths into body_photos', async () => {
      const backup = makeEmptyBackup({
        bodyMeasurements: [
          {
            weight: 80,
            bodyFat: null,
            chest: null,
            waist: null,
            hips: null,
            biceps: null,
            thighs: null,
            notes: null,
            measuredAt: '2026-02-01T08:00:00.000Z',
            photoPaths: ['/photos/front.jpg', '/photos/side.jpg'],
          },
        ],
      });
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 5 });

      await repo.importData(backup);

      const photoInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO body_photos'),
      );
      expect(photoInserts).toHaveLength(2);
      expect(photoInserts[0][1]).toBe(5); // measurement_id
      expect(photoInserts[0][2]).toBe('/photos/front.jpg');
      expect(photoInserts[1][1]).toBe(5);
      expect(photoInserts[1][2]).toBe('/photos/side.jpg');
    });

    it('should skip body_photos import when photoPaths is not in backup', async () => {
      const backup = makeEmptyBackup({
        bodyMeasurements: [
          {
            weight: 80,
            bodyFat: null,
            chest: null,
            waist: null,
            hips: null,
            biceps: null,
            thighs: null,
            notes: null,
            measuredAt: '2026-02-01T08:00:00.000Z',
          },
        ],
      });

      await repo.importData(backup);

      const photoInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO body_photos'),
      );
      expect(photoInserts).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // v1 backward compatibility
  // ---------------------------------------------------------------------------
  describe('importData v1 backward compatibility', () => {
    it('should import a v1 backup without settings or badges without crashing', async () => {
      const v1Backup: IronLogBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        exercises: [
          {
            id: 1,
            name: 'Bench Press',
            type: 'weights',
            muscleGroup: 'chest',
            illustration: null,
            restSeconds: 90,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        routines: [
          {
            id: 10,
            name: 'Push',
            createdAt: '2026-01-01T00:00:00.000Z',
            exercises: [{ exerciseId: 1, sortOrder: 0 }],
          },
        ],
        workouts: [
          {
            id: 100,
            routineId: 10,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: '2026-01-10T09:00:00.000Z',
            sets: [
              {
                exerciseId: 1,
                sortOrder: 0,
                weight: 80,
                reps: 8,
                duration: null,
                distance: null,
              },
            ],
          },
        ],
        bodyMeasurements: [],
      };
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(repo.importData(v1Backup)).resolves.toBeUndefined();

      // No settings or badges inserts
      const settingInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('user_settings'),
      );
      const badgeInserts = (db.runAsync as jest.Mock).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('INTO badges'),
      );
      expect(settingInserts).toHaveLength(0);
      expect(badgeInserts).toHaveLength(0);
    });

    it('should default v3 fields to safe values when importing v1 backup', async () => {
      const v1Backup: IronLogBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        exercises: [
          {
            id: 1,
            name: 'Squat',
            type: 'weights',
            muscleGroup: 'legs',
            illustration: null,
            restSeconds: 120,
            createdAt: '2026-01-01T00:00:00.000Z',
            // No isPredefined, no notes
          },
        ],
        routines: [
          {
            id: 10,
            name: 'Leg Day',
            createdAt: '2026-01-01T00:00:00.000Z',
            // No isTemplate, no description
            exercises: [{ exerciseId: 1, sortOrder: 0 }], // No groupId, groupType
          },
        ],
        workouts: [
          {
            id: 100,
            routineId: null,
            startedAt: '2026-01-10T08:00:00.000Z',
            finishedAt: null,
            sets: [
              {
                exerciseId: 1,
                sortOrder: 0,
                weight: 100,
                reps: 5,
                duration: null,
                distance: null,
                // No groupId, groupType, notes
              },
            ],
          },
        ],
        bodyMeasurements: [],
      };
      (db.getFirstAsync as jest.Mock).mockResolvedValue({ id: 1 });

      await repo.importData(v1Backup);

      // Exercise: is_predefined defaults to 0
      const exerciseInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR IGNORE INTO exercises'),
      );
      expect(exerciseInsert![8]).toBe(0); // is_predefined

      // Routine: is_template defaults to 0, description to null
      const routineInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT OR REPLACE INTO routines'),
      );
      expect(routineInsert![4]).toBe(0); // is_template
      expect(routineInsert![5]).toBeNull(); // description

      // Routine exercises: group_id and group_type default to null
      const reInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO routine_exercises'),
      );
      expect(reInsert![4]).toBeNull(); // group_id
      expect(reInsert![5]).toBeNull(); // group_type

      // Workout sets: group_id and group_type default to null
      const setInsert = (db.runAsync as jest.Mock).mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO workout_sets'),
      );
      expect(setInsert![9]).toBeNull(); // group_id
      expect(setInsert![10]).toBeNull(); // group_type
    });

    it('should import a v1 backup with empty settings and badges gracefully', async () => {
      const backup = makeEmptyBackup({
        version: 1,
        settings: [],
        badges: [],
      });

      await expect(repo.importData(backup)).resolves.toBeUndefined();
    });
  });
});
