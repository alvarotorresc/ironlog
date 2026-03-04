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

  describe('exercise grouping', () => {
    it('should group exercises with a shared group_id and group_type', async () => {
      const e1 = await exerciseRepo.create({
        name: 'Bench Press',
        type: 'weights',
        muscleGroup: 'chest',
      });
      const e2 = await exerciseRepo.create({
        name: 'Dumbbell Fly',
        type: 'weights',
        muscleGroup: 'chest',
      });

      const routine = await routineRepo.create('Push Day');
      await routineRepo.addExercise(routine.id, e1.id, 1);
      await routineRepo.addExercise(routine.id, e2.id, 2);

      const before = await routineRepo.getById(routine.id);
      const reIds = before!.exercises.map((re) => re.id);

      const groupId = await routineRepo.groupExercises(routine.id, reIds, 'superset');

      const after = await routineRepo.getById(routine.id);

      expect(groupId).toBeGreaterThan(0);
      expect(after!.exercises[0].groupId).toBe(groupId);
      expect(after!.exercises[0].groupType).toBe('superset');
      expect(after!.exercises[1].groupId).toBe(groupId);
      expect(after!.exercises[1].groupType).toBe('superset');
    });

    it('should assign incremental group_ids for multiple groups', async () => {
      const e1 = await exerciseRepo.create({ name: 'Ex1', type: 'weights', muscleGroup: 'chest' });
      const e2 = await exerciseRepo.create({ name: 'Ex2', type: 'weights', muscleGroup: 'chest' });
      const e3 = await exerciseRepo.create({ name: 'Ex3', type: 'weights', muscleGroup: 'back' });
      const e4 = await exerciseRepo.create({ name: 'Ex4', type: 'weights', muscleGroup: 'back' });

      const routine = await routineRepo.create('Full Body');
      await routineRepo.addExercise(routine.id, e1.id, 1);
      await routineRepo.addExercise(routine.id, e2.id, 2);
      await routineRepo.addExercise(routine.id, e3.id, 3);
      await routineRepo.addExercise(routine.id, e4.id, 4);

      const result = await routineRepo.getById(routine.id);
      const reIds = result!.exercises.map((re) => re.id);

      const groupA = await routineRepo.groupExercises(routine.id, [reIds[0], reIds[1]], 'superset');
      const groupB = await routineRepo.groupExercises(routine.id, [reIds[2], reIds[3]], 'circuit');

      expect(groupB).toBe(groupA + 1);

      const after = await routineRepo.getById(routine.id);
      expect(after!.exercises[0].groupId).toBe(groupA);
      expect(after!.exercises[0].groupType).toBe('superset');
      expect(after!.exercises[2].groupId).toBe(groupB);
      expect(after!.exercises[2].groupType).toBe('circuit');
    });

    it('should ungroup a single exercise', async () => {
      const e1 = await exerciseRepo.create({ name: 'Ex1', type: 'weights', muscleGroup: 'chest' });
      const e2 = await exerciseRepo.create({ name: 'Ex2', type: 'weights', muscleGroup: 'chest' });

      const routine = await routineRepo.create('Test');
      await routineRepo.addExercise(routine.id, e1.id, 1);
      await routineRepo.addExercise(routine.id, e2.id, 2);

      const result = await routineRepo.getById(routine.id);
      const reIds = result!.exercises.map((re) => re.id);
      await routineRepo.groupExercises(routine.id, reIds, 'dropset');

      // Ungroup first exercise
      await routineRepo.ungroupExercise(reIds[0]);

      const after = await routineRepo.getById(routine.id);
      expect(after!.exercises[0].groupId).toBeNull();
      expect(after!.exercises[0].groupType).toBeNull();
      expect(after!.exercises[1].groupId).not.toBeNull();
      expect(after!.exercises[1].groupType).toBe('dropset');
    });

    it('should ungroup all exercises in a group', async () => {
      const e1 = await exerciseRepo.create({ name: 'Ex1', type: 'weights', muscleGroup: 'chest' });
      const e2 = await exerciseRepo.create({ name: 'Ex2', type: 'weights', muscleGroup: 'chest' });

      const routine = await routineRepo.create('Test');
      await routineRepo.addExercise(routine.id, e1.id, 1);
      await routineRepo.addExercise(routine.id, e2.id, 2);

      const result = await routineRepo.getById(routine.id);
      const reIds = result!.exercises.map((re) => re.id);
      const groupId = await routineRepo.groupExercises(routine.id, reIds, 'circuit');

      await routineRepo.ungroupAll(routine.id, groupId);

      const after = await routineRepo.getById(routine.id);
      expect(after!.exercises[0].groupId).toBeNull();
      expect(after!.exercises[0].groupType).toBeNull();
      expect(after!.exercises[1].groupId).toBeNull();
      expect(after!.exercises[1].groupType).toBeNull();
    });

    it('should return group info from getById', async () => {
      const e1 = await exerciseRepo.create({ name: 'Ex1', type: 'weights', muscleGroup: 'chest' });
      const e2 = await exerciseRepo.create({ name: 'Ex2', type: 'weights', muscleGroup: 'chest' });
      const e3 = await exerciseRepo.create({ name: 'Ex3', type: 'weights', muscleGroup: 'legs' });

      const routine = await routineRepo.create('Test');
      await routineRepo.addExercise(routine.id, e1.id, 1);
      await routineRepo.addExercise(routine.id, e2.id, 2);
      await routineRepo.addExercise(routine.id, e3.id, 3);

      const result = await routineRepo.getById(routine.id);
      const reIds = result!.exercises.map((re) => re.id);
      await routineRepo.groupExercises(routine.id, [reIds[0], reIds[1]], 'superset');

      const after = await routineRepo.getById(routine.id);

      // Grouped exercises
      expect(after!.exercises[0].groupId).not.toBeNull();
      expect(after!.exercises[0].groupType).toBe('superset');
      expect(after!.exercises[1].groupId).toBe(after!.exercises[0].groupId);

      // Ungrouped exercise
      expect(after!.exercises[2].groupId).toBeNull();
      expect(after!.exercises[2].groupType).toBeNull();
    });

    it('should persist group info via createWithExercises', async () => {
      const e1 = await exerciseRepo.create({ name: 'Ex1', type: 'weights', muscleGroup: 'chest' });
      const e2 = await exerciseRepo.create({ name: 'Ex2', type: 'weights', muscleGroup: 'chest' });

      const routine = await routineRepo.createWithExercises(
        'Grouped',
        [e1.id, e2.id],
        [
          { exerciseId: e1.id, groupId: 1, groupType: 'superset' },
          { exerciseId: e2.id, groupId: 1, groupType: 'superset' },
        ],
      );

      const result = await routineRepo.getById(routine.id);
      expect(result!.exercises[0].groupId).toBe(1);
      expect(result!.exercises[0].groupType).toBe('superset');
      expect(result!.exercises[1].groupId).toBe(1);
      expect(result!.exercises[1].groupType).toBe('superset');
    });

    it('should persist group info via replaceExercises', async () => {
      const e1 = await exerciseRepo.create({ name: 'Ex1', type: 'weights', muscleGroup: 'chest' });
      const e2 = await exerciseRepo.create({ name: 'Ex2', type: 'weights', muscleGroup: 'chest' });

      const routine = await routineRepo.create('Test');
      await routineRepo.replaceExercises(
        routine.id,
        [e1.id, e2.id],
        [
          { index: 0, groupId: 1, groupType: 'circuit' },
          { index: 1, groupId: 1, groupType: 'circuit' },
        ],
      );

      const result = await routineRepo.getById(routine.id);
      expect(result!.exercises[0].groupId).toBe(1);
      expect(result!.exercises[0].groupType).toBe('circuit');
      expect(result!.exercises[1].groupId).toBe(1);
      expect(result!.exercises[1].groupType).toBe('circuit');
    });
  });
});
