import type { UnitSystem } from '../types';

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;

/**
 * Convert weight from kg to the target unit system.
 * Data is always stored in kg (metric).
 */
export function convertWeight(kg: number, system: UnitSystem): number {
  if (system === 'imperial') {
    return kg * KG_TO_LBS;
  }
  return kg;
}

/**
 * Convert length from cm to the target unit system.
 * Data is always stored in cm (metric).
 */
export function convertLength(cm: number, system: UnitSystem): number {
  if (system === 'imperial') {
    return cm * CM_TO_IN;
  }
  return cm;
}

/**
 * Convert weight from display units back to kg for storage.
 */
export function toMetricWeight(value: number, system: UnitSystem): number {
  if (system === 'imperial') {
    return value / KG_TO_LBS;
  }
  return value;
}

/**
 * Convert length from display units back to cm for storage.
 */
export function toMetricLength(value: number, system: UnitSystem): number {
  if (system === 'imperial') {
    return value / CM_TO_IN;
  }
  return value;
}

/**
 * Format a weight value with the correct unit suffix.
 * Rounds to 1 decimal place for imperial, nearest 0.5 for metric.
 */
export function formatWeight(kg: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const lbs = kg * KG_TO_LBS;
    return `${Math.round(lbs * 10) / 10} lbs`;
  }
  return `${kg} kg`;
}

/**
 * Format a length value with the correct unit suffix.
 * Rounds to 1 decimal place.
 */
export function formatLength(cm: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const inches = cm * CM_TO_IN;
    return `${Math.round(inches * 10) / 10} in`;
  }
  return `${cm} cm`;
}

/**
 * Get the weight unit label for the current system.
 */
export function weightUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'lbs' : 'kg';
}

/**
 * Get the length unit label for the current system.
 */
export function lengthUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'in' : 'cm';
}

/**
 * Format a volume (total weight lifted) with appropriate scaling.
 * Values >= 1000 are shown as "1.2k kg" / "2.6k lbs".
 */
export function formatVolume(volumeKg: number, system: UnitSystem): string {
  const converted = convertWeight(volumeKg, system);
  const unit = weightUnit(system);
  if (converted >= 1000) {
    return `${(converted / 1000).toFixed(1)}k ${unit}`;
  }
  return `${Math.round(converted)} ${unit}`;
}
