import { useState, useCallback } from 'react';
import type { Exercise } from '@/types';

export interface RoutineExerciseItem {
  exerciseId: number;
  name: string;
  illustration: string | null;
  muscleGroup: string;
  notes: string | null;
}

interface FormErrors {
  name?: string;
  exercises?: string;
}

export function useRoutineForm(
  initialName: string = '',
  initialExercises: RoutineExerciseItem[] = [],
) {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<RoutineExerciseItem[]>(initialExercises);
  const [errors, setErrors] = useState<FormErrors>({});

  const addExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        illustration: exercise.illustration,
        muscleGroup: exercise.muscleGroup,
        notes: exercise.notes,
      },
    ]);
    setErrors((prev) => ({ ...prev, exercises: undefined }));
  }, []);

  const removeExercise = useCallback((index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    setExercises((prev) => {
      const newList = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newList.length) return prev;

      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;

      return newList;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Routine name is required';
    }

    if (exercises.length === 0) {
      newErrors.exercises = 'Add at least 1 exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, exercises]);

  const clearNameError = useCallback(() => {
    setErrors((prev) => ({ ...prev, name: undefined }));
  }, []);

  const resetForm = useCallback((newName: string, newExercises: RoutineExerciseItem[]) => {
    setName(newName);
    setExercises(newExercises);
    setErrors({});
  }, []);

  return {
    name,
    setName,
    exercises,
    errors,
    addExercise,
    removeExercise,
    moveExercise,
    validate,
    clearNameError,
    resetForm,
  };
}
