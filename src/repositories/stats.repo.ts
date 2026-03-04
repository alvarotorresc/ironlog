import { type SQLiteDatabase } from 'expo-sqlite';
import type {
  ExercisePR,
  VolumeDataPoint,
  MaxWeightDataPoint,
  MuscleGroupVolume,
  DashboardStats,
  ExerciseStats,
  TimePeriod,
  MuscleGroup,
  FatigueLevel,
  MuscleFatigueData,
} from '../types';

interface PRRow {
  exercise_id: number;
  exercise_name: string;
  max_weight: number;
  date: string;
}

interface CountRow {
  count: number;
}

interface SumRow {
  total: number | null;
}

interface MaxWeightRow {
  max_weight: number | null;
}

interface DateRow {
  date: string | null;
}

interface MaxWeightDataPointRow {
  date: string;
  max_weight: number;
}

interface VolumeDataPointRow {
  date: string;
  volume: number;
}

interface MuscleGroupVolumeRow {
  muscle_group: string;
  total_volume: number;
}

interface AvgVolumeRow {
  avg_volume: number | null;
}

interface WorkoutDateRow {
  workout_date: string;
}

/**
 * Map a TimePeriod to the SQLite date modifier for filtering.
 * Returns null for 'all' (no filter).
 */
function periodToDays(period: TimePeriod): number | null {
  switch (period) {
    case '1w':
      return 7;
    case '1m':
      return 30;
    case '3m':
      return 90;
    case '6m':
      return 180;
    case 'all':
      return null;
  }
}

/** Volume types: only weights and calisthenics contribute to volume. */
const VOLUME_TYPES = "('weights', 'calisthenics')";

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
];

export function getFatigueLevel(daysSince: number | null): FatigueLevel {
  if (daysSince === null) return 'rested';
  if (daysSince <= 1) return 'weakened';
  if (daysSince <= 2) return 'recovering';
  if (daysSince <= 5) return 'recovered';
  return 'rested';
}

export class StatsRepository {
  constructor(private db: SQLiteDatabase) {}

  // ── Dashboard ─────────────────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalWorkouts,
      workoutsThisWeek,
      workoutsThisMonth,
      currentStreak,
      volumeThisWeek,
      volumeThisMonth,
      recentPRs,
    ] = await Promise.all([
      this.getTotalWorkouts(),
      this.getWorkoutsThisWeek(),
      this.getWorkoutsThisMonth(),
      this.getCurrentStreak(),
      this.getVolumeThisWeek(),
      this.getVolumeThisMonth(),
      this.getRecentPRs(),
    ]);

    return {
      totalWorkouts,
      workoutsThisWeek,
      workoutsThisMonth,
      currentStreak,
      volumeThisWeek,
      volumeThisMonth,
      recentPRs,
    };
  }

  async getTotalWorkouts(): Promise<number> {
    const row = await this.db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) as count FROM workouts WHERE finished_at IS NOT NULL',
    );
    return row?.count ?? 0;
  }

  async getWorkoutsThisWeek(): Promise<number> {
    // ISO week: Monday to Sunday. Get the start of the current week (Monday).
    const row = await this.db.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count FROM workouts
       WHERE finished_at IS NOT NULL
         AND date(started_at) >= date('now', 'weekday 0', '-6 days')`,
    );
    return row?.count ?? 0;
  }

  async getWorkoutsThisMonth(): Promise<number> {
    const row = await this.db.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count FROM workouts
       WHERE finished_at IS NOT NULL
         AND strftime('%Y-%m', started_at) = strftime('%Y-%m', 'now')`,
    );
    return row?.count ?? 0;
  }

  async getCurrentStreak(): Promise<number> {
    // Get all distinct workout dates (finished only), ordered descending.
    const rows = await this.db.getAllAsync<WorkoutDateRow>(
      `SELECT DISTINCT date(started_at) as workout_date
       FROM workouts
       WHERE finished_at IS NOT NULL
       ORDER BY workout_date DESC`,
    );

    if (rows.length === 0) return 0;

    // Build reference: start from today, or yesterday if no workout today
    const todayRow = await this.db.getFirstAsync<{ today: string }>("SELECT date('now') as today");
    const today = todayRow!.today;

    let streak = 0;
    let expectedDate = today;

    // If the most recent workout is not today, check if it was yesterday
    if (rows[0].workout_date !== today) {
      // Calculate yesterday
      const yesterdayRow = await this.db.getFirstAsync<{ yesterday: string }>(
        "SELECT date('now', '-1 day') as yesterday",
      );
      const yesterday = yesterdayRow!.yesterday;

      if (rows[0].workout_date !== yesterday) {
        return 0; // Last workout was before yesterday, streak is 0
      }
      expectedDate = yesterday;
    }

    for (const row of rows) {
      if (row.workout_date === expectedDate) {
        streak++;
        // Calculate previous day using SQLite
        const prevRow = await this.db.getFirstAsync<{ prev: string }>(
          "SELECT date(?, '-1 day') as prev",
          expectedDate,
        );
        expectedDate = prevRow!.prev;
      } else {
        break;
      }
    }

    return streak;
  }

  async getVolumeThisWeek(): Promise<number> {
    const row = await this.db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(ws.weight * ws.reps), 0) as total
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE w.finished_at IS NOT NULL
         AND e.type IN ${VOLUME_TYPES}
         AND ws.weight IS NOT NULL
         AND ws.reps IS NOT NULL
         AND date(w.started_at) >= date('now', 'weekday 0', '-6 days')`,
    );
    return row?.total ?? 0;
  }

  async getVolumeThisMonth(): Promise<number> {
    const row = await this.db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(ws.weight * ws.reps), 0) as total
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE w.finished_at IS NOT NULL
         AND e.type IN ${VOLUME_TYPES}
         AND ws.weight IS NOT NULL
         AND ws.reps IS NOT NULL
         AND strftime('%Y-%m', w.started_at) = strftime('%Y-%m', 'now')`,
    );
    return row?.total ?? 0;
  }

  async getRecentPRs(days = 30): Promise<ExercisePR[]> {
    const rows = await this.db.getAllAsync<PRRow>(
      `SELECT
         ws.exercise_id,
         e.name as exercise_name,
         MAX(ws.weight) as max_weight,
         date(w.started_at) as date
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE w.finished_at IS NOT NULL
         AND ws.weight IS NOT NULL
         AND date(w.started_at) >= date('now', ? || ' days')
       GROUP BY ws.exercise_id
       ORDER BY max_weight DESC`,
      `-${days}`,
    );

    return rows.map((row) => ({
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      maxWeight: row.max_weight,
      date: row.date,
    }));
  }

  // ── Exercise-specific ─────────────────────────────────────────────────

  async getExerciseStats(exerciseId: number): Promise<ExerciseStats> {
    const [currentPR, lastWorkoutDate, totalSessions, averageVolume] = await Promise.all([
      this.getExercisePR(exerciseId),
      this.getLastWorkoutDate(exerciseId),
      this.getExerciseSessionCount(exerciseId),
      this.getAverageVolume(exerciseId),
    ]);

    return {
      currentPR,
      lastWorkoutDate,
      totalSessions,
      averageVolume,
    };
  }

  async getExercisePR(exerciseId: number): Promise<number | null> {
    const row = await this.db.getFirstAsync<MaxWeightRow>(
      `SELECT MAX(ws.weight) as max_weight
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       WHERE w.finished_at IS NOT NULL
         AND ws.exercise_id = ?
         AND ws.weight IS NOT NULL`,
      exerciseId,
    );
    return row?.max_weight ?? null;
  }

  async getLastWorkoutDate(exerciseId: number): Promise<string | null> {
    const row = await this.db.getFirstAsync<DateRow>(
      `SELECT date(MAX(w.started_at)) as date
       FROM workouts w
       JOIN workout_sets ws ON ws.workout_id = w.id
       WHERE w.finished_at IS NOT NULL
         AND ws.exercise_id = ?`,
      exerciseId,
    );
    return row?.date ?? null;
  }

  async getExerciseSessionCount(exerciseId: number): Promise<number> {
    const row = await this.db.getFirstAsync<CountRow>(
      `SELECT COUNT(DISTINCT w.id) as count
       FROM workouts w
       JOIN workout_sets ws ON ws.workout_id = w.id
       WHERE w.finished_at IS NOT NULL
         AND ws.exercise_id = ?`,
      exerciseId,
    );
    return row?.count ?? 0;
  }

  // ── Progress charts ───────────────────────────────────────────────────

  async getMaxWeightOverTime(
    exerciseId: number,
    period: TimePeriod,
  ): Promise<MaxWeightDataPoint[]> {
    const days = periodToDays(period);
    const dateFilter =
      days !== null ? `AND date(w.started_at) >= date('now', '-${days} days')` : '';

    const rows = await this.db.getAllAsync<MaxWeightDataPointRow>(
      `SELECT
         date(w.started_at) as date,
         MAX(ws.weight) as max_weight
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       WHERE w.finished_at IS NOT NULL
         AND ws.exercise_id = ?
         AND ws.weight IS NOT NULL
         ${dateFilter}
       GROUP BY date(w.started_at)
       ORDER BY date ASC`,
      exerciseId,
    );

    return rows.map((row) => ({
      date: row.date,
      maxWeight: row.max_weight,
    }));
  }

  async getVolumeOverTime(exerciseId: number, period: TimePeriod): Promise<VolumeDataPoint[]> {
    const days = periodToDays(period);
    const dateFilter =
      days !== null ? `AND date(w.started_at) >= date('now', '-${days} days')` : '';

    const rows = await this.db.getAllAsync<VolumeDataPointRow>(
      `SELECT
         date(w.started_at) as date,
         COALESCE(SUM(ws.weight * ws.reps), 0) as volume
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       WHERE w.finished_at IS NOT NULL
         AND ws.exercise_id = ?
         AND ws.weight IS NOT NULL
         AND ws.reps IS NOT NULL
         ${dateFilter}
       GROUP BY date(w.started_at)
       ORDER BY date ASC`,
      exerciseId,
    );

    return rows.map((row) => ({
      date: row.date,
      volume: row.volume,
    }));
  }

  // ── Muscle group distribution ─────────────────────────────────────────

  async getMuscleGroupDistribution(period: TimePeriod): Promise<MuscleGroupVolume[]> {
    const days = periodToDays(period);
    const dateFilter =
      days !== null ? `AND date(w.started_at) >= date('now', '-${days} days')` : '';

    const rows = await this.db.getAllAsync<MuscleGroupVolumeRow>(
      `SELECT
         emg.muscle_group,
         COALESCE(SUM(ws.weight * ws.reps), 0) as total_volume
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       JOIN exercises e ON e.id = ws.exercise_id
       JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
       WHERE w.finished_at IS NOT NULL
         AND e.type IN ${VOLUME_TYPES}
         AND ws.weight IS NOT NULL
         AND ws.reps IS NOT NULL
         ${dateFilter}
       GROUP BY emg.muscle_group
       ORDER BY total_volume DESC`,
    );

    return rows.map((row) => ({
      muscleGroup: row.muscle_group as MuscleGroup,
      totalVolume: row.total_volume,
    }));
  }

  // ── Muscle fatigue ───────────────────────────────────────────────────

  async getMuscleFatigueData(): Promise<MuscleFatigueData[]> {
    interface FatigueRow {
      muscle_group: string;
      last_workout: string | null;
    }

    const rows = await this.db.getAllAsync<FatigueRow>(
      `SELECT
         emg.muscle_group,
         MAX(date(w.started_at)) as last_workout
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       JOIN exercises e ON e.id = ws.exercise_id
       JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
       WHERE w.finished_at IS NOT NULL
       GROUP BY emg.muscle_group`,
    );

    const rowMap = new Map(rows.map((r) => [r.muscle_group, r.last_workout]));

    const todayRow = await this.db.getFirstAsync<{ today: string }>("SELECT date('now') as today");
    const today = todayRow!.today;

    return ALL_MUSCLE_GROUPS.map((group) => {
      const lastWorkout = rowMap.get(group) ?? null;
      let daysSince: number | null = null;

      if (lastWorkout) {
        const lastDate = new Date(lastWorkout);
        const todayDate = new Date(today);
        daysSince = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        muscleGroup: group,
        level: getFatigueLevel(daysSince),
        daysSince,
      };
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private async getAverageVolume(exerciseId: number): Promise<number> {
    const row = await this.db.getFirstAsync<AvgVolumeRow>(
      `SELECT AVG(session_volume) as avg_volume FROM (
         SELECT SUM(ws.weight * ws.reps) as session_volume
         FROM workout_sets ws
         JOIN workouts w ON w.id = ws.workout_id
         WHERE w.finished_at IS NOT NULL
           AND ws.exercise_id = ?
           AND ws.weight IS NOT NULL
           AND ws.reps IS NOT NULL
         GROUP BY w.id
       )`,
      exerciseId,
    );
    return row?.avg_volume ?? 0;
  }
}
