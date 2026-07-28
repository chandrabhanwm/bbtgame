import React, { useState } from 'react';
import { DISTRICT_ICONS } from './DistrictNode';
import { DistrictIconName } from '../../data/cityMapData';

interface DistrictPhotoProps {
  districtId: string;
  icon: DistrictIconName;
  className?: string;
}

/**
 * Attempts to load a real photo from /assets/districts/{id}.jpg. If it's
 * not there (no photo has been supplied yet), falls back to a plain,
 * neutral premium-surface tile with a small muted icon — explicitly not
 * an illustration and not an emoji, per the City Map spec. Once real
 * photography is added to public/assets/districts/, this starts
 * rendering it automatically with no code change.
 */
export const DistrictPhoto: React.FC<DistrictPhotoProps> = ({ districtId, icon, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const Icon = DISTRICT_ICONS[icon];

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor: 'var(--color-premium-elevated)' }}
      >
        <Icon size={22} strokeWidth={1.75} color="var(--color-premium-text-secondary)" />
      </div>
    );
  }

  return (
    <img
      src={`/assets/districts/${districtId}.jpg`}
      alt=""
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
};
