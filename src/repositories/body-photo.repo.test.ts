import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { BodyRepository } from './body.repo';
import { BodyPhotoRepository, MAX_PHOTOS_PER_MEASUREMENT } from './body-photo.repo';

describe('BodyPhotoRepository', () => {
  let db: SQLiteDatabase;
  let bodyRepo: BodyRepository;
  let photoRepo: BodyPhotoRepository;
  let measurementId: number;

  beforeEach(async () => {
    db = await createTestDatabase();
    bodyRepo = new BodyRepository(db);
    photoRepo = new BodyPhotoRepository(db);
    const measurement = await bodyRepo.create({ weight: 80 });
    measurementId = measurement.id;
  });

  it('should add a photo to a measurement', async () => {
    const photo = await photoRepo.addPhoto(measurementId, '/photos/test.jpg');

    expect(photo.id).toBeDefined();
    expect(photo.measurementId).toBe(measurementId);
    expect(photo.photoPath).toBe('/photos/test.jpg');
    expect(photo.createdAt).toBeDefined();
  });

  it('should get all photos for a measurement', async () => {
    await photoRepo.addPhoto(measurementId, '/photos/a.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/b.jpg');

    const photos = await photoRepo.getPhotos(measurementId);

    expect(photos).toHaveLength(2);
    expect(photos[0].photoPath).toBe('/photos/a.jpg');
    expect(photos[1].photoPath).toBe('/photos/b.jpg');
  });

  it('should return empty array when no photos exist', async () => {
    const photos = await photoRepo.getPhotos(measurementId);

    expect(photos).toHaveLength(0);
  });

  it('should delete a photo and return its path', async () => {
    const photo = await photoRepo.addPhoto(measurementId, '/photos/delete-me.jpg');

    const deletedPath = await photoRepo.deletePhoto(photo.id);

    expect(deletedPath).toBe('/photos/delete-me.jpg');
    const remaining = await photoRepo.getPhotos(measurementId);
    expect(remaining).toHaveLength(0);
  });

  it('should return null when deleting non-existent photo', async () => {
    const result = await photoRepo.deletePhoto(999);

    expect(result).toBeNull();
  });

  it('should get photo count for a measurement', async () => {
    expect(await photoRepo.getPhotoCount(measurementId)).toBe(0);

    await photoRepo.addPhoto(measurementId, '/photos/1.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/2.jpg');

    expect(await photoRepo.getPhotoCount(measurementId)).toBe(2);
  });

  it('should enforce max 4 photos per measurement', async () => {
    await photoRepo.addPhoto(measurementId, '/photos/1.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/2.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/3.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/4.jpg');

    await expect(photoRepo.addPhoto(measurementId, '/photos/5.jpg')).rejects.toThrow(
      `Maximum ${MAX_PHOTOS_PER_MEASUREMENT} photos per measurement`,
    );
  });

  it('should cascade delete photos when measurement is deleted', async () => {
    await photoRepo.addPhoto(measurementId, '/photos/1.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/2.jpg');

    await bodyRepo.delete(measurementId);

    const photos = await photoRepo.getPhotos(measurementId);
    expect(photos).toHaveLength(0);
  });

  it('should not mix photos between measurements', async () => {
    const m2 = await bodyRepo.create({ weight: 75 });

    await photoRepo.addPhoto(measurementId, '/photos/m1.jpg');
    await photoRepo.addPhoto(m2.id, '/photos/m2.jpg');

    const photos1 = await photoRepo.getPhotos(measurementId);
    const photos2 = await photoRepo.getPhotos(m2.id);

    expect(photos1).toHaveLength(1);
    expect(photos1[0].photoPath).toBe('/photos/m1.jpg');
    expect(photos2).toHaveLength(1);
    expect(photos2[0].photoPath).toBe('/photos/m2.jpg');
  });

  it('should get photo counts for multiple measurements', async () => {
    const m2 = await bodyRepo.create({ weight: 75 });

    await photoRepo.addPhoto(measurementId, '/photos/a.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/b.jpg');
    await photoRepo.addPhoto(m2.id, '/photos/c.jpg');

    const counts = await photoRepo.getPhotoCountsForMeasurements([measurementId, m2.id]);

    expect(counts.get(measurementId)).toBe(2);
    expect(counts.get(m2.id)).toBe(1);
  });

  it('should return empty map for empty measurement ids', async () => {
    const counts = await photoRepo.getPhotoCountsForMeasurements([]);

    expect(counts.size).toBe(0);
  });

  it('should get first photo for a measurement', async () => {
    await photoRepo.addPhoto(measurementId, '/photos/first.jpg');
    await photoRepo.addPhoto(measurementId, '/photos/second.jpg');

    const first = await photoRepo.getFirstPhotoForMeasurement(measurementId);

    expect(first).not.toBeNull();
    expect(first!.photoPath).toBe('/photos/first.jpg');
  });

  it('should return null when no first photo exists', async () => {
    const first = await photoRepo.getFirstPhotoForMeasurement(measurementId);

    expect(first).toBeNull();
  });

  it('should reject invalid measurement id via FK constraint', async () => {
    let threw = false;
    try {
      await photoRepo.addPhoto(99999, '/photos/orphan.jpg');
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
