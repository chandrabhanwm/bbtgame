import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Business } from '../types';
import { CoinIcon } from './CoinIcon';
import { BusinessPhoto, BusinessIcon } from './BusinessPhoto';
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
  /** True for a brief window, timed to start after the existing
   *  purchase/upgrade celebration finishes — shows a separate "+10
   *  contest points" beat, not blended into the existing one. */
  contestPointsCelebrating?: boolean;
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
/** Level-tier colors for a business's card — L1 (just bought, not yet
 *  upgraded) deliberately gets no special treatment, since it isn't an
 *  achievement yet. L2 through L6 each get their own distinct color, so a
 *  player can tell how invested a business is at a glance across an
 *  entire grid, without reading every level number individually. */
function getLevelTierColor(level: number): { border: string; glow: string; tint: string } | null {
  switch (level) {
    case 2: return { border: '#CD7F32', glow: 'rgba(205,127,50,0.35)', tint: 'rgba(205,127,50,0.10)' }; // bronze
    case 3: return { border: '#C0C0C0', glow: 'rgba(192,192,192,0.35)', tint: 'rgba(192,192,192,0.10)' }; // silver
    case 4: return { border: '#FFD700', glow: 'rgba(255,215,0,0.40)', tint: 'rgba(255,215,0,0.12)' }; // gold
    case 5: return { border: '#40E0D0', glow: 'rgba(64,224,208,0.40)', tint: 'rgba(64,224,208,0.12)' }; // platinum/teal
    default: return level >= 6 ? { border: '#A855F7', glow: 'rgba(168,85,247,0.45)', tint: 'rgba(168,85,247,0.14)' } : null; // diamond/purple
  }
}

export const BusinessGridCard: React.FC<BusinessGridCardProps> = ({ business, index, imageUrl, onSelect, justUpdated = false, cash, contestPointsCelebrating = false }) => {
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

  const levelTier = getLevelTierColor(business.level);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      animate={{ scale: celebrating ? [1, 1.03, 1] : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={() => { playTap(); onSelect(business.id); }}
      className="glossy-3d relative flex flex-col rounded-[22px] text-left cursor-pointer overflow-hidden"
      style={{
        minHeight: '340px',
        border: levelTier ? `1.5px solid ${levelTier.border}` : undefined,
        boxShadow: celebrating
          ? '0 0 0 2px var(--color-premium-gold-400), 0 0 16px rgba(212, 167, 44, 0.45)'
          : levelTier
          ? `0 0 14px ${levelTier.glow}`
          : undefined,
      }}
    >
      {/* Level-tier tint — a real DOM overlay, not a background-color on
          the button itself. glossy-3d's own ::after pseudo-element (its
          diagonal shine effect) sits on top of a plain background-color
          with no z-index of its own, which was completely burying the
          subtle tint there. An explicit z-index here guarantees this
          renders above that shine, while still sitting below all the
          real card content (icon, name, price), which naturally stacks
          on top since it comes later in the DOM at the same z-index.
          `key={business.level}` is the actual trigger — Framer Motion
          treats a changed key as a brand-new element, so the wipe below
          replays from `initial` every single time the level changes,
          not just on first mount. This is what makes the reveal feel
          like a genuine moment tied to the upgrade itself, automatic,
          with no extra tap required. */}
      {levelTier && (
        <motion.div
          key={business.level}
          className="absolute inset-0 rounded-[22px] pointer-events-none overflow-hidden"
          style={{ backgroundColor: levelTier.tint, zIndex: 1 }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          {/* A brighter leading edge on the wipe itself — makes the sweep
              read as a deliberate "reveal," not just a fade-in. */}
          <motion.div
            className="absolute inset-y-0 w-10 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${levelTier.border}55, transparent)` }}
            initial={{ left: '-10%' }}
            animate={{ left: '110%' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        </motion.div>
      )}

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

      {/* Weekly contest points — a genuinely separate, later beat. The
          parent delays triggering this until after the purchase/upgrade
          celebration above has already played, and it's positioned and
          styled distinctly (top-right, rose accent, trophy icon) so the
          two never visually collide even during their brief overlap. */}
      {contestPointsCelebrating && (
        <motion.div
          className="absolute -top-2 -right-1 z-20 px-2.5 py-1 rounded-full font-bold text-[10px] whitespace-nowrap pointer-events-none flex items-center gap-1"
          style={{
            backgroundColor: '#D4547E',
            color: '#ffffff',
            boxShadow: '0 2px 10px rgba(212,84,126,0.6)',
          }}
          initial={{ opacity: 0, y: 4, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: [4, -10, -18, -26], scale: [0.6, 1.15, 1, 0.9] }}
          transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.25, 0.7, 1] }}
        >
          🏆 +10 pts
        </motion.div>
      )}
      {/* Full-bleed photo — fills the entire card, not just a header strip.
          Everything else (title, description, badges, button) overlays on
          top of it via the gradient below, exactly like the reference. */}
      <div className="absolute inset-0">
        <BusinessPhoto
          business={business}
          imageUrl={imageUrl}
          fallback={
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${business.themeColor}66, var(--color-premium-surface))` }}
            >
              <BusinessIcon business={business} />
            </div>
          }
        />
      </div>

      {/* Bottom gradient — fades from transparent to near-black so the
          overlaid text stays readable against any photo/color underneath,
          matching the reference's card treatment. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[72%] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0) 100%)' }}
      />

      {/* Content — pinned to the bottom of the card, sitting on the
          gradient above. */}
      <div className="relative z-10 mt-auto flex flex-col gap-2 px-3.5 pb-3.5 pt-2">
        <div>
          <h3 className="font-bold text-white text-[15px] leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {business.name}
          </h3>
          <p className="text-white/80 text-[11px] leading-snug mt-1 line-clamp-2">
            {business.description}
          </p>
        </div>

        {/* Two badge pills, matching the reference's rating/stay pills —
            here showing level-or-buy status and income rate instead,
            since those are this game's equivalent "at a glance" facts. */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <motion.span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#ffffff', backdropFilter: 'blur(4px)' }}
            animate={isAffordable && !isOwned ? { boxShadow: ['0 0 0px rgba(212,167,44,0)', '0 0 10px rgba(212,167,44,0.85)', '0 0 0px rgba(212,167,44,0)'] } : {}}
            transition={{ duration: 1.6, repeat: isAffordable && !isOwned ? Infinity : 0, ease: 'easeInOut' }}
          >
            {isOwned ? `⭐ LEVEL ${business.level}` : '🔓 Buy'}
          </motion.span>
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#ffffff', backdropFilter: 'blur(4px)' }}
          >
            <CoinIcon className="w-2.5 h-2.5" premium />
            ₹{Math.round(isOwned ? business.profitPerMin : business.baseProfitPerMin)}/min
          </span>
        </div>

        {/* CTA — visually a button, but this whole card is already a
            <button> (onSelect above), so this stays a <div> to avoid
            nesting interactive elements; tapping anywhere on the card,
            including here, opens the same detail sheet. */}
        <div
          className="w-full mt-0.5 py-2.5 rounded-full text-center font-bold text-[12.5px]"
          style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}
        >
          {isOwned ? `Upgrade — ₹${formatShort(business.cost)}` : `Buy — ₹${formatShort(business.cost)}`}
        </div>
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
