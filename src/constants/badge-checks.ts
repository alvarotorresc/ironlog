import type { TranslationKey } from '@/i18n/en';

/**
 * Stats snapshot used to evaluate badge conditions.
 * Gathered from BadgeRepository.gatherStats() at badge-check time.
 */
export interface BadgeCheckStats {
  totalWorkouts: number;
  currentStreak: number;
  totalVolume: number;
  distinctExercises: number;
  totalMeasurements: number;
  hasEarlyBirdWorkout: boolean;
}

/**
 * Badge check definition — pure data, no RN/icon dependencies.
 * Safe to import in Node test environment.
 */
export interface BadgeCheck {
  key: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  check: (stats: BadgeCheckStats) => boolean;
}

export const BADGE_CHECKS: BadgeCheck[] = [
  // Workout milestones
  {
    key: 'first_workout',
    titleKey: 'badge.first_workout.title',
    descriptionKey: 'badge.first_workout.desc',
    check: (stats) => stats.totalWorkouts >= 1,
  },
  {
    key: 'workout_10',
    titleKey: 'badge.workout_10.title',
    descriptionKey: 'badge.workout_10.desc',
    check: (stats) => stats.totalWorkouts >= 10,
  },
  {
    key: 'workout_50',
    titleKey: 'badge.workout_50.title',
    descriptionKey: 'badge.workout_50.desc',
    check: (stats) => stats.totalWorkouts >= 50,
  },
  {
    key: 'workout_100',
    titleKey: 'badge.workout_100.title',
    descriptionKey: 'badge.workout_100.desc',
    check: (stats) => stats.totalWorkouts >= 100,
  },

  // Streak
  {
    key: 'streak_3',
    titleKey: 'badge.streak_3.title',
    descriptionKey: 'badge.streak_3.desc',
    check: (stats) => stats.currentStreak >= 3,
  },
  {
    key: 'streak_7',
    titleKey: 'badge.streak_7.title',
    descriptionKey: 'badge.streak_7.desc',
    check: (stats) => stats.currentStreak >= 7,
  },
  {
    key: 'streak_30',
    titleKey: 'badge.streak_30.title',
    descriptionKey: 'badge.streak_30.desc',
    check: (stats) => stats.currentStreak >= 30,
  },

  // Volume
  {
    key: 'volume_1000',
    titleKey: 'badge.volume_1000.title',
    descriptionKey: 'badge.volume_1000.desc',
    check: (stats) => stats.totalVolume >= 1000,
  },
  {
    key: 'volume_10000',
    titleKey: 'badge.volume_10000.title',
    descriptionKey: 'badge.volume_10000.desc',
    check: (stats) => stats.totalVolume >= 10000,
  },
  {
    key: 'volume_100000',
    titleKey: 'badge.volume_100000.title',
    descriptionKey: 'badge.volume_100000.desc',
    check: (stats) => stats.totalVolume >= 100000,
  },

  // Exercise variety
  {
    key: 'exercises_10',
    titleKey: 'badge.exercises_10.title',
    descriptionKey: 'badge.exercises_10.desc',
    check: (stats) => stats.distinctExercises >= 10,
  },
  {
    key: 'exercises_25',
    titleKey: 'badge.exercises_25.title',
    descriptionKey: 'badge.exercises_25.desc',
    check: (stats) => stats.distinctExercises >= 25,
  },

  // Body tracking
  {
    key: 'first_measurement',
    titleKey: 'badge.first_measurement.title',
    descriptionKey: 'badge.first_measurement.desc',
    check: (stats) => stats.totalMeasurements >= 1,
  },
  {
    key: 'measurements_10',
    titleKey: 'badge.measurements_10.title',
    descriptionKey: 'badge.measurements_10.desc',
    check: (stats) => stats.totalMeasurements >= 10,
  },

  // Special
  {
    key: 'early_bird',
    titleKey: 'badge.early_bird.title',
    descriptionKey: 'badge.early_bird.desc',
    check: (stats) => stats.hasEarlyBirdWorkout,
  },
];

export const TOTAL_BADGES = BADGE_CHECKS.length;
