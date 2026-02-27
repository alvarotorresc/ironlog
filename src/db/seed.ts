import { type SQLiteDatabase } from 'expo-sqlite';
import { PREDEFINED_EXERCISES } from '@/constants/exercises';

export async function seedExercises(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const exercise of PREDEFINED_EXERCISES) {
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM exercises WHERE name = ?',
        exercise.name,
      );

      if (!existing) {
        await db.runAsync(
          `INSERT INTO exercises (name, type, muscle_group, illustration, rest_seconds)
           VALUES (?, ?, ?, ?, ?)`,
          exercise.name,
          exercise.type,
          exercise.muscleGroup,
          exercise.illustration,
          exercise.restSeconds,
        );
      }
    }
  });
}
