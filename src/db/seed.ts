import { type SQLiteDatabase } from 'expo-sqlite';
import { PREDEFINED_EXERCISES } from '@/constants/exercises';

export async function seedExercises(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises',
  );

  if (result && result.count > 0) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const exercise of PREDEFINED_EXERCISES) {
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
  });
}
