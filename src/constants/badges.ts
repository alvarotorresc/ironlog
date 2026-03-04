import {
  Trophy,
  Medal,
  Award,
  Crown,
  Flame,
  Zap,
  Star,
  Dumbbell,
  Weight,
  Mountain,
  Target,
  Compass,
  Ruler,
  TrendingUp,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import type { TranslationKey } from '@/i18n/en';
import { BADGE_CHECKS, type BadgeCheck } from './badge-checks';

// Re-export types and constants from badge-checks for convenience
export { BADGE_CHECKS, TOTAL_BADGES } from './badge-checks';
export type { BadgeCheckStats, BadgeCheck } from './badge-checks';

/**
 * Full badge definition including icon — for UI rendering.
 * Extends BadgeCheck with LucideIcon.
 */
export interface BadgeDefinition extends BadgeCheck {
  icon: LucideIcon;
}

/** Map from badge key to Lucide icon component. */
const BADGE_ICONS: Record<string, LucideIcon> = {
  first_workout: Trophy,
  workout_10: Medal,
  workout_50: Award,
  workout_100: Crown,
  streak_3: Flame,
  streak_7: Zap,
  streak_30: Star,
  volume_1000: Dumbbell,
  volume_10000: Weight,
  volume_100000: Mountain,
  exercises_10: Target,
  exercises_25: Compass,
  first_measurement: Ruler,
  measurements_10: TrendingUp,
  early_bird: Sunrise,
};

/**
 * Full badge definitions with icons — use in UI components.
 * For tests/non-RN code, import BADGE_CHECKS from badge-checks.ts instead.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = BADGE_CHECKS.map((check) => ({
  ...check,
  icon: BADGE_ICONS[check.key] ?? Trophy,
}));

/**
 * Get the icon for a specific badge key. Returns Trophy as fallback.
 */
export function getBadgeIcon(key: string): LucideIcon {
  return BADGE_ICONS[key] ?? Trophy;
}

/**
 * Get the title translation key for a badge key.
 */
export function getBadgeTitleKey(key: string): TranslationKey {
  const check = BADGE_CHECKS.find((c) => c.key === key);
  return check?.titleKey ?? 'badges.locked';
}

/**
 * Get the description translation key for a badge key.
 */
export function getBadgeDescriptionKey(key: string): TranslationKey {
  const check = BADGE_CHECKS.find((c) => c.key === key);
  return check?.descriptionKey ?? 'badges.locked';
}
