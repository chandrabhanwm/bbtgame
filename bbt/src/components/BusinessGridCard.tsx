import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Business } from '../types';
import { CoinIcon } from './CoinIcon';
import { BusinessPhoto, BusinessIcon } from './BusinessPhoto';
import { CoinBurst } from './FX';
import { playTap } from '../utils/audio';
import { getBusinessCategory } from '../data/businessCategoryPresentation';

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

/** Level-tier colors for a business's card — every level from L1 onward
 *  gets its own distinct color, so a player can tell a business's exact
 *  level at a glance from color alone, before even reading the "LEVEL X"
 *  badge. Levels 7+ reuse the L6 diamond/purple tier rather than
 *  inventing more colors, since the strategy-layer economy caps every
 *  business at exactly level 6 — only a legacy (pre-strategy-layer)
 *  business could ever exceed it. */
function getLevelTierColor(level: number): { border: string; glow: string; tint: string } | null {
  switch (level) {
    case 1: return { border: '#C87F4A', glow: 'rgba(200,127,74,0.35)', tint: 'rgba(200,127,74,0.10)' }; // copper
    case 2: return { border: '#CD7F32', glow: 'rgba(205,127,50,0.35)', tint: 'rgba(205,127,50,0.10)' }; // bronze
    case 3: return { border: '#C0C0C0', glow: 'rgba(192,192,192,0.35)', tint: 'rgba(192,192,192,0.10)' }; // silver
    case 4: return { border: '#FFD700', glow: 'rgba(255,215,0,0.40)', tint: 'rgba(255,215,0,0.12)' }; // gold
    case 5: return { border: '#40E0D0', glow: 'rgba(64,224,208,0.40)', tint: 'rgba(64,224,208,0.12)' }; // platinum/teal
    default: return level >= 6 ? { border: '#A855F7', glow: 'rgba(168,85,247,0.45)', tint: 'rgba(168,85,247,0.14)' } : null; // diamond/purple
  }
}

/** Converts a "#rrggbb" hex color to an "rgba(r,g,b,a)" string, used to
 *  build translucent badge/wash fills from the same hex the border and
 *  glow already use, so every level-colored surface on the card stays
 *  in the same exact hue rather than drifting between hand-picked
 *  rgba() values. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Blends a "#rrggbb" hex toward white (amount 0-1) — used to build the
 *  lighter "face" of the pressable button's gradient from the same
 *  level color used everywhere else on the card, instead of a second
 *  hand-picked color per level. */
function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Blends a "#rrggbb" hex toward black (amount 0-1) — used to build the
 *  darker "lip" shadow underneath the pressable button, which is what
 *  actually reads as the button's thickness/depth. */
function darkenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Title-cases a category label like "BAKERY" -> "Bakery" for use as the
 *  card's subtitle line, matching the reference's plain-case subtitle
 *  rather than shouting in caps the way the old category chip did. */
function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s|&\s)\w/g, (c) => c.toUpperCase());
}

/** Compact "₹20K" style formatting for the price badge, matching the reference. */
function formatShort(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${Math.round(value / 100000)}L`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

export const BusinessGridCard: React.FC<BusinessGridCardProps> = ({ business, index, imageUrl, onSelect, justUpdated = false, cash, contestPointsCelebrating = false }) => {
  const isOwned = business.level > 0;
  const category = getBusinessCategory(business.id);

  // One-shot celebrate window — 180ms card pulse per spec, held a little
  // longer (700ms) so the slower badge/income/particle beats can finish
  // reading before everything settles back to normal. Interruptible: if
  // justUpdated fires again before this clears, the effect just restarts
  // the window cleanly.
  const [celebrating, setCelebrating] = useState(false);
  // A plain ref, not a useEffect cleanup, is what owns this timer's
  // lifecycle — deliberately. The parent (useBusinessActions.ts) clears
  // its own justUpdatedBusinessId flag after 700ms, which flips this
  // component's `justUpdated` prop back to false. If the reset timer
  // below were returned as this effect's cleanup function (the more
  // typical pattern), React would silently cancel it the instant that
  // prop flip happened — before the 950ms celebration was ever allowed
  // to finish. The visible result: `celebrating` got stuck `true`
  // forever after a business's very first purchase, since the early
  // `return` on the next (false) run of this effect never got a chance
  // to reset it either. A real screenshot confirmed the symptom: the
  // gold celebration glow ring never went away, permanently replacing
  // the card's normal thick pressable shadow. Storing the timer in a
  // ref means a `justUpdated` flip to false is simply ignored — only
  // this timer's own completion, or a genuine component unmount
  // (separate effect below), is allowed to end the celebration.
  const celebrateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!justUpdated) return;
    setCelebrating(true);
    if (celebrateTimeoutRef.current) clearTimeout(celebrateTimeoutRef.current);
    celebrateTimeoutRef.current = setTimeout(() => setCelebrating(false), 950);
  }, [justUpdated]);
  useEffect(() => {
    return () => {
      if (celebrateTimeoutRef.current) clearTimeout(celebrateTimeoutRef.current);
    };
  }, []);

  const levelTier = getLevelTierColor(business.level);
  // The glossy image frame's accent color — the level's own color once
  // owned, otherwise the app's default teal, so an unbought business
  // doesn't show a color that hasn't been earned yet.
  const imageAccent = levelTier?.border ?? '#2DBEC8';

  return (
    <motion.button
      whileTap={{
        scale: 0.99,
        y: 4,
        boxShadow: celebrating
          ? '0 0 0 2px var(--color-premium-gold-400), 0 0 16px rgba(212, 167, 44, 0.45)'
          : `0 1px 0 ${darkenHex(imageAccent, 0.4)}, 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.14)`,
      }}
      animate={{ scale: celebrating ? [1, 0.95, 1.08, 0.98, 1.02, 1] : 1 }}
      transition={{ duration: celebrating ? 0.55 : 0.18, ease: 'easeOut' }}
      onClick={() => { playTap(); onSelect(business.id); }}
      className="relative flex flex-col rounded-[20px] text-left cursor-pointer p-3"
      style={{
        // Flat color, but a real physical "lip" underneath — the same
        // thick/pressable technique the Upgrade button already uses
        // (solid offset shadow = thickness, not the diagonal glossy
        // sheen, which stays scoped to the image/button faces only).
        // Reusing imageAccent (the level's own color, or default teal
        // when unowned) so the lip always matches everything else on
        // the card. whileTap above compresses this down to a thin lip
        // and nudges the whole card down 4px, so tapping ANYWHERE on
        // the card — not just the Upgrade button — reads as physically
        // pressing it in.
        background: levelTier
          ? `linear-gradient(165deg, ${hexToRgba(levelTier.border, 0.24)} 0%, var(--color-premium-surface) 65%)`
          : 'var(--color-premium-surface)',
        border: levelTier ? `1px solid ${hexToRgba(levelTier.border, 0.55)}` : '1px solid var(--color-premium-border)',
        boxShadow: celebrating
          ? '0 0 0 2px var(--color-premium-gold-400), 0 0 16px rgba(212, 167, 44, 0.45)'
          : `0 6px 0 ${darkenHex(imageAccent, 0.4)}, 0 10px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)`,
      }}
    >
      {/* Level-up wipe reveal — a brief, automatic color sweep across the
          card the instant a level changes, rather than the new tint just
          silently appearing. `key={business.level}` is what makes this
          replay every single time the level changes, not just on first
          mount — Framer Motion treats a changed key as a brand-new
          element and restarts the animation from `initial`. Sits above
          the card's own background (z-index 1) but below all real
          content, which stacks on top naturally since it comes later in
          the DOM at the same implicit level. */}
      {levelTier && (
        <motion.div
          key={business.level}
          className="absolute inset-0 rounded-[20px] pointer-events-none overflow-hidden"
          style={{ zIndex: 1 }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: levelTier.tint }} />
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
          <CoinBurst count={9} />
          <motion.div
            className="absolute -top-3 left-1/2 z-20 px-3 py-1.5 rounded-full font-bold text-[12px] whitespace-nowrap pointer-events-none flex items-center gap-1"
            style={{
              backgroundColor: 'var(--color-premium-gold-400)',
              color: 'var(--color-premium-text-inverse)',
              boxShadow: '0 3px 14px rgba(212,167,44,0.7)',
            }}
            initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: [6, -16, -26, -36], scale: [0.5, 1.25, 1, 0.92] }}
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

      {/* Glossy 3D image — inset with real padding on all sides (the card
          itself stays flat), reusing the app's shared glossy-3d treatment
          scoped to just this frame rather than the whole card, per design
          direction: gloss on the internal image and buttons only. Border/
          glow color is the business's own level tier once owned, so the
          level color is still visible here even though there's no
          full-card wash. */}
      <div
        className="relative w-full h-[130px] rounded-2xl overflow-hidden flex-shrink-0"
        style={{
          border: `1.5px solid ${imageAccent}`,
          // Sunken into the card, not raised — the opposite direction
          // from the card's own outward lip shadow above. A dark inset
          // shadow along the top/inner edge reads as a recessed slot the
          // photo sits inside, with a faint inset highlight along the
          // bottom edge suggesting the socket's far inside wall catching
          // a little light — the same visual grammar as a physical
          // photo-frame cutout pressed into a raised panel.
          boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.08)',
          zIndex: 2,
        }}
      >
        <BusinessPhoto
          business={business}
          imageUrl={imageUrl}
          fallback={
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${business.themeColor}66, var(--color-premium-elevated))` }}
            >
              <BusinessIcon business={business} className="w-16 h-16 object-contain" emojiClassName="text-5xl" />
            </div>
          }
        />
      </div>

      {/* Title, category subtitle, description — plain readable text on
          the flat card surface. Every block below reserves a FIXED height
          (line-clamp + explicit minHeight) rather than sizing to actual
          content, so a 1-line title doesn't let everything below it sit
          higher than a neighboring card whose title wrapped to 2 lines —
          every card in the grid keeps an identical skeleton regardless of
          what text lands in it. */}
      <div className="mt-3 relative" style={{ zIndex: 2 }}>
        <h3
          className="font-semibold text-[15px] leading-tight line-clamp-2"
          style={{ color: 'var(--color-premium-text)', minHeight: '38px' }}
        >
          {business.name}
        </h3>
        <p
          className="text-[11px] font-medium mt-1 line-clamp-1"
          style={{ color: 'var(--color-premium-text-secondary)', minHeight: '14px' }}
        >
          {toTitleCase(category.label)}
        </p>
        <p
          className="text-[11px] leading-snug mt-2 line-clamp-2"
          style={{ color: 'var(--color-premium-text-secondary)', minHeight: '30px' }}
        >
          {business.description}
        </p>
      </div>

      {/* Level + income pills. Income always reads business.profitPerMin
          directly, whether owned or not — that field is correctly
          maintained as a genuine Level 1 preview (with any already-active
          synergies applied) for an unowned business, and as the real,
          synergy-adjusted current income once owned. Reading
          baseProfitPerMin here instead was the exact bug caught from a
          real screenshot — a stale, unscaled number that never reflected
          the actual strategy-layer economy at all. */}
      <div className="flex items-center gap-1.5 mt-2.5 relative" style={{ minHeight: '26px', zIndex: 2 }}>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
          style={{ backgroundColor: hexToRgba(imageAccent, 0.16), color: imageAccent }}
        >
          {isOwned ? `Level ${business.level}` : 'Buy'}
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
          style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--color-premium-green-500)' }}
        >
          <CoinIcon className="w-2.5 h-2.5" premium />
          ₹{Math.round(business.profitPerMin)}/min
        </span>
      </div>

      {/* Divider + price/CTA footer. Explicit gap-2 guarantees real
          separation between the price and the button regardless of how
          much room justify-between finds — at this card's actual narrow
          2-column width, "Upgrade" plus a wide price like "₹53K" left no
          room at all without this, and the two visibly overlapped (the
          price's last character rendering underneath the button). */}
      <div
        className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 relative"
        style={{ borderTop: '1px solid var(--color-premium-border)', zIndex: 2 }}
      >
        <span className="font-bold text-[15px] flex-shrink-0" style={{ color: imageAccent }}>
          ₹{formatShort(business.cost)}
        </span>

        {/* CTA — visually a button, but this whole card is already a
            <button> (onSelect above), so this stays a <div> to avoid
            nesting interactive elements; tapping anywhere on the card,
            including here, opens the same detail sheet. Built from the
            same pressable "recipe" (gradient face, solid lip shadow, real
            depress on tap) as .btn-premium-pressable, via inline styles
            here instead of the static CSS class, so the face/lip colors
            can be derived from this business's own level color. */}
        <motion.div
          whileTap={{ y: 3, boxShadow: `0 1px 0 ${darkenHex(imageAccent, 0.35)}, 0 2px 5px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)` }}
          className="px-4 py-2 rounded-full font-bold text-[11.5px] flex-shrink-0"
          style={{
            background: `linear-gradient(180deg, ${lightenHex(imageAccent, 0.35)} 0%, ${imageAccent} 100%)`,
            color: 'var(--color-premium-text-inverse)',
            boxShadow: `0 4px 0 ${darkenHex(imageAccent, 0.35)}, 0 7px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)`,
          }}
        >
          {isOwned ? 'Upgrade' : 'Buy'}
        </motion.div>
      </div>
    </motion.button>
  );
};

/** Locked-lower-tier "not yet reachable" card variant — structurally ready
 *  for a future district/slot that needs it, not triggered by any current
 *  data (every current business is either owned or buy-now). */
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
