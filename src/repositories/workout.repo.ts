import { type SQLiteDatabase } from 'expo-sqlite';
import type { Workout, WorkoutSet, Exercise, WorkoutHistoryItem, GroupType } from '../types';

interface WorkoutRow {
  id: number;
  routine_id: number | null;
  started_at: string;
  finished_at: string | null;
}

interface WorkoutSetRow {
  id: number;
  workout_id: number;
  exercise_id: number;
  sort_order: number;
  weight: number | null;
  reps: number | null;
  duration: number | null;
  distance: number | null;
  group_id: number | null;
  group_type: string | null;
  notes: string | null;
}

interface WorkoutHistoryRow extends WorkoutRow {
  routine_name: string | null;
  exercise_count: number;
}

interface WorkoutSetJoinRow extends WorkoutSetRow {
  e_id: number;
  e_name: string;
  e_type: string;
  e_muscle_group: string;
  e_is_predefined: number;
  e_illustration: string | null;
  e_rest_seconds: number;
  e_notes: string | null;
  e_created_at: string;
}

interface AddSetData {
  workoutId: number;
  exerciseId: number;
  order: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
  notes?: string | null;
}

interface UpdateSetData {
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
  notes?: string | null;
}

export interface WorkoutExerciseGroup {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutDetail extends Workout {
  routineName: string | null;
  exercises: WorkoutExerciseGroup[];
}

function rowToWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    routineId: row.routine_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

function rowToSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    order: row.sort_order,
    weight: row.weight,
    reps: row.reps,
    duration: row.duration,
    distance: row.distance,
    groupId: row.group_id,
    groupType: row.group_type as GroupType | null,
    notes: row.notes,
  };
}

export class WorkoutRepository {
  constructor(private db: SQLiteDatabase) {}

  async start(routineId?: number): Promise<Workout> {
    const result = await this.db.runAsync(
      'INSERT INTO workouts (routine_id) VALUES (?)',
      routineId ?? null,
    );

    const row = await this.db.getFirstAsync<WorkoutRow>(
      'SELECT * FROM workouts WHERE id = ?',
      result.lastInsertRowId,
    );

    return rowToWorkout(row!);
  }

  async finish(workoutId: number): Promise<void> {
    await this.db.runAsync(
      "UPDATE workouts SET finished_at = datetime('now') WHERE id = ?",
      workoutId,
    );
  }

  async addSet(data: AddSetData): Promise<WorkoutSet> {
    const result = await this.db.runAsync(
      `INSERT INTO workout_sets (workout_id, exercise_id, sort_order, weight, reps, duration, distance, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.workoutId,
      data.exerciseId,
      data.order,
      data.weight ?? null,
      data.reps ?? null,
      data.duration ?? null,
      data.distance ?? null,
      data.notes ?? null,
    );

    const row = await this.db.getFirstAsync<WorkoutSetRow>(
      'SELECT * FROM workout_sets WHERE id = ?',
      result.lastInsertRowId,
    );

    return rowToSet(row!);
  }

  async updateSet(setId: number, data: UpdateSetData): Promise<void> {
    const fields: string[] = [];
    const values: (number | string | null)[] = [];

    if (data.weight !== undefined) {
      fields.push('weight = ?');
      values.push(data.weight ?? null);
    }
    if (data.reps !== undefined) {
      fields.push('reps = ?');
      values.push(data.reps ?? null);
    }
    if (data.duration !== undefined) {
      fields.push('duration = ?');
      values.push(data.duration ?? null);
    }
    if (data.distance !== undefined) {
      fields.push('distance = ?');
      values.push(data.distance ?? null);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes ?? null);
    }

    if (fields.length === 0) return;

    values.push(setId);
    await this.db.runAsync(`UPDATE workout_sets SET ${fields.join(', ')} WHERE id = ?`, ...values);
  }

  async getSetsForWorkout(workoutId: number): Promise<WorkoutSet[]> {
    const rows = await this.db.getAllAsync<WorkoutSetRow>(
      'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY exercise_id, sort_order',
      workoutId,
    );

    return rows.map(rowToSet);
  }

  async getLastSetForExercise(workoutId: number, exerciseId: number): Promise<WorkoutSet | null> {
    const row = await this.db.getFirstAsync<WorkoutSetRow>(
      'SELECT * FROM workout_sets WHERE workout_id = ? AND exercise_id = ? ORDER BY sort_order DESC LIMIT 1',
      workoutId,
      exerciseId,
    );

    return row ? rowToSet(row) : null;
  }

  async getLastSetFromPreviousWorkout(exerciseId: number): Promise<WorkoutSet | null> {
    const row = await this.db.getFirstAsync<WorkoutSetRow>(
      `SELECT ws.* FROM workout_sets ws
       JOIN workouts w ON w.id = ws.workout_id
       WHERE ws.exercise_id = ? AND w.finished_at IS NOT NULL
       ORDER BY w.finished_at DESC, ws.sort_order DESC LIMIT 1`,
      exerciseId,
    );

    return row ? rowToSet(row) : null;
  }

  async deleteSet(setId: number): Promise<void> {
    await this.db.runAsync('DELETE FROM workout_sets WHERE id = ?', setId);
  }

  async getHistory(limit = 50, offset = 0): Promise<Workout[]> {
    const rows = await this.db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workouts ORDER BY started_at DESC LIMIT ? OFFSET ?',
      limit,
      offset,
    );

    return rows.map(rowToWorkout);
  }

  async getHistoryWithRoutineNames(limit = 50, offset = 0): Promise<WorkoutHistoryItem[]> {
    const rows = await this.db.getAllAsync<WorkoutHistoryRow>(
      `SELECT w.*, r.name as routine_name,
        (SELECT COUNT(DISTINCT ws.exercise_id) FROM workout_sets ws WHERE ws.workout_id = w.id) as exercise_count
      FROM workouts w
      LEFT JOIN routines r ON r.id = w.routine_id
      WHERE w.finished_at IS NOT NULL
      ORDER BY w.started_at DESC
      LIMIT ? OFFSET ?`,
      limit,
      offset,
    );

    return rows.map((row) => ({
      ...rowToWorkout(row),
      routineName: row.routine_name,
      exerciseCount: row.exercise_count,
    }));
  }

  async getDetail(workoutId: number): Promise<WorkoutDetail | null> {
    const workoutRow = await this.db.getFirstAsync<WorkoutRow & { routine_name: string | null }>(
      `SELECT w.*, r.name as routine_name
      FROM workouts w
      LEFT JOIN routines r ON r.id = w.routine_id
      WHERE w.id = ?`,
      workoutId,
    );

    if (!workoutRow) return null;

    const setRows = await this.db.getAllAsync<WorkoutSetJoinRow>(
      `SELECT
        ws.id, ws.workout_id, ws.exercise_id, ws.sort_order,
        ws.weight, ws.reps, ws.duration, ws.distance,
        ws.group_id, ws.group_type, ws.notes,
        e.id as e_id,
        e.name as e_name,
        e.type as e_type,
        e.muscle_group as e_muscle_group,
        e.is_predefined as e_is_predefined,
        e.illustration as e_illustration,
        e.rest_seconds as e_rest_seconds,
        e.notes as e_notes,
        e.created_at as e_created_at
      FROM workout_sets ws
      JOIN exercises e ON e.id = ws.exercise_id
      WHERE ws.workout_id = ?
      ORDER BY ws.exercise_id, ws.sort_order`,
      workoutId,
    );

    const exerciseMap = new Map<number, WorkoutExerciseGroup>();

    for (const row of setRows) {
      if (!exerciseMap.has(row.exercise_id)) {
        exerciseMap.set(row.exercise_id, {
          exercise: {
            id: row.e_id,
            name: row.e_name,
            type: row.e_type as Exercise['type'],
            muscleGroup: row.e_muscle_group as Exercise['muscleGroup'],
            muscleGroups: [row.e_muscle_group as Exercise['muscleGroup']],
            isPredefined: row.e_is_predefined === 1,
            illustration: row.e_illustration,
            restSeconds: row.e_rest_seconds,
            notes: row.e_notes,
            createdAt: row.e_created_at,
          },
          sets: [],
        });
      }

      exerciseMap.get(row.exercise_id)!.sets.push(rowToSet(row));
    }

    return {
      ...rowToWorkout(workoutRow),
      routineName: workoutRow.routine_name,
      exercises: Array.from(exerciseMap.values()),
    };
  }

  async delete(workoutId: number): Promise<void> {
    await this.db.runAsync('DELETE FROM workouts WHERE id = ?', workoutId);
  }
}
