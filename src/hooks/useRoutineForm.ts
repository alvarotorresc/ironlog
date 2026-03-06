import { useState, useCallback, useRef } from 'react';
import type { Exercise, GroupType } from '@/types';

export interface RoutineExerciseItem {
  exerciseId: number;
  name: string;
  illustration: string | null;
  muscleGroup: string;
  notes: string | null;
  groupId: number | null;
  groupType: GroupType | null;
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
  const nextGroupIdRef = useRef(
    initialExercises.reduce((max, e) => Math.max(max, e.groupId ?? 0), 0) + 1,
  );

  const addExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        illustration: exercise.illustration,
        muscleGroup: exercise.muscleGroup,
        notes: exercise.notes,
        groupId: null,
        groupType: null,
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

  const groupExercises = useCallback((indices: number[], groupType: GroupType) => {
    const groupId = nextGroupIdRef.current;
    nextGroupIdRef.current += 1;

    setExercises((prev) =>
      prev.map((item, i) => (indices.includes(i) ? { ...item, groupId, groupType } : item)),
    );

    return groupId;
  }, []);

  const ungroupExercise = useCallback((index: number) => {
    setExercises((prev) =>
      prev.map((item, i) => (i === index ? { ...item, groupId: null, groupType: null } : item)),
    );
  }, []);

  const ungroupAll = useCallback((groupId: number) => {
    setExercises((prev) =>
      prev.map((item) =>
        item.groupId === groupId ? { ...item, groupId: null, groupType: null } : item,
      ),
    );
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
    nextGroupIdRef.current = newExercises.reduce((max, e) => Math.max(max, e.groupId ?? 0), 0) + 1;
  }, []);

  return {
    name,
    setName,
    exercises,
    errors,
    addExercise,
    removeExercise,
    moveExercise,
    groupExercises,
    ungroupExercise,
    ungroupAll,
    validate,
    clearNameError,
    resetForm,
  };
}
