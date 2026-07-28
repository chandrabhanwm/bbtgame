import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { bastiCity, getDistrict } from '../data/cityMapData';

interface DistrictContextValue {
  currentDistrictId: string;
  setCurrentDistrict: (districtId: string) => void;
  /** Live/dynamic unlock status — the source of truth at runtime, not the
   *  static `unlocked` seed flag on District. */
  isDistrictUnlocked: (districtId: string) => boolean;
  /** Marks a district unlocked and persists it. Idempotent — safe to call
   *  repeatedly (e.g. every time the progression engine re-evaluates). */
  unlockDistrict: (districtId: string) => void;
  /** Whether this district's one-time completion bonus has already been
   *  paid out — the guard that makes the reward "only granted once." */
  isDistrictRewarded: (districtId: string) => boolean;
  /** Marks the completion bonus as paid. Idempotent, same pattern as
   *  unlockDistrict — persisted immediately, safe to call repeatedly. */
  markDistrictRewarded: (districtId: string) => void;
  /** Resets all district unlock/reward/current-district state back to
   *  the starting seed (only Badeban unlocked, nothing rewarded). Used
   *  by Legacy resets and the manual full-progress reset. */
  resetDistricts: () => void;
  restoreDistrictState: (data: { currentDistrictId: string; unlockedDistricts: Record<string, boolean>; rewardedDistricts: Record<string, boolean> }) => void;
  /** Raw unlock/reward maps — exposed specifically so App.tsx's
   *  background cloud-sync can gather a complete save snapshot. Prefer
   *  isDistrictUnlocked/isDistrictRewarded for any actual game-logic
   *  check; these are for persistence purposes only. */
  unlockedDistrictsMap: Record<string, boolean>;
  rewardedDistrictsMap: Record<string, boolean>;
}

const DistrictContext = createContext<DistrictContextValue | undefined>(undefined);

const CURRENT_DISTRICT_STORAGE_KEY = 'basti_current_district';
const UNLOCKED_DISTRICTS_STORAGE_KEY = 'basti_unlocked_districts';
const REWARDED_DISTRICTS_STORAGE_KEY = 'basti_rewarded_districts';
const DEFAULT_DISTRICT_ID = 'badeban';

function seedUnlockedMap(): Record<string, boolean> {
  const seeded: Record<string, boolean> = {};
  bastiCity.districts.forEach((d) => {
    seeded[d.id] = d.unlocked;
  });
  return seeded;
}

/**
 * Tracks which district is currently loaded on the Home/District screen,
 * and — new in this slice — which districts are actually unlocked right
 * now. This second part used to just be the static `unlocked` flag baked
 * into cityMapData.ts; it's now live, persisted state that the progression
 * engine (in App.tsx) flips on as requirements are met, and once flipped
 * it stays on (no re-locking if net worth dips back down later).
 */
export const DistrictProvider: React.FC<{ children: React.ReactNode; currentUid: string }> = ({ children, currentUid }) => {
  // Same ownership check as AppInner, same shared 'basti_owner_uid' key —
  // this is one concept ("does local data belong to this account"),
  // checked in both places since district progress and business/stats
  // progress are stored under genuinely separate localStorage keys.
  const localDataBelongsToThisUser = localStorage.getItem('basti_owner_uid') === currentUid;

  const [currentDistrictId, setCurrentDistrictId] = useState<string>(() => {
    return (localDataBelongsToThisUser && localStorage.getItem(CURRENT_DISTRICT_STORAGE_KEY)) || DEFAULT_DISTRICT_ID;
  });

  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>(() => {
    const seeded = seedUnlockedMap();
    const saved = localDataBelongsToThisUser ? localStorage.getItem(UNLOCKED_DISTRICTS_STORAGE_KEY) : null;
    if (!saved) return seeded;
    try {
      // Merge over the seed so a newly-added district (per §10, data-only)
      // is never missing a key just because an old save predates it.
      return { ...seeded, ...JSON.parse(saved) };
    } catch {
      return seeded;
    }
  });

  const [rewardedMap, setRewardedMap] = useState<Record<string, boolean>>(() => {
    const saved = localDataBelongsToThisUser ? localStorage.getItem(REWARDED_DISTRICTS_STORAGE_KEY) : null;
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem(CURRENT_DISTRICT_STORAGE_KEY, currentDistrictId);
  }, [currentDistrictId, currentUid]);

  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem(UNLOCKED_DISTRICTS_STORAGE_KEY, JSON.stringify(unlockedMap));
  }, [unlockedMap, currentUid]);

  useEffect(() => {
    localStorage.setItem('basti_owner_uid', currentUid);
    localStorage.setItem(REWARDED_DISTRICTS_STORAGE_KEY, JSON.stringify(rewardedMap));
  }, [rewardedMap, currentUid]);

  const isDistrictUnlocked = useCallback((districtId: string): boolean => {
    return unlockedMap[districtId] === true;
  }, [unlockedMap]);

  const unlockDistrict = useCallback((districtId: string) => {
    setUnlockedMap((prev) => {
      if (prev[districtId]) return prev; // already unlocked, no-op
      return { ...prev, [districtId]: true };
    });
  }, []);

  const isDistrictRewarded = useCallback((districtId: string): boolean => {
    return rewardedMap[districtId] === true;
  }, [rewardedMap]);

  const markDistrictRewarded = useCallback((districtId: string) => {
    setRewardedMap((prev) => {
      if (prev[districtId]) return prev; // already rewarded, no-op — this is the "only once" guard
      return { ...prev, [districtId]: true };
    });
  }, []);

  const setCurrentDistrict = useCallback((districtId: string) => {
    const district = getDistrict(bastiCity, districtId);
    // Locked districts cannot be opened — enforced here so every caller
    // (City Map taps, future deep links, anything else) gets this for free
    // rather than needing to remember to check unlocked status itself.
    if (!district || unlockedMap[districtId] !== true) return;
    setCurrentDistrictId(districtId);
  }, [unlockedMap]);

  const resetDistricts = useCallback(() => {
    setUnlockedMap(seedUnlockedMap());
    setRewardedMap({});
    setCurrentDistrictId(DEFAULT_DISTRICT_ID);
  }, []);

  /** Applies a cloud-restored save's district state directly — used only
   *  when restoring on a genuinely fresh device/browser with no local
   *  save at all. Distinct from resetDistricts, which resets to the
   *  starting seed rather than applying arbitrary saved data. */
  const restoreDistrictState = useCallback((data: { currentDistrictId: string; unlockedDistricts: Record<string, boolean>; rewardedDistricts: Record<string, boolean> }) => {
    setUnlockedMap(data.unlockedDistricts);
    setRewardedMap(data.rewardedDistricts);
    setCurrentDistrictId(data.currentDistrictId);
  }, []);

  return (
    <DistrictContext.Provider value={{
      currentDistrictId,
      setCurrentDistrict,
      isDistrictUnlocked,
      unlockDistrict,
      isDistrictRewarded,
      markDistrictRewarded,
      resetDistricts,
      restoreDistrictState,
      unlockedDistrictsMap: unlockedMap,
      rewardedDistrictsMap: rewardedMap,
    }}>
      {children}
    </DistrictContext.Provider>
  );
};

export function useDistrict(): DistrictContextValue {
  const ctx = useContext(DistrictContext);
  if (!ctx) {
    throw new Error('useDistrict must be used within a DistrictProvider');
  }
  return ctx;
}
