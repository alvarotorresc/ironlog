import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/connection';
import { BodyRepository } from '@/repositories/body.repo';
import type { BodyMeasurement, WeightDataPoint } from '@/types';

interface UseBodyMeasurementsReturn {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

interface UseWeightProgressReturn {
  data: WeightDataPoint[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

interface UseLatestMeasurementReturn {
  latest: BodyMeasurement | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useBodyMeasurements(): UseBodyMeasurementsReturn {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new BodyRepository(db);
      const result = await repo.getAll();
      setMeasurements(result);
    } catch (error) {
      console.error('Failed to load body measurements:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { measurements, isLoading, reload: load };
}

export function useWeightProgress(): UseWeightProgressReturn {
  const [data, setData] = useState<WeightDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new BodyRepository(db);
      const result = await repo.getWeightOverTime();
      setData(result);
    } catch (error) {
      console.error('Failed to load weight progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, reload: load };
}

export function useLatestMeasurement(): UseLatestMeasurementReturn {
  const [latest, setLatest] = useState<BodyMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new BodyRepository(db);
      const result = await repo.getLatest();
      setLatest(result);
    } catch (error) {
      console.error('Failed to load latest measurement:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { latest, isLoading, reload: load };
}
