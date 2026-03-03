import { type SQLiteDatabase } from 'expo-sqlite';
import type { Exercise, ExerciseType, MuscleGroup } from '../types';

export interface CreateExerciseData {
  name: string;
  type: ExerciseType;
  muscleGroup: MuscleGroup;
  muscleGroups?: MuscleGroup[];
  illustration?: string | null;
  restSeconds?: number;
  isPredefined?: boolean;
}

export interface UpdateExerciseData {
  name?: string;
  type?: ExerciseType;
  muscleGroup?: MuscleGroup;
  muscleGroups?: MuscleGroup[];
  illustration?: string | null;
  restSeconds?: number;
}

interface ExerciseRow {
  id: number;
  name: string;
  type: ExerciseType;
  muscle_group: MuscleGroup;
  is_predefined: number;
  illustration: string | null;
  rest_seconds: number;
  created_at: string;
}

interface MuscleGroupRow {
  exercise_id: number;
  muscle_group: MuscleGroup;
  is_primary: number;
}

function rowToExercise(row: ExerciseRow, muscleGroups?: MuscleGroup[]): Exercise {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    muscleGroup: row.muscle_group,
    muscleGroups: muscleGroups ?? [row.muscle_group],
    isPredefined: row.is_predefined === 1,
    illustration: row.illustration,
    restSeconds: row.rest_seconds,
    createdAt: row.created_at,
  };
}

export class ExerciseRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(data: CreateExerciseData): Promise<Exercise> {
    let exercise: Exercise | null = null;

    await this.db.withTransactionAsync(async () => {
      const result = await this.db.runAsync(
        `INSERT INTO exercises (name, type, muscle_group, illustration, rest_seconds, is_predefined)
         VALUES (?, ?, ?, ?, ?, ?)`,
        data.name,
        data.type,
        data.muscleGroup,
        data.illustration ?? null,
        data.restSeconds ?? 90,
        data.isPredefined ? 1 : 0,
      );

      const exerciseId = result.lastInsertRowId;

      // Insert muscle groups into pivot
      const groups = data.muscleGroups ?? [data.muscleGroup];
      for (let i = 0; i < groups.length; i++) {
        await this.db.runAsync(
          `INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary)
           VALUES (?, ?, ?)`,
          exerciseId,
          groups[i],
          i === 0 ? 1 : 0,
        );
      }

      const row = await this.db.getFirstAsync<ExerciseRow>(
        'SELECT * FROM exercises WHERE id = ?',
        exerciseId,
      );
      exercise = rowToExercise(row!, groups);
    });

    return exercise!;
  }

  async getAll(): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<ExerciseRow>(
      'SELECT * FROM exercises ORDER BY name ASC',
    );

    if (rows.length === 0) return [];

    const muscleGroupRows = await this.db.getAllAsync<MuscleGroupRow>(
      'SELECT exercise_id, muscle_group, is_primary FROM exercise_muscle_groups ORDER BY exercise_id, is_primary DESC',
    );

    const groupsByExercise = new Map<number, MuscleGroup[]>();
    for (const mg of muscleGroupRows) {
      const list = groupsByExercise.get(mg.exercise_id) ?? [];
      list.push(mg.muscle_group);
      groupsByExercise.set(mg.exercise_id, list);
    }

    return rows.map((row) => rowToExercise(row, groupsByExercise.get(row.id)));
  }

  async getByMuscleGroup(group: MuscleGroup): Promise<Exercise[]> {
    // Query pivot table for ANY match (not just primary)
    const rows = await this.db.getAllAsync<ExerciseRow>(
      `SELECT DISTINCT e.* FROM exercises e
       JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
       WHERE emg.muscle_group = ?
       ORDER BY e.name ASC`,
      group,
    );

    if (rows.length === 0) return [];

    const exerciseIds = rows.map((r) => r.id);
    const placeholders = exerciseIds.map(() => '?').join(',');
    const muscleGroupRows = await this.db.getAllAsync<MuscleGroupRow>(
      `SELECT exercise_id, muscle_group, is_primary FROM exercise_muscle_groups
       WHERE exercise_id IN (${placeholders})
       ORDER BY exercise_id, is_primary DESC`,
      ...exerciseIds,
    );

    const groupsByExercise = new Map<number, MuscleGroup[]>();
    for (const mg of muscleGroupRows) {
      const list = groupsByExercise.get(mg.exercise_id) ?? [];
      list.push(mg.muscle_group);
      groupsByExercise.set(mg.exercise_id, list);
    }

    return rows.map((row) => rowToExercise(row, groupsByExercise.get(row.id)));
  }

  async getById(id: number): Promise<Exercise | null> {
    const row = await this.db.getFirstAsync<ExerciseRow>(
      'SELECT * FROM exercises WHERE id = ?',
      id,
    );
    if (!row) return null;

    const muscleGroupRows = await this.db.getAllAsync<MuscleGroupRow>(
      'SELECT exercise_id, muscle_group, is_primary FROM exercise_muscle_groups WHERE exercise_id = ? ORDER BY is_primary DESC',
      id,
    );

    const groups = muscleGroupRows.map((mg) => mg.muscle_group);
    return rowToExercise(row, groups.length > 0 ? groups : undefined);
  }

  async update(id: number, data: UpdateExerciseData): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
      }
      if (data.type !== undefined) {
        fields.push('type = ?');
        values.push(data.type);
      }
      if (data.muscleGroup !== undefined) {
        fields.push('muscle_group = ?');
        values.push(data.muscleGroup);
      }
      if (data.illustration !== undefined) {
        fields.push('illustration = ?');
        values.push(data.illustration);
      }
      if (data.restSeconds !== undefined) {
        fields.push('rest_seconds = ?');
        values.push(data.restSeconds);
      }

      if (fields.length > 0) {
        values.push(id);
        await this.db.runAsync(`UPDATE exercises SET ${fields.join(', ')} WHERE id = ?`, ...values);
      }

      // Update pivot table if muscleGroups provided
      if (data.muscleGroups !== undefined) {
        await this.db.runAsync('DELETE FROM exercise_muscle_groups WHERE exercise_id = ?', id);
        for (let i = 0; i < data.muscleGroups.length; i++) {
          await this.db.runAsync(
            `INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary)
             VALUES (?, ?, ?)`,
            id,
            data.muscleGroups[i],
            i === 0 ? 1 : 0,
          );
        }
        // Also update the primary muscle_group column
        if (data.muscleGroups.length > 0 && data.muscleGroup === undefined) {
          await this.db.runAsync(
            'UPDATE exercises SET muscle_group = ? WHERE id = ?',
            data.muscleGroups[0],
            id,
          );
        }
      }
    });
  }

  async delete(id: number): Promise<void> {
    // Pivot rows cascade-deleted via FK
    await this.db.runAsync('DELETE FROM exercises WHERE id = ?', id);
  }
}
