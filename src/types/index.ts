export type ExerciseType = 'weights' | 'cardio' | 'calisthenics' | 'hiit' | 'flexibility';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body';

export interface Exercise {
  id: number;
  name: string;
  type: ExerciseType;
  muscleGroup: MuscleGroup;
  illustration: string | null;
  restSeconds: number;
  createdAt: string;
}

export interface Routine {
  id: number;
  name: string;
  createdAt: string;
}

export interface RoutineExercise {
  id: number;
  routineId: number;
  exerciseId: number;
  order: number;
}

export interface Workout {
  id: number;
  routineId: number | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exerciseId: number;
  order: number;
  weight: number | null;
  reps: number | null;
  duration: number | null;
  distance: number | null;
}

export interface WorkoutHistoryItem extends Workout {
  routineName: string | null;
  exerciseCount: number;
}

export interface ExercisePR {
  exerciseId: number;
  exerciseName: string;
  maxWeight: number;
  date: string;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface MaxWeightDataPoint {
  date: string;
  maxWeight: number;
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  totalVolume: number;
}

export interface DashboardStats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
  recentPRs: ExercisePR[];
}

export interface ExerciseStats {
  currentPR: number | null;
  lastWorkoutDate: string | null;
  totalSessions: number;
  averageVolume: number;
}

export type TimePeriod = '1w' | '1m' | '3m' | '6m' | 'all';
