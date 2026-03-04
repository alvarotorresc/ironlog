import { type SQLiteDatabase } from 'expo-sqlite';
import { PREDEFINED_EXERCISES } from '@/constants/exercises';
import { ROUTINE_TEMPLATES } from '@/constants/routine-templates';
import { en } from '@/i18n/en';

export async function seedExercises(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const exercise of PREDEFINED_EXERCISES) {
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM exercises WHERE name = ?',
        exercise.name,
      );

      let exerciseId: number;

      if (!existing) {
        const result = await db.runAsync(
          `INSERT INTO exercises (name, type, muscle_group, illustration, rest_seconds, is_predefined)
           VALUES (?, ?, ?, ?, ?, 1)`,
          exercise.name,
          exercise.type,
          exercise.muscleGroup,
          exercise.illustration,
          exercise.restSeconds,
        );
        exerciseId = result.lastInsertRowId;
      } else {
        exerciseId = existing.id;
        // Ensure is_predefined is set for existing exercises
        await db.runAsync('UPDATE exercises SET is_predefined = 1 WHERE id = ?', exerciseId);
      }

      // Populate pivot table for multi-muscle-group
      for (let i = 0; i < exercise.muscleGroups.length; i++) {
        await db.runAsync(
          `INSERT OR IGNORE INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary)
           VALUES (?, ?, ?)`,
          exerciseId,
          exercise.muscleGroups[i],
          i === 0 ? 1 : 0,
        );
      }
    }
  });
}

export async function seedRoutineTemplates(db: SQLiteDatabase): Promise<void> {
  // Check if templates already exist — idempotent
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM routines WHERE is_template = 1',
  );
  if (existing && existing.count > 0) return;

  await db.withTransactionAsync(async () => {
    for (const template of ROUTINE_TEMPLATES) {
      const templateName = en[template.nameKey];

      const result = await db.runAsync(
        'INSERT INTO routines (name, is_template, description) VALUES (?, 1, NULL)',
        templateName,
      );
      const routineId = result.lastInsertRowId;

      for (let i = 0; i < template.exerciseNames.length; i++) {
        const exercise = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM exercises WHERE name = ?',
          template.exerciseNames[i],
        );

        if (exercise) {
          await db.runAsync(
            'INSERT INTO routine_exercises (routine_id, exercise_id, sort_order) VALUES (?, ?, ?)',
            routineId,
            exercise.id,
            i + 1,
          );
        }
      }
    }
  });
}
