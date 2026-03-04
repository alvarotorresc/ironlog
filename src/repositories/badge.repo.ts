import { type SQLiteDatabase } from 'expo-sqlite';
import type { Badge } from '../types';
import { BADGE_CHECKS, type BadgeCheckStats } from '../constants/badge-checks';

interface BadgeRow {
  id: number;
  badge_key: string;
  unlocked_at: string;
}

interface CountRow {
  count: number;
}

interface SumRow {
  total: number | null;
}

function rowToBadge(row: BadgeRow): Badge {
  return {
    id: row.id,
    badgeKey: row.badge_key,
    unlockedAt: row.unlocked_at,
  };
}

export class BadgeRepository {
  constructor(private db: SQLiteDatabase) {}

  async getUnlocked(): Promise<Badge[]> {
    const rows = await this.db.getAllAsync<BadgeRow>(
      'SELECT * FROM badges ORDER BY unlocked_at ASC',
    );
    return rows.map(rowToBadge);
  }

  async isUnlocked(badgeKey: string): Promise<boolean> {
    const row = await this.db.getFirstAsync<BadgeRow>(
      'SELECT * FROM badges WHERE badge_key = ?',
      badgeKey,
    );
    return row !== null;
  }

  async unlock(badgeKey: string): Promise<Badge | null> {
    try {
      const result = await this.db.runAsync(
        "INSERT OR IGNORE INTO badges (badge_key, unlocked_at) VALUES (?, datetime('now'))",
        badgeKey,
      );

      if (result.changes === 0) {
        return null; // Already unlocked
      }

      const row = await this.db.getFirstAsync<BadgeRow>(
        'SELECT * FROM badges WHERE id = ?',
        result.lastInsertRowId,
      );
      return row ? rowToBadge(row) : null;
    } catch {
      return null;
    }
  }

  /**
   * Gather all stats needed for badge evaluation.
   */
  async gatherStats(): Promise<BadgeCheckStats> {
    const [
      totalWorkouts,
      currentStreak,
      totalVolume,
      distinctExercises,
      totalMeasurements,
      hasEarlyBirdWorkout,
    ] = await Promise.all([
      this.getTotalWorkouts(),
      this.getCurrentStreak(),
      this.getTotalVolume(),
      this.getDistinctExercises(),
      this.getTotalMeasurements(),
      this.getHasEarlyBirdWorkout(),
    ]);

    return {
      totalWorkouts,
      currentStreak,
      totalVolume,
      distinctExercises,
      totalMeasurements,
      hasEarlyBirdWorkout,
    };
  }

  /**
   * Evaluate all badge definitions against current stats.
   * Returns the list of newly unlocked badges.
   */
  async checkAndUnlock(stats: BadgeCheckStats): Promise<Badge[]> {
    const unlocked = await this.getUnlocked();
    const unlockedKeys = new Set(unlocked.map((b) => b.badgeKey));

    const newlyUnlocked: Badge[] = [];

    for (const definition of BADGE_CHECKS) {
      if (unlockedKeys.has(definition.key)) continue;

      if (definition.check(stats)) {
        const badge = await this.unlock(definition.key);
        if (badge) {
          newlyUnlocked.push(badge);
        }
      }
    }

    return newlyUnlocked;
  }

  // ── Private stat queries ────────────────────────────────────────────

  private async getTotalWorkouts(): Promise<number> {
    const row = await this.db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) as count FROM workouts WHERE finished_at IS NOT NULL',
    );
    return row?.count ?? 0;
  }

  private async getCurrentStreak(): Promise<number> {
    const rows = await this.db.getAllAsync<{ workout_date: string }>(
      `SELECT DISTINCT date(started_at) as workout_date
       FROM workouts
       WHERE finished_at IS NOT NULL
       ORDER BY workout_date DESC`,
    );

    if (rows.length === 0) return 0;

    const todayRow = await this.db.getFirstAsync<{ today: string }>("SELECT date('now') as today");
    const today = todayRow!.today;

    let streak = 0;
    let expectedDate = today;

    if (rows[0].workout_date !== today) {
      const yesterdayRow = await this.db.getFirstAsync<{ yesterday: string }>(
        "SELECT date('now', '-1 day') as yesterday",
      );
      const yesterday = yesterdayRow!.yesterday;

      if (rows[0].workout_date !== yesterday) {
        return 0;
      }
      expectedDate = yesterday;
    }

    for (const row of rows) {
      if (row.workout_date === expectedDate) {
        streak++;
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

  private async getTotalVolume(): Promise<number> {
    const row = await this.db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(ws.weight * ws.reps), 0) as total
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE w.finished_at IS NOT NULL
         AND e.type IN ('weights', 'calisthenics')
         AND ws.weight IS NOT NULL
         AND ws.reps IS NOT NULL`,
    );
    return row?.total ?? 0;
  }

  private async getDistinctExercises(): Promise<number> {
    const row = await this.db.getFirstAsync<CountRow>(
      `SELECT COUNT(DISTINCT ws.exercise_id) as count
       FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       WHERE w.finished_at IS NOT NULL`,
    );
    return row?.count ?? 0;
  }

  private async getTotalMeasurements(): Promise<number> {
    const row = await this.db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) as count FROM body_measurements',
    );
    return row?.count ?? 0;
  }

  private async getHasEarlyBirdWorkout(): Promise<boolean> {
    const row = await this.db.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count FROM workouts
       WHERE finished_at IS NOT NULL
         AND CAST(strftime('%H', started_at) AS INTEGER) < 7`,
    );
    return (row?.count ?? 0) > 0;
  }
}
