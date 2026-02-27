import { type SQLiteDatabase } from 'expo-sqlite';
import type { Exercise, ExerciseType, MuscleGroup } from '../types';

interface CreateExerciseData {
  name: string;
  type: ExerciseType;
  muscleGroup: MuscleGroup;
  illustration?: string | null;
  restSeconds?: number;
}

interface UpdateExerciseData {
  name?: string;
  type?: ExerciseType;
  muscleGroup?: MuscleGroup;
  illustration?: string | null;
  restSeconds?: number;
}

interface ExerciseRow {
  id: number;
  name: string;
  type: ExerciseType;
  muscle_group: MuscleGroup;
  illustration: string | null;
  rest_seconds: number;
  created_at: string;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    muscleGroup: row.muscle_group,
    illustration: row.illustration,
    restSeconds: row.rest_seconds,
    createdAt: row.created_at,
  };
}

export class ExerciseRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(data: CreateExerciseData): Promise<Exercise> {
    const result = await this.db.runAsync(
      `INSERT INTO exercises (name, type, muscle_group, illustration, rest_seconds)
       VALUES (?, ?, ?, ?, ?)`,
      data.name,
      data.type,
      data.muscleGroup,
      data.illustration ?? null,
      data.restSeconds ?? 90,
    );

    const exercise = await this.getById(result.lastInsertRowId);
    return exercise!;
  }

  async getAll(): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<ExerciseRow>(
      'SELECT * FROM exercises ORDER BY name ASC',
    );
    return rows.map(rowToExercise);
  }

  async getByMuscleGroup(group: MuscleGroup): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<ExerciseRow>(
      'SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name ASC',
      group,
    );
    return rows.map(rowToExercise);
  }

  async getById(id: number): Promise<Exercise | null> {
    const row = await this.db.getFirstAsync<ExerciseRow>(
      'SELECT * FROM exercises WHERE id = ?',
      id,
    );
    return row ? rowToExercise(row) : null;
  }

  async update(id: number, data: UpdateExerciseData): Promise<void> {
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

    if (fields.length === 0) return;

    values.push(id);
    await this.db.runAsync(`UPDATE exercises SET ${fields.join(', ')} WHERE id = ?`, ...values);
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM exercises WHERE id = ?', id);
  }
}
