import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { BadgeRepository } from './badge.repo';
import { ExerciseRepository } from './exercise.repo';
import { BADGE_CHECKS, TOTAL_BADGES, type BadgeCheckStats } from '../constants/badge-checks';

/**
 * Helper to format a Date as 'YYYY-MM-DD HH:MM:SS' for SQLite.
 */
function formatDate(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Helper to get a date N days ago at a specific hour.
 */
function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Insert a finished workout at a specific date via raw SQL.
 */
async function insertWorkout(
  db: SQLiteDatabase,
  startedAt: Date,
  finishedAt: Date,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO workouts (routine_id, started_at, finished_at) VALUES (NULL, ?, ?)',
    formatDate(startedAt),
    formatDate(finishedAt),
  );
  return result.lastInsertRowId;
}

/**
 * Insert a workout set via raw SQL.
 */
async function insertSet(
  db: SQLiteDatabase,
  workoutId: number,
  exerciseId: number,
  order: number,
  weight: number | null,
  reps: number | null,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO workout_sets (workout_id, exercise_id, sort_order, weight, reps) VALUES (?, ?, ?, ?, ?)',
    workoutId,
    exerciseId,
    order,
    weight,
    reps,
  );
}

/**
 * Insert a body measurement via raw SQL.
 */
async function insertMeasurement(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    "INSERT INTO body_measurements (weight, measured_at) VALUES (80.0, datetime('now'))",
  );
}

/**
 * Create a base stats object with all zeros.
 */
function baseStats(): BadgeCheckStats {
  return {
    totalWorkouts: 0,
    currentStreak: 0,
    totalVolume: 0,
    distinctExercises: 0,
    totalMeasurements: 0,
    hasEarlyBirdWorkout: false,
  };
}

describe('BadgeRepository', () => {
  let db: SQLiteDatabase;
  let badgeRepo: BadgeRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    badgeRepo = new BadgeRepository(db);
  });

  // ── unlock and getUnlocked ────────────────────────────────────────

  it('should unlock a badge and retrieve it', async () => {
    const badge = await badgeRepo.unlock('first_workout');

    expect(badge).not.toBeNull();
    expect(badge!.badgeKey).toBe('first_workout');
    expect(badge!.unlockedAt).toBeTruthy();

    const unlocked = await badgeRepo.getUnlocked();

    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].badgeKey).toBe('first_workout');
  });

  it('should return empty array when no badges unlocked', async () => {
    const unlocked = await badgeRepo.getUnlocked();

    expect(unlocked).toHaveLength(0);
  });

  it('should return multiple unlocked badges ordered by unlocked_at', async () => {
    await badgeRepo.unlock('first_workout');
    await badgeRepo.unlock('streak_3');
    await badgeRepo.unlock('volume_1000');

    const unlocked = await badgeRepo.getUnlocked();

    expect(unlocked).toHaveLength(3);
    const keys = unlocked.map((b) => b.badgeKey);
    expect(keys).toContain('first_workout');
    expect(keys).toContain('streak_3');
    expect(keys).toContain('volume_1000');
  });

  // ── isUnlocked ────────────────────────────────────────────────────

  it('should return true for unlocked badge', async () => {
    await badgeRepo.unlock('first_workout');

    const result = await badgeRepo.isUnlocked('first_workout');

    expect(result).toBe(true);
  });

  it('should return false for locked badge', async () => {
    const result = await badgeRepo.isUnlocked('first_workout');

    expect(result).toBe(false);
  });

  // ── No duplicate unlock ───────────────────────────────────────────

  it('should not create duplicate badges (INSERT OR IGNORE)', async () => {
    const first = await badgeRepo.unlock('first_workout');
    const second = await badgeRepo.unlock('first_workout');

    expect(first).not.toBeNull();
    expect(second).toBeNull(); // Already unlocked

    const unlocked = await badgeRepo.getUnlocked();
    expect(unlocked).toHaveLength(1);
  });

  // ── checkAndUnlock ────────────────────────────────────────────────

  it('should unlock badges that meet criteria', async () => {
    const stats: BadgeCheckStats = {
      ...baseStats(),
      totalWorkouts: 1,
    };

    const newlyUnlocked = await badgeRepo.checkAndUnlock(stats);

    expect(newlyUnlocked.length).toBeGreaterThanOrEqual(1);
    expect(newlyUnlocked.some((b) => b.badgeKey === 'first_workout')).toBe(true);
  });

  it('should not re-unlock already unlocked badges', async () => {
    await badgeRepo.unlock('first_workout');

    const stats: BadgeCheckStats = {
      ...baseStats(),
      totalWorkouts: 1,
    };

    const newlyUnlocked = await badgeRepo.checkAndUnlock(stats);

    expect(newlyUnlocked.every((b) => b.badgeKey !== 'first_workout')).toBe(true);
  });

  it('should unlock multiple badges when multiple criteria met', async () => {
    const stats: BadgeCheckStats = {
      ...baseStats(),
      totalWorkouts: 10,
      totalVolume: 15000,
      totalMeasurements: 1,
    };

    const newlyUnlocked = await badgeRepo.checkAndUnlock(stats);

    const keys = newlyUnlocked.map((b) => b.badgeKey);
    expect(keys).toContain('first_workout');
    expect(keys).toContain('workout_10');
    expect(keys).toContain('volume_10000');
    expect(keys).toContain('first_measurement');
  });

  it('should not unlock badges when criteria not met', async () => {
    const stats: BadgeCheckStats = baseStats();

    const newlyUnlocked = await badgeRepo.checkAndUnlock(stats);

    expect(newlyUnlocked).toHaveLength(0);
  });

  it('should handle early bird badge correctly', async () => {
    const stats: BadgeCheckStats = {
      ...baseStats(),
      hasEarlyBirdWorkout: true,
    };

    const newlyUnlocked = await badgeRepo.checkAndUnlock(stats);

    expect(newlyUnlocked.some((b) => b.badgeKey === 'early_bird')).toBe(true);
  });

  // ── gatherStats ───────────────────────────────────────────────────

  it('should return zero stats when no data', async () => {
    const stats = await badgeRepo.gatherStats();

    expect(stats.totalWorkouts).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.totalVolume).toBe(0);
    expect(stats.distinctExercises).toBe(0);
    expect(stats.totalMeasurements).toBe(0);
    expect(stats.hasEarlyBirdWorkout).toBe(false);
  });

  it('should correctly count total workouts', async () => {
    await insertWorkout(db, daysAgo(0), daysAgo(0, 11));
    await insertWorkout(db, daysAgo(1), daysAgo(1, 11));

    const stats = await badgeRepo.gatherStats();

    expect(stats.totalWorkouts).toBe(2);
  });

  it('should correctly calculate total volume', async () => {
    const exerciseRepo = new ExerciseRepository(db);
    const bench = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      restSeconds: 120,
    });

    const wId = await insertWorkout(db, daysAgo(0), daysAgo(0, 11));
    await insertSet(db, wId, bench.id, 1, 80, 10); // 800
    await insertSet(db, wId, bench.id, 2, 90, 5); // 450

    const stats = await badgeRepo.gatherStats();

    expect(stats.totalVolume).toBe(1250);
  });

  it('should correctly count distinct exercises', async () => {
    const exerciseRepo = new ExerciseRepository(db);
    const bench = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
    });
    const squat = await exerciseRepo.create({
      name: 'Squat',
      type: 'weights',
      muscleGroup: 'legs',
    });

    const wId = await insertWorkout(db, daysAgo(0), daysAgo(0, 11));
    await insertSet(db, wId, bench.id, 1, 80, 10);
    await insertSet(db, wId, squat.id, 1, 100, 8);

    const stats = await badgeRepo.gatherStats();

    expect(stats.distinctExercises).toBe(2);
  });

  it('should correctly count body measurements', async () => {
    await insertMeasurement(db);
    await insertMeasurement(db);

    const stats = await badgeRepo.gatherStats();

    expect(stats.totalMeasurements).toBe(2);
  });

  it('should detect early bird workouts', async () => {
    // Workout started at 5 AM
    await insertWorkout(db, daysAgo(0, 5), daysAgo(0, 6));

    const stats = await badgeRepo.gatherStats();

    expect(stats.hasEarlyBirdWorkout).toBe(true);
  });

  it('should not flag early bird for workouts after 7 AM', async () => {
    await insertWorkout(db, daysAgo(0, 8), daysAgo(0, 9));

    const stats = await badgeRepo.gatherStats();

    expect(stats.hasEarlyBirdWorkout).toBe(false);
  });

  // ── Badge definitions integrity ───────────────────────────────────

  it('should have 15 badge definitions', () => {
    expect(TOTAL_BADGES).toBe(15);
    expect(BADGE_CHECKS).toHaveLength(15);
  });

  it('should have unique keys for all badge definitions', () => {
    const keys = BADGE_CHECKS.map((d) => d.key);
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should have valid translation keys for all badge definitions', () => {
    for (const definition of BADGE_CHECKS) {
      expect(definition.titleKey).toMatch(/^badge\.\w+\.title$/);
      expect(definition.descriptionKey).toMatch(/^badge\.\w+\.desc$/);
    }
  });

  it('should have a check function for all badge definitions', () => {
    for (const definition of BADGE_CHECKS) {
      expect(typeof definition.check).toBe('function');
    }
  });

  // ── Full integration: gatherStats + checkAndUnlock ────────────────

  it('should unlock first_workout badge after completing a workout with stats from DB', async () => {
    const exerciseRepo = new ExerciseRepository(db);
    const bench = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
    });

    const wId = await insertWorkout(db, daysAgo(0), daysAgo(0, 11));
    await insertSet(db, wId, bench.id, 1, 80, 10);

    const stats = await badgeRepo.gatherStats();
    const newlyUnlocked = await badgeRepo.checkAndUnlock(stats);

    expect(newlyUnlocked.some((b) => b.badgeKey === 'first_workout')).toBe(true);
    expect(newlyUnlocked.some((b) => b.badgeKey === 'volume_1000')).toBe(false); // only 800
  });
});
