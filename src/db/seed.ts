import { type SQLiteDatabase } from 'expo-sqlite';
import { PREDEFINED_EXERCISES } from '@/constants/exercises';

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
