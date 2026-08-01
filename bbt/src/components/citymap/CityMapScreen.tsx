import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { bastiCity, getDistrict, isRoadActive, District } from '../../data/cityMapData';
import { DistrictProgressSummary } from '../../utils/districtProgress';
import { Business } from '../../types';
import { DistrictNode } from './DistrictNode';
import { RoadPath } from './RoadPath';
import { DistrictDetailSheet } from './DistrictDetailSheet';

const EMPTY_PROGRESS: DistrictProgressSummary = {
  income: 0, businessesOwned: 0, businessesTotal: 0, completionPercent: 0, completed: false, stars: 0, districtLevel: 0,
};

interface CityMapScreenProps {
  /** Called when the player taps "Enter District" in the detail sheet for
   *  an unlocked district. Locked districts never trigger this — the sheet
   *  shows the unlock requirement instead, matching "locked districts
   *  cannot be opened." */
  onOpenDistrict?: (district: District) => void;
  /** Called when the player taps "Preview Businesses" for a locked
   *  district. Opens the same Home/District screen used for real play,
   *  but in read-only preview mode — no separate preview screen exists. */
  onPreviewDistrict?: (district: District) => void;
  /** Live unlock status per district. Falls back to the static seed flag
   *  on District if not provided, so this component still works standalone. */
  isDistrictUnlocked?: (districtId: string) => boolean;
  /** Income/completion/stars per district, keyed by id. Missing entries
   *  just render as zero/incomplete rather than erroring. */
  districtProgress?: Record<string, DistrictProgressSummary>;
  currentDistrictId?: string;
  /** Each district's businesses, keyed by id — the same Business[] used
   *  everywhere else, only read here (for potential-income preview math). */
  businessesByDistrict?: Record<string, Business[]>;
  /** Id of a district that /just/ completed, if any — roads touching it
   *  pulse briefly. Caller (App.tsx) is expected to clear this after
   *  progressionConfig.completionRoadPulseDurationMs. */
  celebratingDistrictId?: string | null;
}

/**
 * The City Map screen. Fully data-driven and self-contained — it does not
 * touch any existing screen, route, or piece of game state. Drop it in
 * wherever it's needed later (a new tab, a replacement home screen, etc.)
 * by simply rendering <CityMapScreen />.
 *
 * Tapping a district still logs "Open District: <name>" per the original
 * spec, and opens a detail sheet (name, stars, completion, businesses,
 * income, unlock requirement, status). Unlocked districts get an "Enter
 * District" button; locked ones get a "Preview Businesses" button instead
 * of being blocked outright.
 */
export const CityMapScreen: React.FC<CityMapScreenProps> = ({ onOpenDistrict, onPreviewDistrict, isDistrictUnlocked, districtProgress, businessesByDistrict, celebratingDistrictId, currentDistrictId }) => {
  const [selected, setSelected] = useState<District | null>(null);

  const checkUnlocked = (districtId: string): boolean => {
    if (isDistrictUnlocked) return isDistrictUnlocked(districtId);
    return getDistrict(bastiCity, districtId)?.unlocked ?? false; // backward-compatible fallback
  };

  const getProgress = (districtId: string): DistrictProgressSummary => {
    return districtProgress?.[districtId] ?? EMPTY_PROGRESS;
  };

  const getBusinesses = (districtId: string): Business[] => {
    return businessesByDistrict?.[districtId] ?? [];
  };

  // Map content bounding box, derived from the data rather than hardcoded,
  // so adding districts further out doesn't require touching this file.
  const xs = bastiCity.districts.map((d) => d.x);
  const ys = bastiCity.districts.map((d) => d.y);
  const pad = 65;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  const handleSelect = (district: District) => {
    // eslint-disable-next-line no-console
    console.log(`Open District: ${district.name}`);
    setSelected(district);
  };

  const handleEnter = (district: District) => {
    setSelected(null);
    onOpenDistrict?.(district);
  };

  const handlePreview = (district: District) => {
    setSelected(null);
    onPreviewDistrict?.(district);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: 'radial-gradient(120% 90% at 50% 35%, var(--color-premium-elevated) 0%, var(--color-premium-bg) 75%)' }}
    >
      {/* City skyline silhouette — a fixed atmospheric backdrop, doesn't
          pan/zoom with the map content itself. Same thin gold line-art
          technique as the Footer Tip Bar's skyline, just scaled up. This
          is what actually delivers "city style background" — texture and
          atmosphere, not brightness. */}
      <svg
        viewBox="0 0 400 160"
        className="absolute inset-x-0 bottom-0 w-full pointer-events-none z-0"
        style={{ height: '22%', opacity: 0.14 }}
        preserveAspectRatio="xMidYMax slice"
      >
        <g fill="none" stroke="var(--color-premium-gold-400)" strokeWidth="2">
          <rect x="8" y="70" width="28" height="90" />
          <rect x="42" y="40" width="24" height="120" />
          <rect x="70" y="85" width="20" height="75" />
          <line x1="80" y1="85" x2="80" y2="60" />
          <rect x="96" y="20" width="32" height="140" />
          <line x1="112" y1="20" x2="112" y2="4" />
          <rect x="134" y="60" width="24" height="100" />
          <rect x="162" y="95" width="20" height="65" />
          <rect x="188" y="30" width="28" height="130" />
          <rect x="222" y="70" width="24" height="90" />
          <rect x="252" y="48" width="20" height="112" />
          <rect x="278" y="80" width="24" height="80" />
          <rect x="308" y="34" width="28" height="126" />
          <line x1="322" y1="34" x2="322" y2="14" />
          <rect x="342" y="66" width="24" height="94" />
          <rect x="372" y="90" width="20" height="70" />
        </g>
      </svg>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2.5}
        centerOnInit
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'zoomIn', step: 0.6 }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Roads render first so nodes sit visually on top */}
            {bastiCity.roads.map((road) => {
              const from = getDistrict(bastiCity, road.from);
              const to = getDistrict(bastiCity, road.to);
              if (!from || !to) return null;
              const touchesCelebrating = celebratingDistrictId != null &&
                (road.from === celebratingDistrictId || road.to === celebratingDistrictId);
              const traveled = getProgress(road.from).completed && getProgress(road.to).completed;
              return (
                <RoadPath
                  key={road.id}
                  id={road.id}
                  from={from}
                  to={to}
                  active={isRoadActive(bastiCity, road, checkUnlocked)}
                  traveled={traveled}
                  celebrating={touchesCelebrating}
                />
              );
            })}

            {bastiCity.districts.map((district) => (
              <DistrictNode
                key={district.id}
                district={district}
                unlocked={checkUnlocked(district.id)}
                progress={getProgress(district.id)}
                onSelect={handleSelect}
                isCurrent={district.id === currentDistrictId}
              />
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      <DistrictDetailSheet
        district={selected}
        unlocked={selected ? checkUnlocked(selected.id) : false}
        progress={selected ? getProgress(selected.id) : EMPTY_PROGRESS}
        businesses={selected ? getBusinesses(selected.id) : []}
        onEnter={handleEnter}
        onPreview={handlePreview}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};
