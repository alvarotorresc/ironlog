import { type SQLiteDatabase } from 'expo-sqlite';
import type { BodyMeasurement, WeightDataPoint } from '../types';

interface CreateBodyMeasurementData {
  weight?: number | null;
  bodyFat?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  biceps?: number | null;
  thighs?: number | null;
  notes?: string | null;
  measuredAt?: string;
}

interface UpdateBodyMeasurementData {
  weight?: number | null;
  bodyFat?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  biceps?: number | null;
  thighs?: number | null;
  notes?: string | null;
}

interface BodyMeasurementRow {
  id: number;
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  biceps: number | null;
  thighs: number | null;
  notes: string | null;
  measured_at: string;
}

function rowToMeasurement(row: BodyMeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    weight: row.weight,
    bodyFat: row.body_fat,
    chest: row.chest,
    waist: row.waist,
    hips: row.hips,
    biceps: row.biceps,
    thighs: row.thighs,
    notes: row.notes,
    measuredAt: row.measured_at,
  };
}

export class BodyRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(data: CreateBodyMeasurementData): Promise<BodyMeasurement> {
    const result = await this.db.runAsync(
      `INSERT INTO body_measurements (weight, body_fat, chest, waist, hips, biceps, thighs, notes, measured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.weight ?? null,
      data.bodyFat ?? null,
      data.chest ?? null,
      data.waist ?? null,
      data.hips ?? null,
      data.biceps ?? null,
      data.thighs ?? null,
      data.notes ?? null,
      data.measuredAt ?? new Date().toISOString().replace('T', ' ').slice(0, 19),
    );

    const measurement = await this.getById(result.lastInsertRowId);
    return measurement!;
  }

  async getAll(): Promise<BodyMeasurement[]> {
    const rows = await this.db.getAllAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements ORDER BY measured_at DESC',
    );
    return rows.map(rowToMeasurement);
  }

  async getById(id: number): Promise<BodyMeasurement | null> {
    const row = await this.db.getFirstAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements WHERE id = ?',
      id,
    );
    return row ? rowToMeasurement(row) : null;
  }

  async update(id: number, data: UpdateBodyMeasurementData): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.weight !== undefined) {
      fields.push('weight = ?');
      values.push(data.weight);
    }
    if (data.bodyFat !== undefined) {
      fields.push('body_fat = ?');
      values.push(data.bodyFat);
    }
    if (data.chest !== undefined) {
      fields.push('chest = ?');
      values.push(data.chest);
    }
    if (data.waist !== undefined) {
      fields.push('waist = ?');
      values.push(data.waist);
    }
    if (data.hips !== undefined) {
      fields.push('hips = ?');
      values.push(data.hips);
    }
    if (data.biceps !== undefined) {
      fields.push('biceps = ?');
      values.push(data.biceps);
    }
    if (data.thighs !== undefined) {
      fields.push('thighs = ?');
      values.push(data.thighs);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length === 0) return;

    values.push(id);
    await this.db.runAsync(
      `UPDATE body_measurements SET ${fields.join(', ')} WHERE id = ?`,
      ...values,
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM body_measurements WHERE id = ?', id);
  }

  async getWeightOverTime(limit = 90): Promise<WeightDataPoint[]> {
    const rows = await this.db.getAllAsync<{ measured_at: string; weight: number }>(
      `SELECT measured_at, weight FROM body_measurements
       WHERE weight IS NOT NULL
       ORDER BY measured_at ASC
       LIMIT ?`,
      limit,
    );
    return rows.map((r) => ({ date: r.measured_at, weight: r.weight }));
  }

  async getLatest(): Promise<BodyMeasurement | null> {
    const row = await this.db.getFirstAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements ORDER BY measured_at DESC LIMIT 1',
    );
    return row ? rowToMeasurement(row) : null;
  }
}
