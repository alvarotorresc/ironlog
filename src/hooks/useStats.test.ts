import { renderHook, waitFor } from '@testing-library/react';
import {
  useExerciseProgress,
  useExerciseStats,
  useDashboardStats,
  useMuscleDistribution,
} from './useStats';
import type {
  ExerciseStats,
  DashboardStats,
  MaxWeightDataPoint,
  VolumeDataPoint,
  MuscleGroupVolume,
  TimePeriod,
} from '@/types';

// Mock getDatabase and StatsRepository
const mockGetMaxWeightOverTime = jest.fn();
const mockGetVolumeOverTime = jest.fn();
const mockGetExerciseStats = jest.fn();
const mockGetDashboardStats = jest.fn();
const mockGetMuscleGroupDistribution = jest.fn();

jest.mock('@/db/connection', () => ({
  getDatabase: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/repositories/stats.repo', () => ({
  StatsRepository: jest.fn().mockImplementation(() => ({
    getMaxWeightOverTime: mockGetMaxWeightOverTime,
    getVolumeOverTime: mockGetVolumeOverTime,
    getExerciseStats: mockGetExerciseStats,
    getDashboardStats: mockGetDashboardStats,
    getMuscleGroupDistribution: mockGetMuscleGroupDistribution,
  })),
}));

describe('useExerciseProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start in loading state', () => {
    mockGetMaxWeightOverTime.mockResolvedValue([]);
    mockGetVolumeOverTime.mockResolvedValue([]);

    const { result } = renderHook(() => useExerciseProgress(1, '1m'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.maxWeightData).toEqual([]);
    expect(result.current.volumeData).toEqual([]);
  });

  it('should load max weight and volume data', async () => {
    const weightData: MaxWeightDataPoint[] = [
      { date: '2026-02-20', maxWeight: 80 },
      { date: '2026-02-25', maxWeight: 90 },
    ];
    const volumeData: VolumeDataPoint[] = [
      { date: '2026-02-20', volume: 1600 },
      { date: '2026-02-25', volume: 900 },
    ];

    mockGetMaxWeightOverTime.mockResolvedValue(weightData);
    mockGetVolumeOverTime.mockResolvedValue(volumeData);

    const { result } = renderHook(() => useExerciseProgress(1, '1m'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.maxWeightData).toEqual(weightData);
    expect(result.current.volumeData).toEqual(volumeData);
    expect(mockGetMaxWeightOverTime).toHaveBeenCalledWith(1, '1m');
    expect(mockGetVolumeOverTime).toHaveBeenCalledWith(1, '1m');
  });

  it('should reload when period changes', async () => {
    mockGetMaxWeightOverTime.mockResolvedValue([]);
    mockGetVolumeOverTime.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ period }: { period: TimePeriod }) => useExerciseProgress(1, period),
      { initialProps: { period: '1m' as TimePeriod } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ period: '3m' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetMaxWeightOverTime).toHaveBeenCalledWith(1, '3m');
    expect(mockGetVolumeOverTime).toHaveBeenCalledWith(1, '3m');
  });

  it('should handle errors gracefully', async () => {
    mockGetMaxWeightOverTime.mockRejectedValue(new Error('DB error'));
    mockGetVolumeOverTime.mockRejectedValue(new Error('DB error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useExerciseProgress(1, '1m'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.maxWeightData).toEqual([]);
    expect(result.current.volumeData).toEqual([]);

    consoleSpy.mockRestore();
  });
});

describe('useExerciseStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start in loading state with null stats', () => {
    mockGetExerciseStats.mockResolvedValue({
      currentPR: null,
      lastWorkoutDate: null,
      totalSessions: 0,
      averageVolume: 0,
    });

    const { result } = renderHook(() => useExerciseStats(1));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBeNull();
  });

  it('should load exercise stats', async () => {
    const stats: ExerciseStats = {
      currentPR: 100,
      lastWorkoutDate: '2026-02-25',
      totalSessions: 12,
      averageVolume: 1350,
    };

    mockGetExerciseStats.mockResolvedValue(stats);

    const { result } = renderHook(() => useExerciseStats(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual(stats);
    expect(mockGetExerciseStats).toHaveBeenCalledWith(1);
  });

  it('should handle errors gracefully', async () => {
    mockGetExerciseStats.mockRejectedValue(new Error('DB error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useExerciseStats(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeNull();

    consoleSpy.mockRestore();
  });
});

describe('useDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load dashboard stats', async () => {
    const stats: DashboardStats = {
      totalWorkouts: 42,
      workoutsThisWeek: 3,
      workoutsThisMonth: 15,
      currentStreak: 5,
      volumeThisWeek: 12000,
      volumeThisMonth: 56000,
      recentPRs: [],
    };

    mockGetDashboardStats.mockResolvedValue(stats);

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual(stats);
  });
});

describe('useMuscleDistribution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load muscle distribution', async () => {
    const distribution: MuscleGroupVolume[] = [
      { muscleGroup: 'chest', totalVolume: 5000 },
      { muscleGroup: 'legs', totalVolume: 8000 },
    ];

    mockGetMuscleGroupDistribution.mockResolvedValue(distribution);

    const { result } = renderHook(() => useMuscleDistribution('1m'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.distribution).toEqual(distribution);
    expect(mockGetMuscleGroupDistribution).toHaveBeenCalledWith('1m');
  });

  it('should reload when period changes', async () => {
    mockGetMuscleGroupDistribution.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ period }: { period: TimePeriod }) => useMuscleDistribution(period),
      { initialProps: { period: '1m' as TimePeriod } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ period: 'all' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetMuscleGroupDistribution).toHaveBeenCalledWith('all');
  });
});
