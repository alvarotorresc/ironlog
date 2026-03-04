import type { TranslationKey } from '@/i18n/en';

export interface RoutineTemplateDefinition {
  nameKey: TranslationKey;
  exerciseNames: string[];
}

/**
 * 6 predefined routine templates that users can clone.
 * Exercise names must match exactly with PREDEFINED_EXERCISES names.
 */
export const ROUTINE_TEMPLATES: RoutineTemplateDefinition[] = [
  {
    nameKey: 'template.pushDay',
    exerciseNames: [
      'Bench Press',
      'Incline Dumbbell Press',
      'Overhead Press',
      'Lateral Raise',
      'Tricep Pushdown',
      'Dumbbell Fly',
    ],
  },
  {
    nameKey: 'template.pullDay',
    exerciseNames: [
      'Deadlift',
      'Barbell Row',
      'Lat Pulldown',
      'Face Pull',
      'Barbell Curl',
      'Hammer Curl',
    ],
  },
  {
    nameKey: 'template.legDay',
    exerciseNames: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Lunges'],
  },
  {
    nameKey: 'template.upperBody',
    exerciseNames: [
      'Bench Press',
      'Barbell Row',
      'Overhead Press',
      'Lat Pulldown',
      'Barbell Curl',
      'Tricep Pushdown',
    ],
  },
  {
    nameKey: 'template.lowerBody',
    exerciseNames: [
      'Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Leg Curl',
      'Calf Raise',
      'Hip Thrust',
    ],
  },
  {
    nameKey: 'template.fullBody',
    exerciseNames: [
      'Squat',
      'Bench Press',
      'Barbell Row',
      'Overhead Press',
      'Deadlift',
      'Barbell Curl',
    ],
  },
];
