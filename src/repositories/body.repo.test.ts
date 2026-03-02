import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { BodyRepository } from './body.repo';

describe('BodyRepository', () => {
  let db: SQLiteDatabase;
  let repo: BodyRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new BodyRepository(db);
  });

  it('should create a measurement with weight only', async () => {
    const m = await repo.create({ weight: 80.5 });

    expect(m.id).toBeDefined();
    expect(m.weight).toBe(80.5);
    expect(m.bodyFat).toBeNull();
    expect(m.measuredAt).toBeDefined();
  });

  it('should create a measurement with all fields', async () => {
    const m = await repo.create({
      weight: 82,
      bodyFat: 15.5,
      chest: 100,
      waist: 80,
      hips: 95,
      biceps: 35,
      thighs: 58,
      notes: 'Morning measurement',
    });

    expect(m.weight).toBe(82);
    expect(m.bodyFat).toBe(15.5);
    expect(m.chest).toBe(100);
    expect(m.waist).toBe(80);
    expect(m.hips).toBe(95);
    expect(m.biceps).toBe(35);
    expect(m.thighs).toBe(58);
    expect(m.notes).toBe('Morning measurement');
  });

  it('should create a measurement with custom date', async () => {
    const m = await repo.create({
      weight: 79,
      measuredAt: '2026-01-15 08:00:00',
    });

    expect(m.measuredAt).toBe('2026-01-15 08:00:00');
  });

  it('should get all measurements ordered by date descending', async () => {
    await repo.create({ weight: 80, measuredAt: '2026-01-01 08:00:00' });
    await repo.create({ weight: 81, measuredAt: '2026-01-15 08:00:00' });
    await repo.create({ weight: 79, measuredAt: '2026-02-01 08:00:00' });

    const all = await repo.getAll();

    expect(all).toHaveLength(3);
    expect(all[0].weight).toBe(79);
    expect(all[2].weight).toBe(80);
  });

  it('should get a measurement by id', async () => {
    const created = await repo.create({ weight: 82.3, notes: 'test' });

    const found = await repo.getById(created.id);

    expect(found).not.toBeNull();
    expect(found!.weight).toBe(82.3);
    expect(found!.notes).toBe('test');
  });

  it('should return null for non-existent id', async () => {
    const found = await repo.getById(999);

    expect(found).toBeNull();
  });

  it('should update a measurement', async () => {
    const created = await repo.create({ weight: 80 });

    await repo.update(created.id, { weight: 81, notes: 'corrected' });

    const updated = await repo.getById(created.id);
    expect(updated!.weight).toBe(81);
    expect(updated!.notes).toBe('corrected');
  });

  it('should update a single field without affecting others', async () => {
    const created = await repo.create({
      weight: 80,
      bodyFat: 18,
      chest: 100,
    });

    await repo.update(created.id, { bodyFat: 17 });

    const updated = await repo.getById(created.id);
    expect(updated!.weight).toBe(80);
    expect(updated!.bodyFat).toBe(17);
    expect(updated!.chest).toBe(100);
  });

  it('should no-op when update is called with empty data', async () => {
    const created = await repo.create({ weight: 80 });

    await repo.update(created.id, {});

    const m = await repo.getById(created.id);
    expect(m!.weight).toBe(80);
  });

  it('should delete a measurement', async () => {
    const created = await repo.create({ weight: 80 });

    await repo.delete(created.id);

    const found = await repo.getById(created.id);
    expect(found).toBeNull();
  });

  it('should get weight over time in ascending order', async () => {
    await repo.create({ weight: 80, measuredAt: '2026-01-01 08:00:00' });
    await repo.create({ weight: 81, measuredAt: '2026-01-15 08:00:00' });
    await repo.create({ measuredAt: '2026-01-20 08:00:00' }); // no weight
    await repo.create({ weight: 79, measuredAt: '2026-02-01 08:00:00' });

    const points = await repo.getWeightOverTime();

    expect(points).toHaveLength(3);
    expect(points[0].weight).toBe(80);
    expect(points[1].weight).toBe(81);
    expect(points[2].weight).toBe(79);
  });

  it('should return empty array when no weight data exists', async () => {
    const points = await repo.getWeightOverTime();

    expect(points).toHaveLength(0);
  });

  it('should get latest measurement', async () => {
    await repo.create({ weight: 80, measuredAt: '2026-01-01 08:00:00' });
    await repo.create({ weight: 82, measuredAt: '2026-02-01 08:00:00' });

    const latest = await repo.getLatest();

    expect(latest).not.toBeNull();
    expect(latest!.weight).toBe(82);
  });

  it('should return null when no measurements exist', async () => {
    const latest = await repo.getLatest();

    expect(latest).toBeNull();
  });

  it('should reject body_fat outside 0-100 range', async () => {
    await expect(repo.create({ bodyFat: 101 })).rejects.toThrow();
  });

  it('should reject negative measurements', async () => {
    await expect(repo.create({ chest: -5 })).rejects.toThrow();
  });

  it('should allow setting fields to null via update', async () => {
    const created = await repo.create({ weight: 80, notes: 'test' });

    await repo.update(created.id, { notes: null });

    const updated = await repo.getById(created.id);
    expect(updated!.notes).toBeNull();
  });

  it('should get body_fat over time in ascending order', async () => {
    await repo.create({ bodyFat: 18, measuredAt: '2026-01-01 08:00:00' });
    await repo.create({ bodyFat: 17, measuredAt: '2026-02-01 08:00:00' });
    await repo.create({ weight: 80, measuredAt: '2026-02-15 08:00:00' });

    const points = await repo.getMeasurementOverTime('body_fat', null);

    expect(points).toHaveLength(2);
    expect(points[0].value).toBe(18);
    expect(points[1].value).toBe(17);
  });

  it('should return empty array when no field data exists', async () => {
    await repo.create({ weight: 80 });
    const points = await repo.getMeasurementOverTime('chest', null);
    expect(points).toHaveLength(0);
  });

  it('should filter getMeasurementOverTime by days', async () => {
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    await repo.create({ waist: 85, measuredAt: oldDate });
    await repo.create({ waist: 84, measuredAt: recentDate });

    const points = await repo.getMeasurementOverTime('waist', 30);

    expect(points).toHaveLength(1);
    expect(points[0].value).toBe(84);
  });

  it('should filter getWeightOverTime by days', async () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    await repo.create({ weight: 82, measuredAt: oldDate });
    await repo.create({ weight: 80, measuredAt: recentDate });

    const filtered = await repo.getWeightOverTime(30);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].weight).toBe(80);

    const all = await repo.getWeightOverTime(null);
    expect(all).toHaveLength(2);
  });
});
