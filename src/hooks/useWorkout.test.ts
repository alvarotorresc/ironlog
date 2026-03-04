import { reorderExercises } from './useWorkout';
import type { WorkoutExerciseState } from './useWorkout';
import type { Exercise, WorkoutSet } from '@/types';

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    name: 'Bench Press',
    type: 'weights',
    muscleGroup: 'chest',
    muscleGroups: ['chest'],
    isPredefined: true,
    illustration: null,
    restSeconds: 90,
    createdAt: '2024-01-01',
    ...overrides,
  };
}

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 1,
    workoutId: 1,
    exerciseId: 1,
    order: 1,
    weight: 80,
    reps: 10,
    duration: null,
    distance: null,
    groupId: null,
    groupType: null,
    ...overrides,
  };
}

function createExerciseState(
  exercise: Partial<Exercise>,
  sets: Partial<WorkoutSet>[] = [],
): WorkoutExerciseState {
  const ex = createExercise(exercise);
  return {
    exercise: ex,
    sets: sets.map((s) => createSet({ ...s, exerciseId: ex.id })),
  };
}

describe('reorderExercises', () => {
  const threeExercises: WorkoutExerciseState[] = [
    createExerciseState({ id: 1, name: 'Bench Press' }, [{ id: 10, weight: 80, reps: 10 }]),
    createExerciseState({ id: 2, name: 'Squat' }, [
      { id: 20, weight: 100, reps: 8 },
      { id: 21, weight: 110, reps: 6 },
    ]),
    createExerciseState({ id: 3, name: 'Deadlift' }, [{ id: 30, weight: 120, reps: 5 }]),
  ];

  it('should swap exercise down correctly', () => {
    const result = reorderExercises(threeExercises, 0, 'down');

    expect(result[0].exercise.id).toBe(2);
    expect(result[1].exercise.id).toBe(1);
    expect(result[2].exercise.id).toBe(3);
  });

  it('should swap exercise up correctly', () => {
    const result = reorderExercises(threeExercises, 2, 'up');

    expect(result[0].exercise.id).toBe(1);
    expect(result[1].exercise.id).toBe(3);
    expect(result[2].exercise.id).toBe(2);
  });

  it('should not move the first exercise up', () => {
    const result = reorderExercises(threeExercises, 0, 'up');

    expect(result).toBe(threeExercises);
    expect(result[0].exercise.id).toBe(1);
    expect(result[1].exercise.id).toBe(2);
    expect(result[2].exercise.id).toBe(3);
  });

  it('should not move the last exercise down', () => {
    const result = reorderExercises(threeExercises, 2, 'down');

    expect(result).toBe(threeExercises);
    expect(result[0].exercise.id).toBe(1);
    expect(result[1].exercise.id).toBe(2);
    expect(result[2].exercise.id).toBe(3);
  });

  it('should preserve sets for each exercise after reorder', () => {
    const result = reorderExercises(threeExercises, 0, 'down');

    // Bench Press moved to index 1 — should keep its set
    const benchPress = result[1];
    expect(benchPress.exercise.name).toBe('Bench Press');
    expect(benchPress.sets).toHaveLength(1);
    expect(benchPress.sets[0].id).toBe(10);
    expect(benchPress.sets[0].weight).toBe(80);

    // Squat moved to index 0 — should keep its 2 sets
    const squat = result[0];
    expect(squat.exercise.name).toBe('Squat');
    expect(squat.sets).toHaveLength(2);
    expect(squat.sets[0].id).toBe(20);
    expect(squat.sets[1].id).toBe(21);

    // Deadlift stays at index 2 — should keep its set
    const deadlift = result[2];
    expect(deadlift.exercise.name).toBe('Deadlift');
    expect(deadlift.sets).toHaveLength(1);
    expect(deadlift.sets[0].id).toBe(30);
  });

  it('should return same reference for out-of-bounds index', () => {
    const resultNeg = reorderExercises(threeExercises, -1, 'up');
    expect(resultNeg).toBe(threeExercises);

    const resultOver = reorderExercises(threeExercises, 5, 'down');
    expect(resultOver).toBe(threeExercises);
  });

  it('should handle single exercise list', () => {
    const singleExercise = [createExerciseState({ id: 1, name: 'Curl' })];

    const resultUp = reorderExercises(singleExercise, 0, 'up');
    expect(resultUp).toBe(singleExercise);

    const resultDown = reorderExercises(singleExercise, 0, 'down');
    expect(resultDown).toBe(singleExercise);
  });

  it('should handle empty exercise list', () => {
    const result = reorderExercises([], 0, 'down');
    expect(result).toEqual([]);
  });

  it('should not mutate the original array', () => {
    const original = [...threeExercises];
    reorderExercises(threeExercises, 0, 'down');

    expect(threeExercises[0].exercise.id).toBe(original[0].exercise.id);
    expect(threeExercises[1].exercise.id).toBe(original[1].exercise.id);
    expect(threeExercises[2].exercise.id).toBe(original[2].exercise.id);
  });

  it('should swap middle exercise up correctly', () => {
    const result = reorderExercises(threeExercises, 1, 'up');

    expect(result[0].exercise.id).toBe(2);
    expect(result[1].exercise.id).toBe(1);
    expect(result[2].exercise.id).toBe(3);
  });

  it('should swap middle exercise down correctly', () => {
    const result = reorderExercises(threeExercises, 1, 'down');

    expect(result[0].exercise.id).toBe(1);
    expect(result[1].exercise.id).toBe(3);
    expect(result[2].exercise.id).toBe(2);
  });
});
