import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { DistrictHeroBanner } from './DistrictHeroBanner';
import { CoinIcon } from './CoinIcon';
import { progressionConfig } from '../config/progressionConfig';
import { formatCash } from '../utils/formatCash';

interface DistrictSummaryCardProps {
  districtEmoji: string;
  districtName: string;
  /** Real district photography, supplied later. */
  bannerImageUrl?: string;
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  districtLevel: number;
  stars: number;
  /** True for the brief window the existing completion celebration modal
   *  is showing — this is what adds ambient effects around the card
   *  (gold rays, a shine sweep, a soft spotlight vignette) without
   *  touching the modal/confetti/sound, which already do their job. */
  celebrating?: boolean;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * The District Hero Card. Same data contract as before (fed by
 * getDistrictProgress() upstream) — presentation only.
 *
 * Note on "Next Level in X%": no separate "progress to next district
 * level" metric exists in the game's data model, and none was added —
 * this reuses completionPercent (the same value driving the progress bar)
 * rather than inventing a new calculation.
 */
export const DistrictSummaryCard: React.FC<DistrictSummaryCardProps> = React.memo(({
  districtEmoji,
  districtName,
  bannerImageUrl,
  income,
  businessesOwned,
  businessesTotal,
  completionPercent,
  districtLevel,
  stars,
  celebrating = false,
}) => {
  const starSlots = useMemo(() => Array.from({ length: progressionConfig.maxStars }), []);

  return (
    <div className="relative">
      {/* Soft spotlight vignette + gold rays — sits behind the card,
          extending slightly beyond its edges, giving a "the world is
          celebrating with you" feel without a fixed-position overlay
          that could misbehave inside animated ancestors. Purely ambient;
          the actual celebration (modal, confetti, sound) is untouched. */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute -inset-6 -z-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(212,167,44,0.35), rgba(10,10,11,0.55) 70%)',
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(212,167,44,0.25) 8deg, transparent 16deg, transparent 45deg, rgba(212,167,44,0.25) 53deg, transparent 61deg, transparent 90deg, rgba(212,167,44,0.25) 98deg, transparent 106deg, transparent 135deg, rgba(212,167,44,0.25) 143deg, transparent 151deg, transparent 180deg, rgba(212,167,44,0.25) 188deg, transparent 196deg, transparent 225deg, rgba(212,167,44,0.25) 233deg, transparent 241deg, transparent 270deg, rgba(212,167,44,0.25) 278deg, transparent 286deg, transparent 315deg, rgba(212,167,44,0.25) 323deg, transparent 331deg, transparent 360deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glossy-3d-subtle relative rounded-2xl overflow-hidden">
        {/* Shine sweep — a single diagonal light band crossing the card
            once when the celebration begins */}
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3 pointer-events-none z-20"
              style={{
                background: 'linear-gradient(115deg, transparent, rgba(255,255,255,0.28), transparent)',
              }}
            />
          )}
        </AnimatePresence>
      {/* Banner background + content — the content sits in normal document
          flow now (not absolutely positioned over a fixed-height box), so
          this section's height is exactly what the text needs, nothing
          more. The banner background layer fills whatever that ends up
          being via absolute inset-0, instead of the other way around.
          Clipping is scoped to this banner's own rounded top corners only
          (not the outer card) — an outer overflow:hidden was confirmed via
          a real iOS Safari screenshot to sometimes clip entire content
          blocks below it when the flex container's height was
          miscalculated on that engine. */}
      <div className="relative rounded-t-2xl overflow-hidden">
        <div className="absolute inset-0">
          <DistrictHeroBanner imageUrl={bannerImageUrl} />
        </div>

        <div className="relative px-3 pt-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[19px] font-bold text-white leading-none">
              {districtEmoji} {districtName.toUpperCase()}
            </h2>
            <span className="flex items-center gap-0.5 flex-shrink-0" aria-label={`${stars} of ${progressionConfig.maxStars} stars`}>
              {starSlots.map((_, i) => (
                <Star key={i} size={12} className={i < stars ? 'fill-current' : ''} color={i < stars ? GOLD : 'var(--color-premium-star-empty)'} />
              ))}
            </span>
          </div>
          <p className="text-[9px] font-bold tracking-wider mt-1" style={{ color: GOLD }}>
            YOUR CURRENT DISTRICT
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: 'var(--color-premium-border)' }} />

      {/* Stat row — 4 columns, dividers between */}
      <div className="grid grid-cols-4">
        <StatCell
          icon={<CoinIcon className="w-3 h-3" premium />}
          label="DISTRICT INCOME"
          value={`${formatCash(income)}/min`}
          valueColor={GREEN}
        />
        <StatCell
          icon={<span className="text-[10px]">🏬</span>}
          label="BUSINESSES OWNED"
          value={`${businessesOwned} / ${businessesTotal}`}
        />
        <StatCell
          icon={<span className="text-[10px]">🎯</span>}
          label="COMPLETION"
          value={`${completionPercent}%`}
        />
        <StatCell
          icon={<span className="text-[10px]">🏛️</span>}
          label="DISTRICT LEVEL"
          value={`${districtLevel}`}
          last
        />
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: 'var(--color-premium-border)' }} />

      {/* Progress bar — "Next Level in X%" sits inline on the same row now,
          instead of as its own line below it. A soft glow appears on the
          track itself when close to a milestone (85%+), not the fill bar
          — the track's own overflow-hidden only clips what's inside it,
          not its own external glow, so this stays visible. */}
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <motion.div
          className="flex-1 h-[6px] rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-premium-track)' }}
          animate={completionPercent >= 85 ? { boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 8px rgba(34,197,94,0.55)', '0 0 0px rgba(34,197,94,0)'] } : {}}
          transition={{ duration: 2, repeat: completionPercent >= 85 ? Infinity : 0, ease: 'easeInOut' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: GREEN }}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </motion.div>
        <span className="text-[9px] font-medium whitespace-nowrap flex-shrink-0" style={{ color: TEXT_SECONDARY }}>
          Next Level in {completionPercent}%
        </span>
      </div>
      </div>
    </div>
  );
});

DistrictSummaryCard.displayName = 'DistrictSummaryCard';

const StatCell: React.FC<{ icon: React.ReactNode; label: string; value: string; valueColor?: string; last?: boolean }> = ({
  icon, label, value, valueColor, last,
}) => (
  <div
    className="flex flex-col items-start gap-1 px-2.5 py-2"
    style={{ borderRight: last ? 'none' : '1px solid var(--color-premium-border-subtle)' }}
  >
    <span className="flex items-center gap-1 text-[7px] font-bold tracking-wide" style={{ color: GOLD }}>
      {label}
    </span>
    <span className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap" style={{ color: valueColor ?? 'var(--color-premium-text)' }}>
      {icon}
      {value}
    </span>
  </div>
);
