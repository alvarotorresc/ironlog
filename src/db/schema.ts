import { type SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('weights','cardio','calisthenics','hiit','flexibility')),
        muscle_group TEXT NOT NULL CHECK(muscle_group IN ('chest','back','legs','shoulders','arms','core','full_body')),
        illustration TEXT,
        rest_seconds INTEGER NOT NULL DEFAULT 90,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS routine_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        finished_at TEXT
      );

      CREATE TABLE IF NOT EXISTS workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        weight REAL,
        reps INTEGER,
        duration INTEGER,
        distance REAL
      );

      CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);
      CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id);
      CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
      CREATE INDEX IF NOT EXISTS idx_workouts_started ON workouts(started_at);
      CREATE INDEX IF NOT EXISTS idx_workouts_finished ON workouts(finished_at);
      CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
    `,
  },
  {
    version: 2,
    up: `
      -- Add CHECK constraints for data integrity

      -- exercises: name not empty, rest_seconds non-negative
      CREATE TABLE exercises_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) > 0),
        type TEXT NOT NULL CHECK(type IN ('weights','cardio','calisthenics','hiit','flexibility')),
        muscle_group TEXT NOT NULL CHECK(muscle_group IN ('chest','back','legs','shoulders','arms','core','full_body')),
        illustration TEXT,
        rest_seconds INTEGER NOT NULL DEFAULT 90 CHECK(rest_seconds >= 0),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO exercises_new SELECT * FROM exercises;
      DROP TABLE exercises;
      ALTER TABLE exercises_new RENAME TO exercises;
      CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

      -- routines: name not empty
      CREATE TABLE routines_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) > 0),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO routines_new SELECT * FROM routines;
      DROP TABLE routines;
      ALTER TABLE routines_new RENAME TO routines;

      -- routine_exercises: sort_order non-negative
      CREATE TABLE routine_exercises_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL CHECK(sort_order >= 0)
      );
      INSERT INTO routine_exercises_new SELECT * FROM routine_exercises;
      DROP TABLE routine_exercises;
      ALTER TABLE routine_exercises_new RENAME TO routine_exercises;
      CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);

      -- workouts: no changes needed (routine_id nullable, timestamps have defaults)

      -- workout_sets: non-negative values
      CREATE TABLE workout_sets_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL CHECK(sort_order >= 0),
        weight REAL CHECK(weight IS NULL OR weight >= 0),
        reps INTEGER CHECK(reps IS NULL OR reps >= 0),
        duration INTEGER CHECK(duration IS NULL OR duration >= 0),
        distance REAL CHECK(distance IS NULL OR distance >= 0)
      );
      INSERT INTO workout_sets_new SELECT * FROM workout_sets;
      DROP TABLE workout_sets;
      ALTER TABLE workout_sets_new RENAME TO workout_sets;
      CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id);
      CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
    `,
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version',
  );
  const currentVersion = result?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.execAsync(migration.up);
      await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', migration.version);
    }
  }
}
