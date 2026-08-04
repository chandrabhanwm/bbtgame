import React, { useState } from 'react';
import { Business } from '../types';

const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Real, glossy 3D storefront icons — Microsoft's open-source, MIT licensed
 * Fluent Emoji 3D set (microsoft/fluentui-emoji), downloaded into
 * public/assets/business-icons/{businessId}.png. Falls back to the flat
 * emoji character if a given business id doesn't have a downloaded icon.
 */
export const BusinessIcon: React.FC<{ business: Business; className?: string; emojiClassName?: string }> = ({
  business,
  className = 'w-24 h-24 object-contain',
  emojiClassName = 'text-7xl',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={emojiClassName} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>{business.emoji}</span>;
  }

  return (
    <img
      src={`/assets/business-icons/${business.id}.png`}
      alt={business.name}
      className={className}
      style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.55))' }}
      onError={() => setFailed(true)}
    />
  );
};

interface BusinessPhotoProps {
  business: Business;
  /** Explicit photo URL — wins over auto-lookup if supplied. */
  imageUrl?: string;
  className?: string;
  /** Rendered when no explicit imageUrl was given AND no file was found
   *  at any of the auto-lookup paths. Defaults to the themed
   *  gradient + icon treatment used everywhere else in the app, so a
   *  business always shows *something* reasonable, real photo or not. */
  fallback?: React.ReactNode;
}

/**
 * Auto-looks up a real photo for a business by id, trying
 * /assets/business-photos/{id}.jpg, .jpeg, .png, then .webp in order —
 * so adding a photo for any business is just "drop a file with the
 * right name in that folder," no code change needed per business.
 * An explicit `imageUrl` (e.g. from a future CMS/upload flow) always
 * takes priority over the auto-lookup when supplied.
 */
export const BusinessPhoto: React.FC<BusinessPhotoProps> = ({ business, imageUrl, className = 'w-full h-full object-cover', fallback }) => {
  const [extIndex, setExtIndex] = useState(0);
  const [autoFailed, setAutoFailed] = useState(false);

  if (imageUrl) {
    return <img src={imageUrl} alt={business.name} className={className} />;
  }

  if (!autoFailed && extIndex < PHOTO_EXTENSIONS.length) {
    return (
      <img
        key={extIndex}
        src={`/assets/business-photos/${business.id}.${PHOTO_EXTENSIONS[extIndex]}`}
        alt={business.name}
        className={className}
        onError={() => {
          if (extIndex + 1 < PHOTO_EXTENSIONS.length) setExtIndex((i) => i + 1);
          else setAutoFailed(true);
        }}
      />
    );
  }

  return <>{fallback ?? null}</>;
};
