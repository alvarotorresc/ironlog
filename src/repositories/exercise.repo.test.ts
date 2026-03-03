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
    expect(exercise.muscleGroups).toEqual(['chest']);
    expect(exercise.isPredefined).toBe(false);
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
    let threw = false;
    try {
      await repo.create({ name: '', type: 'weights', muscleGroup: 'chest' });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('should reject negative restSeconds via CHECK constraint', async () => {
    let threw = false;
    try {
      await repo.create({ name: 'Test', type: 'weights', muscleGroup: 'chest', restSeconds: -10 });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  // --- Multi-muscle-group tests ---

  it('should create an exercise with multiple muscle groups', async () => {
    const exercise = await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      muscleGroups: ['chest', 'arms', 'shoulders'],
    });

    expect(exercise.muscleGroups).toEqual(['chest', 'arms', 'shoulders']);
    expect(exercise.muscleGroup).toBe('chest');
  });

  it('should return muscleGroups from pivot in getAll', async () => {
    await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      muscleGroups: ['chest', 'arms', 'shoulders'],
    });
    await repo.create({
      name: 'Squat',
      type: 'weights',
      muscleGroup: 'legs',
      muscleGroups: ['legs', 'core'],
    });

    const exercises = await repo.getAll();
    const bench = exercises.find((e) => e.name === 'Bench Press')!;
    const squat = exercises.find((e) => e.name === 'Squat')!;

    expect(bench.muscleGroups).toEqual(['chest', 'arms', 'shoulders']);
    expect(squat.muscleGroups).toEqual(['legs', 'core']);
  });

  it('should return muscleGroups from pivot in getById', async () => {
    const created = await repo.create({
      name: 'Deadlift',
      type: 'weights',
      muscleGroup: 'back',
      muscleGroups: ['back', 'legs', 'core'],
    });

    const exercise = await repo.getById(created.id);

    expect(exercise!.muscleGroups).toEqual(['back', 'legs', 'core']);
  });

  it('should find exercises by secondary muscle group', async () => {
    await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      muscleGroups: ['chest', 'arms', 'shoulders'],
    });
    await repo.create({
      name: 'Barbell Curl',
      type: 'weights',
      muscleGroup: 'arms',
      muscleGroups: ['arms'],
    });

    // Bench Press has 'arms' as secondary muscle group
    const armsExercises = await repo.getByMuscleGroup('arms');

    expect(armsExercises).toHaveLength(2);
    expect(armsExercises.map((e) => e.name).sort()).toEqual(['Barbell Curl', 'Bench Press']);
  });

  it('should update muscleGroups via pivot table', async () => {
    const created = await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      muscleGroups: ['chest'],
    });

    await repo.update(created.id, {
      muscleGroups: ['chest', 'arms', 'shoulders'],
    });

    const updated = await repo.getById(created.id);
    expect(updated!.muscleGroups).toEqual(['chest', 'arms', 'shoulders']);
  });

  it('should update primary muscle_group when muscleGroups changes', async () => {
    const created = await repo.create({
      name: 'Test',
      type: 'weights',
      muscleGroup: 'chest',
      muscleGroups: ['chest'],
    });

    await repo.update(created.id, {
      muscleGroups: ['back', 'arms'],
    });

    const updated = await repo.getById(created.id);
    expect(updated!.muscleGroup).toBe('back');
    expect(updated!.muscleGroups).toEqual(['back', 'arms']);
  });

  it('should cascade delete pivot rows when exercise is deleted', async () => {
    const created = await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      muscleGroups: ['chest', 'arms', 'shoulders'],
    });

    await repo.delete(created.id);

    const pivotRows = await db.getAllAsync(
      'SELECT * FROM exercise_muscle_groups WHERE exercise_id = ?',
      created.id,
    );
    expect(pivotRows).toHaveLength(0);
  });

  it('should create predefined exercise with isPredefined flag', async () => {
    const exercise = await repo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      isPredefined: true,
    });

    expect(exercise.isPredefined).toBe(true);

    const fetched = await repo.getById(exercise.id);
    expect(fetched!.isPredefined).toBe(true);
  });

  it('should default isPredefined to false', async () => {
    const exercise = await repo.create({
      name: 'My Custom Exercise',
      type: 'weights',
      muscleGroup: 'chest',
    });

    expect(exercise.isPredefined).toBe(false);
  });

  it('should return empty muscleGroups array as single primary group fallback', async () => {
    // Insert directly into DB without pivot data to test fallback
    await db.runAsync(
      "INSERT INTO exercises (name, type, muscle_group) VALUES ('LegacyExercise', 'weights', 'chest')",
    );
    const row = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM exercises WHERE name = 'LegacyExercise'",
    );

    const exercise = await repo.getById(row!.id);
    // Falls back to primary muscle_group when no pivot data
    expect(exercise!.muscleGroups).toEqual(['chest']);
  });
});
