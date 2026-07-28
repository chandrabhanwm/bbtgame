import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Business } from '../types';
import { getBusinessCategory } from '../data/businessCategoryPresentation';
import { CoinIcon } from './CoinIcon';
import { CoinBurst } from './FX';
import { playTap } from '../utils/audio';

interface BusinessGridCardProps {
  business: Business;
  /** Position within the district's business list — drives even price-badge
   *  color cycling (not a hash, which clustered unevenly across the real
   *  business ids). Purely presentational, not persisted. */
  index: number;
  /** Optional real photo, supplied later — falls back to a themed gradient
   *  + emoji placeholder when not provided, so nothing breaks or looks
   *  broken before real images are wired in. */
  imageUrl?: string;
  onSelect: (id: string) => void;
  /** True for exactly one brief window right after this specific business
   *  was bought/upgraded — plays a one-shot celebrate animation, then
   *  clears itself. Never blocks tapping the card again mid-animation. */
  justUpdated?: boolean;
  /** Player's current cash — used only to determine whether the Buy/
   *  Upgrade badge should glow as affordable right now. */
  cash: number;
}

/**
 * Real premium 3D storefront-style icons — Microsoft's open-source, MIT
 * licensed Fluent Emoji 3D set (microsoft/fluentui-emoji), downloaded into
 * public/assets/business-icons/{businessId}.png. This replaces the flat,
 * OS-dependent emoji character (which rendered completely differently on
 * Android vs iOS vs desktop) with the exact same glossy, dimensional icon
 * on every device, matching the reference's visual quality directly
 * rather than hoping the viewer's OS emoji font looks similar.
 * Falls back to the flat emoji gracefully if a given business id doesn't
 * have a matching downloaded icon (e.g. a future business added later).
 */
const BusinessIcon: React.FC<{ business: Business }> = ({ business }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>{business.emoji}</span>;
  }

  return (
    <img
      src={`/assets/business-icons/${business.id}.png`}
      alt={business.name}
      className="w-11 h-11 object-contain"
      style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
      onError={() => setFailed(true)}
    />
  );
};

export const BusinessGridCard: React.FC<BusinessGridCardProps> = ({ business, index, imageUrl, onSelect, justUpdated = false, cash }) => {
  const category = getBusinessCategory(business.id);
  const isOwned = business.level > 0;
  const isAffordable = cash >= business.cost;

  // One-shot celebrate window — 180ms card pulse per spec, held a little
  // longer (700ms) so the slower badge/income/particle beats can finish
  // reading before everything settles back to normal. Interruptible: if
  // justUpdated fires again before this clears, the effect just restarts
  // the window cleanly.
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!justUpdated) return;
    setCelebrating(true);
    const t = setTimeout(() => setCelebrating(false), 700);
    return () => clearTimeout(t);
  }, [justUpdated]);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      animate={{ scale: celebrating ? [1, 1.03, 1] : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={() => { playTap(); onSelect(business.id); }}
      className="glossy-3d relative flex flex-col rounded-[14px] text-left cursor-pointer"
      style={{
        minHeight: '156px',
        boxShadow: celebrating ? '0 0 0 2px var(--color-premium-gold-400), 0 0 16px rgba(212, 167, 44, 0.45)' : undefined,
      }}
    >
      {celebrating && (
        <>
          <CoinBurst count={7} />
          <motion.div
            className="absolute -top-2 left-1/2 z-20 px-2.5 py-1 rounded-full font-bold text-[10px] whitespace-nowrap pointer-events-none flex items-center gap-1"
            style={{
              backgroundColor: 'var(--color-premium-gold-400)',
              color: 'var(--color-premium-text-inverse)',
              boxShadow: '0 2px 10px rgba(212,167,44,0.6)',
            }}
            initial={{ opacity: 0, y: 4, x: '-50%', scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [4, -14, -22, -30], scale: [0.6, 1.15, 1, 0.9] }}
            transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.25, 0.7, 1] }}
          >
            {business.level === 1 ? '✓ Purchased!' : '⬆ Level Up!'}
          </motion.div>
        </>
      )}
      {/* Image region — clipped to rounded top corners locally, not via the
          outer card's overflow, so the outer container can never clip
          content below it regardless of any height-calculation quirk.
          Shrunk further per request — icon inside is smaller to match. */}
      <div className="relative w-full h-[64px] rounded-t-[14px] overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${business.themeColor}44, var(--color-premium-surface))` }}
          >
            <BusinessIcon business={business} />
          </div>
        )}

        {/* Buy/Upgrade badge, top-left — shows the actual action this
            card leads to (not the category name, which didn't tell a
            player anything actionable), colored per-category to match
            the price badge below it. Glows when currently affordable. */}
        <motion.span
          className="absolute top-1.5 left-1.5 px-2.5 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: category.badgeBg, color: category.badgeText }}
          animate={isAffordable ? { boxShadow: ['0 0 0px rgba(212,167,44,0)', '0 0 10px rgba(212,167,44,0.85)', '0 0 0px rgba(212,167,44,0)'] } : {}}
          transition={{ duration: 1.6, repeat: isAffordable ? Infinity : 0, ease: 'easeInOut' }}
        >
          {isOwned ? 'Upgrade' : 'Buy'}
        </motion.span>
      </div>

      {/* Content region — flex-shrink-0 so this block, and everything in
          it, holds its real size no matter what height the image region
          or an ancestor grid row ends up computing. Without this, flex's
          default shrink behavior can compress a child below its content
          size instead of overflowing visibly — which reads as squished,
          illegible text rather than a clean line break. Padding/gap
          tightened to make the card read as more compact — font size and
          the name's line reservation are otherwise untouched, since those
          were the actual fix for real cross-browser bugs, not just sizing. */}
      <div className="px-2 py-1 flex flex-col gap-[3px] flex-shrink-0">
        {/* Business name — reserves a genuine 3-line box, not 2. A real
            screenshot showed "Chaudhary Marriage Hall" (24 characters, the
            longest name in the current data) rendering with its price/
            income missing entirely — the actual cause: at this card width,
            a name that long needs 3 lines, but the box only reserved 2,
            so the card's own computed height fell short of what its real
            content needed. Reserving 3 lines here, and sizing the card's
            min-height to match, fixes the root cause rather than the
            symptom. No ellipsis, no truncation, no hard line-cap — still
            wraps naturally either way. */}
        <span
          className="font-semibold text-white flex-shrink-0"
          style={{
            fontSize: '13px',
            lineHeight: '1.2',
            minHeight: '47px',
            display: 'block',
          }}
        >
          {business.name}
        </span>

        {isOwned ? (
          <motion.span
            animate={{ scale: celebrating ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-fit px-2 py-[2px] rounded-[5px] text-[9px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--color-premium-badge-green)', lineHeight: '1.6' }}
          >
            LEVEL {business.level}
          </motion.span>
        ) : (
          <span
            className="w-fit px-2 py-[2px] rounded-[5px] text-[9px] font-bold flex items-center gap-1 flex-shrink-0"
            style={{ backgroundColor: category.badgeBg, color: category.badgeText, lineHeight: '1.6' }}
          >
            ₹{formatShort(business.cost)}
          </span>
        )}

        {/* Income row — restored per reference; money is always green,
            per the frozen design system, regardless of the price badge's
            rotated color above it. Flashes to a brighter green briefly
            on purchase/upgrade, then settles back. */}
        <motion.span
          animate={{ color: celebrating ? ['var(--color-premium-green-500)', 'var(--color-premium-gold-100)', 'var(--color-premium-green-500)'] : 'var(--color-premium-green-500)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center gap-1 text-[10px] font-semibold flex-shrink-0"
        >
          <CoinIcon className="w-3 h-3" premium />
          ₹{Math.round(isOwned ? business.profitPerMin : business.baseProfitPerMin)} /min
        </motion.span>
      </div>
    </motion.button>
  );
};

/** Compact "₹20K" style formatting for the price badge, matching the reference. */
function formatShort(value: number): string {
  if (value >= 100000) return `${Math.round(value / 100000)}L`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

/** Locked-lower-tier "not yet reachable" card variant — structurally ready
 *  for a future district/slot that needs it, not triggered by any current
 *  Badeban data (every current business is either owned or buy-now). */
export const BusinessGridCardComingSoon: React.FC<{ name: string }> = ({ name }) => {
  return (
    <div
      className="glossy-3d relative flex flex-col rounded-[14px]"
      style={{ minHeight: '156px' }}
    >
      <div className="relative w-full h-[64px] rounded-t-[14px] overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-track)' }}>
          <Lock size={12} color="var(--color-premium-text-secondary)" />
        </div>
        <span className="absolute top-1.5 left-1.5 px-2 py-1 rounded-[6px] text-[7.5px] font-bold uppercase tracking-wide max-w-[68px] leading-[1.15]" style={{ backgroundColor: 'var(--color-premium-badge-gray)', color: 'var(--color-premium-text)' }}>
          REAL ESTATE
        </span>
      </div>
      <div className="px-2 py-1 flex flex-col gap-[3px] flex-shrink-0">
        <span
          className="font-semibold flex-shrink-0"
          style={{
            fontSize: '13px',
            lineHeight: '1.2',
            minHeight: '47px',
            color: 'var(--color-premium-text-secondary)',
            display: 'block',
          }}
        >
          {name}
        </span>
        <span className="text-[9px] font-semibold flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>COMING SOON</span>
        <span className="w-fit px-2 py-[3px] rounded-[6px] text-[8px] font-semibold flex-shrink-0" style={{ backgroundColor: 'var(--color-premium-track)', color: 'var(--color-premium-text-secondary)' }}>
          Unlock to build
        </span>
      </div>
    </div>
  );
};
