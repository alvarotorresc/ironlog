import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { RoutineRepository } from './routine.repo';
import { ExerciseRepository } from './exercise.repo';

describe('RoutineRepository', () => {
  let db: SQLiteDatabase;
  let routineRepo: RoutineRepository;
  let exerciseRepo: ExerciseRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    routineRepo = new RoutineRepository(db);
    exerciseRepo = new ExerciseRepository(db);
  });

  it('should create a routine with a name', async () => {
    const routine = await routineRepo.create('Push Day');

    expect(routine.id).toBeDefined();
    expect(routine.name).toBe('Push Day');
    expect(routine.createdAt).toBeDefined();
  });

  it('should get all routines', async () => {
    await routineRepo.create('Push Day');
    await routineRepo.create('Pull Day');
    await routineRepo.create('Leg Day');

    const routines = await routineRepo.getAll();

    expect(routines).toHaveLength(3);
  });

  it('should get a routine by id with its exercises', async () => {
    const bench = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      illustration: 'bench-press',
      restSeconds: 120,
    });
    const ohp = await exerciseRepo.create({
      name: 'Overhead Press',
      type: 'weights',
      muscleGroup: 'shoulders',
      illustration: 'ohp',
      restSeconds: 90,
    });

    const routine = await routineRepo.create('Push Day');
    await routineRepo.addExercise(routine.id, bench.id, 1);
    await routineRepo.addExercise(routine.id, ohp.id, 2);

    const result = await routineRepo.getById(routine.id);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Push Day');
    expect(result!.exercises).toHaveLength(2);
    expect(result!.exercises[0].exercise.name).toBe('Bench Press');
    expect(result!.exercises[1].exercise.name).toBe('Overhead Press');
  });

  it('should include exercise illustration and restSeconds in routine exercises', async () => {
    const exercise = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      illustration: 'bench-press',
      restSeconds: 120,
    });

    const routine = await routineRepo.create('Push Day');
    await routineRepo.addExercise(routine.id, exercise.id, 1);

    const result = await routineRepo.getById(routine.id);

    expect(result!.exercises[0].exercise.illustration).toBe('bench-press');
    expect(result!.exercises[0].exercise.restSeconds).toBe(120);
  });

  it('should add exercises to a routine with correct order', async () => {
    const e1 = await exerciseRepo.create({
      name: 'Exercise 1',
      type: 'weights',
      muscleGroup: 'chest',
    });
    const e2 = await exerciseRepo.create({
      name: 'Exercise 2',
      type: 'weights',
      muscleGroup: 'back',
    });
    const e3 = await exerciseRepo.create({
      name: 'Exercise 3',
      type: 'weights',
      muscleGroup: 'legs',
    });

    const routine = await routineRepo.create('Full Body');
    await routineRepo.addExercise(routine.id, e1.id, 1);
    await routineRepo.addExercise(routine.id, e2.id, 2);
    await routineRepo.addExercise(routine.id, e3.id, 3);

    const result = await routineRepo.getById(routine.id);

    expect(result!.exercises[0].order).toBe(1);
    expect(result!.exercises[1].order).toBe(2);
    expect(result!.exercises[2].order).toBe(3);
  });

  it('should remove an exercise from a routine', async () => {
    const exercise = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
    });

    const routine = await routineRepo.create('Push Day');
    await routineRepo.addExercise(routine.id, exercise.id, 1);

    let result = await routineRepo.getById(routine.id);
    expect(result!.exercises).toHaveLength(1);

    await routineRepo.removeExercise(result!.exercises[0].id);

    result = await routineRepo.getById(routine.id);
    expect(result!.exercises).toHaveLength(0);
  });

  it('should delete a routine and cascade to routine_exercises', async () => {
    const exercise = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
    });

    const routine = await routineRepo.create('Push Day');
    await routineRepo.addExercise(routine.id, exercise.id, 1);

    await routineRepo.delete(routine.id);

    const result = await routineRepo.getById(routine.id);
    expect(result).toBeNull();
  });

  it('should return null when getting a non-existent routine', async () => {
    const result = await routineRepo.getById(999);

    expect(result).toBeNull();
  });

  it('should reorder exercises in a routine', async () => {
    const e1 = await exerciseRepo.create({
      name: 'First',
      type: 'weights',
      muscleGroup: 'chest',
    });
    const e2 = await exerciseRepo.create({
      name: 'Second',
      type: 'weights',
      muscleGroup: 'back',
    });

    const routine = await routineRepo.create('Test');
    await routineRepo.addExercise(routine.id, e1.id, 1);
    await routineRepo.addExercise(routine.id, e2.id, 2);

    const before = await routineRepo.getById(routine.id);
    const reIds = before!.exercises.map((re) => re.id);

    // Reverse order
    await routineRepo.reorderExercises(routine.id, [reIds[1], reIds[0]]);

    const after = await routineRepo.getById(routine.id);
    expect(after!.exercises[0].exercise.name).toBe('Second');
    expect(after!.exercises[1].exercise.name).toBe('First');
  });
});
