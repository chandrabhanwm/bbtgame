import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShoppingCart, ArrowUpCircle, X } from 'lucide-react';
import { Business } from '../types';
import { playClick, playUpgrade, playUnlock, playError } from '../utils/audio';
import { MiniShopSVG } from './BusinessCard';
import { CoinIcon } from './CoinIcon';
import { CoinBurst } from './FX';
import { calculateTieredProfit } from '../utils/profitCurve';

interface ShopDetailSheetProps {
  business: Business | null;
  index: number;
  cash: number;
  onUpgrade: (id: string) => void;
  onClose: () => void;
  /** Locked-district preview: shows the shop's info (name, icon, buy price,
   *  base income, description) but every action is disabled — no buy, no
   *  upgrade, no collect. onUpgrade is never called in this mode. */
  readOnly?: boolean;
}

/**
 * The core Home Screen interaction: tap a shop, see its stats in a sheet,
 * tap Buy/Upgrade, watch it register, sheet closes. Same interaction and
 * logic as before — this update only brings the visuals in line with the
 * frozen premium design system (it was the one remaining Home Screen
 * surface still on the old bright theme).
 */
export const ShopDetailSheet: React.FC<ShopDetailSheetProps> = ({ business, index, cash, onUpgrade, onClose, readOnly = false }) => {
  const [showBurst, setShowBurst] = useState(false);
  const [justBought, setJustBought] = useState(false);

  if (!business) return null;

  // In preview mode every shop displays as not-yet-owned, regardless of
  // its real level (a district's first shop is pre-seeded at level 1 for
  // when it's actually unlocked — see StreetView's displayBusinesses note).
  const isLocked = readOnly ? true : business.level === 0;
  const isAffordable = readOnly ? false : cash >= business.cost;

  const handleAction = () => {
    if (readOnly) return; // preview mode: never buys, upgrades, or collects
    if (!isAffordable) {
      playError();
      return;
    }
    isLocked ? playUnlock() : playUpgrade();
    onUpgrade(business.id);
    setShowBurst(true);
    setJustBought(true);
    // Let the player see the coin burst + updated level for a beat, then
    // close the sheet automatically — "tap, see it happen, move on."
    setTimeout(() => {
      onClose();
      setShowBurst(false);
      setJustBought(false);
    }, 550);
  };

  return (
    <AnimatePresence>
      {business && (
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
            className="relative w-full rounded-t-[24px] p-5 pb-7"
            style={{
              backgroundColor: 'var(--color-premium-surface)',
              borderTop: '1.5px solid var(--color-premium-border-strong)',
              borderLeft: '1.5px solid var(--color-premium-border-strong)',
              borderRight: '1.5px solid var(--color-premium-border-strong)',
            }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1.5 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--color-premium-track)' }} />

            <button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
              aria-label="Close"
            >
              <X size={16} color="var(--color-premium-text-secondary)" strokeWidth={3} />
            </button>

            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-visible"
                style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
              >
                {showBurst && <CoinBurst />}
                <div className={`w-16 h-16 ${isLocked ? 'opacity-40 grayscale' : ''}`}>
                  <MiniShopSVG business={business} index={index} />
                </div>
                <div
                  className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: 'var(--color-premium-gold-400)', border: '1.5px solid var(--color-premium-bg)', color: 'var(--color-premium-text-inverse)' }}
                >
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--color-premium-text)' }}>
                  {business.name}
                </h3>
                <p className="text-[11px] font-medium leading-snug mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                  {business.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div
                className="flex-1 rounded-xl px-3 py-2 flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--color-premium-elevated)',
                  border: `1.5px solid ${isLocked ? 'var(--color-premium-border)' : 'var(--color-premium-green-500)'}`,
                }}
              >
                <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-premium-text-secondary)' }}>
                  {readOnly ? 'Buy Price' : isLocked ? 'Not opened yet' : `Level ${business.level}`}
                </span>
                <span className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--color-premium-green-500)' }}>
                  <CoinIcon className="w-4 h-4" premium />
                  {readOnly
                    ? business.cost.toLocaleString('en-IN')
                    : (isLocked ? business.baseProfitPerMin : business.profitPerMin).toLocaleString('en-IN') + '/min'}
                </span>
              </div>
            </div>

            {readOnly && (
              <div className="flex items-center gap-3 mt-2">
                <div
                  className="flex-1 rounded-xl px-3 py-2 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
                >
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-premium-text-secondary)' }}>Base Income</span>
                  <span className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--color-premium-green-500)' }}>
                    <CoinIcon className="w-4 h-4" premium />
                    {business.baseProfitPerMin.toLocaleString('en-IN')}/min
                  </span>
                </div>
              </div>
            )}

            {readOnly && business.maxLevel !== undefined && (
              <div className="flex items-center gap-3 mt-2">
                <div
                  className="flex-1 rounded-xl px-3 py-2 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
                >
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-premium-text-secondary)' }}>Max Potential Income</span>
                  <span className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--color-premium-gold-400)' }}>
                    <CoinIcon className="w-4 h-4" premium />
                    {calculateTieredProfit(business.baseProfitPerMin, business.maxLevel).toLocaleString('en-IN')}/min
                  </span>
                </div>
              </div>
            )}

            {readOnly ? (
              <button
                disabled
                className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-not-allowed"
                style={{ border: '1.5px solid var(--color-premium-border)', backgroundColor: 'var(--color-premium-elevated)', color: 'var(--color-premium-text-secondary)' }}
              >
                <Lock size={16} /> Unlock this district first
              </button>
            ) : (
              <>
                <motion.button
                  whileTap={isAffordable ? { scale: 0.97 } : {}}
                  onClick={handleAction}
                  disabled={!isAffordable || justBought}
                  className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isAffordable ? (isLocked ? 'var(--color-premium-badge-blue)' : 'var(--color-premium-badge-green)') : 'var(--color-premium-elevated)',
                    border: `1.5px solid ${isAffordable ? (isLocked ? 'var(--color-premium-badge-blue)' : 'var(--color-premium-badge-green)') : 'var(--color-premium-border)'}`,
                    color: isAffordable ? 'var(--color-premium-text)' : 'var(--color-premium-text-secondary)',
                    cursor: isAffordable ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isLocked ? <ShoppingCart size={16} /> : <ArrowUpCircle size={16} />}
                  {isLocked ? 'Open shop' : 'Upgrade'} — ₹{business.cost.toLocaleString('en-IN')}
                </motion.button>

                {!isAffordable && (
                  <p className="text-center text-[10px] font-bold mt-2" style={{ color: 'var(--color-premium-red-400)' }}>
                    Need ₹{(business.cost - cash).toLocaleString('en-IN')} more
                  </p>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
