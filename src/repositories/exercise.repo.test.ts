import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { ExerciseRepository } from './exercise.repo';

describe('ExerciseRepository', () => {
  let db: SQLiteDatabase;
  let repo: ExerciseRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new ExerciseRepository(db);
  });

  it('should create an exercise with valid data', async () => {
    const exercise = await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
    });

    expect(exercise.id).toBeDefined();
    expect(exercise.name).toBe('Bench Press');
    expect(exercise.type).toBe('weights');
    expect(exercise.muscleGroup).toBe('chest');
    expect(exercise.createdAt).toBeDefined();
  });

  it('should create an exercise with illustration and restSeconds', async () => {
    const exercise = await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      illustration: 'bench-press',
      restSeconds: 120,
    });

    expect(exercise.illustration).toBe('bench-press');
    expect(exercise.restSeconds).toBe(120);
  });

  it('should default restSeconds to 90 when not provided', async () => {
    const exercise = await repo.create({
      name: 'Squat',
      type: 'weights',
      muscleGroup: 'legs',
    });

    expect(exercise.restSeconds).toBe(90);
  });

  it('should get all exercises', async () => {
    await repo.create({ name: 'Bench Press', type: 'weights', muscleGroup: 'chest' });
    await repo.create({ name: 'Squat', type: 'weights', muscleGroup: 'legs' });
    await repo.create({ name: 'Running', type: 'cardio', muscleGroup: 'full_body' });

    const exercises = await repo.getAll();

    expect(exercises).toHaveLength(3);
  });

  it('should get exercises filtered by muscle group', async () => {
    await repo.create({ name: 'Bench Press', type: 'weights', muscleGroup: 'chest' });
    await repo.create({ name: 'Incline Bench', type: 'weights', muscleGroup: 'chest' });
    await repo.create({ name: 'Squat', type: 'weights', muscleGroup: 'legs' });

    const chestExercises = await repo.getByMuscleGroup('chest');

    expect(chestExercises).toHaveLength(2);
    expect(chestExercises.every((e) => e.muscleGroup === 'chest')).toBe(true);
  });

  it('should get a single exercise by id', async () => {
    const created = await repo.create({
      name: 'Deadlift',
      type: 'weights',
      muscleGroup: 'back',
      illustration: 'deadlift',
    });

    const exercise = await repo.getById(created.id);

    expect(exercise).not.toBeNull();
    expect(exercise!.name).toBe('Deadlift');
    expect(exercise!.illustration).toBe('deadlift');
  });

  it('should return null when getting a non-existent exercise', async () => {
    const exercise = await repo.getById(999);

    expect(exercise).toBeNull();
  });

  it('should delete an exercise by id', async () => {
    const created = await repo.create({
      name: 'Plank',
      type: 'flexibility',
      muscleGroup: 'core',
    });

    await repo.delete(created.id);
    const exercise = await repo.getById(created.id);

    expect(exercise).toBeNull();
  });

  it('should update an exercise', async () => {
    const created = await repo.create({
      name: 'Press',
      type: 'weights',
      muscleGroup: 'chest',
    });

    await repo.update(created.id, {
      name: 'Bench Press',
      illustration: 'bench-press',
      restSeconds: 120,
    });

    const updated = await repo.getById(created.id);

    expect(updated!.name).toBe('Bench Press');
    expect(updated!.illustration).toBe('bench-press');
    expect(updated!.restSeconds).toBe(120);
  });

  it('should update a single field without affecting others', async () => {
    const created = await repo.create({
      name: 'Press',
      type: 'weights',
      muscleGroup: 'chest',
      illustration: 'press',
      restSeconds: 90,
    });

    await repo.update(created.id, { name: 'Overhead Press' });

    const updated = await repo.getById(created.id);
    expect(updated!.name).toBe('Overhead Press');
    expect(updated!.type).toBe('weights');
    expect(updated!.muscleGroup).toBe('chest');
    expect(updated!.illustration).toBe('press');
    expect(updated!.restSeconds).toBe(90);
  });

  it('should no-op when update is called with empty data', async () => {
    const created = await repo.create({
      name: 'Squat',
      type: 'weights',
      muscleGroup: 'legs',
    });

    await repo.update(created.id, {});

    const exercise = await repo.getById(created.id);
    expect(exercise!.name).toBe('Squat');
  });

  it('should return exercises ordered by name ascending', async () => {
    await repo.create({ name: 'Squat', type: 'weights', muscleGroup: 'legs' });
    await repo.create({ name: 'Bench Press', type: 'weights', muscleGroup: 'chest' });
    await repo.create({ name: 'Deadlift', type: 'weights', muscleGroup: 'back' });

    const exercises = await repo.getAll();

    expect(exercises[0].name).toBe('Bench Press');
    expect(exercises[1].name).toBe('Deadlift');
    expect(exercises[2].name).toBe('Squat');
  });

  it('should return empty array for muscle group with no exercises', async () => {
    await repo.create({ name: 'Bench Press', type: 'weights', muscleGroup: 'chest' });

    const result = await repo.getByMuscleGroup('legs');

    expect(result).toHaveLength(0);
  });

  it('should reject empty name via CHECK constraint', async () => {
    await expect(
      repo.create({ name: '', type: 'weights', muscleGroup: 'chest' }),
    ).rejects.toThrow();
  });

  it('should reject negative restSeconds via CHECK constraint', async () => {
    await expect(
      repo.create({ name: 'Test', type: 'weights', muscleGroup: 'chest', restSeconds: -10 }),
    ).rejects.toThrow();
  });
});
