import { type SQLiteDatabase } from 'expo-sqlite';
import { createTestDatabase } from '../db/test-helpers';
import { WorkoutRepository } from './workout.repo';
import { ExerciseRepository } from './exercise.repo';
import { RoutineRepository } from './routine.repo';

describe('WorkoutRepository', () => {
  let db: SQLiteDatabase;
  let workoutRepo: WorkoutRepository;
  let exerciseRepo: ExerciseRepository;
  let routineRepo: RoutineRepository;

  let benchId: number;
  let squatId: number;
  let routineId: number;

  beforeEach(async () => {
    db = await createTestDatabase();
    workoutRepo = new WorkoutRepository(db);
    exerciseRepo = new ExerciseRepository(db);
    routineRepo = new RoutineRepository(db);

    const bench = await exerciseRepo.create({
      name: 'Bench Press',
      type: 'weights',
      muscleGroup: 'chest',
      illustration: 'bench-press',
      restSeconds: 120,
    });
    benchId = bench.id;

    const squat = await exerciseRepo.create({
      name: 'Squat',
      type: 'weights',
      muscleGroup: 'legs',
      illustration: 'squat',
      restSeconds: 180,
    });
    squatId = squat.id;

    const routine = await routineRepo.create('Push Day');
    routineId = routine.id;
    await routineRepo.addExercise(routineId, benchId, 1);
    await routineRepo.addExercise(routineId, squatId, 2);
  });

  it('should start a workout from a routine', async () => {
    const workout = await workoutRepo.start(routineId);

    expect(workout.id).toBeDefined();
    expect(workout.routineId).toBe(routineId);
    expect(workout.startedAt).toBeDefined();
    expect(workout.finishedAt).toBeNull();
  });

  it('should start a workout without a routine', async () => {
    const workout = await workoutRepo.start();

    expect(workout.routineId).toBeNull();
  });

  it('should finish a workout with a timestamp', async () => {
    const workout = await workoutRepo.start(routineId);
    await workoutRepo.finish(workout.id);

    const detail = await workoutRepo.getDetail(workout.id);
    expect(detail!.finishedAt).not.toBeNull();
  });

  it('should add a set to a workout', async () => {
    const workout = await workoutRepo.start(routineId);

    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 80,
      reps: 10,
    });

    expect(set.id).toBeDefined();
    expect(set.weight).toBe(80);
    expect(set.reps).toBe(10);
  });

  it('should add a weight set with kg and reps', async () => {
    const workout = await workoutRepo.start(routineId);

    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 95,
      reps: 6,
    });

    expect(set.weight).toBe(95);
    expect(set.reps).toBe(6);
    expect(set.duration).toBeNull();
    expect(set.distance).toBeNull();
  });

  it('should add a cardio set with duration and distance', async () => {
    const running = await exerciseRepo.create({
      name: 'Running',
      type: 'cardio',
      muscleGroup: 'full_body',
    });

    const workout = await workoutRepo.start();
    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: running.id,
      order: 1,
      duration: 1800,
      distance: 5.2,
    });

    expect(set.duration).toBe(1800);
    expect(set.distance).toBe(5.2);
    expect(set.weight).toBeNull();
    expect(set.reps).toBeNull();
  });

  it('should get all sets for a workout', async () => {
    const workout = await workoutRepo.start(routineId);

    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 2,
      weight: 80,
      reps: 10,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: squatId,
      order: 1,
      weight: 100,
      reps: 8,
    });

    const sets = await workoutRepo.getSetsForWorkout(workout.id);

    expect(sets).toHaveLength(3);
  });

  it('should get the last set for an exercise in a workout', async () => {
    const workout = await workoutRepo.start(routineId);

    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 2,
      weight: 80,
      reps: 10,
    });

    const lastSet = await workoutRepo.getLastSetForExercise(workout.id, benchId);

    expect(lastSet).not.toBeNull();
    expect(lastSet!.weight).toBe(80);
    expect(lastSet!.order).toBe(2);
  });

  it('should delete a set from a workout', async () => {
    const workout = await workoutRepo.start(routineId);
    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 80,
      reps: 10,
    });

    await workoutRepo.deleteSet(set.id);

    const sets = await workoutRepo.getSetsForWorkout(workout.id);
    expect(sets).toHaveLength(0);
  });

  it('should get workout history ordered by date descending', async () => {
    await workoutRepo.start(routineId);
    await workoutRepo.start(routineId);
    await workoutRepo.start();

    const history = await workoutRepo.getHistory();

    expect(history).toHaveLength(3);
  });

  it('should get a workout detail with all exercises and sets', async () => {
    const workout = await workoutRepo.start(routineId);

    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 2,
      weight: 80,
      reps: 10,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: squatId,
      order: 1,
      weight: 100,
      reps: 8,
    });

    const detail = await workoutRepo.getDetail(workout.id);

    expect(detail).not.toBeNull();
    expect(detail!.exercises).toHaveLength(2);
    expect(detail!.exercises[0].exercise.name).toBe('Bench Press');
    expect(detail!.exercises[0].sets).toHaveLength(2);
    expect(detail!.exercises[1].exercise.name).toBe('Squat');
    expect(detail!.exercises[1].sets).toHaveLength(1);
  });

  it('should delete a workout and cascade to workout_sets', async () => {
    const workout = await workoutRepo.start(routineId);
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 80,
      reps: 10,
    });

    await workoutRepo.delete(workout.id);

    const detail = await workoutRepo.getDetail(workout.id);
    expect(detail).toBeNull();
  });

  it('should update a set', async () => {
    const workout = await workoutRepo.start(routineId);
    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });

    await workoutRepo.updateSet(set.id, { weight: 75, reps: 10 });

    const sets = await workoutRepo.getSetsForWorkout(workout.id);
    expect(sets[0].weight).toBe(75);
    expect(sets[0].reps).toBe(10);
  });

  it('should update a single set field without affecting others', async () => {
    const workout = await workoutRepo.start(routineId);
    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });

    await workoutRepo.updateSet(set.id, { weight: 80 });

    const sets = await workoutRepo.getSetsForWorkout(workout.id);
    expect(sets[0].weight).toBe(80);
    expect(sets[0].reps).toBe(12);
  });

  it('should no-op when updateSet is called with empty data', async () => {
    const workout = await workoutRepo.start(routineId);
    const set = await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });

    await workoutRepo.updateSet(set.id, {});

    const sets = await workoutRepo.getSetsForWorkout(workout.id);
    expect(sets[0].weight).toBe(70);
    expect(sets[0].reps).toBe(12);
  });

  it('should get workout detail with empty exercises when no sets added', async () => {
    const workout = await workoutRepo.start(routineId);

    const detail = await workoutRepo.getDetail(workout.id);

    expect(detail).not.toBeNull();
    expect(detail!.exercises).toHaveLength(0);
  });

  it('should return null for getDetail of non-existent workout', async () => {
    const detail = await workoutRepo.getDetail(999);

    expect(detail).toBeNull();
  });

  it('should get history with limit and offset', async () => {
    await workoutRepo.start(routineId);
    await workoutRepo.start(routineId);
    await workoutRepo.start(routineId);

    const page1 = await workoutRepo.getHistory(2, 0);
    const page2 = await workoutRepo.getHistory(2, 2);

    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(1);
  });

  it('should return null for getLastSetForExercise when no sets exist', async () => {
    const workout = await workoutRepo.start(routineId);

    const lastSet = await workoutRepo.getLastSetForExercise(workout.id, benchId);

    expect(lastSet).toBeNull();
  });

  it('should reject negative weight via CHECK constraint', async () => {
    const workout = await workoutRepo.start(routineId);

    await expect(
      workoutRepo.addSet({
        workoutId: workout.id,
        exerciseId: benchId,
        order: 1,
        weight: -10,
        reps: 5,
      }),
    ).rejects.toThrow();
  });

  it('should reject negative reps via CHECK constraint', async () => {
    const workout = await workoutRepo.start(routineId);

    await expect(
      workoutRepo.addSet({
        workoutId: workout.id,
        exerciseId: benchId,
        order: 1,
        weight: 50,
        reps: -5,
      }),
    ).rejects.toThrow();
  });

  describe('getLastSetFromPreviousWorkout', () => {
    it('should return last set from a finished workout', async () => {
      const workout = await workoutRepo.start(routineId);
      await workoutRepo.addSet({
        workoutId: workout.id,
        exerciseId: benchId,
        order: 1,
        weight: 70,
        reps: 12,
      });
      await workoutRepo.addSet({
        workoutId: workout.id,
        exerciseId: benchId,
        order: 2,
        weight: 80,
        reps: 10,
      });
      await workoutRepo.finish(workout.id);

      const lastSet = await workoutRepo.getLastSetFromPreviousWorkout(benchId);

      expect(lastSet).not.toBeNull();
      expect(lastSet!.weight).toBe(80);
      expect(lastSet!.reps).toBe(10);
    });

    it('should ignore unfinished workouts', async () => {
      const workout = await workoutRepo.start(routineId);
      await workoutRepo.addSet({
        workoutId: workout.id,
        exerciseId: benchId,
        order: 1,
        weight: 100,
        reps: 5,
      });
      // Do NOT finish this workout

      const lastSet = await workoutRepo.getLastSetFromPreviousWorkout(benchId);

      expect(lastSet).toBeNull();
    });

    it('should return null when no previous data exists', async () => {
      const lastSet = await workoutRepo.getLastSetFromPreviousWorkout(benchId);

      expect(lastSet).toBeNull();
    });
  });

  it('should return sets ordered by exercise and sort_order', async () => {
    const workout = await workoutRepo.start(routineId);

    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: squatId,
      order: 1,
      weight: 100,
      reps: 8,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 1,
      weight: 70,
      reps: 12,
    });
    await workoutRepo.addSet({
      workoutId: workout.id,
      exerciseId: benchId,
      order: 2,
      weight: 80,
      reps: 10,
    });

    const sets = await workoutRepo.getSetsForWorkout(workout.id);

    // benchId < squatId, so bench sets come first, ordered by sort_order
    expect(sets[0].exerciseId).toBe(benchId);
    expect(sets[0].order).toBe(1);
    expect(sets[1].exerciseId).toBe(benchId);
    expect(sets[1].order).toBe(2);
    expect(sets[2].exerciseId).toBe(squatId);
  });
});
