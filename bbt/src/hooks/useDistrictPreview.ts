import { useState, useEffect } from 'react';

interface UseDistrictPreviewParams {
  activeTab: string;
  isDistrictUnlocked: (districtId: string) => boolean;
  setCurrentDistrict: (districtId: string) => void;
}

/**
 * Locked-district preview mode — extracted out of App.tsx per the
 * Phase 0 architecture cleanup. Behavior preserved exactly: if the
 * previewed district becomes unlocked while the player is browsing it
 * (e.g. passive income crosses the net-worth threshold mid-preview),
 * it seamlessly promotes to the real currentDistrictId and drops out
 * of preview — same screen, same components, it just stops being
 * read-only. Leaving the Home tab always exits preview; re-entering
 * starts fresh.
 */
export function useDistrictPreview({ activeTab, isDistrictUnlocked, setCurrentDistrict }: UseDistrictPreviewParams) {
  const [previewDistrictId, setPreviewDistrictId] = useState<string | null>(null);

  useEffect(() => {
    if (previewDistrictId && isDistrictUnlocked(previewDistrictId)) {
      setCurrentDistrict(previewDistrictId);
      setPreviewDistrictId(null);
    }
  }, [previewDistrictId, isDistrictUnlocked, setCurrentDistrict]);

  useEffect(() => {
    if (activeTab !== 'home' && previewDistrictId) {
      setPreviewDistrictId(null);
    }
  }, [activeTab]);

  const isPreviewMode = previewDistrictId !== null;

  return { previewDistrictId, setPreviewDistrictId, isPreviewMode };
}
