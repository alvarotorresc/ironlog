import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { StatsRepository, getFatigueLevel } from './stats.repo';
import { ExerciseRepository } from './exercise.repo';
import { RoutineRepository } from './routine.repo';

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
 * Helper to get just the date portion 'YYYY-MM-DD'.
 */
function dateOnly(d: Date): string {
  return formatDate(d).split(' ')[0];
}

/**
 * Insert a finished workout at a specific date via raw SQL.
 * Returns the workout ID.
 */
async function insertWorkout(
  db: SQLiteDatabase,
  routineId: number | null,
  startedAt: Date,
  finishedAt: Date,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO workouts (routine_id, started_at, finished_at) VALUES (?, ?, ?)',
    routineId,
    formatDate(startedAt),
    formatDate(finishedAt),
  );
  return result.lastInsertRowId;
}

/**
 * Insert an unfinished (in-progress) workout.
 */
async function insertUnfinishedWorkout(
  db: SQLiteDatabase,
  routineId: number | null,
  startedAt: Date,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO workouts (routine_id, started_at, finished_at) VALUES (?, ?, NULL)',
    routineId,
    formatDate(startedAt),
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

describe('StatsRepository', () => {
  let db: SQLiteDatabase;
  let statsRepo: StatsRepository;
  let exerciseRepo: ExerciseRepository;
  let routineRepo: RoutineRepository;

  // Exercise IDs
  let benchId: number;
  let squatId: number;
  let runningId: number;

  // Routine ID
  let routineId: number;

  beforeEach(async () => {
    db = await createTestDatabase();
    statsRepo = new StatsRepository(db);
    exerciseRepo = new ExerciseRepository(db);
    routineRepo = new RoutineRepository(db);

    // Create exercises: 2 weights, 1 cardio
    const bench = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      restSeconds: 120,
    });
    benchId = bench.id;

    const squat = await exerciseRepo.create({
      name: 'Squat',
      type: 'weights',
      muscleGroup: 'legs',
      restSeconds: 180,
    });
    squatId = squat.id;

    const running = await exerciseRepo.create({
      name: 'Running',
      type: 'cardio',
      muscleGroup: 'full_body',
    });
    runningId = running.id;

    // Create routine
    const routine = await routineRepo.create('Push Day');
    routineId = routine.id;
  });

  // ── Dashboard: getTotalWorkouts ───────────────────────────────────────

  it('should count only finished workouts for getTotalWorkouts', async () => {
    await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));
    await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));
    await insertUnfinishedWorkout(db, routineId, daysAgo(0));

    const total = await statsRepo.getTotalWorkouts();

    expect(total).toBe(2);
  });

  // ── Dashboard: getWorkoutsThisWeek ────────────────────────────────────

  it('should count only workouts from this week (Mon-Sun)', async () => {
    // Insert a workout today (should count)
    await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));

    // Insert a workout 14 days ago (should NOT count)
    await insertWorkout(db, routineId, daysAgo(14), daysAgo(14, 11));

    const count = await statsRepo.getWorkoutsThisWeek();

    expect(count).toBeGreaterThanOrEqual(1);
    // The exact count depends on what day of the week it is, but
    // the 14-days-ago one should never be counted
    expect(count).toBeLessThanOrEqual(1);
  });

  // ── Dashboard: getWorkoutsThisMonth ───────────────────────────────────

  it('should count only workouts from this month', async () => {
    await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    // Insert workout from 60 days ago (should NOT count)
    await insertWorkout(db, routineId, daysAgo(60), daysAgo(60, 11));

    const count = await statsRepo.getWorkoutsThisMonth();

    // Today + yesterday should be in this month; 60 days ago is not
    expect(count).toBe(2);
  });

  // ── Dashboard: getCurrentStreak ───────────────────────────────────────

  it('should return consecutive days streak', async () => {
    // Workouts today, yesterday, and 2 days ago = streak of 3
    await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));
    await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    const streak = await statsRepo.getCurrentStreak();

    expect(streak).toBe(3);
  });

  it('should return 0 when there are no workouts', async () => {
    const streak = await statsRepo.getCurrentStreak();

    expect(streak).toBe(0);
  });

  it('should break streak on gap days', async () => {
    // Workouts today and yesterday, then gap, then 4 days ago
    await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));
    // Gap on day 2 and 3
    await insertWorkout(db, routineId, daysAgo(4), daysAgo(4, 11));

    const streak = await statsRepo.getCurrentStreak();

    expect(streak).toBe(2);
  });

  it('should start streak from yesterday if no workout today', async () => {
    // No workout today, but yesterday and 2 days ago
    await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));
    await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    const streak = await statsRepo.getCurrentStreak();

    expect(streak).toBe(2);
  });

  // ── Dashboard: getVolumeThisWeek ──────────────────────────────────────

  it('should calculate volume as SUM(weight*reps) only for weights/calisthenics this week', async () => {
    const workoutId = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));

    // Bench: 80kg x 10 = 800, 90kg x 8 = 720 => total 1520
    await insertSet(db, workoutId, benchId, 1, 80, 10);
    await insertSet(db, workoutId, benchId, 2, 90, 8);

    // Running set (cardio) should NOT count
    await insertSet(db, workoutId, runningId, 1, null, null);

    const volume = await statsRepo.getVolumeThisWeek();

    expect(volume).toBe(1520);
  });

  // ── Dashboard: getVolumeThisMonth ─────────────────────────────────────

  it('should calculate volume for the entire month', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    await insertSet(db, w1Id, benchId, 1, 80, 10); // 800
    await insertSet(db, w2Id, squatId, 1, 100, 5); // 500

    const volume = await statsRepo.getVolumeThisMonth();

    expect(volume).toBe(1300);
  });

  // ── Dashboard: getRecentPRs ───────────────────────────────────────────

  it('should return max weight per exercise in last 30 days', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(5), daysAgo(5, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    // Bench: 80 and 100 -> PR is 100
    await insertSet(db, w1Id, benchId, 1, 80, 10);
    await insertSet(db, w2Id, benchId, 1, 100, 5);

    // Squat: 120 -> PR is 120
    await insertSet(db, w1Id, squatId, 1, 120, 8);

    const prs = await statsRepo.getRecentPRs();

    expect(prs).toHaveLength(2);

    const benchPR = prs.find((pr) => pr.exerciseId === benchId);
    const squatPR = prs.find((pr) => pr.exerciseId === squatId);

    expect(benchPR).toBeDefined();
    expect(benchPR!.maxWeight).toBe(100);
    expect(benchPR!.exerciseName).toBe('Bench Press');

    expect(squatPR).toBeDefined();
    expect(squatPR!.maxWeight).toBe(120);
  });

  it('should not include PRs older than the specified days', async () => {
    const wOldId = await insertWorkout(db, routineId, daysAgo(40), daysAgo(40, 11));
    const wRecentId = await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    await insertSet(db, wOldId, benchId, 1, 200, 1); // Old, should not show
    await insertSet(db, wRecentId, squatId, 1, 100, 5); // Recent

    const prs = await statsRepo.getRecentPRs(30);

    // Only squat should appear (bench PR is >30 days old)
    expect(prs).toHaveLength(1);
    expect(prs[0].exerciseId).toBe(squatId);
  });

  // ── Exercise-specific: getExercisePR ──────────────────────────────────

  it('should return max weight for a specific exercise', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(5), daysAgo(5, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    await insertSet(db, w1Id, benchId, 1, 80, 10);
    await insertSet(db, w2Id, benchId, 1, 100, 5);
    await insertSet(db, w2Id, benchId, 2, 95, 8);

    const pr = await statsRepo.getExercisePR(benchId);

    expect(pr).toBe(100);
  });

  it('should return null for exercise with no sets', async () => {
    const pr = await statsRepo.getExercisePR(benchId);

    expect(pr).toBeNull();
  });

  // ── Exercise-specific: getLastWorkoutDate ─────────────────────────────

  it('should return the last workout date for an exercise', async () => {
    const recentDate = daysAgo(1);
    const olderDate = daysAgo(5);

    const w1Id = await insertWorkout(db, routineId, olderDate, daysAgo(5, 11));
    const w2Id = await insertWorkout(db, routineId, recentDate, daysAgo(1, 11));

    await insertSet(db, w1Id, benchId, 1, 80, 10);
    await insertSet(db, w2Id, benchId, 1, 100, 5);

    const lastDate = await statsRepo.getLastWorkoutDate(benchId);

    expect(lastDate).toBe(dateOnly(recentDate));
  });

  it('should return null when exercise has no workouts', async () => {
    const lastDate = await statsRepo.getLastWorkoutDate(benchId);

    expect(lastDate).toBeNull();
  });

  // ── Exercise-specific: getExerciseSessionCount ────────────────────────

  it('should count distinct finished workouts containing the exercise', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(5), daysAgo(5, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));
    const w3Id = await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    // Bench in w1 and w2, not in w3
    await insertSet(db, w1Id, benchId, 1, 80, 10);
    await insertSet(db, w2Id, benchId, 1, 90, 8);
    await insertSet(db, w3Id, squatId, 1, 100, 5);

    // Also add an unfinished workout with bench (should NOT count)
    const w4Id = await insertUnfinishedWorkout(db, routineId, daysAgo(0));
    await insertSet(db, w4Id, benchId, 1, 70, 12);

    const count = await statsRepo.getExerciseSessionCount(benchId);

    expect(count).toBe(2);
  });

  // ── Exercise-specific: getExerciseStats ───────────────────────────────

  it('should return aggregated exercise stats', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(5), daysAgo(5, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    // w1: bench 80x10=800, 85x8=680 => session volume 1480
    await insertSet(db, w1Id, benchId, 1, 80, 10);
    await insertSet(db, w1Id, benchId, 2, 85, 8);

    // w2: bench 100x5=500, 90x8=720 => session volume 1220
    await insertSet(db, w2Id, benchId, 1, 100, 5);
    await insertSet(db, w2Id, benchId, 2, 90, 8);

    const stats = await statsRepo.getExerciseStats(benchId);

    expect(stats.currentPR).toBe(100);
    expect(stats.totalSessions).toBe(2);
    expect(stats.lastWorkoutDate).toBe(dateOnly(daysAgo(1)));
    // Average volume: (1480 + 1220) / 2 = 1350
    expect(stats.averageVolume).toBe(1350);
  });

  it('should return empty exercise stats when no data', async () => {
    const stats = await statsRepo.getExerciseStats(benchId);

    expect(stats.currentPR).toBeNull();
    expect(stats.totalSessions).toBe(0);
    expect(stats.lastWorkoutDate).toBeNull();
    expect(stats.averageVolume).toBe(0);
  });

  // ── Progress charts: getMaxWeightOverTime ─────────────────────────────

  it('should return max weight data points per workout date', async () => {
    const date1 = daysAgo(10);
    const date2 = daysAgo(5);
    const date3 = daysAgo(1);

    const w1Id = await insertWorkout(db, routineId, date1, daysAgo(10, 11));
    const w2Id = await insertWorkout(db, routineId, date2, daysAgo(5, 11));
    const w3Id = await insertWorkout(db, routineId, date3, daysAgo(1, 11));

    await insertSet(db, w1Id, benchId, 1, 70, 10);
    await insertSet(db, w2Id, benchId, 1, 80, 8);
    await insertSet(db, w2Id, benchId, 2, 85, 6);
    await insertSet(db, w3Id, benchId, 1, 90, 5);

    const dataPoints = await statsRepo.getMaxWeightOverTime(benchId, 'all');

    expect(dataPoints).toHaveLength(3);
    expect(dataPoints[0].date).toBe(dateOnly(date1));
    expect(dataPoints[0].maxWeight).toBe(70);
    expect(dataPoints[1].date).toBe(dateOnly(date2));
    expect(dataPoints[1].maxWeight).toBe(85);
    expect(dataPoints[2].date).toBe(dateOnly(date3));
    expect(dataPoints[2].maxWeight).toBe(90);
  });

  it('should filter getMaxWeightOverTime by time period', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(60), daysAgo(60, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    await insertSet(db, w1Id, benchId, 1, 70, 10);
    await insertSet(db, w2Id, benchId, 1, 90, 5);

    const dataPoints = await statsRepo.getMaxWeightOverTime(benchId, '1m');

    // Only the workout from 2 days ago (within 30 days)
    expect(dataPoints).toHaveLength(1);
    expect(dataPoints[0].maxWeight).toBe(90);
  });

  // ── Progress charts: getVolumeOverTime ────────────────────────────────

  it('should return volume data points per workout date', async () => {
    const date1 = daysAgo(5);
    const date2 = daysAgo(1);

    const w1Id = await insertWorkout(db, routineId, date1, daysAgo(5, 11));
    const w2Id = await insertWorkout(db, routineId, date2, daysAgo(1, 11));

    // w1: bench 80x10=800, 85x8=680 => 1480
    await insertSet(db, w1Id, benchId, 1, 80, 10);
    await insertSet(db, w1Id, benchId, 2, 85, 8);

    // w2: bench 100x5=500 => 500
    await insertSet(db, w2Id, benchId, 1, 100, 5);

    const dataPoints = await statsRepo.getVolumeOverTime(benchId, 'all');

    expect(dataPoints).toHaveLength(2);
    expect(dataPoints[0].date).toBe(dateOnly(date1));
    expect(dataPoints[0].volume).toBe(1480);
    expect(dataPoints[1].date).toBe(dateOnly(date2));
    expect(dataPoints[1].volume).toBe(500);
  });

  // ── Muscle group distribution ─────────────────────────────────────────

  it('should return total volume per muscle group', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    // Bench (chest): 80x10=800
    await insertSet(db, w1Id, benchId, 1, 80, 10);

    // Squat (legs): 100x8=800, 120x5=600 => 1400
    await insertSet(db, w1Id, squatId, 1, 100, 8);
    await insertSet(db, w1Id, squatId, 2, 120, 5);

    // Running (cardio, full_body) -> excluded from volume
    await insertSet(db, w1Id, runningId, 1, null, null);

    const distribution = await statsRepo.getMuscleGroupDistribution('all');

    expect(distribution).toHaveLength(2);

    const chest = distribution.find((d) => d.muscleGroup === 'chest');
    const legs = distribution.find((d) => d.muscleGroup === 'legs');

    expect(chest).toBeDefined();
    expect(chest!.totalVolume).toBe(800);

    expect(legs).toBeDefined();
    expect(legs!.totalVolume).toBe(1400);
  });

  it('should filter getMuscleGroupDistribution by time period', async () => {
    const wOldId = await insertWorkout(db, routineId, daysAgo(60), daysAgo(60, 11));
    const wRecentId = await insertWorkout(db, routineId, daysAgo(2), daysAgo(2, 11));

    // Old workout: bench 100x10=1000
    await insertSet(db, wOldId, benchId, 1, 100, 10);

    // Recent workout: squat 80x10=800
    await insertSet(db, wRecentId, squatId, 1, 80, 10);

    const distribution = await statsRepo.getMuscleGroupDistribution('1m');

    // Only the recent squat (legs) should appear
    expect(distribution).toHaveLength(1);
    expect(distribution[0].muscleGroup).toBe('legs');
    expect(distribution[0].totalVolume).toBe(800);
  });

  // ── Dashboard: getDashboardStats (aggregated) ─────────────────────────

  it('should return all dashboard stats aggregated', async () => {
    const w1Id = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    const w2Id = await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    await insertSet(db, w1Id, benchId, 1, 80, 10); // 800
    await insertSet(db, w2Id, benchId, 1, 100, 5); // 500

    const stats = await statsRepo.getDashboardStats();

    expect(stats.totalWorkouts).toBe(2);
    expect(stats.currentStreak).toBeGreaterThanOrEqual(1);
    expect(stats.currentStreak).toBeLessThanOrEqual(2);
    expect(stats.recentPRs).toHaveLength(1);
    expect(stats.recentPRs[0].exerciseName).toBe('Bench Press');
    expect(stats.volumeThisMonth).toBe(1300);
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  it('should not count unfinished workouts in any stat', async () => {
    const wFinished = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    const wUnfinished = await insertUnfinishedWorkout(db, routineId, daysAgo(0));

    await insertSet(db, wFinished, benchId, 1, 80, 10);
    await insertSet(db, wUnfinished, benchId, 1, 200, 1);

    const total = await statsRepo.getTotalWorkouts();
    const pr = await statsRepo.getExercisePR(benchId);

    expect(total).toBe(1);
    expect(pr).toBe(80); // Not 200 from unfinished workout
  });

  it('should handle calisthenics exercises in volume calculation', async () => {
    const pullUp = await exerciseRepo.create({
      name: 'Pull Up',
      type: 'calisthenics',
      muscleGroup: 'back',
    });

    const wId = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));

    // Calisthenics with weight (weighted pull-ups): 20x10=200
    await insertSet(db, wId, pullUp.id, 1, 20, 10);

    const volume = await statsRepo.getVolumeThisWeek();

    expect(volume).toBe(200);
  });

  it('should handle multiple workouts on the same day for streak', async () => {
    // Two workouts today
    await insertWorkout(db, routineId, daysAgo(0, 8), daysAgo(0, 9));
    await insertWorkout(db, routineId, daysAgo(0, 14), daysAgo(0, 15));

    // One workout yesterday
    await insertWorkout(db, routineId, daysAgo(1), daysAgo(1, 11));

    const streak = await statsRepo.getCurrentStreak();

    // Should be 2 (today + yesterday), not 3
    expect(streak).toBe(2);
  });

  // ── getFatigueLevel (pure function) ──────────────────────────────────

  it('should return weakened for 0 days since last workout', () => {
    expect(getFatigueLevel(0)).toBe('weakened');
  });

  it('should return weakened for 1 day since last workout', () => {
    expect(getFatigueLevel(1)).toBe('weakened');
  });

  it('should return recovering for 2 days since last workout', () => {
    expect(getFatigueLevel(2)).toBe('recovering');
  });

  it('should return recovered for 3 days since last workout', () => {
    expect(getFatigueLevel(3)).toBe('recovered');
  });

  it('should return recovered for 5 days since last workout', () => {
    expect(getFatigueLevel(5)).toBe('recovered');
  });

  it('should return rested for 6+ days since last workout', () => {
    expect(getFatigueLevel(6)).toBe('rested');
    expect(getFatigueLevel(30)).toBe('rested');
  });

  it('should return rested for null (never worked)', () => {
    expect(getFatigueLevel(null)).toBe('rested');
  });

  // ── getMuscleFatigueData ─────────────────────────────────────────────

  it('should return all muscle groups with rested status when no workouts', async () => {
    const data = await statsRepo.getMuscleFatigueData();

    expect(data).toHaveLength(7);
    expect(data.every((d) => d.level === 'rested')).toBe(true);
    expect(data.every((d) => d.daysSince === null)).toBe(true);
  });

  it('should return weakened for recently worked muscle group', async () => {
    const wId = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    await insertSet(db, wId, benchId, 1, 80, 10);

    const data = await statsRepo.getMuscleFatigueData();

    const chest = data.find((d) => d.muscleGroup === 'chest');
    expect(chest).toBeDefined();
    expect(chest!.level).toBe('weakened');
    // daysSince can be 0 or -1 depending on UTC vs local timezone
    expect(chest!.daysSince).toBeLessThanOrEqual(1);
  });

  it('should return correct fatigue levels for different muscle groups', async () => {
    // Chest: worked today (weakened)
    const w1Id = await insertWorkout(db, routineId, daysAgo(0), daysAgo(0, 11));
    await insertSet(db, w1Id, benchId, 1, 80, 10);

    // Legs: worked 4 days ago (recovered, even with timezone offset)
    const w2Id = await insertWorkout(db, routineId, daysAgo(4), daysAgo(4, 11));
    await insertSet(db, w2Id, squatId, 1, 100, 8);

    const data = await statsRepo.getMuscleFatigueData();

    const chest = data.find((d) => d.muscleGroup === 'chest');
    const legs = data.find((d) => d.muscleGroup === 'legs');
    const back = data.find((d) => d.muscleGroup === 'back');

    expect(chest!.level).toBe('weakened');
    expect(legs!.level).toBe('recovered');
    expect(back!.level).toBe('rested');
  });

  it('should not count unfinished workouts in fatigue data', async () => {
    const wUnfinished = await insertUnfinishedWorkout(db, routineId, daysAgo(0));
    await insertSet(db, wUnfinished, benchId, 1, 80, 10);

    const data = await statsRepo.getMuscleFatigueData();

    const chest = data.find((d) => d.muscleGroup === 'chest');
    expect(chest!.level).toBe('rested');
    expect(chest!.daysSince).toBeNull();
  });
});
