import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Lock } from 'lucide-react';
import { playClick } from '../utils/audio';
import { PRESTIGE_BADGES, getCurrentPrestigeBadge } from '../config/prestigeConfig';

interface PrestigeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
}

/** Blends a "#rrggbb" hex toward white — used to build a badge's lighter
 *  icon-box face gradient, same recipe the business cards already use. */
function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/**
 * The Prestige trophy case — every badge in the ladder, in order, with
 * three visual states: earned (embossed gold, icon box glowing), the
 * CURRENT one specifically called out with a "You are here"-style ring,
 * and everything still ahead shown locked/dimmed with the level gap to
 * go. Deliberately shows the whole ladder up front, not just what's
 * unlocked — seeing exactly what's still ahead (and how far) is what
 * gives a collection screen like this its pull.
 */
export const PrestigeScreen: React.FC<PrestigeScreenProps> = ({ isOpen, onClose, level }) => {
  const currentBadge = getCurrentPrestigeBadge(level);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-[60] overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--color-premium-bg)' }}
        >
          <div
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: 'var(--color-premium-bg)', borderBottom: '1px solid var(--color-premium-border)' }}
          >
            <button
              onClick={() => { playClick(); onClose(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
              aria-label="Back"
            >
              <ChevronLeft size={16} color="var(--color-premium-text-secondary)" />
            </button>
            <span className="font-bold text-[15px]" style={{ color: 'var(--color-premium-text)' }}>
              Prestige Badges
            </span>
          </div>

          <div className="p-4 pb-10">
            {/* Current status banner */}
            <div
              className="rounded-2xl p-4 mb-4 text-center"
              style={{
                background: 'linear-gradient(145deg, var(--color-premium-elevated) 0%, var(--color-premium-bg) 100%)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.5), -6px -6px 14px rgba(255,255,255,0.035)',
              }}
            >
              <div className="text-4xl mb-1">{currentBadge?.icon ?? '🔒'}</div>
              <div className="font-bold text-[16px]" style={{ color: 'var(--color-premium-text)' }}>
                {currentBadge ? currentBadge.name : 'No badge yet'}
              </div>
              <div className="text-[10.5px] font-medium mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                {currentBadge ? `Level ${level} — your current title` : `Reach Level 5 to earn your first title`}
              </div>
            </div>

            <div className="space-y-2.5">
              {PRESTIGE_BADGES.map((badge) => {
                const earned = level >= badge.level;
                const isCurrent = badge === currentBadge;
                const levelsToGo = badge.level - level;

                return (
                  <div
                    key={badge.name}
                    className="rounded-2xl p-3 flex items-center gap-3"
                    style={{
                      background: earned
                        ? 'linear-gradient(145deg, var(--color-premium-elevated) 0%, var(--color-premium-bg) 100%)'
                        : 'var(--color-premium-surface)',
                      boxShadow: earned
                        ? isCurrent
                          ? '0 0 0 2px var(--color-premium-gold-400), 8px 8px 16px rgba(0,0,0,0.5), -6px -6px 14px rgba(255,255,255,0.035)'
                          : '4px 4px 10px rgba(0,0,0,0.4), -3px -3px 8px rgba(255,255,255,0.02)'
                        : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -2px -2px 5px rgba(255,255,255,0.03)',
                      opacity: earned ? 1 : 0.55,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative"
                      style={{
                        background: earned
                          ? `linear-gradient(145deg, ${lightenHex('#D4A72C', 0.3)}, #D4A72C)`
                          : 'var(--color-premium-elevated)',
                        boxShadow: earned ? '2px 2px 5px rgba(0,0,0,0.4), inset 1px 1px 1px rgba(255,255,255,0.3)' : undefined,
                      }}
                    >
                      {earned ? badge.icon : <Lock size={16} color="var(--color-premium-text-secondary)" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-bold text-[13px] truncate"
                        style={{ color: earned ? 'var(--color-premium-text)' : 'var(--color-premium-text-secondary)' }}
                      >
                        {badge.name}
                      </div>
                      <div className="text-[9.5px] font-medium mt-0.5" style={{ color: 'var(--color-premium-text-secondary)' }}>
                        {earned ? `Unlocked at Level ${badge.level}` : `Level ${badge.level} — ${levelsToGo} to go`}
                      </div>
                    </div>
                    {isCurrent && (
                      <span
                        className="text-[8.5px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
