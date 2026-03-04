export type ExerciseType = 'weights' | 'cardio' | 'calisthenics' | 'hiit' | 'flexibility';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body';

export type GroupType = 'superset' | 'circuit' | 'dropset';

export interface Exercise {
  id: number;
  name: string;
  type: ExerciseType;
  muscleGroup: MuscleGroup;
  muscleGroups: MuscleGroup[];
  isPredefined: boolean;
  illustration: string | null;
  restSeconds: number;
  notes: string | null;
  createdAt: string;
}

export interface Routine {
  id: number;
  name: string;
  isTemplate: boolean;
  description: string | null;
  createdAt: string;
}

export interface RoutineExercise {
  id: number;
  routineId: number;
  exerciseId: number;
  order: number;
  groupId: number | null;
  groupType: GroupType | null;
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
  groupId: number | null;
  groupType: GroupType | null;
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

export interface BodyMeasurement {
  id: number;
  weight: number | null;
  bodyFat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  biceps: number | null;
  thighs: number | null;
  notes: string | null;
  measuredAt: string;
}

export interface WeightDataPoint {
  date: string;
  weight: number;
}

export type FatigueLevel = 'weakened' | 'recovering' | 'recovered' | 'rested';

export interface MuscleFatigueData {
  muscleGroup: MuscleGroup;
  level: FatigueLevel;
  daysSince: number | null;
}

export type BodyMetricField =
  | 'weight'
  | 'body_fat'
  | 'chest'
  | 'waist'
  | 'hips'
  | 'biceps'
  | 'thighs';

export interface BodyMetricDataPoint {
  date: string;
  value: number;
}

// Backup / Restore

export interface ExerciseExport {
  id: number;
  name: string;
  type: string;
  muscleGroup: string;
  muscleGroups?: string[];
  illustration: string | null;
  restSeconds: number;
  notes?: string | null;
  createdAt: string;
}

export interface RoutineExport {
  id: number;
  name: string;
  createdAt: string;
  exercises: Array<{ exerciseId: number; sortOrder: number }>;
}

export interface WorkoutExport {
  id: number;
  routineId: number | null;
  startedAt: string;
  finishedAt: string | null;
  sets: Array<{
    exerciseId: number;
    sortOrder: number;
    weight: number | null;
    reps: number | null;
    duration: number | null;
    distance: number | null;
  }>;
}

export interface BodyMeasurementExport {
  weight: number | null;
  bodyFat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  biceps: number | null;
  thighs: number | null;
  notes: string | null;
  measuredAt: string;
}

export interface IronLogBackup {
  version: 1 | 2;
  exportedAt: string;
  exercises: ExerciseExport[];
  routines: RoutineExport[];
  workouts: WorkoutExport[];
  bodyMeasurements: BodyMeasurementExport[];
}

// Body photos

export interface BodyPhoto {
  id: number;
  measurementId: number;
  photoPath: string;
  createdAt: string;
}

// User settings

export interface UserSetting {
  key: string;
  value: string;
}

// Badges

export interface Badge {
  id: number;
  badgeKey: string;
  unlockedAt: string;
}
