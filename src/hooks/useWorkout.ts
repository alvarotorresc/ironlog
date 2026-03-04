import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '@/db/connection';
import { WorkoutRepository } from '@/repositories/workout.repo';
import { RoutineRepository } from '@/repositories/routine.repo';
import type { Exercise, WorkoutSet } from '@/types';

export interface WorkoutExerciseState {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export function reorderExercises(
  exercises: WorkoutExerciseState[],
  index: number,
  direction: 'up' | 'down',
): WorkoutExerciseState[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (
    index < 0 ||
    index >= exercises.length ||
    targetIndex < 0 ||
    targetIndex >= exercises.length
  ) {
    return exercises;
  }

  const reordered = [...exercises];
  const temp = reordered[index];
  reordered[index] = reordered[targetIndex];
  reordered[targetIndex] = temp;
  return reordered;
}

interface UseWorkoutReturn {
  workoutId: number | null;
  routineName: string;
  exercises: WorkoutExerciseState[];
  elapsedSeconds: number;
  loading: boolean;
  addSet: (exerciseId: number) => Promise<WorkoutSet | null>;
  updateSet: (
    setId: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      distance?: number | null;
    },
  ) => Promise<void>;
  updateSetNotes: (setId: number, notes: string | null) => Promise<void>;
  deleteSet: (setId: number, exerciseId: number) => Promise<void>;
  addExercise: (exercise: Exercise) => void;
  reorderExercise: (exerciseIndex: number, direction: 'up' | 'down') => void;
  finishWorkout: () => Promise<void>;
  abandonWorkout: () => Promise<void>;
  isFinished: boolean;
}

export function useWorkout(routineIdParam: string, workoutIdParam: string): UseWorkoutReturn {
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<WorkoutExerciseState[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize workout on mount
  useEffect(() => {
    async function init() {
      try {
        const db = await getDatabase();
        const wId = parseInt(workoutIdParam, 10);
        if (isNaN(wId)) return;
        setWorkoutId(wId);

        const isEmptyWorkout = routineIdParam === 'empty';

        if (!isEmptyWorkout) {
          const routineId = parseInt(routineIdParam, 10);
          if (isNaN(routineId)) return;

          const routineRepo = new RoutineRepository(db);
          const routine = await routineRepo.getById(routineId);

          if (routine) {
            setRoutineName(routine.name);
            setExercises(
              routine.exercises.map((re) => ({
                exercise: re.exercise,
                sets: [],
              })),
            );
          }
        } else {
          setRoutineName('Empty Workout');
        }

        // Check if workout already has sets (in case of app restart)
        const workoutRepo = new WorkoutRepository(db);
        const detail = await workoutRepo.getDetail(wId);
        if (detail) {
          // Restore elapsed time from started_at
          const startTime = new Date(detail.startedAt + 'Z').getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (elapsed > 0) {
            setElapsedSeconds(elapsed);
          }

          if (detail.exercises.length > 0) {
            setExercises((prev) => {
              const merged = [...prev];
              for (const group of detail.exercises) {
                const existingIndex = merged.findIndex((e) => e.exercise.id === group.exercise.id);
                if (existingIndex >= 0) {
                  merged[existingIndex] = { ...merged[existingIndex], sets: group.sets };
                } else {
                  merged.push(group);
                }
              }
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Failed to initialize workout:', error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [routineIdParam, workoutIdParam]);

  // Elapsed time counter
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const addSet = useCallback(
    async (exerciseId: number): Promise<WorkoutSet | null> => {
      if (!workoutId) return null;

      try {
        const db = await getDatabase();
        const workoutRepo = new WorkoutRepository(db);

        // Get the last set for this exercise to copy values (fallback to previous workout)
        let lastSet = await workoutRepo.getLastSetForExercise(workoutId, exerciseId);
        if (!lastSet) {
          lastSet = await workoutRepo.getLastSetFromPreviousWorkout(exerciseId);
        }

        // Determine the next order
        const exerciseState = exercises.find((e) => e.exercise.id === exerciseId);
        const nextOrder = exerciseState
          ? exerciseState.sets.length > 0
            ? Math.max(...exerciseState.sets.map((s) => s.order)) + 1
            : 1
          : 1;

        const newSet = await workoutRepo.addSet({
          workoutId,
          exerciseId,
          order: nextOrder,
          weight: lastSet?.weight ?? null,
          reps: lastSet?.reps ?? null,
          duration: lastSet?.duration ?? null,
          distance: lastSet?.distance ?? null,
        });

        setExercises((prev) =>
          prev.map((e) => (e.exercise.id === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e)),
        );

        return newSet;
      } catch (error) {
        console.error('Failed to add set:', error);
        return null;
      }
    },
    [workoutId, exercises],
  );

  const updateSet = useCallback(
    async (
      setId: number,
      data: {
        weight?: number | null;
        reps?: number | null;
        duration?: number | null;
        distance?: number | null;
      },
    ) => {
      try {
        const db = await getDatabase();
        const workoutRepo = new WorkoutRepository(db);
        await workoutRepo.updateSet(setId, data);

        setExercises((prev) =>
          prev.map((e) => ({
            ...e,
            sets: e.sets.map((s) => (s.id === setId ? { ...s, ...data } : s)),
          })),
        );
      } catch (error) {
        console.error('Failed to update set:', error);
      }
    },
    [],
  );

  const updateSetNotes = useCallback(async (setId: number, notes: string | null) => {
    try {
      const db = await getDatabase();
      const workoutRepo = new WorkoutRepository(db);
      await workoutRepo.updateSet(setId, { notes });

      setExercises((prev) =>
        prev.map((e) => ({
          ...e,
          sets: e.sets.map((s) => (s.id === setId ? { ...s, notes } : s)),
        })),
      );
    } catch (error) {
      console.error('Failed to update set notes:', error);
    }
  }, []);

  const deleteSet = useCallback(async (setId: number, exerciseId: number) => {
    try {
      const db = await getDatabase();
      const workoutRepo = new WorkoutRepository(db);
      await workoutRepo.deleteSet(setId);

      setExercises((prev) =>
        prev.map((e) =>
          e.exercise.id === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e,
        ),
      );
    } catch (error) {
      console.error('Failed to delete set:', error);
    }
  }, []);

  const addExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => {
      const exists = prev.some((e) => e.exercise.id === exercise.id);
      if (exists) return prev;
      return [...prev, { exercise, sets: [] }];
    });
  }, []);

  const reorderExercise = useCallback((exerciseIndex: number, direction: 'up' | 'down') => {
    setExercises((prev) => reorderExercises(prev, exerciseIndex, direction));
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!workoutId) return;

    try {
      const db = await getDatabase();
      const workoutRepo = new WorkoutRepository(db);
      await workoutRepo.finish(workoutId);
      setIsFinished(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Failed to finish workout:', error);
    }
  }, [workoutId]);

  const abandonWorkout = useCallback(async () => {
    if (!workoutId) return;
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const db = await getDatabase();
      const workoutRepo = new WorkoutRepository(db);
      await workoutRepo.delete(workoutId);
      setIsFinished(true);
    } catch (error) {
      console.error('Failed to abandon workout:', error);
    }
  }, [workoutId]);

  return {
    workoutId,
    routineName,
    exercises,
    elapsedSeconds,
    loading,
    addSet,
    updateSet,
    updateSetNotes,
    deleteSet,
    addExercise,
    reorderExercise,
    finishWorkout,
    abandonWorkout,
    isFinished,
  };
}
