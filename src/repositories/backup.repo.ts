import { type SQLiteDatabase } from 'expo-sqlite';
import type {
  IronLogBackup,
  ExerciseExport,
  RoutineExport,
  WorkoutExport,
  BodyMeasurementExport,
  SettingExport,
  BadgeExport,
} from '../types';

interface ExerciseRow {
  id: number;
  name: string;
  type: string;
  muscle_group: string;
  illustration: string | null;
  rest_seconds: number;
  notes: string | null;
  created_at: string;
  is_predefined: number;
}

interface RoutineRow {
  id: number;
  name: string;
  created_at: string;
  is_template: number;
  description: string | null;
}

interface RoutineExerciseRow {
  routine_id: number;
  exercise_id: number;
  sort_order: number;
  group_id: number | null;
  group_type: string | null;
}

interface WorkoutRow {
  id: number;
  routine_id: number | null;
  started_at: string;
  finished_at: string | null;
}

interface WorkoutSetRow {
  workout_id: number;
  exercise_id: number;
  sort_order: number;
  weight: number | null;
  reps: number | null;
  duration: number | null;
  distance: number | null;
  notes: string | null;
  group_id: number | null;
  group_type: string | null;
}

interface MuscleGroupRow {
  exercise_id: number;
  muscle_group: string;
  is_primary: number;
}

interface SettingRow {
  key: string;
  value: string;
}

interface BadgeRow {
  badge_key: string;
  unlocked_at: string;
}

interface BodyMeasurementRow {
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  biceps: number | null;
  thighs: number | null;
  notes: string | null;
  measured_at: string;
}

export class BackupRepository {
  constructor(private db: SQLiteDatabase) {}

  async exportData(): Promise<IronLogBackup> {
    // Exercises
    const exerciseRows = await this.db.getAllAsync<ExerciseRow>(
      'SELECT id, name, type, muscle_group, illustration, rest_seconds, notes, created_at, is_predefined FROM exercises ORDER BY id ASC',
    );
    // Muscle groups from pivot table
    const muscleGroupRows = await this.db.getAllAsync<MuscleGroupRow>(
      'SELECT exercise_id, muscle_group, is_primary FROM exercise_muscle_groups ORDER BY exercise_id, is_primary DESC',
    );
    const groupsByExercise = new Map<number, string[]>();
    for (const mg of muscleGroupRows) {
      const list = groupsByExercise.get(mg.exercise_id) ?? [];
      list.push(mg.muscle_group);
      groupsByExercise.set(mg.exercise_id, list);
    }

    const exercises: ExerciseExport[] = exerciseRows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      muscleGroup: row.muscle_group,
      muscleGroups: groupsByExercise.get(row.id) ?? [row.muscle_group],
      illustration: row.illustration,
      restSeconds: row.rest_seconds,
      notes: row.notes,
      createdAt: row.created_at,
      isPredefined: row.is_predefined === 1,
    }));

    // Routines with their exercises
    const routineRows = await this.db.getAllAsync<RoutineRow>(
      'SELECT id, name, created_at, is_template, description FROM routines ORDER BY id ASC',
    );
    const routineExerciseRows = await this.db.getAllAsync<RoutineExerciseRow>(
      'SELECT routine_id, exercise_id, sort_order, group_id, group_type FROM routine_exercises ORDER BY routine_id ASC, sort_order ASC',
    );

    const reByRoutine = new Map<
      number,
      Array<{
        exerciseId: number;
        sortOrder: number;
        groupId: number | null;
        groupType: string | null;
      }>
    >();
    for (const row of routineExerciseRows) {
      const list = reByRoutine.get(row.routine_id) ?? [];
      list.push({
        exerciseId: row.exercise_id,
        sortOrder: row.sort_order,
        groupId: row.group_id,
        groupType: row.group_type,
      });
      reByRoutine.set(row.routine_id, list);
    }

    const routines: RoutineExport[] = routineRows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      isTemplate: row.is_template === 1,
      description: row.description,
      exercises: reByRoutine.get(row.id) ?? [],
    }));

    // Workouts with their sets
    const workoutRows = await this.db.getAllAsync<WorkoutRow>(
      'SELECT id, routine_id, started_at, finished_at FROM workouts ORDER BY id ASC',
    );
    const workoutSetRows = await this.db.getAllAsync<WorkoutSetRow>(
      'SELECT workout_id, exercise_id, sort_order, weight, reps, duration, distance, notes, group_id, group_type FROM workout_sets ORDER BY workout_id ASC, sort_order ASC',
    );

    const setsByWorkout = new Map<number, WorkoutExport['sets']>();
    for (const row of workoutSetRows) {
      const list = setsByWorkout.get(row.workout_id) ?? [];
      list.push({
        exerciseId: row.exercise_id,
        sortOrder: row.sort_order,
        weight: row.weight,
        reps: row.reps,
        duration: row.duration,
        distance: row.distance,
        notes: row.notes,
        groupId: row.group_id,
        groupType: row.group_type,
      });
      setsByWorkout.set(row.workout_id, list);
    }

    const workouts: WorkoutExport[] = workoutRows.map((row) => ({
      id: row.id,
      routineId: row.routine_id,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      sets: setsByWorkout.get(row.id) ?? [],
    }));

    // Body measurements with photo paths
    const bodyRows = await this.db.getAllAsync<BodyMeasurementRow & { id: number }>(
      'SELECT id, weight, body_fat, chest, waist, hips, biceps, thighs, notes, measured_at FROM body_measurements ORDER BY measured_at ASC',
    );
    const photoRows = await this.db.getAllAsync<{ measurement_id: number; photo_path: string }>(
      'SELECT measurement_id, photo_path FROM body_photos ORDER BY measurement_id, created_at ASC',
    );
    const photosByMeasurement = new Map<number, string[]>();
    for (const pr of photoRows) {
      const list = photosByMeasurement.get(pr.measurement_id) ?? [];
      list.push(pr.photo_path);
      photosByMeasurement.set(pr.measurement_id, list);
    }

    const bodyMeasurements: BodyMeasurementExport[] = bodyRows.map((row) => {
      const photoPaths = photosByMeasurement.get(row.id);
      return {
        weight: row.weight,
        bodyFat: row.body_fat,
        chest: row.chest,
        waist: row.waist,
        hips: row.hips,
        biceps: row.biceps,
        thighs: row.thighs,
        notes: row.notes,
        measuredAt: row.measured_at,
        ...(photoPaths && photoPaths.length > 0 ? { photoPaths } : {}),
      };
    });

    // User settings
    const settingRows = await this.db.getAllAsync<SettingRow>(
      'SELECT key, value FROM user_settings',
    );
    const settings: SettingExport[] = settingRows.map((row) => ({
      key: row.key,
      value: row.value,
    }));

    // Badges
    const badgeRows = await this.db.getAllAsync<BadgeRow>(
      'SELECT badge_key, unlocked_at FROM badges',
    );
    const badges: BadgeExport[] = badgeRows.map((row) => ({
      badgeKey: row.badge_key,
      unlockedAt: row.unlocked_at,
    }));

    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      exercises,
      routines,
      workouts,
      bodyMeasurements,
      settings,
      badges,
    };
  }

  async importData(backup: IronLogBackup): Promise<void> {
    // Map from exported exercise ID → ID in this device's DB
    const exerciseIdMap = new Map<number, number>();

    await this.db.withTransactionAsync(async () => {
      // 1. Insert exercises with INSERT OR IGNORE by name.
      //    Predefined exercises already exist; custom ones get inserted.
      //    After each upsert, resolve the real local ID.
      for (const ex of backup.exercises) {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO exercises (name, type, muscle_group, illustration, rest_seconds, notes, created_at, is_predefined)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ex.name,
          ex.type,
          ex.muscleGroup,
          ex.illustration ?? null,
          ex.restSeconds,
          ex.notes ?? null,
          ex.createdAt,
          ex.isPredefined ? 1 : 0,
        );

        const row = await this.db.getFirstAsync<{ id: number }>(
          'SELECT id FROM exercises WHERE name = ?',
          ex.name,
        );
        if (row) {
          exerciseIdMap.set(ex.id, row.id);

          // Sync muscle groups pivot if backup includes them
          const groups = ex.muscleGroups ?? [ex.muscleGroup];
          await this.db.runAsync(
            'DELETE FROM exercise_muscle_groups WHERE exercise_id = ?',
            row.id,
          );
          for (let i = 0; i < groups.length; i++) {
            await this.db.runAsync(
              `INSERT OR IGNORE INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary)
               VALUES (?, ?, ?)`,
              row.id,
              groups[i],
              i === 0 ? 1 : 0,
            );
          }
        }
      }

      // 2. Insert routines with INSERT OR REPLACE (preserves original ID).
      for (const routine of backup.routines) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO routines (id, name, created_at, is_template, description)
           VALUES (?, ?, ?, ?, ?)`,
          routine.id,
          routine.name,
          routine.createdAt,
          routine.isTemplate ? 1 : 0,
          routine.description ?? null,
        );

        // Remove existing routine_exercises for this routine before reinserting.
        await this.db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', routine.id);

        for (const re of routine.exercises) {
          const localExerciseId = exerciseIdMap.get(re.exerciseId);
          if (localExerciseId === undefined) {
            console.warn(
              `[backup] skipping routine_exercise: exerciseId ${re.exerciseId} not in map`,
            );
            continue;
          }

          await this.db.runAsync(
            `INSERT INTO routine_exercises (routine_id, exercise_id, sort_order, group_id, group_type)
             VALUES (?, ?, ?, ?, ?)`,
            routine.id,
            localExerciseId,
            re.sortOrder,
            re.groupId ?? null,
            re.groupType ?? null,
          );
        }
      }

      // 3. Insert workouts with INSERT OR REPLACE (preserves original ID).
      for (const workout of backup.workouts) {
        const localRoutineId = workout.routineId !== null ? workout.routineId : null;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO workouts (id, routine_id, started_at, finished_at)
           VALUES (?, ?, ?, ?)`,
          workout.id,
          localRoutineId ?? null,
          workout.startedAt,
          workout.finishedAt ?? null,
        );

        // Remove existing sets for this workout before reinserting.
        await this.db.runAsync('DELETE FROM workout_sets WHERE workout_id = ?', workout.id);

        for (const set of workout.sets) {
          const localExerciseId = exerciseIdMap.get(set.exerciseId);
          if (localExerciseId === undefined) {
            console.warn(`[backup] skipping set: exerciseId ${set.exerciseId} not in map`);
            continue;
          }

          await this.db.runAsync(
            `INSERT INTO workout_sets (workout_id, exercise_id, sort_order, weight, reps, duration, distance, notes, group_id, group_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            workout.id,
            localExerciseId,
            set.sortOrder,
            set.weight ?? null,
            set.reps ?? null,
            set.duration ?? null,
            set.distance ?? null,
            set.notes ?? null,
            set.groupId ?? null,
            set.groupType ?? null,
          );
        }
      }

      // 4. Insert body measurements.
      //    They have no meaningful shared ID across devices, so use INSERT OR IGNORE
      //    keyed on measured_at to avoid exact duplicates.
      for (const bm of backup.bodyMeasurements) {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO body_measurements
             (weight, body_fat, chest, waist, hips, biceps, thighs, notes, measured_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          bm.weight ?? null,
          bm.bodyFat ?? null,
          bm.chest ?? null,
          bm.waist ?? null,
          bm.hips ?? null,
          bm.biceps ?? null,
          bm.thighs ?? null,
          bm.notes ?? null,
          bm.measuredAt,
        );

        // If backup includes photo paths, preserve references in body_photos
        if (bm.photoPaths && bm.photoPaths.length > 0) {
          const bmRow = await this.db.getFirstAsync<{ id: number }>(
            'SELECT id FROM body_measurements WHERE measured_at = ?',
            bm.measuredAt,
          );
          if (bmRow) {
            for (const photoPath of bm.photoPaths) {
              await this.db.runAsync(
                `INSERT OR IGNORE INTO body_photos (measurement_id, photo_path)
                 VALUES (?, ?)`,
                bmRow.id,
                photoPath,
              );
            }
          }
        }
      }

      // 5. Import user settings (INSERT OR REPLACE to update existing keys).
      if (backup.settings) {
        for (const setting of backup.settings) {
          await this.db.runAsync(
            `INSERT OR REPLACE INTO user_settings (key, value)
             VALUES (?, ?)`,
            setting.key,
            setting.value,
          );
        }
      }

      // 6. Import badges (INSERT OR IGNORE to preserve already-unlocked badges).
      if (backup.badges) {
        for (const badge of backup.badges) {
          await this.db.runAsync(
            `INSERT OR IGNORE INTO badges (badge_key, unlocked_at)
             VALUES (?, ?)`,
            badge.badgeKey,
            badge.unlockedAt,
          );
        }
      }
    });
  }
}
