import React from 'react';

interface DistrictHeroBannerProps {
  /** Real district photography, supplied later — falls back to a themed
   *  gradient when not provided. */
  imageUrl?: string;
}

export const DistrictHeroBanner: React.FC<DistrictHeroBannerProps> = React.memo(({ imageUrl }) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-premium-elevated) 0%, var(--color-premium-bg) 100%)' }} />
      )}
      {/* Vignette + bottom dark gradient so overlaid text always reads clearly */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 50% 15%, transparent 35%, var(--color-premium-overlay-vignette) 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: 'linear-gradient(to top, var(--color-premium-overlay-fade), transparent)' }} />
    </div>
  );
});

DistrictHeroBanner.displayName = 'DistrictHeroBanner';
