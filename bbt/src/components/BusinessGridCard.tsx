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
  index: number;
  imageUrl?: string;
  onSelect: (id: string) => void;
  justUpdated?: boolean;
  cash: number;
}

const BusinessIcon: React.FC<{ business: Business }> = ({ business }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(22,48,46,0.35))' }}>{business.emoji}</span>;
  }

  return (
    <img
      src={`/assets/business-icons/${business.id}.png`}
      alt={business.name}
      className="w-11 h-11 object-contain"
      style={{ filter: 'drop-shadow(0 3px 6px rgba(22,48,46,0.35))' }}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * The business "ticket stub" card. A small illustrated top zone (the
 * item for sale) is separated from the price/action zone below by the
 * same ticket-perforation divider used throughout the app — visually
 * tearing the card into "what it is" and "what it costs", the way a
 * real admission ticket splits into a stub.
 */
export const BusinessGridCard: React.FC<BusinessGridCardProps> = ({ business, index, imageUrl, onSelect, justUpdated = false, cash }) => {
  const category = getBusinessCategory(business.id);
  const isOwned = business.level > 0;
  const isAffordable = cash >= business.cost;

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
      className="glossy-3d relative flex flex-col rounded-[16px] text-left cursor-pointer"
      style={{
        minHeight: '160px',
        boxShadow: celebrating ? `0 0 0 2px var(--color-postcard-coral), 0 0 16px rgba(255,111,94,0.4)` : undefined,
      }}
    >
      {celebrating && (
        <>
          <CoinBurst count={7} />
          <motion.div
            className="absolute -top-2 left-1/2 z-20 px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap pointer-events-none flex items-center gap-1"
            style={{
              fontFamily: 'var(--font-premium-display)', fontWeight: 700,
              backgroundColor: 'var(--color-postcard-coral)',
              color: '#FFFFFF',
              border: '2px solid var(--color-postcard-ink)',
            }}
            initial={{ opacity: 0, y: 4, x: '-50%', scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [4, -14, -22, -30], scale: [0.6, 1.15, 1, 0.9] }}
            transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.25, 0.7, 1] }}
          >
            {business.level === 1 ? '✓ Purchased!' : '⬆ Level Up!'}
          </motion.div>
        </>
      )}

      <div className="relative w-full h-[66px] rounded-t-[14px] overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${business.themeColor}33, var(--color-premium-elevated))` }}
          >
            <BusinessIcon business={business} />
          </div>
        )}

        <motion.span
          className="absolute top-1.5 left-1.5 px-2.5 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: category.badgeBg, color: category.badgeText }}
          animate={isAffordable ? { boxShadow: ['0 0 0px rgba(28,156,147,0)', '0 0 10px rgba(28,156,147,0.85)', '0 0 0px rgba(28,156,147,0)'] } : {}}
          transition={{ duration: 1.6, repeat: isAffordable ? Infinity : 0, ease: 'easeInOut' }}
        >
          {isOwned ? 'Upgrade' : 'Buy'}
        </motion.span>
      </div>

      {/* Ticket perforation — tears the icon zone from the price/name zone */}
      <div className="ticket-perforation" style={{ ['--notch-color' as any]: 'var(--color-premium-surface)' }} />

      <div className="px-2.5 py-1.5 flex flex-col gap-[3px] flex-shrink-0">
        <span
          className="flex-shrink-0"
          style={{
            fontFamily: 'var(--font-premium-display)',
            fontWeight: 700,
            fontSize: '13px',
            lineHeight: '1.2',
            minHeight: '47px',
            display: 'block',
            color: 'var(--color-premium-text)',
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
            style={{ backgroundColor: category.badgeBg, color: category.badgeText, lineHeight: '1.6', fontFamily: 'var(--font-premium-mono)' }}
          >
            ${formatShort(business.cost)}
          </span>
        )}

        <motion.span
          animate={{ color: celebrating ? ['var(--color-premium-green-500)', 'var(--color-postcard-sun)', 'var(--color-premium-green-500)'] : 'var(--color-premium-green-500)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center gap-1 text-[10px] font-semibold flex-shrink-0"
        >
          <CoinIcon className="w-3 h-3" premium />
          ${Math.round(isOwned ? business.profitPerMin : business.baseProfitPerMin)} /min
        </motion.span>
      </div>
    </motion.button>
  );
};

/** Compact "$20K" style formatting for the price badge — Western K/M,
 *  matching formatCash.ts's own thresholds rather than a separate scale. */
function formatShort(value: number): string {
  if (value >= 1000000) return `${Math.round(value / 100000) / 10}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

export const BusinessGridCardComingSoon: React.FC<{ name: string }> = ({ name }) => {
  return (
    <div
      className="glossy-3d relative flex flex-col rounded-[16px]"
      style={{ minHeight: '160px' }}
    >
      <div className="relative w-full h-[66px] rounded-t-[14px] overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-track)' }}>
          <Lock size={12} color="var(--color-premium-text-secondary)" />
        </div>
        <span className="absolute top-1.5 left-1.5 px-2 py-1 rounded-[6px] text-[7.5px] font-bold uppercase tracking-wide max-w-[68px] leading-[1.15]" style={{ backgroundColor: 'var(--color-premium-badge-gray)', color: '#FFFFFF' }}>
          COMING SOON
        </span>
      </div>
      <div className="ticket-perforation" style={{ ['--notch-color' as any]: 'var(--color-premium-surface)' }} />
      <div className="px-2.5 py-1.5 flex flex-col gap-[3px] flex-shrink-0">
        <span
          className="flex-shrink-0"
          style={{
            fontFamily: 'var(--font-premium-display)',
            fontWeight: 700,
            fontSize: '13px',
            lineHeight: '1.2',
            minHeight: '47px',
            color: 'var(--color-premium-text-secondary)',
            display: 'block',
          }}
        >
          {name}
        </span>
        <span className="text-premium-caption flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>Locked</span>
        <span className="w-fit px-2 py-[3px] rounded-[6px] text-[8px] font-semibold flex-shrink-0" style={{ backgroundColor: 'var(--color-premium-track)', color: 'var(--color-premium-text-secondary)' }}>
          Unlock to build
        </span>
      </div>
    </div>
  );
};
