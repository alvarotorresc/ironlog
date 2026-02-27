import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/connection';
import { StatsRepository } from '@/repositories/stats.repo';
import type {
  ExerciseStats,
  DashboardStats,
  MaxWeightDataPoint,
  VolumeDataPoint,
  MuscleGroupVolume,
  MuscleFatigueData,
  TimePeriod,
} from '@/types';

interface UseExerciseProgressReturn {
  maxWeightData: MaxWeightDataPoint[];
  volumeData: VolumeDataPoint[];
  isLoading: boolean;
}

interface UseExerciseStatsReturn {
  stats: ExerciseStats | null;
  isLoading: boolean;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

interface UseMuscleDistributionReturn {
  distribution: MuscleGroupVolume[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useExerciseProgress(
  exerciseId: number,
  period: TimePeriod,
): UseExerciseProgressReturn {
  const [maxWeightData, setMaxWeightData] = useState<MaxWeightDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new StatsRepository(db);
      const [weight, volume] = await Promise.all([
        repo.getMaxWeightOverTime(exerciseId, period),
        repo.getVolumeOverTime(exerciseId, period),
      ]);
      setMaxWeightData(weight);
      setVolumeData(volume);
    } catch (error) {
      console.error('Failed to load exercise progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, period]);

  useEffect(() => {
    load();
  }, [load]);

  return { maxWeightData, volumeData, isLoading };
}

export function useExerciseStats(exerciseId: number): UseExerciseStatsReturn {
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new StatsRepository(db);
      const result = await repo.getExerciseStats(exerciseId);
      setStats(result);
    } catch (error) {
      console.error('Failed to load exercise stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, isLoading };
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new StatsRepository(db);
      const result = await repo.getDashboardStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, isLoading, reload: load };
}

export function useMuscleDistribution(period: TimePeriod): UseMuscleDistributionReturn {
  const [distribution, setDistribution] = useState<MuscleGroupVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new StatsRepository(db);
      const result = await repo.getMuscleGroupDistribution(period);
      setDistribution(result);
    } catch (error) {
      console.error('Failed to load muscle distribution:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { distribution, isLoading, reload: load };
}

interface UseMuscleFatigueReturn {
  fatigueData: MuscleFatigueData[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useMuscleFatigue(): UseMuscleFatigueReturn {
  const [fatigueData, setFatigueData] = useState<MuscleFatigueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new StatsRepository(db);
      const result = await repo.getMuscleFatigueData();
      setFatigueData(result);
    } catch (error) {
      console.error('Failed to load muscle fatigue data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { fatigueData, isLoading, reload: load };
}
