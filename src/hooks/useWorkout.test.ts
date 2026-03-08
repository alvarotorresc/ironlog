import { renderHook, waitFor, act } from '@testing-library/react';
import { reorderExercises, useWorkout } from './useWorkout';
import type { WorkoutExerciseState } from './useWorkout';
import type { Exercise, WorkoutSet } from '@/types';
import { getDatabase } from '@/db/connection';

// Mock getDatabase
jest.mock('@/db/connection', () => ({
  getDatabase: jest.fn().mockResolvedValue({}),
}));

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

// Mock repositories
const mockGetById = jest.fn();
const mockGetDetail = jest.fn();
const mockAddSet = jest.fn();
const mockUpdateSet = jest.fn();
const mockDeleteSet = jest.fn();
const mockFinish = jest.fn();
const mockDelete = jest.fn();
const mockGetLastSetForExercise = jest.fn();
const mockGetLastSetFromPreviousWorkout = jest.fn();

jest.mock('@/repositories/workout.repo', () => ({
  WorkoutRepository: jest.fn().mockImplementation(() => ({
    getDetail: mockGetDetail,
    addSet: mockAddSet,
    updateSet: mockUpdateSet,
    deleteSet: mockDeleteSet,
    finish: mockFinish,
    delete: mockDelete,
    getLastSetForExercise: mockGetLastSetForExercise,
    getLastSetFromPreviousWorkout: mockGetLastSetFromPreviousWorkout,
  })),
}));

jest.mock('@/repositories/routine.repo', () => ({
  RoutineRepository: jest.fn().mockImplementation(() => ({
    getById: mockGetById,
  })),
}));

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
    notes: null,
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
    notes: null,
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
    groupId: null,
    groupType: null,
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

describe('useWorkout', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetDetail.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderWorkoutHook(routineId = '1', workoutId = '1') {
    return renderHook(() => useWorkout(routineId, workoutId));
  }

  function createRoutine(exercises: Partial<Exercise>[] = []) {
    return {
      id: 1,
      name: 'Push Day',
      isTemplate: false,
      description: null,
      createdAt: '2024-01-01',
      exercises: exercises.map((ex, i) => ({
        id: i + 1,
        routineId: 1,
        exerciseId: ex.id ?? i + 1,
        order: i + 1,
        groupId: null,
        groupType: null,
        exercise: createExercise(ex),
      })),
    };
  }

  // --- Initialization ---

  describe('initialization', () => {
    it('should set routineName to Empty Workout when routineIdParam is empty', async () => {
      const { result } = renderWorkoutHook('empty', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.routineName).toBe('Empty Workout');
      expect(result.current.workoutId).toBe(1);
    });

    it('should load routine and map exercises when routineIdParam is a number', async () => {
      const routine = createRoutine([
        { id: 1, name: 'Bench Press' },
        { id: 2, name: 'Overhead Press' },
      ]);
      mockGetById.mockResolvedValue(routine);

      const { result } = renderWorkoutHook('1', '5');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.routineName).toBe('Push Day');
      expect(result.current.workoutId).toBe(5);
      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises[0].exercise.name).toBe('Bench Press');
      expect(result.current.exercises[1].exercise.name).toBe('Overhead Press');
      expect(result.current.exercises[0].sets).toEqual([]);
    });

    it('should restore sets from existing workout detail', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetDetail.mockResolvedValue({
        id: 1,
        routineId: 1,
        startedAt: new Date(Date.now() - 120_000).toISOString().replace('Z', ''),
        finishedAt: null,
        routineName: 'Push Day',
        exercises: [
          {
            exercise: createExercise({ id: 1 }),
            sets: [createSet({ id: 10, weight: 60, reps: 12 })],
          },
        ],
      });

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exercises[0].sets).toHaveLength(1);
      expect(result.current.exercises[0].sets[0].weight).toBe(60);
    });

    it('should add exercises from detail that are not in the routine', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetDetail.mockResolvedValue({
        id: 1,
        routineId: 1,
        startedAt: new Date(Date.now() - 10_000).toISOString().replace('Z', ''),
        finishedAt: null,
        routineName: 'Push Day',
        exercises: [
          {
            exercise: createExercise({ id: 99, name: 'Extra Exercise' }),
            sets: [createSet({ id: 50, exerciseId: 99 })],
          },
        ],
      });

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises[1].exercise.name).toBe('Extra Exercise');
    });

    it('should restore elapsed time from startedAt', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 300_000).toISOString().replace('Z', '');
      mockGetDetail.mockResolvedValue({
        id: 1,
        routineId: null,
        startedAt: fiveMinutesAgo,
        finishedAt: null,
        routineName: null,
        exercises: [],
      });

      const { result } = renderWorkoutHook('empty', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(299);
    });

    it('should return early when workoutIdParam is NaN', async () => {
      const { result } = renderWorkoutHook('1', 'invalid');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.workoutId).toBeNull();
      expect(mockGetById).not.toHaveBeenCalled();
    });

    it('should return early when routineIdParam is NaN for non-empty workout', async () => {
      const { result } = renderWorkoutHook('invalid', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // workoutId gets set before routineId check, but routine is not loaded
      expect(mockGetById).not.toHaveBeenCalled();
    });

    it('should log error and set loading false when getDatabase throws', async () => {
      mockGetDatabase.mockRejectedValueOnce(new Error('DB error'));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize workout:', expect.any(Error));
    });

    it('should handle routine not found', async () => {
      mockGetById.mockResolvedValue(null);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.routineName).toBe('');
      expect(result.current.exercises).toEqual([]);
    });
  });

  // --- Timer ---

  describe('timer', () => {
    it('should increment elapsedSeconds every second', async () => {
      const { result } = renderWorkoutHook('empty', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialSeconds = result.current.elapsedSeconds;

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.elapsedSeconds).toBe(initialSeconds + 3);
    });
  });

  // --- addSet ---

  describe('addSet', () => {
    it('should return null when workoutId is null', async () => {
      const { result } = renderWorkoutHook('1', 'invalid');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returned: WorkoutSet | null = null;
      await act(async () => {
        returned = await result.current.addSet(1);
      });

      expect(returned).toBeNull();
    });

    it('should add set and update exercises state', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(null);
      const newSet = createSet({ id: 100, weight: null, reps: null, order: 1 });
      mockAddSet.mockResolvedValue(newSet);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returned: WorkoutSet | null = null;
      await act(async () => {
        returned = await result.current.addSet(1);
      });

      expect(returned).toEqual(newSet);
      expect(result.current.exercises[0].sets).toHaveLength(1);
      expect(result.current.exercises[0].sets[0].id).toBe(100);
    });

    it('should copy weight and reps from last set in current workout', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      const lastSet = createSet({ weight: 90, reps: 8 });
      mockGetLastSetForExercise.mockResolvedValue(lastSet);
      const newSet = createSet({ id: 200, weight: 90, reps: 8, order: 1 });
      mockAddSet.mockResolvedValue(newSet);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSet(1);
      });

      expect(mockAddSet).toHaveBeenCalledWith(expect.objectContaining({ weight: 90, reps: 8 }));
    });

    it('should fallback to previous workout set when no current set exists', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      const previousSet = createSet({ weight: 70, reps: 12 });
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(previousSet);
      mockAddSet.mockResolvedValue(createSet({ id: 300 }));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSet(1);
      });

      expect(mockGetLastSetFromPreviousWorkout).toHaveBeenCalledWith(1);
      expect(mockAddSet).toHaveBeenCalledWith(expect.objectContaining({ weight: 70, reps: 12 }));
    });

    it('should return null and log error when addSet fails', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(null);
      mockAddSet.mockRejectedValue(new Error('DB write error'));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returned: WorkoutSet | null = null;
      await act(async () => {
        returned = await result.current.addSet(1);
      });

      expect(returned).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add set:', expect.any(Error));
    });

    it('should calculate correct order for subsequent sets', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(null);
      mockAddSet
        .mockResolvedValueOnce(createSet({ id: 100, order: 1 }))
        .mockResolvedValueOnce(createSet({ id: 101, order: 2 }));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSet(1);
      });
      await act(async () => {
        await result.current.addSet(1);
      });

      expect(mockAddSet).toHaveBeenLastCalledWith(expect.objectContaining({ order: 2 }));
    });
  });

  // --- updateSet ---

  describe('updateSet', () => {
    it('should update set in state', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(null);
      const newSet = createSet({ id: 100, weight: 80, reps: 10 });
      mockAddSet.mockResolvedValue(newSet);
      mockUpdateSet.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSet(1);
      });

      await act(async () => {
        await result.current.updateSet(100, { weight: 100, reps: 8 });
      });

      expect(mockUpdateSet).toHaveBeenCalledWith(100, { weight: 100, reps: 8 });
      expect(result.current.exercises[0].sets[0].weight).toBe(100);
      expect(result.current.exercises[0].sets[0].reps).toBe(8);
    });

    it('should log error when updateSet fails', async () => {
      mockGetById.mockResolvedValue(createRoutine([{ id: 1 }]));
      mockUpdateSet.mockRejectedValue(new Error('Update failed'));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSet(999, { weight: 100 });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update set:', expect.any(Error));
    });
  });

  // --- updateSetNotes ---

  describe('updateSetNotes', () => {
    it('should update notes in state', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(null);
      mockAddSet.mockResolvedValue(createSet({ id: 100, notes: null }));
      mockUpdateSet.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSet(1);
      });

      await act(async () => {
        await result.current.updateSetNotes(100, 'Felt strong');
      });

      expect(mockUpdateSet).toHaveBeenCalledWith(100, { notes: 'Felt strong' });
      expect(result.current.exercises[0].sets[0].notes).toBe('Felt strong');
    });

    it('should log error when updateSetNotes fails', async () => {
      mockUpdateSet.mockRejectedValue(new Error('Notes update failed'));

      const { result } = renderWorkoutHook('empty', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSetNotes(999, 'note');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update set notes:', expect.any(Error));
    });
  });

  // --- deleteSet ---

  describe('deleteSet', () => {
    it('should remove set from state', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);
      mockGetLastSetForExercise.mockResolvedValue(null);
      mockGetLastSetFromPreviousWorkout.mockResolvedValue(null);
      mockAddSet.mockResolvedValue(createSet({ id: 100 }));
      mockDeleteSet.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSet(1);
      });

      expect(result.current.exercises[0].sets).toHaveLength(1);

      await act(async () => {
        await result.current.deleteSet(100, 1);
      });

      expect(mockDeleteSet).toHaveBeenCalledWith(100);
      expect(result.current.exercises[0].sets).toHaveLength(0);
    });

    it('should log error when deleteSet fails', async () => {
      mockDeleteSet.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderWorkoutHook('empty', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteSet(999, 1);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete set:', expect.any(Error));
    });
  });

  // --- addExercise ---

  describe('addExercise', () => {
    it('should add new exercise to state', async () => {
      const { result } = renderWorkoutHook('empty', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.addExercise(createExercise({ id: 5, name: 'Lateral Raise' }));
      });

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].exercise.name).toBe('Lateral Raise');
      expect(result.current.exercises[0].sets).toEqual([]);
      expect(result.current.exercises[0].groupId).toBeNull();
    });

    it('should skip adding exercise when it already exists', async () => {
      const routine = createRoutine([{ id: 1, name: 'Bench Press' }]);
      mockGetById.mockResolvedValue(routine);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const countBefore = result.current.exercises.length;

      act(() => {
        result.current.addExercise(createExercise({ id: 1, name: 'Bench Press' }));
      });

      expect(result.current.exercises).toHaveLength(countBefore);
    });
  });

  // --- reorderExercise ---

  describe('reorderExercise', () => {
    it('should reorder exercises in state', async () => {
      const routine = createRoutine([
        { id: 1, name: 'Bench Press' },
        { id: 2, name: 'Squat' },
      ]);
      mockGetById.mockResolvedValue(routine);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reorderExercise(0, 'down');
      });

      expect(result.current.exercises[0].exercise.name).toBe('Squat');
      expect(result.current.exercises[1].exercise.name).toBe('Bench Press');
    });
  });

  // --- finishWorkout ---

  describe('finishWorkout', () => {
    it('should call repo finish and set isFinished to true', async () => {
      mockGetById.mockResolvedValue(createRoutine([]));
      mockFinish.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.finishWorkout();
      });

      expect(mockFinish).toHaveBeenCalledWith(1);
      expect(result.current.isFinished).toBe(true);
    });

    it('should stop the timer when finishing', async () => {
      mockGetById.mockResolvedValue(createRoutine([]));
      mockFinish.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.finishWorkout();
      });

      const secondsAfterFinish = result.current.elapsedSeconds;

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(secondsAfterFinish);
    });

    it('should return early when workoutId is null', async () => {
      const { result } = renderWorkoutHook('1', 'invalid');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.finishWorkout();
      });

      expect(mockFinish).not.toHaveBeenCalled();
    });

    it('should log error when finish fails', async () => {
      mockGetById.mockResolvedValue(createRoutine([]));
      mockFinish.mockRejectedValue(new Error('Finish error'));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.finishWorkout();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to finish workout:', expect.any(Error));
    });
  });

  // --- abandonWorkout ---

  describe('abandonWorkout', () => {
    it('should call repo delete and set isFinished to true', async () => {
      mockGetById.mockResolvedValue(createRoutine([]));
      mockDelete.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.abandonWorkout();
      });

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(result.current.isFinished).toBe(true);
    });

    it('should stop the timer when abandoning', async () => {
      mockGetById.mockResolvedValue(createRoutine([]));
      mockDelete.mockResolvedValue(undefined);

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.abandonWorkout();
      });

      const secondsAfterAbandon = result.current.elapsedSeconds;

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(secondsAfterAbandon);
    });

    it('should return early when workoutId is null', async () => {
      const { result } = renderWorkoutHook('1', 'invalid');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.abandonWorkout();
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should log error when abandon fails', async () => {
      mockGetById.mockResolvedValue(createRoutine([]));
      mockDelete.mockRejectedValue(new Error('Delete error'));

      const { result } = renderWorkoutHook('1', '1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.abandonWorkout();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to abandon workout:', expect.any(Error));
    });
  });
});
