import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/connection';
import { BodyRepository } from '@/repositories/body.repo';
import { BodyPhotoRepository } from '@/repositories/body-photo.repo';
import type {
  BodyMeasurement,
  WeightDataPoint,
  BodyMetricField,
  BodyMetricDataPoint,
  TimePeriod,
} from '@/types';

interface UseBodyMeasurementsReturn {
  measurements: BodyMeasurement[];
  photoCounts: Map<number, number>;
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
  const [photoCounts, setPhotoCounts] = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new BodyRepository(db);
      const result = await repo.getAll();
      setMeasurements(result);

      if (result.length > 0) {
        const photoRepo = new BodyPhotoRepository(db);
        const ids = result.map((m) => m.id);
        const counts = await photoRepo.getPhotoCountsForMeasurements(ids);
        setPhotoCounts(counts);
      } else {
        setPhotoCounts(new Map());
      }
    } catch (error) {
      console.error('Failed to load body measurements:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { measurements, photoCounts, isLoading, reload: load };
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

function periodToDays(period: TimePeriod): number | null {
  switch (period) {
    case '1w':
      return 7;
    case '1m':
      return 30;
    case '3m':
      return 90;
    case '6m':
      return 180;
    case 'all':
      return null;
  }
}

interface UseBodyMetricProgressReturn {
  data: BodyMetricDataPoint[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useBodyMetricProgress(
  metric: BodyMetricField,
  period: TimePeriod,
): UseBodyMetricProgressReturn {
  const [data, setData] = useState<BodyMetricDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new BodyRepository(db);
      const days = periodToDays(period);
      let result: BodyMetricDataPoint[];
      if (metric === 'weight') {
        const weightPoints = await repo.getWeightOverTime(days);
        result = weightPoints.map((p) => ({ date: p.date, value: p.weight }));
      } else {
        result = await repo.getMeasurementOverTime(metric, days);
      }
      setData(result);
    } catch (error) {
      console.error('Failed to load body metric progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [metric, period]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, reload: load };
}
