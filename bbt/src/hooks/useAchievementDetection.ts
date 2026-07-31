import { useEffect, useRef } from 'react';
import { Business, PlayerStats } from '../types';
import { computeAchievements, Achievement } from '../utils/achievements';

interface UseAchievementDetectionParams {
  stats: PlayerStats;
  businessesByDistrict: Record<string, Business[]>;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  /** Called exactly once per newly-unlocked achievement — the caller
   *  owns what a celebration actually looks like (Milestone modal,
   *  sound, news ticker entry), this hook only owns detecting and
   *  permanently persisting the unlock itself. */
  onUnlock: (achievement: Achievement) => void;
}

/**
 * Watches for achievements crossing from locked to unlocked, and
 * permanently persists each new unlock — extracted out of App.tsx as
 * its own domain per the Phase 0 architecture cleanup. Behavior
 * preserved exactly; this is a relocation, not a rewrite.
 *
 * The permanent-persistence part matters specifically because of
 * Legacy: without it, resetting businesses to zero would silently
 * re-lock an achievement a player had already genuinely earned.
 */
export function useAchievementDetection({ stats, businessesByDistrict, setStats, onUnlock }: UseAchievementDetectionParams) {
  // Baseline captured on first run only (not persisted across sessions,
  // intentionally) — every subsequent render compares against this to
  // detect what's genuinely NEW since the app opened.
  const seenAchievementIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const current = computeAchievements(stats, businessesByDistrict);
    const unlockedIds = new Set(current.filter((a) => a.unlocked).map((a) => a.id));

    if (seenAchievementIdsRef.current === null) {
      seenAchievementIdsRef.current = unlockedIds;
      return;
    }

    const newlyUnlocked = current.find((a) => a.unlocked && !seenAchievementIdsRef.current!.has(a.id));
    if (newlyUnlocked) {
      onUnlock(newlyUnlocked);
      // The actual persistence — permanently records this ID so it
      // survives a future Legacy reset instead of silently re-locking.
      setStats((prev) => ({
        ...prev,
        unlockedAchievementIds: prev.unlockedAchievementIds.includes(newlyUnlocked.id)
          ? prev.unlockedAchievementIds
          : [...prev.unlockedAchievementIds, newlyUnlocked.id],
      }));
    }

    seenAchievementIdsRef.current = unlockedIds;
  }, [stats, businessesByDistrict]);
}
