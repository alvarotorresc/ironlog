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

  it('should reject empty routine name via CHECK constraint', async () => {
    let threw = false;
    try {
      await routineRepo.create('');
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('should reject addExercise with non-existent exercise id', async () => {
    const routine = await routineRepo.create('Test');

    let threw = false;
    try {
      await routineRepo.addExercise(routine.id, 999, 1);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('should return routines ordered by most recent first', async () => {
    await routineRepo.create('First');
    await routineRepo.create('Second');
    await routineRepo.create('Third');

    const routines = await routineRepo.getAll();

    expect(routines).toHaveLength(3);
    expect(routines[0].name).toBe('Third');
    expect(routines[1].name).toBe('Second');
    expect(routines[2].name).toBe('First');
  });

  // --- Template tests ---

  describe('templates', () => {
    it('should create a template with exercises', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Bench Press',
        type: 'weights',
        muscleGroup: 'chest',
      });
      const e2 = await exerciseRepo.create({
        name: 'Overhead Press',
        type: 'weights',
        muscleGroup: 'shoulders',
      });

      const template = await routineRepo.createTemplate('Push Day', 'Push workout', [e1.id, e2.id]);

      expect(template.isTemplate).toBe(true);
      expect(template.description).toBe('Push workout');
      expect(template.name).toBe('Push Day');
    });

    it('should return only templates from getTemplates', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Bench Press',
        type: 'weights',
        muscleGroup: 'chest',
      });

      await routineRepo.createTemplate('Push Day', null, [e1.id]);
      await routineRepo.create('My Custom Routine');

      const templates = await routineRepo.getTemplates();

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Push Day');
      expect(templates[0].isTemplate).toBe(true);
    });

    it('should return templates with their exercises', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Bench Press',
        type: 'weights',
        muscleGroup: 'chest',
      });
      const e2 = await exerciseRepo.create({
        name: 'Overhead Press',
        type: 'weights',
        muscleGroup: 'shoulders',
      });

      await routineRepo.createTemplate('Push Day', null, [e1.id, e2.id]);

      const templates = await routineRepo.getTemplates();

      expect(templates[0].exercises).toHaveLength(2);
      expect(templates[0].exercises[0].exercise.name).toBe('Bench Press');
      expect(templates[0].exercises[1].exercise.name).toBe('Overhead Press');
    });

    it('should exclude templates from getAll', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Squat',
        type: 'weights',
        muscleGroup: 'legs',
      });

      await routineRepo.createTemplate('Leg Day', null, [e1.id]);
      await routineRepo.create('My Routine');

      const routines = await routineRepo.getAll();

      expect(routines).toHaveLength(1);
      expect(routines[0].name).toBe('My Routine');
    });

    it('should exclude templates from getAllWithExercises', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Squat',
        type: 'weights',
        muscleGroup: 'legs',
      });

      await routineRepo.createTemplate('Leg Day', null, [e1.id]);
      await routineRepo.create('My Routine');

      const routines = await routineRepo.getAllWithExercises();

      expect(routines).toHaveLength(1);
      expect(routines[0].name).toBe('My Routine');
    });

    it('should clone a template into a user routine with same exercises', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Bench Press',
        type: 'weights',
        muscleGroup: 'chest',
      });
      const e2 = await exerciseRepo.create({
        name: 'Overhead Press',
        type: 'weights',
        muscleGroup: 'shoulders',
      });
      const e3 = await exerciseRepo.create({
        name: 'Tricep Pushdown',
        type: 'weights',
        muscleGroup: 'arms',
      });

      const template = await routineRepo.createTemplate('Push Day', null, [e1.id, e2.id, e3.id]);

      const cloned = await routineRepo.cloneTemplate(template.id, 'My Push Day');

      expect(cloned.isTemplate).toBe(false);
      expect(cloned.name).toBe('My Push Day');

      // Verify exercises were copied
      const clonedFull = await routineRepo.getById(cloned.id);
      expect(clonedFull).not.toBeNull();
      expect(clonedFull!.exercises).toHaveLength(3);
      expect(clonedFull!.exercises[0].exercise.name).toBe('Bench Press');
      expect(clonedFull!.exercises[1].exercise.name).toBe('Overhead Press');
      expect(clonedFull!.exercises[2].exercise.name).toBe('Tricep Pushdown');
    });

    it('should clone template with correct exercise order', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Exercise A',
        type: 'weights',
        muscleGroup: 'chest',
      });
      const e2 = await exerciseRepo.create({
        name: 'Exercise B',
        type: 'weights',
        muscleGroup: 'back',
      });

      const template = await routineRepo.createTemplate('Test', null, [e1.id, e2.id]);
      const cloned = await routineRepo.cloneTemplate(template.id, 'Cloned');

      const clonedFull = await routineRepo.getById(cloned.id);
      expect(clonedFull!.exercises[0].order).toBe(1);
      expect(clonedFull!.exercises[1].order).toBe(2);
    });

    it('should throw when cloning a non-existent template', async () => {
      await expect(routineRepo.cloneTemplate(999, 'Test')).rejects.toThrow('not found');
    });

    it('should throw when cloning a non-template routine', async () => {
      const routine = await routineRepo.create('Not a template');

      await expect(routineRepo.cloneTemplate(routine.id, 'Test')).rejects.toThrow('not a template');
    });

    it('should keep template unchanged after cloning', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Squat',
        type: 'weights',
        muscleGroup: 'legs',
      });

      const template = await routineRepo.createTemplate('Leg Day', null, [e1.id]);
      await routineRepo.cloneTemplate(template.id, 'My Leg Day');

      // Template should still exist and be a template
      const templates = await routineRepo.getTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Leg Day');
      expect(templates[0].isTemplate).toBe(true);
    });
  });
});
