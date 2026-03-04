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
        name TEXT NOT NULL CHECK(length(name) > 0),
        type TEXT NOT NULL CHECK(type IN ('weights','cardio','calisthenics','hiit','flexibility')),
        muscle_group TEXT NOT NULL CHECK(muscle_group IN ('chest','back','legs','shoulders','arms','core','full_body')),
        illustration TEXT,
        rest_seconds INTEGER NOT NULL DEFAULT 90 CHECK(rest_seconds >= 0),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) > 0),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS routine_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL CHECK(sort_order >= 0)
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
        sort_order INTEGER NOT NULL CHECK(sort_order >= 0),
        weight REAL CHECK(weight IS NULL OR weight >= 0),
        reps INTEGER CHECK(reps IS NULL OR reps >= 0),
        duration INTEGER CHECK(duration IS NULL OR duration >= 0),
        distance REAL CHECK(distance IS NULL OR distance >= 0)
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
      CREATE TABLE IF NOT EXISTS body_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight REAL,
        body_fat REAL CHECK(body_fat IS NULL OR (body_fat >= 0 AND body_fat <= 100)),
        chest REAL CHECK(chest IS NULL OR chest >= 0),
        waist REAL CHECK(waist IS NULL OR waist >= 0),
        hips REAL CHECK(hips IS NULL OR hips >= 0),
        biceps REAL CHECK(biceps IS NULL OR biceps >= 0),
        thighs REAL CHECK(thighs IS NULL OR thighs >= 0),
        notes TEXT,
        measured_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(measured_at);
    `,
  },
  {
    version: 3,
    up: `
      -- Multi-muscle-group pivot table
      CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        muscle_group TEXT NOT NULL CHECK(muscle_group IN ('chest','back','legs','shoulders','arms','core','full_body')),
        is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
        UNIQUE(exercise_id, muscle_group)
      );

      CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_exercise ON exercise_muscle_groups(exercise_id);
      CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_muscle ON exercise_muscle_groups(muscle_group);

      -- Populate pivot from existing exercises.muscle_group
      INSERT OR IGNORE INTO exercise_muscle_groups (exercise_id, muscle_group, is_primary)
        SELECT id, muscle_group, 1 FROM exercises;

      -- Predefined flag for exercises
      ALTER TABLE exercises ADD COLUMN is_predefined INTEGER NOT NULL DEFAULT 0;

      -- Template support for routines
      ALTER TABLE routines ADD COLUMN is_template INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE routines ADD COLUMN description TEXT;

      -- Exercise grouping in routines (supersets, circuits, dropsets)
      ALTER TABLE routine_exercises ADD COLUMN group_id INTEGER;
      ALTER TABLE routine_exercises ADD COLUMN group_type TEXT CHECK(group_type IS NULL OR group_type IN ('superset','circuit','dropset'));

      -- Exercise grouping in workout sets
      ALTER TABLE workout_sets ADD COLUMN group_id INTEGER;
      ALTER TABLE workout_sets ADD COLUMN group_type TEXT CHECK(group_type IS NULL OR group_type IN ('superset','circuit','dropset'));

      -- Body photos
      CREATE TABLE IF NOT EXISTS body_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        measurement_id INTEGER NOT NULL REFERENCES body_measurements(id) ON DELETE CASCADE,
        photo_path TEXT NOT NULL CHECK(length(photo_path) > 0),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_body_photos_measurement ON body_photos(measurement_id);

      -- User settings (key-value store)
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY CHECK(length(key) > 0),
        value TEXT NOT NULL
      );

      -- Badges / achievements
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge_key TEXT NOT NULL UNIQUE CHECK(length(badge_key) > 0),
        unlocked_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 4,
    up: `
      ALTER TABLE workout_sets ADD COLUMN notes TEXT;
    `,
  },
  {
    version: 5,
    up: `
      ALTER TABLE exercises ADD COLUMN notes TEXT;
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
