import { type SQLiteDatabase } from 'expo-sqlite';
import type { Routine, RoutineExercise, Exercise, GroupType } from '../types';

export interface RoutineWithExercises extends Routine {
  exercises: (RoutineExercise & { exercise: Exercise })[];
}

interface RoutineRow {
  id: number;
  name: string;
  is_template: number;
  description: string | null;
  created_at: string;
}

interface RoutineExerciseJoinRow {
  re_id: number;
  routine_id: number;
  exercise_id: number;
  sort_order: number;
  re_group_id: number | null;
  re_group_type: string | null;
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
      isTemplate: row!.is_template === 1,
      description: row!.description,
      createdAt: row!.created_at,
    };
  }

  async getAll(): Promise<Routine[]> {
    const rows = await this.db.getAllAsync<RoutineRow>(
      'SELECT * FROM routines ORDER BY created_at DESC, id DESC',
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      isTemplate: row.is_template === 1,
      description: row.description,
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
        re.group_id as re_group_id,
        re.group_type as re_group_type,
        e.id as e_id,
        e.name as e_name,
        e.type as e_type,
        e.muscle_group as e_muscle_group,
        e.is_predefined as e_is_predefined,
        e.illustration as e_illustration,
        e.rest_seconds as e_rest_seconds,
        e.notes as e_notes,
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
      isTemplate: routineRow.is_template === 1,
      description: routineRow.description,
      createdAt: routineRow.created_at,
      exercises: exerciseRows.map((row) => ({
        id: row.re_id,
        routineId: row.routine_id,
        exerciseId: row.exercise_id,
        order: row.sort_order,
        groupId: row.re_group_id,
        groupType: row.re_group_type as GroupType | null,
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
      })),
    };
  }

  async createWithExercises(name: string, exerciseIds: number[]): Promise<Routine> {
    let routine: Routine | null = null;

    await this.db.withTransactionAsync(async () => {
      const result = await this.db.runAsync('INSERT INTO routines (name) VALUES (?)', name);
      const row = await this.db.getFirstAsync<RoutineRow>(
        'SELECT * FROM routines WHERE id = ?',
        result.lastInsertRowId,
      );

      routine = {
        id: row!.id,
        name: row!.name,
        isTemplate: row!.is_template === 1,
        description: row!.description,
        createdAt: row!.created_at,
      };

      for (let i = 0; i < exerciseIds.length; i++) {
        await this.db.runAsync(
          'INSERT INTO routine_exercises (routine_id, exercise_id, sort_order) VALUES (?, ?, ?)',
          routine!.id,
          exerciseIds[i],
          i + 1,
        );
      }
    });

    return routine!;
  }

  async replaceExercises(routineId: number, exerciseIds: number[]): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', routineId);

      for (let i = 0; i < exerciseIds.length; i++) {
        await this.db.runAsync(
          'INSERT INTO routine_exercises (routine_id, exercise_id, sort_order) VALUES (?, ?, ?)',
          routineId,
          exerciseIds[i],
          i + 1,
        );
      }
    });
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

  async getAllWithExercises(): Promise<RoutineWithExercises[]> {
    const routineRows = await this.db.getAllAsync<RoutineRow>(
      'SELECT * FROM routines ORDER BY created_at DESC, id DESC',
    );

    if (routineRows.length === 0) return [];

    const allExerciseRows = await this.db.getAllAsync<RoutineExerciseJoinRow & { r_id: number }>(
      `SELECT
        re.id as re_id,
        re.routine_id,
        re.exercise_id,
        re.sort_order,
        re.group_id as re_group_id,
        re.group_type as re_group_type,
        r.id as r_id,
        e.id as e_id,
        e.name as e_name,
        e.type as e_type,
        e.muscle_group as e_muscle_group,
        e.is_predefined as e_is_predefined,
        e.illustration as e_illustration,
        e.rest_seconds as e_rest_seconds,
        e.notes as e_notes,
        e.created_at as e_created_at
      FROM routine_exercises re
      JOIN exercises e ON e.id = re.exercise_id
      JOIN routines r ON r.id = re.routine_id
      ORDER BY re.routine_id, re.sort_order ASC`,
    );

    const exercisesByRoutine = new Map<number, RoutineWithExercises['exercises']>();
    for (const row of allExerciseRows) {
      const list = exercisesByRoutine.get(row.routine_id) ?? [];
      list.push({
        id: row.re_id,
        routineId: row.routine_id,
        exerciseId: row.exercise_id,
        order: row.sort_order,
        groupId: row.re_group_id,
        groupType: row.re_group_type as GroupType | null,
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
      });
      exercisesByRoutine.set(row.routine_id, list);
    }

    return routineRows.map((row) => ({
      id: row.id,
      name: row.name,
      isTemplate: row.is_template === 1,
      description: row.description,
      createdAt: row.created_at,
      exercises: exercisesByRoutine.get(row.id) ?? [],
    }));
  }

  async updateName(id: number, name: string): Promise<void> {
    await this.db.runAsync('UPDATE routines SET name = ? WHERE id = ?', name, id);
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM routines WHERE id = ?', id);
  }
}
