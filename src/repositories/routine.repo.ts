import { type SQLiteDatabase } from 'expo-sqlite';
import type { Routine, RoutineExercise, Exercise } from '../types';

export interface RoutineWithExercises extends Routine {
  exercises: (RoutineExercise & { exercise: Exercise })[];
}

interface RoutineRow {
  id: number;
  name: string;
  created_at: string;
}

interface RoutineExerciseJoinRow {
  re_id: number;
  routine_id: number;
  exercise_id: number;
  sort_order: number;
  e_id: number;
  e_name: string;
  e_type: string;
  e_muscle_group: string;
  e_illustration: string | null;
  e_rest_seconds: number;
  e_created_at: string;
}

export class RoutineRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(name: string): Promise<Routine> {
    const result = await this.db.runAsync('INSERT INTO routines (name) VALUES (?)', name);

    const row = await this.db.getFirstAsync<RoutineRow>(
      'SELECT * FROM routines WHERE id = ?',
      result.lastInsertRowId,
    );

    return {
      id: row!.id,
      name: row!.name,
      createdAt: row!.created_at,
    };
  }

  async getAll(): Promise<Routine[]> {
    const rows = await this.db.getAllAsync<RoutineRow>(
      'SELECT * FROM routines ORDER BY created_at DESC',
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }

  async getById(id: number): Promise<RoutineWithExercises | null> {
    const routineRow = await this.db.getFirstAsync<RoutineRow>(
      'SELECT * FROM routines WHERE id = ?',
      id,
    );

    if (!routineRow) return null;

    const exerciseRows = await this.db.getAllAsync<RoutineExerciseJoinRow>(
      `SELECT
        re.id as re_id,
        re.routine_id,
        re.exercise_id,
        re.sort_order,
        e.id as e_id,
        e.name as e_name,
        e.type as e_type,
        e.muscle_group as e_muscle_group,
        e.illustration as e_illustration,
        e.rest_seconds as e_rest_seconds,
        e.created_at as e_created_at
      FROM routine_exercises re
      JOIN exercises e ON e.id = re.exercise_id
      WHERE re.routine_id = ?
      ORDER BY re.sort_order ASC`,
      id,
    );

    return {
      id: routineRow.id,
      name: routineRow.name,
      createdAt: routineRow.created_at,
      exercises: exerciseRows.map((row) => ({
        id: row.re_id,
        routineId: row.routine_id,
        exerciseId: row.exercise_id,
        order: row.sort_order,
        exercise: {
          id: row.e_id,
          name: row.e_name,
          type: row.e_type as Exercise['type'],
          muscleGroup: row.e_muscle_group as Exercise['muscleGroup'],
          illustration: row.e_illustration,
          restSeconds: row.e_rest_seconds,
          createdAt: row.e_created_at,
        },
      })),
    };
  }

  async addExercise(routineId: number, exerciseId: number, order: number): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO routine_exercises (routine_id, exercise_id, sort_order) VALUES (?, ?, ?)',
      routineId,
      exerciseId,
      order,
    );
  }

  async removeExercise(routineExerciseId: number): Promise<void> {
    await this.db.runAsync('DELETE FROM routine_exercises WHERE id = ?', routineExerciseId);
  }

  async reorderExercises(routineId: number, orderedRoutineExerciseIds: number[]): Promise<void> {
    for (let i = 0; i < orderedRoutineExerciseIds.length; i++) {
      await this.db.runAsync(
        'UPDATE routine_exercises SET sort_order = ? WHERE id = ? AND routine_id = ?',
        i + 1,
        orderedRoutineExerciseIds[i],
        routineId,
      );
    }
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM routines WHERE id = ?', id);
  }
}
