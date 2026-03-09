import { backupSchema } from './backup.schema';

function makeValidBackup() {
  return {
    version: 1 as const,
    exportedAt: '2026-03-01T00:00:00.000Z',
    exercises: [
      {
        id: 1,
        name: 'Bench Press',
        type: 'weights',
        muscleGroup: 'chest',
        muscleGroups: ['chest', 'shoulders'],
        illustration: null,
        restSeconds: 90,
        notes: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    routines: [
      {
        id: 1,
        name: 'Push Day',
        createdAt: '2026-01-01T00:00:00.000Z',
        exercises: [{ exerciseId: 1, sortOrder: 0 }],
      },
    ],
    workouts: [
      {
        id: 1,
        routineId: 1 as number | null,
        startedAt: '2026-01-10T08:00:00.000Z',
        finishedAt: '2026-01-10T09:00:00.000Z' as string | null,
        sets: [
          {
            exerciseId: 1,
            sortOrder: 0,
            weight: 80,
            reps: 10,
            duration: null,
            distance: null,
          },
        ],
      },
    ],
    bodyMeasurements: [
      {
        weight: 80.5,
        bodyFat: 15.0,
        chest: null,
        waist: 82,
        hips: null,
        biceps: null,
        thighs: null,
        notes: null,
        measuredAt: '2026-02-01T08:00:00.000Z',
      },
    ],
  };
}

describe('backupSchema', () => {
  it('should accept a valid complete backup', () => {
    const result = backupSchema.safeParse(makeValidBackup());
    expect(result.success).toBe(true);
  });

  it('should accept a valid backup with empty arrays', () => {
    const result = backupSchema.safeParse({
      version: 1,
      exportedAt: '2026-03-01T00:00:00.000Z',
      exercises: [],
      routines: [],
      workouts: [],
      bodyMeasurements: [],
    });
    expect(result.success).toBe(true);
  });

  it('should accept version 2', () => {
    const backup = makeValidBackup();
    (backup as { version: number }).version = 2;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(true);
  });

  it('should accept optional settings and badges arrays', () => {
    const backup = {
      ...makeValidBackup(),
      settings: [{ key: 'unit_system', value: 'metric' }],
      badges: [{ badgeKey: 'first_workout', unlockedAt: '2026-01-10T08:00:00.000Z' }],
    };
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(true);
  });

  it('should accept exercises without optional muscleGroups field', () => {
    const backup = makeValidBackup();
    delete (backup.exercises[0] as Record<string, unknown>).muscleGroups;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(true);
  });

  it('should reject missing version', () => {
    const backup = makeValidBackup();
    delete (backup as Record<string, unknown>).version;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject unsupported version number', () => {
    const backup = makeValidBackup();
    (backup as { version: number }).version = 99;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject missing exercises array', () => {
    const backup = makeValidBackup();
    delete (backup as Record<string, unknown>).exercises;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject exercises as a non-array', () => {
    const backup = makeValidBackup();
    (backup as Record<string, unknown>).exercises = 'not an array';
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject exercise with missing name', () => {
    const backup = makeValidBackup();
    delete (backup.exercises[0] as Record<string, unknown>).name;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject exercise with empty name', () => {
    const backup = makeValidBackup();
    backup.exercises[0].name = '';
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject exercise with negative restSeconds', () => {
    const backup = makeValidBackup();
    backup.exercises[0].restSeconds = -10;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject workout set with negative exerciseId', () => {
    const backup = makeValidBackup();
    backup.workouts[0].sets[0].exerciseId = -1;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject routine with missing exercises array', () => {
    const backup = makeValidBackup();
    delete (backup.routines[0] as Record<string, unknown>).exercises;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject body measurement with missing measuredAt', () => {
    const backup = makeValidBackup();
    delete (backup.bodyMeasurements[0] as Record<string, unknown>).measuredAt;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(false);
  });

  it('should reject non-object input', () => {
    expect(backupSchema.safeParse(null).success).toBe(false);
    expect(backupSchema.safeParse('string').success).toBe(false);
    expect(backupSchema.safeParse(42).success).toBe(false);
    expect(backupSchema.safeParse(undefined).success).toBe(false);
  });

  it('should accept workout with null routineId and finishedAt', () => {
    const backup = makeValidBackup();
    backup.workouts[0].routineId = null;
    backup.workouts[0].finishedAt = null;
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(true);
  });

  it('should accept body measurement with photoPaths', () => {
    const backup = makeValidBackup();
    (backup.bodyMeasurements[0] as Record<string, unknown>).photoPaths = [
      '/photos/front.jpg',
      '/photos/side.jpg',
    ];
    const result = backupSchema.safeParse(backup);
    expect(result.success).toBe(true);
  });
});
