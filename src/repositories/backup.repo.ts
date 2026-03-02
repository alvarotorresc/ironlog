import { type SQLiteDatabase } from 'expo-sqlite';
import type {
  IronLogBackup,
  ExerciseExport,
  RoutineExport,
  WorkoutExport,
  BodyMeasurementExport,
} from '../types';

interface ExerciseRow {
  id: number;
  name: string;
  type: string;
  muscle_group: string;
  illustration: string | null;
  rest_seconds: number;
  created_at: string;
}

interface RoutineRow {
  id: number;
  name: string;
  created_at: string;
}

interface RoutineExerciseRow {
  routine_id: number;
  exercise_id: number;
  sort_order: number;
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
      'SELECT id, name, type, muscle_group, illustration, rest_seconds, created_at FROM exercises ORDER BY id ASC',
    );
    const exercises: ExerciseExport[] = exerciseRows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      muscleGroup: row.muscle_group,
      illustration: row.illustration,
      restSeconds: row.rest_seconds,
      createdAt: row.created_at,
    }));

    // Routines with their exercises
    const routineRows = await this.db.getAllAsync<RoutineRow>(
      'SELECT id, name, created_at FROM routines ORDER BY id ASC',
    );
    const routineExerciseRows = await this.db.getAllAsync<RoutineExerciseRow>(
      'SELECT routine_id, exercise_id, sort_order FROM routine_exercises ORDER BY routine_id ASC, sort_order ASC',
    );

    const reByRoutine = new Map<number, Array<{ exerciseId: number; sortOrder: number }>>();
    for (const row of routineExerciseRows) {
      const list = reByRoutine.get(row.routine_id) ?? [];
      list.push({ exerciseId: row.exercise_id, sortOrder: row.sort_order });
      reByRoutine.set(row.routine_id, list);
    }

    const routines: RoutineExport[] = routineRows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      exercises: reByRoutine.get(row.id) ?? [],
    }));

    // Workouts with their sets
    const workoutRows = await this.db.getAllAsync<WorkoutRow>(
      'SELECT id, routine_id, started_at, finished_at FROM workouts ORDER BY id ASC',
    );
    const workoutSetRows = await this.db.getAllAsync<WorkoutSetRow>(
      'SELECT workout_id, exercise_id, sort_order, weight, reps, duration, distance FROM workout_sets ORDER BY workout_id ASC, sort_order ASC',
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

    // Body measurements
    const bodyRows = await this.db.getAllAsync<BodyMeasurementRow>(
      'SELECT weight, body_fat, chest, waist, hips, biceps, thighs, notes, measured_at FROM body_measurements ORDER BY measured_at ASC',
    );
    const bodyMeasurements: BodyMeasurementExport[] = bodyRows.map((row) => ({
      weight: row.weight,
      bodyFat: row.body_fat,
      chest: row.chest,
      waist: row.waist,
      hips: row.hips,
      biceps: row.biceps,
      thighs: row.thighs,
      notes: row.notes,
      measuredAt: row.measured_at,
    }));

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      exercises,
      routines,
      workouts,
      bodyMeasurements,
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
          `INSERT OR IGNORE INTO exercises (name, type, muscle_group, illustration, rest_seconds, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ex.name,
          ex.type,
          ex.muscleGroup,
          ex.illustration ?? null,
          ex.restSeconds,
          ex.createdAt,
        );

        const row = await this.db.getFirstAsync<{ id: number }>(
          'SELECT id FROM exercises WHERE name = ?',
          ex.name,
        );
        if (row) {
          exerciseIdMap.set(ex.id, row.id);
        }
      }

      // 2. Insert routines with INSERT OR REPLACE (preserves original ID).
      for (const routine of backup.routines) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO routines (id, name, created_at)
           VALUES (?, ?, ?)`,
          routine.id,
          routine.name,
          routine.createdAt,
        );

        // Remove existing routine_exercises for this routine before reinserting.
        await this.db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', routine.id);

        for (const re of routine.exercises) {
          const localExerciseId = exerciseIdMap.get(re.exerciseId);
          if (localExerciseId === undefined) continue;

          await this.db.runAsync(
            `INSERT INTO routine_exercises (routine_id, exercise_id, sort_order)
             VALUES (?, ?, ?)`,
            routine.id,
            localExerciseId,
            re.sortOrder,
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
          if (localExerciseId === undefined) continue;

          await this.db.runAsync(
            `INSERT INTO workout_sets (workout_id, exercise_id, sort_order, weight, reps, duration, distance)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            workout.id,
            localExerciseId,
            set.sortOrder,
            set.weight ?? null,
            set.reps ?? null,
            set.duration ?? null,
            set.distance ?? null,
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
      }
    });
  }
}
