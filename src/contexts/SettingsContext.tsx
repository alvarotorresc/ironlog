import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { createElement, type ReactNode } from 'react';
import { getDatabase } from '@/db/connection';
import { SettingsRepository } from '@/repositories/settings.repo';
import {
  formatWeight,
  formatLength,
  formatVolume,
  weightUnit,
  lengthUnit,
  convertWeight,
  convertLength,
  toMetricWeight,
  toMetricLength,
} from '@/utils/units';
import type { UnitSystem } from '@/types';

interface SettingsContextValue {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  isLoading: boolean;
  formatWeight: (kg: number) => string;
  formatLength: (cm: number) => string;
  formatVolume: (volumeKg: number) => string;
  weightUnit: () => string;
  lengthUnit: () => string;
  convertWeight: (kg: number) => number;
  convertLength: (cm: number) => number;
  toMetricWeight: (value: number) => number;
  toMetricLength: (value: number) => number;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('metric');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const db = await getDatabase();
        const repo = new SettingsRepository(db);
        const system = await repo.getUnitSystem();
        setUnitSystemState(system);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const setUnitSystem = useCallback(async (system: UnitSystem) => {
    setUnitSystemState(system);
    try {
      const db = await getDatabase();
      const repo = new SettingsRepository(db);
      await repo.setUnitSystem(system);
    } catch (error) {
      console.error('Failed to save unit system:', error);
    }
  }, []);

  const value = useMemo(
    (): SettingsContextValue => ({
      unitSystem,
      setUnitSystem,
      isLoading,
      formatWeight: (kg: number) => formatWeight(kg, unitSystem),
      formatLength: (cm: number) => formatLength(cm, unitSystem),
      formatVolume: (volumeKg: number) => formatVolume(volumeKg, unitSystem),
      weightUnit: () => weightUnit(unitSystem),
      lengthUnit: () => lengthUnit(unitSystem),
      convertWeight: (kg: number) => convertWeight(kg, unitSystem),
      convertLength: (cm: number) => convertLength(cm, unitSystem),
      toMetricWeight: (displayValue: number) => toMetricWeight(displayValue, unitSystem),
      toMetricLength: (displayValue: number) => toMetricLength(displayValue, unitSystem),
    }),
    [unitSystem, setUnitSystem, isLoading],
  );

  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
