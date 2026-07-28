import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { Clock, Gift } from 'lucide-react';
import { RewardCard } from '../types';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';
import { CoinBurst } from './FX';
import { CountdownClock } from './CountdownClock';
import { playClick, playUnlock } from '../utils/audio';
import { getCooldownRemainingSeconds, CLAIM_COOLDOWN_MS } from '../utils/cooldown';

interface DailyRewardCardsProps {
  cards: RewardCard[];
  onScratch: (index: number) => void;
  onClaim: (index: number) => void;
  /** Real wall-clock ms timestamp of the last card claim — gates every
   *  other not-yet-scratched card behind the same 60-second cooldown,
   *  shown as a live countdown clock on each of them. */
  lastCardClaimAt: number;
}

const SWIPE_THRESHOLD = 40; // px of drag distance before we treat it as a scratch

const BRANDS = [
  'Basti Cola Co. 🥤',
  'Chaiwala Crypto Coins 🪙',
  'Auto rickshaw Racing Pro 🛺',
  'Gully Cricket Manager 🏏',
  'Samosa Delivery Express 🥟'
];

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';
const ROSE = '#D4547E'; // warm-leaning rose, distinct from the app's gold accent — chosen specifically for this component to stand out

/**
 * Three Daily Reward Cards — but strictly sequential now, by touch
 * order rather than fixed position. Whichever card the player scratches
 * first becomes "active"; the other two lock (can't be scratched, show
 * a "claim your previous card" message on tap) until the active one is
 * claimed. Claiming it starts a real 60-second countdown, shown as a
 * big circular clock directly on both remaining cards, before either
 * becomes scratchable again. This repeats for the last card.
 *
 * The reveal itself is a triggered animation (Option B from the design
 * discussion), not real pixel-level scratch tracking — deliberately, to
 * avoid taking on canvas + real-time pointer-path complexity this app has
 * no other precedent for, for a difference players won't perceive.
 */
export const DailyRewardCards: React.FC<DailyRewardCardsProps> = ({ cards, onScratch, onClaim, lastCardClaimAt }) => {
  const [adCardIndex, setAdCardIndex] = useState<number | null>(null);
  const [adCountdown, setAdCountdown] = useState(6);
  const [adBrand, setAdBrand] = useState('Basti Cola Co.');
  const [justRevealedIndex, setJustRevealedIndex] = useState<number | null>(null);
  const [lockedTapMessage, setLockedTapMessage] = useState<number | null>(null);

  // A plain re-render tick, once a second — this is what makes the
  // countdown clock actually drain live rather than being frozen at
  // whatever value it had when the component last rendered for some
  // other reason.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (adCardIndex !== null) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const idx = adCardIndex;
            setAdCardIndex(null);
            if (idx !== null) {
              playUnlock();
              onClaim(idx);
            }
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adCardIndex]);

  const allClaimed = cards.length > 0 && cards.every((c) => c.claimed);
  // The one card currently mid-flow: scratched, but not yet claimed.
  // Whichever card the player touches first becomes this — position
  // never matters, only order of interaction.
  const activeIndex = cards.findIndex((c) => c.scratched && !c.claimed);
  const cooldownSecondsRemaining = getCooldownRemainingSeconds(lastCardClaimAt);

  const handleSwipe = (index: number, info: PanInfo) => {
    if (cards[index].scratched) return;
    // Another card is already active — this one can't be scratched yet,
    // no matter how the player swipes at it.
    if (activeIndex !== -1) {
      setLockedTapMessage(index);
      setTimeout(() => setLockedTapMessage((cur) => (cur === index ? null : cur)), 1800);
      return;
    }
    // No active card, but the cooldown from the last claim hasn't
    // finished yet — same locked treatment, different reason.
    if (cooldownSecondsRemaining > 0) return;
    const distance = Math.abs(info.offset.x) + Math.abs(info.offset.y);
    if (distance >= SWIPE_THRESHOLD) {
      playClick();
      onScratch(index);
      setJustRevealedIndex(index);
      setTimeout(() => setJustRevealedIndex((cur) => (cur === index ? null : cur)), 600);
    }
  };

  const handleWatchAd = (index: number) => {
    playClick();
    setAdBrand(BRANDS[Math.floor(Math.random() * BRANDS.length)]);
    setAdCountdown(6);
    setAdCardIndex(index);
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, ${ROSE}, transparent)` }} />
        <span className="flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap" style={{ color: ROSE }}>
          <Gift size={14} color={ROSE} />
          Your Daily Reward Cards
        </span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${ROSE}, transparent)` }} />
      </div>

      {allClaimed ? (
        /* Once all 3 are claimed, the grid stops being useful information —
           it's just 3 static checkmarked boxes nagging at you for the rest
           of the day. Replace it with one small, closed statement instead,
           which also reclaims the space the grid was taking. */
        <div className="rounded-xl py-3 flex items-center justify-center gap-1.5" style={{ backgroundColor: 'var(--color-premium-surface)', border: '1px solid var(--color-premium-border)' }}>
          <span className="text-[11px] font-semibold" style={{ color: TEXT_SECONDARY }}>
            🎉 All caught up! New cards tomorrow.
          </span>
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card, index) => {
          const isLockedByOtherActive = !card.scratched && activeIndex !== -1 && activeIndex !== index;
          const isLockedByCooldown = !card.scratched && activeIndex === -1 && cooldownSecondsRemaining > 0;
          const isLocked = isLockedByOtherActive || isLockedByCooldown;

          return (
          <div key={index} className="glossy-3d rounded-2xl overflow-hidden relative" style={{ minHeight: '108px' }}>
            <AnimatePresence mode="wait">
              {!card.scratched ? (
                <motion.div
                  key="unscratched"
                  drag={!isLocked}
                  dragElastic={0.25}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={(_, info) => handleSwipe(index, info)}
                  onClick={() => isLocked && isLockedByOtherActive && handleSwipe(index, { offset: { x: 0, y: 0 } } as PanInfo)}
                  whileTap={!isLocked ? { scale: 0.97 } : {}}
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-2.5 overflow-hidden ${isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  style={{
                    background: 'linear-gradient(155deg, #3D1F2C 0%, var(--color-premium-surface) 55%, var(--color-premium-bg) 100%)',
                    opacity: isLocked ? 0.55 : 1,
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(130% 65% at 25% -10%, ${ROSE}38 0%, transparent 60%)` }}
                  />

                  {isLockedByCooldown ? (
                    <>
                      <CountdownClock secondsRemaining={cooldownSecondsRemaining} totalSeconds={CLAIM_COOLDOWN_MS / 1000} size={56} />
                      <span className="relative text-[8.5px] font-bold text-center px-2" style={{ color: '#E8A4BB' }}>
                        Unlocks soon
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: `radial-gradient(circle, ${ROSE}48 0%, transparent 72%)` }}
                      >
                        <Gift size={22} color="#F3C6D3" strokeWidth={1.75} />
                      </div>

                      <div className="relative flex items-center gap-1.5 px-2">
                        <div className="w-3 h-px" style={{ borderTop: `1.5px dashed ${ROSE}` }} />
                        <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: '#E8A4BB' }}>
                          {lockedTapMessage === index ? 'Claim previous card' : 'Scratch Here'}
                        </span>
                        <div className="w-3 h-px" style={{ borderTop: `1.5px dashed ${ROSE}` }} />
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-1.5"
                >
                  {justRevealedIndex === index && <CoinBurst count={8} emoji="✨" />}
                  {card.tier === 'rare' ? (
                    <span className="text-2xl leading-none">💎</span>
                  ) : card.tier === 'medium' ? (
                    <span className="text-2xl leading-none">💰</span>
                  ) : (
                    <CoinIcon className="w-6 h-6" premium />
                  )}
                  <span className="font-bold text-[13px]" style={{ color: GREEN }}>
                    {formatCash(card.value)}
                  </span>

                  {card.claimed ? (
                    <span className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                      ✓ Claimed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleWatchAd(index)}
                      className="px-2 py-1.5 rounded-lg text-[8.5px] font-bold cursor-pointer"
                      style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
                    >
                      Watch ad to collect
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          );
        })}
      </div>
      )}

      {/* Simulated video ad — same mechanic reused across the app */}
      <AnimatePresence>
        {adCardIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between"
            >
              <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-bold tracking-wide uppercase">
                    Sponsored
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold">{adBrand}</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-black/60 border border-slate-800 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Clock size={11} className="animate-spin" />
                  <span>Reward in {adCountdown}s</span>
                </div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-2xl mb-6"
                >
                  <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center">
                    <span className="text-4xl filter drop-shadow">🎁</span>
                  </div>
                </motion.div>
                <h2 className="font-display font-bold text-lg text-white leading-tight uppercase tracking-wide">
                  Become the Basti Kingpin!
                </h2>
                <p className="text-xs text-slate-400 mt-2.5 max-w-[240px] leading-relaxed font-medium">
                  Boost your progress! Build stores, leverage upgrades, and outperform rivals.
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 6, ease: 'linear' }}
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center relative z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Thank you for supporting Basti Business Tycoon!
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
