import { useState, useCallback } from 'react';
import { getDatabase } from '@/db/connection';
import { BadgeRepository } from '@/repositories/badge.repo';
import type { Badge } from '@/types';

interface UseBadgesReturn {
  badges: Badge[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

/**
 * Hook to load all unlocked badges.
 * Call reload() when navigating to the badges screen.
 */
export function useBadges(): UseBadgesReturn {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const repo = new BadgeRepository(db);
      const unlocked = await repo.getUnlocked();
      setBadges(unlocked);
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { badges, isLoading, reload };
}

interface UseBadgeCheckReturn {
  checkBadges: () => Promise<Badge[]>;
}

/**
 * Hook to check and unlock new badges.
 * Call checkBadges() after finishing a workout or adding a measurement.
 * Returns the list of newly unlocked badges for notification display.
 */
export function useBadgeCheck(): UseBadgeCheckReturn {
  const checkBadges = useCallback(async (): Promise<Badge[]> => {
    try {
      const db = await getDatabase();
      const repo = new BadgeRepository(db);
      const stats = await repo.gatherStats();
      const newlyUnlocked = await repo.checkAndUnlock(stats);
      return newlyUnlocked;
    } catch (error) {
      console.error('Failed to check badges:', error);
      return [];
    }
  }, []);

  return { checkBadges };
}
