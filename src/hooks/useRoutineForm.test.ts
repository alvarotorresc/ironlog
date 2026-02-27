import { renderHook, act } from '@testing-library/react-hooks';
import { useRoutineForm, type RoutineExerciseItem } from './useRoutineForm';
import type { Exercise } from '@/types';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    name: 'Bench Press',
    type: 'weights',
    muscleGroup: 'chest',
    illustration: 'bench-press',
    restSeconds: 90,
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function makeExerciseItem(overrides: Partial<RoutineExerciseItem> = {}): RoutineExerciseItem {
  return {
    exerciseId: 1,
    name: 'Bench Press',
    illustration: 'bench-press',
    muscleGroup: 'chest',
    ...overrides,
  };
}

describe('useRoutineForm', () => {
  it('should initialize with defaults when no arguments provided', () => {
    const { result } = renderHook(() => useRoutineForm());

    expect(result.current.name).toBe('');
    expect(result.current.exercises).toEqual([]);
    expect(result.current.errors).toEqual({});
  });

  it('should initialize with provided values', () => {
    const items = [makeExerciseItem()];
    const { result } = renderHook(() => useRoutineForm('Push Day', items));

    expect(result.current.name).toBe('Push Day');
    expect(result.current.exercises).toEqual(items);
  });

  describe('validate', () => {
    it('should return false and set name error when name is empty', () => {
      const { result } = renderHook(() => useRoutineForm('', [makeExerciseItem()]));

      let valid: boolean;
      act(() => {
        valid = result.current.validate();
      });

      expect(valid!).toBe(false);
      expect(result.current.errors.name).toBe('Routine name is required');
    });

    it('should return false and set name error when name is only whitespace', () => {
      const { result } = renderHook(() => useRoutineForm('   ', [makeExerciseItem()]));

      let valid: boolean;
      act(() => {
        valid = result.current.validate();
      });

      expect(valid!).toBe(false);
      expect(result.current.errors.name).toBe('Routine name is required');
    });

    it('should return false and set exercises error when exercise list is empty', () => {
      const { result } = renderHook(() => useRoutineForm('Push Day', []));

      let valid: boolean;
      act(() => {
        valid = result.current.validate();
      });

      expect(valid!).toBe(false);
      expect(result.current.errors.exercises).toBe('Add at least 1 exercise');
    });

    it('should return false and set both errors when name empty and no exercises', () => {
      const { result } = renderHook(() => useRoutineForm());

      let valid: boolean;
      act(() => {
        valid = result.current.validate();
      });

      expect(valid!).toBe(false);
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.exercises).toBeDefined();
    });

    it('should return true when name and exercises are valid', () => {
      const { result } = renderHook(() => useRoutineForm('Push Day', [makeExerciseItem()]));

      let valid: boolean;
      act(() => {
        valid = result.current.validate();
      });

      expect(valid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('addExercise', () => {
    it('should append exercise to the list', () => {
      const { result } = renderHook(() => useRoutineForm());

      act(() => {
        result.current.addExercise(makeExercise());
      });

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].exerciseId).toBe(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });

    it('should clear exercises error when adding an exercise', () => {
      const { result } = renderHook(() => useRoutineForm());

      // Trigger validation to set exercises error
      act(() => {
        result.current.validate();
      });
      expect(result.current.errors.exercises).toBeDefined();

      // Add exercise should clear the error
      act(() => {
        result.current.addExercise(makeExercise());
      });
      expect(result.current.errors.exercises).toBeUndefined();
    });
  });

  describe('removeExercise', () => {
    it('should remove exercise at given index', () => {
      const items = [
        makeExerciseItem({ exerciseId: 1, name: 'Bench Press' }),
        makeExerciseItem({ exerciseId: 2, name: 'Squat' }),
        makeExerciseItem({ exerciseId: 3, name: 'Deadlift' }),
      ];
      const { result } = renderHook(() => useRoutineForm('Day', items));

      act(() => {
        result.current.removeExercise(1);
      });

      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises[0].name).toBe('Bench Press');
      expect(result.current.exercises[1].name).toBe('Deadlift');
    });
  });

  describe('moveExercise', () => {
    const items = [
      makeExerciseItem({ exerciseId: 1, name: 'Bench Press' }),
      makeExerciseItem({ exerciseId: 2, name: 'Squat' }),
      makeExerciseItem({ exerciseId: 3, name: 'Deadlift' }),
    ];

    it('should swap exercise up when direction is up', () => {
      const { result } = renderHook(() => useRoutineForm('Day', items));

      act(() => {
        result.current.moveExercise(1, 'up');
      });

      expect(result.current.exercises[0].name).toBe('Squat');
      expect(result.current.exercises[1].name).toBe('Bench Press');
      expect(result.current.exercises[2].name).toBe('Deadlift');
    });

    it('should swap exercise down when direction is down', () => {
      const { result } = renderHook(() => useRoutineForm('Day', items));

      act(() => {
        result.current.moveExercise(0, 'down');
      });

      expect(result.current.exercises[0].name).toBe('Squat');
      expect(result.current.exercises[1].name).toBe('Bench Press');
      expect(result.current.exercises[2].name).toBe('Deadlift');
    });

    it('should no-op when moving first item up', () => {
      const { result } = renderHook(() => useRoutineForm('Day', items));

      act(() => {
        result.current.moveExercise(0, 'up');
      });

      expect(result.current.exercises[0].name).toBe('Bench Press');
      expect(result.current.exercises[1].name).toBe('Squat');
      expect(result.current.exercises[2].name).toBe('Deadlift');
    });

    it('should no-op when moving last item down', () => {
      const { result } = renderHook(() => useRoutineForm('Day', items));

      act(() => {
        result.current.moveExercise(2, 'down');
      });

      expect(result.current.exercises[0].name).toBe('Bench Press');
      expect(result.current.exercises[1].name).toBe('Squat');
      expect(result.current.exercises[2].name).toBe('Deadlift');
    });
  });

  describe('clearNameError', () => {
    it('should clear only the name error', () => {
      const { result } = renderHook(() => useRoutineForm());

      // Set both errors
      act(() => {
        result.current.validate();
      });
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.exercises).toBeDefined();

      // Clear name error
      act(() => {
        result.current.clearNameError();
      });

      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.exercises).toBeDefined();
    });
  });

  describe('resetForm', () => {
    it('should reset name, exercises, and errors', () => {
      const { result } = renderHook(() => useRoutineForm());

      // Trigger validation errors
      act(() => {
        result.current.validate();
      });
      expect(result.current.errors.name).toBeDefined();

      // Reset
      const newExercises = [makeExerciseItem({ exerciseId: 5, name: 'Pull-ups' })];
      act(() => {
        result.current.resetForm('New Name', newExercises);
      });

      expect(result.current.name).toBe('New Name');
      expect(result.current.exercises).toEqual(newExercises);
      expect(result.current.errors).toEqual({});
    });
  });
});
