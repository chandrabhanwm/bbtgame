import React from 'react';
import { Business } from '../types';
import { BusinessGridCard } from './BusinessGridCard';

interface BusinessGridViewProps {
  businesses: Business[];
  onSelectShop: (id: string) => void;
  /** Optional per-business photo URLs, keyed by business id — supplied
   *  later; any id without an entry falls back to the themed placeholder. */
  imageUrls?: Record<string, string>;
  readOnly?: boolean;
  /** Which business (if any) was just bought/upgraded — that one card
   *  plays a brief celebrate animation, everything else is unaffected. */
  justUpdatedBusinessId?: string | null;
  /** Player's current cash — passed through to each card so its Buy/
   *  Upgrade badge can glow when currently affordable. */
  cash: number;
}

/**
 * Alternate "Grid" view of the exact same businesses a district has —
 * same data, same tap-to-open-detail-sheet contract as StreetView. Nothing
 * about buy/upgrade/collect logic lives here; tapping a card just calls
 * onSelectShop(id), identical to tapping a shop in the street view.
 */
export const BusinessGridView: React.FC<BusinessGridViewProps> = ({ businesses, onSelectShop, imageUrls, readOnly = false, justUpdatedBusinessId = null, cash }) => {
  return (
    <div className="grid grid-cols-4 gap-2.5 items-start auto-rows-min pb-2">
      {businesses.map((business, index) => (
        <BusinessGridCard
          key={business.id}
          business={business}
          index={index}
          imageUrl={imageUrls?.[business.id]}
          onSelect={readOnly ? () => {} : onSelectShop}
          justUpdated={business.id === justUpdatedBusinessId}
          cash={cash}
        />
      ))}
    </div>
  );
};
