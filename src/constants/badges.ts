import type { TranslationKey } from '@/i18n/en';
import { BADGE_CHECKS, type BadgeCheck } from './badge-checks';

// Re-export types and constants from badge-checks for convenience
export { BADGE_CHECKS, TOTAL_BADGES } from './badge-checks';
export type { BadgeCheckStats, BadgeCheck } from './badge-checks';

/** Badge category colors */
export const badgeCategoryColors = {
  milestone: { color: '#FFD700', bg: 'rgba(255, 215, 0, 0.12)' },
  streak: { color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.12)' },
  volume: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  variety: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
  body: { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  special: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
} as const;

export type BadgeCategory = keyof typeof badgeCategoryColors;

interface BadgeVisual {
  emoji: string;
  category: BadgeCategory;
}

/** Map from badge key to emoji + category. */
const BADGE_VISUALS: Record<string, BadgeVisual> = {
  // Milestones
  first_workout: { emoji: '\u{1F4AA}', category: 'milestone' },
  workout_10: { emoji: '\u{1F525}', category: 'milestone' },
  workout_50: { emoji: '\u{26A1}', category: 'milestone' },
  workout_100: { emoji: '\u{1F451}', category: 'milestone' },
  // Streaks
  streak_3: { emoji: '\u{1F4C5}', category: 'streak' },
  streak_7: { emoji: '\u{2604}\u{FE0F}', category: 'streak' },
  streak_30: { emoji: '\u{1F30B}', category: 'streak' },
  // Volume
  volume_10000: { emoji: '\u{1F3CB}\u{FE0F}', category: 'volume' },
  volume_100000: { emoji: '\u{1F48E}', category: 'volume' },
  volume_1000000: { emoji: '\u{1F3C6}', category: 'volume' },
  // Variety
  exercises_10: { emoji: '\u{1F3AF}', category: 'variety' },
  exercises_25: { emoji: '\u{1F9ED}', category: 'variety' },
  // Body tracking
  first_measurement: { emoji: '\u{1F4CF}', category: 'body' },
  measurements_10: { emoji: '\u{1F4D0}', category: 'body' },
  // Special
  early_bird: { emoji: '\u{1F305}', category: 'special' },
};

const DEFAULT_VISUAL: BadgeVisual = { emoji: '\u{1F3C6}', category: 'milestone' };

/**
 * Full badge definition with emoji + category — for UI rendering.
 */
export interface BadgeDefinition extends BadgeCheck {
  emoji: string;
  category: BadgeCategory;
}

/**
 * Full badge definitions with emojis — use in UI components.
 * For tests/non-RN code, import BADGE_CHECKS from badge-checks.ts instead.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = BADGE_CHECKS.map((check) => ({
  ...check,
  ...(BADGE_VISUALS[check.key] ?? DEFAULT_VISUAL),
}));

/**
 * Get the emoji for a specific badge key.
 */
export function getBadgeEmoji(key: string): string {
  return (BADGE_VISUALS[key] ?? DEFAULT_VISUAL).emoji;
}

/**
 * Get the category color info for a specific badge key.
 */
export function getBadgeCategoryColor(key: string): (typeof badgeCategoryColors)[BadgeCategory] {
  const category = (BADGE_VISUALS[key] ?? DEFAULT_VISUAL).category;
  return badgeCategoryColors[category];
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
