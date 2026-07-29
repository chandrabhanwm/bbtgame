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
  celebrating?: boolean;
}

const OCEAN = 'var(--color-premium-gold-400)';
const CORAL = 'var(--color-postcard-coral)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * The District Hero Card — the "postcard" itself. A big illustrated
 * scene up top with a rotated postage-stamp corner (the district's
 * emoji), the same signature motif introduced on the Login screen.
 * Below the fold, a ticket-stub stat strip using the perforation motif
 * as its dividers instead of a plain hairline.
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
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute -inset-6 -z-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(28,156,147,0.30), rgba(251,243,227,0) 70%)',
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,111,94,0.22) 8deg, transparent 16deg, transparent 45deg, rgba(255,111,94,0.22) 53deg, transparent 61deg, transparent 90deg, rgba(255,111,94,0.22) 98deg, transparent 106deg, transparent 135deg, rgba(255,111,94,0.22) 143deg, transparent 151deg, transparent 180deg, rgba(255,111,94,0.22) 188deg, transparent 196deg, transparent 225deg, rgba(255,111,94,0.22) 233deg, transparent 241deg, transparent 270deg, rgba(255,111,94,0.22) 278deg, transparent 286deg, transparent 315deg, rgba(255,111,94,0.22) 323deg, transparent 331deg, transparent 360deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glossy-3d relative rounded-[20px] overflow-visible">
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3 pointer-events-none z-20"
              style={{
                background: 'linear-gradient(115deg, transparent, rgba(255,255,255,0.5), transparent)',
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative rounded-t-[18px] overflow-hidden">
          <div className="absolute inset-0">
            <DistrictHeroBanner imageUrl={bannerImageUrl} />
          </div>

          <div className="relative px-3.5 pt-4 pb-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[19px] leading-none text-white" style={{ fontFamily: 'var(--font-premium-display)', fontWeight: 800 }}>
                {districtName}
              </h2>
              <span className="flex items-center gap-0.5 flex-shrink-0" aria-label={`${stars} of ${progressionConfig.maxStars} stars`}>
                {starSlots.map((_, i) => (
                  <Star key={i} size={12} className={i < stars ? 'fill-current' : ''} color={i < stars ? 'var(--color-postcard-sun)' : 'rgba(255,255,255,0.35)'} />
                ))}
              </span>
            </div>
            <p className="text-premium-caption mt-1 text-white/80">
              Your current district
            </p>
          </div>
        </div>

        {/* Postage-stamp corner — the district emoji, rotated, sitting
            half-on/half-off the banner's bottom-right corner, exactly
            like a stamp affixed to a postcard. */}
        <div className="postmark-stamp absolute -top-3 right-3 w-11 h-11 flex items-center justify-center z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <span className="text-xl leading-none">{districtEmoji}</span>
        </div>

        {/* Stat row — ticket-perforation divider above, dividers between
            cells styled as dashed "torn" seams instead of plain hairlines */}
        <div className="ticket-perforation" style={{ ['--notch-color' as any]: 'var(--color-premium-surface)' }} />

        <div className="grid grid-cols-4">
          <StatCell
            icon={<CoinIcon className="w-3 h-3" premium />}
            label="Income"
            value={`${formatCash(income)}/min`}
            valueColor={GREEN}
          />
          <StatCell
            icon={<span className="text-[10px]">🏬</span>}
            label="Owned"
            value={`${businessesOwned}/${businessesTotal}`}
          />
          <StatCell
            icon={<span className="text-[10px]">🎯</span>}
            label="Complete"
            value={`${completionPercent}%`}
          />
          <StatCell
            icon={<span className="text-[10px]">⭐</span>}
            label="Level"
            value={`${districtLevel}`}
            last
          />
        </div>

        <div className="ticket-perforation" style={{ ['--notch-color' as any]: 'var(--color-premium-surface)' }} />

        <div className="px-3.5 py-2.5 flex items-center gap-2.5">
          <motion.div
            className="flex-1 h-[7px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-premium-track)' }}
            animate={completionPercent >= 85 ? { boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 8px rgba(34,197,94,0.45)', '0 0 0px rgba(34,197,94,0)'] } : {}}
            transition={{ duration: 2, repeat: completionPercent >= 85 ? Infinity : 0, ease: 'easeInOut' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: CORAL }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </motion.div>
          <span className="text-premium-caption whitespace-nowrap flex-shrink-0" style={{ color: TEXT_SECONDARY }}>
            {completionPercent}% to next level
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
    className="flex flex-col items-start gap-1 px-3 py-2.5"
    style={{ borderRight: last ? 'none' : '1px dashed var(--color-premium-border)' }}
  >
    <span className="text-premium-label" style={{ color: OCEAN }}>
      {label}
    </span>
    <span className="flex items-center gap-1 text-[12px] whitespace-nowrap" style={{ fontFamily: 'var(--font-premium-display)', fontWeight: 700, color: valueColor ?? 'var(--color-premium-text)' }}>
      {icon}
      {value}
    </span>
  </div>
);
