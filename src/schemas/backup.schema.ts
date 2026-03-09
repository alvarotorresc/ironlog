import { z } from 'zod';

const exerciseExportSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  type: z.string().min(1),
  muscleGroup: z.string().min(1),
  muscleGroups: z.array(z.string().min(1)).optional(),
  illustration: z.string().nullable(),
  restSeconds: z.number().int().min(0),
  notes: z.string().max(500).nullable().optional(),
  createdAt: z.string().min(1),
});

const routineExportSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  createdAt: z.string().min(1),
  exercises: z.array(
    z.object({
      exerciseId: z.number().int().positive(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});

const workoutSetSchema = z.object({
  exerciseId: z.number().int().positive(),
  sortOrder: z.number().int().min(0),
  weight: z.number().nullable(),
  reps: z.number().int().nullable(),
  duration: z.number().nullable(),
  distance: z.number().nullable(),
  notes: z.string().max(500).nullable().optional(),
});

const workoutExportSchema = z.object({
  id: z.number().int().positive(),
  routineId: z.number().int().positive().nullable(),
  startedAt: z.string().min(1),
  finishedAt: z.string().nullable(),
  sets: z.array(workoutSetSchema),
});

const bodyMeasurementExportSchema = z.object({
  weight: z.number().nullable(),
  bodyFat: z.number().nullable(),
  chest: z.number().nullable(),
  waist: z.number().nullable(),
  hips: z.number().nullable(),
  biceps: z.number().nullable(),
  thighs: z.number().nullable(),
  notes: z.string().max(500).nullable(),
  measuredAt: z.string().min(1),
  photoPaths: z.array(z.string()).optional(),
});

const settingExportSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const badgeExportSchema = z.object({
  badgeKey: z.string().min(1),
  unlockedAt: z.string().min(1),
});

export const backupSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string().min(1),
  exercises: z.array(exerciseExportSchema),
  routines: z.array(routineExportSchema),
  workouts: z.array(workoutExportSchema),
  bodyMeasurements: z.array(bodyMeasurementExportSchema),
  settings: z.array(settingExportSchema).optional(),
  badges: z.array(badgeExportSchema).optional(),
});

export type ValidatedBackup = z.infer<typeof backupSchema>;
