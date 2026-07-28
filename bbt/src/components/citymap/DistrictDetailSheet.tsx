import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Star, ArrowRight, X, CheckCircle2, Eye } from 'lucide-react';
import { District } from '../../data/cityMapData';
import { DistrictProgressSummary, getDistrictPotentialIncome } from '../../utils/districtProgress';
import { Business } from '../../types';
import { CoinIcon } from '../CoinIcon';
import { progressionConfig } from '../../config/progressionConfig';
import { playClick } from '../../utils/audio';
import { DistrictPhoto } from './DistrictPhoto';

interface DistrictDetailSheetProps {
  district: District | null;
  unlocked: boolean;
  progress: DistrictProgressSummary;
  /** The district's businesses — used only to compute potential income for
   *  the locked-district preview. Same Business[] already used everywhere
   *  else; nothing separate is created for preview purposes. */
  businesses: Business[];
  onEnter: (district: District) => void;
  /** Locked districts get this instead of "Enter District" — opens the
   *  read-only preview on the same Home/District screen used for real play. */
  onPreview: (district: District) => void;
  onClose: () => void;
}

type DistrictStatus = 'completed' | 'in_progress' | 'locked';

/**
 * Bottom sheet shown when any City Map node is tapped — locked or
 * unlocked. Same structural pattern, tokens, and button/badge/progress-bar
 * conventions as ShopDetailSheet (Header/Business Card language), per the
 * Premium UI Pass 3 spec. The map node itself is untouched; this is purely
 * an overlay on top of it. Functional behavior is identical to before —
 * only the visuals changed.
 */
export const DistrictDetailSheet: React.FC<DistrictDetailSheetProps> = ({ district, unlocked, progress, businesses, onEnter, onPreview, onClose }) => {
  if (!district) return null;

  const status: DistrictStatus = progress.completed ? 'completed' : unlocked ? 'in_progress' : 'locked';
  const statusLabel: Record<DistrictStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    locked: 'Locked',
  };
  const statusStyle: Record<DistrictStatus, { bg: string; text: string; border: string }> = {
    completed: { bg: 'var(--color-premium-green-500)', text: 'var(--color-premium-text-inverse)', border: 'var(--color-premium-green-500)' },
    in_progress: { bg: 'var(--color-premium-elevated)', text: 'var(--color-premium-gold-400)', border: 'var(--color-premium-gold-400)' },
    locked: { bg: 'var(--color-premium-elevated)', text: 'var(--color-premium-text-secondary)', border: 'var(--color-premium-border)' },
  };

  const potentialIncome = getDistrictPotentialIncome(businesses);
  const style = statusStyle[status];

  return (
    <AnimatePresence>
      {district && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--color-premium-scrim)' }}
            onClick={() => { playClick(); onClose(); }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative w-full rounded-t-[24px] p-5 pb-7 max-h-[85vh] overflow-y-auto no-scrollbar"
            style={{
              backgroundColor: 'var(--color-premium-surface)',
              borderTop: '1.5px solid var(--color-premium-border-strong)',
              borderLeft: '1.5px solid var(--color-premium-border-strong)',
              borderRight: '1.5px solid var(--color-premium-border-strong)',
            }}
          >
            <div className="w-10 h-1.5 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--color-premium-track)' }} />

            <button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
              aria-label="Close"
            >
              <X size={16} color="var(--color-premium-text-secondary)" strokeWidth={3} />
            </button>

            {/* District photo — real image from /assets/districts/, plain
                neutral fallback (no illustration, no emoji) if unavailable */}
            <DistrictPhoto
              districtId={district.id}
              icon={district.icon}
              className="w-full h-28 rounded-2xl mb-3.5"
            />

            <div className="flex items-center justify-between pr-10">
              <h3 className="font-bold text-base" style={{ color: 'var(--color-premium-text)' }}>
                {district.name}
              </h3>
              <span className="flex items-center gap-[1px]">
                {Array.from({ length: progressionConfig.maxStars }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    color={i < progress.stars ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border-strong)'}
                    className={i < progress.stars ? 'fill-current' : ''}
                  />
                ))}
              </span>
            </div>

            <p className="text-[10.5px] leading-snug mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
              {district.description}
            </p>

            <span
              className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: style.bg, color: style.text, border: `1.5px solid ${style.border}` }}
            >
              {status === 'completed' && <CheckCircle2 size={11} />}
              {status === 'locked' && <Lock size={10} />}
              {statusLabel[status]}
            </span>

            {unlocked ? (
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <StatTile label="Income" value={`${Math.round(progress.income).toLocaleString('en-IN')}/min`} money />
                <StatTile label="Businesses" value={`${progress.businessesOwned} / ${progress.businessesTotal}`} />
                <StatTile label="Completion" value={`${progress.completionPercent}%`} />
                <StatTile label="District Level" value={`${progress.districtLevel}`} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <StatTile label="Potential Income" value={`${Math.round(potentialIncome).toLocaleString('en-IN')}/min`} money />
                <StatTile label="Businesses" value={`${progress.businessesTotal}`} />
              </div>
            )}

            {/* Progress bar — single, thin, represents completion */}
            <div className="mt-3.5">
              <div className="w-full h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: 'var(--color-premium-green-500)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.completionPercent}%` }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              </div>
            </div>

            {!unlocked && district.unlockRequirement && (
              <div
                className="mt-3 p-3 rounded-xl flex items-center gap-2.5"
                style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
              >
                <Lock size={15} color="var(--color-premium-text-secondary)" className="flex-shrink-0" />
                <span className="text-[10px] leading-snug" style={{ color: 'var(--color-premium-text-secondary)' }}>
                  Unlock requirement: <span className="font-bold" style={{ color: 'var(--color-premium-text)' }}>{district.unlockRequirement.label}</span>
                </span>
              </div>
            )}

            {unlocked ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { playClick(); onEnter(district); }}
                className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-premium-badge-green)', border: '1.5px solid var(--color-premium-badge-green)', color: 'var(--color-premium-text)' }}
              >
                Enter District <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { playClick(); onPreview(district); }}
                className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border-strong)', color: 'var(--color-premium-text)' }}
              >
                <Eye size={16} /> Preview Businesses
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StatTile: React.FC<{ label: string; value: string; money?: boolean }> = ({ label, value, money }) => (
  <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}>
    <span className="text-[8px] font-bold uppercase" style={{ color: 'var(--color-premium-text-secondary)' }}>{label}</span>
    <div className="flex items-center gap-1 font-bold text-[13px]" style={{ color: money ? 'var(--color-premium-green-500)' : 'var(--color-premium-text)' }}>
      {money && <CoinIcon className="w-3.5 h-3.5" premium />}
      {value}
    </div>
  </div>
);
