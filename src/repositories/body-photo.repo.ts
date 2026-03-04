import { type SQLiteDatabase } from 'expo-sqlite';
import type { BodyPhoto } from '../types';

interface BodyPhotoRow {
  id: number;
  measurement_id: number;
  photo_path: string;
  created_at: string;
}

function rowToPhoto(row: BodyPhotoRow): BodyPhoto {
  return {
    id: row.id,
    measurementId: row.measurement_id,
    photoPath: row.photo_path,
    createdAt: row.created_at,
  };
}

export const MAX_PHOTOS_PER_MEASUREMENT = 4;

export class BodyPhotoRepository {
  constructor(private db: SQLiteDatabase) {}

  async addPhoto(measurementId: number, photoPath: string): Promise<BodyPhoto> {
    const count = await this.getPhotoCount(measurementId);
    if (count >= MAX_PHOTOS_PER_MEASUREMENT) {
      throw new Error(`Maximum ${MAX_PHOTOS_PER_MEASUREMENT} photos per measurement`);
    }

    const result = await this.db.runAsync(
      'INSERT INTO body_photos (measurement_id, photo_path) VALUES (?, ?)',
      measurementId,
      photoPath,
    );

    const row = await this.db.getFirstAsync<BodyPhotoRow>(
      'SELECT * FROM body_photos WHERE id = ?',
      result.lastInsertRowId,
    );

    return rowToPhoto(row!);
  }

  async getPhotos(measurementId: number): Promise<BodyPhoto[]> {
    const rows = await this.db.getAllAsync<BodyPhotoRow>(
      'SELECT * FROM body_photos WHERE measurement_id = ? ORDER BY created_at ASC',
      measurementId,
    );
    return rows.map(rowToPhoto);
  }

  async deletePhoto(photoId: number): Promise<string | null> {
    const row = await this.db.getFirstAsync<BodyPhotoRow>(
      'SELECT * FROM body_photos WHERE id = ?',
      photoId,
    );
    if (!row) return null;

    await this.db.runAsync('DELETE FROM body_photos WHERE id = ?', photoId);
    return row.photo_path;
  }

  async getPhotoCount(measurementId: number): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM body_photos WHERE measurement_id = ?',
      measurementId,
    );
    return result?.count ?? 0;
  }

  async getPhotoCountsForMeasurements(measurementIds: number[]): Promise<Map<number, number>> {
    if (measurementIds.length === 0) return new Map();

    const placeholders = measurementIds.map(() => '?').join(',');
    const rows = await this.db.getAllAsync<{ measurement_id: number; count: number }>(
      `SELECT measurement_id, COUNT(*) as count FROM body_photos
       WHERE measurement_id IN (${placeholders})
       GROUP BY measurement_id`,
      ...measurementIds,
    );

    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(row.measurement_id, row.count);
    }
    return map;
  }

  async getFirstPhotoForMeasurement(measurementId: number): Promise<BodyPhoto | null> {
    const row = await this.db.getFirstAsync<BodyPhotoRow>(
      'SELECT * FROM body_photos WHERE measurement_id = ? ORDER BY created_at ASC LIMIT 1',
      measurementId,
    );
    return row ? rowToPhoto(row) : null;
  }
}
