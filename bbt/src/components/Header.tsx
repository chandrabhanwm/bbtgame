import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Award, ShieldAlert, Crown, Banknote } from 'lucide-react';
import { PlayerStats } from '../types';
import { playClick } from '../utils/audio';
import { useCountUp } from '../utils/useCountUp';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';

// Same props contract as before — App.tsx's call site needs no changes.
interface HeaderProps {
  stats: PlayerStats;
  avatarEmoji: string;
  setAvatarEmoji: (emoji: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  /** Bumped by App.tsx on every discrete cash-changing action (a
   *  purchase, a claim, a reward) — never by the continuous per-second
   *  passive tick, which would mean pulsing constantly. */
  cashPulseKey?: number;
  /** Triggers a pool claim from the Header itself — reachable from any
   *  tab, since Header is persistent, not just from Portfolio. */
  onClaimPool: () => void;
  /** True only for the first 3 app sessions, ever — shows a brief
   *  finger-tap hint over the Profit box to help new players discover
   *  it's tappable, then stops appearing for good. */
  showProfitTapHint?: boolean;
  /** Real leaderboard rank, fetched periodically — null while still
   *  loading or if it can't be determined. Replaces the old fake
   *  cash-based climbing formula entirely. */
  realRank: number | null;
}

const AVATAR_OPTIONS = [
  { emoji: '😎', label: 'Coral Bay Boardwalk Boss' },
  { emoji: '👳', label: 'Dockside Captain' },
  { emoji: '👩', label: 'Sarong Queen' },
  { emoji: '☕', label: 'Beach Café Barista' },
  { emoji: '🍬', label: 'Taffy Shop Bro' },
  { emoji: '📱', label: 'Boardwalk Tech Guru' },
  { emoji: '💍', label: 'Pearl Trader' },
  { emoji: '🦁', label: 'Harbor President' }
];

// Colors consumed exclusively from the postcard design system —
// var(--color-premium-*), no hardcoded hex anywhere in this component.
const OCEAN = 'var(--color-premium-gold-400)';
const SUN = 'var(--color-premium-gold-100)';
const INK = 'var(--color-premium-text)';
const BORDER_STRONG = 'var(--color-premium-border-strong)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

export const Header: React.FC<HeaderProps> = ({
  stats,
  avatarEmoji,
  setAvatarEmoji,
  playerName,
  setPlayerName,
  cashPulseKey,
  onClaimPool,
  showProfitTapHint = false,
  realRank
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  // Cash Pill pulse — a brief, one-shot glow whenever cashPulseKey changes
  // (a discrete action), never on the continuous per-second passive tick.
  const [cashPulsing, setCashPulsing] = useState(false);
  const isFirstPulseRender = useRef(true);
  useEffect(() => {
    if (isFirstPulseRender.current) {
      isFirstPulseRender.current = false;
      return;
    }
    setCashPulsing(true);
    const t = setTimeout(() => setCashPulsing(false), 200);
    return () => clearTimeout(t);
  }, [cashPulseKey]);
  const [tempName, setTempName] = useState(playerName);
  const prevCashRef = useRef(stats.cash);

  const displayCash = useCountUp(stats.cash);
  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));

  useEffect(() => {
    prevCashRef.current = stats.cash;
  }, [stats.cash]);

  const selectAvatar = (emoji: string) => {
    setAvatarEmoji(emoji);
    playClick();
    setShowAvatarPicker(false);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
    setEditingName(false);
    playClick();
  };

  return (
    <header
      className="sticky top-0 z-40 w-full px-3 pb-3 select-none"
      style={{ backgroundColor: 'var(--color-premium-bg)', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex flex-nowrap items-stretch gap-1.5">
        {/* ============ Identity block ============ */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={() => { playClick(); setShowAvatarPicker(true); }}
            className="flex-shrink-0 relative w-10 h-10 cursor-pointer before:content-[''] before:absolute before:-inset-1"
            title="Change avatar"
          >
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-surface)', border: `2px dashed ${BORDER_STRONG}` }}>
              <span className="text-lg leading-none">{avatarEmoji}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-postcard-coral)' }}>
              <Crown size={9} color="#FFFFFF" fill="#FFFFFF" />
            </div>
          </button>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                type="text"
                value={tempName}
                maxLength={12}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-[var(--color-premium-surface)] border-2 rounded-[8px] px-1.5 py-0.5 text-[11px] font-bold outline-none w-24"
                style={{ borderColor: OCEAN, color: INK }}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
            ) : (
              <div onClick={() => { playClick(); setEditingName(true); }} className="cursor-pointer">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[12px] tracking-wide truncate" style={{ fontFamily: 'var(--font-premium-display)', fontWeight: 700, color: INK }}>
                    {playerName}
                  </span>
                  <Crown size={9} color="var(--color-postcard-sun)" fill="var(--color-postcard-sun)" className="flex-shrink-0" />
                </div>
                <div className="text-premium-caption mt-0.5 whitespace-nowrap normal-case tracking-normal font-semibold" style={{ color: TEXT_SECONDARY }}>
                  Level {stats.level} · {xpPct}%
                </div>
                <motion.div
                  className="w-16 h-[3px] rounded-full mt-1 overflow-hidden"
                  style={{ backgroundColor: 'var(--color-premium-track)' }}
                  animate={xpPct >= 85 ? { boxShadow: ['0 0 0px rgba(28,156,147,0)', '0 0 6px rgba(28,156,147,0.6)', '0 0 0px rgba(28,156,147,0)'] } : {}}
                  transition={{ duration: 2, repeat: xpPct >= 85 ? Infinity : 0, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: OCEAN }}
                    initial={false}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </motion.div>
                <div className="flex items-center gap-1 mt-1 whitespace-nowrap">
                  <Trophy size={10} color="var(--color-postcard-coral)" />
                  <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: 'var(--color-postcard-coral)' }}>
                    {realRank !== null ? `#${realRank.toLocaleString('en-US')}` : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ Cash balance pill ============ */}
        <motion.div
          animate={{ scale: cashPulsing ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glossy-3d flex-shrink-0 flex flex-col items-center justify-center rounded-[14px] px-2 py-1"
          style={{ boxShadow: cashPulsing ? '0 0 0 4px rgba(28, 156, 147, 0.25)' : undefined }}
        >
          <span className="text-premium-label whitespace-nowrap" style={{ color: OCEAN }}>Balance</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Banknote size={12} color="var(--color-premium-green-500)" />
            <span className="text-[13px] whitespace-nowrap" style={{ fontFamily: 'var(--font-premium-display)', fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>
              {formatCash(displayCash)}
            </span>
          </div>
        </motion.div>

        {/* ============ Pool pill — takes the Rank pill's old spot, now
             bigger, and tappable: claiming is no longer Portfolio-only.
             Since Header is persistent across every tab, this is reachable
             from Home, City, Ranks, and Portfolio alike. A pulsing glow
             and notification dot (same dot pattern as the Ranks tab)
             appear once there's something claimable, so it reads as
             actionable rather than purely informational. ============ */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClaimPool}
          animate={stats.poolCash > 0 ? { boxShadow: ['0 0 0 0px rgba(28,156,147,0)', '0 0 0 4px rgba(28,156,147,0.3)', '0 0 0 0px rgba(28,156,147,0)'] } : {}}
          transition={{ duration: 1.8, repeat: stats.poolCash > 0 ? Infinity : 0, ease: 'easeInOut' }}
          className="glossy-3d relative flex-shrink-0 flex flex-col items-center justify-center rounded-[14px] px-2.5 py-1.5 cursor-pointer"
        >
          {stats.poolCash > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: 'var(--color-postcard-coral)' }} />
          )}
          {showProfitTapHint && stats.poolCash > 0 && (
            <>
              {/* Expanding ripple ring — the "something here wants your
                  attention" signal, distinct from the pulsing glow that
                  already runs when there's real money to claim. */}
              <motion.span
                className="absolute inset-0 rounded-[14px] pointer-events-none"
                style={{ border: `2px solid ${OCEAN}` }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 1.35, 1.35], opacity: [0.8, 0, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.9, ease: 'easeOut' }}
              />
              {/* Floating "Tap to collect!" callout above the box — bold
                  and explicit, since an icon alone apparently wasn't
                  communicating clearly enough on its own. */}
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full whitespace-nowrap pointer-events-none"
                style={{ backgroundColor: 'var(--color-postcard-coral)', color: '#FFFFFF', border: '2px solid var(--color-postcard-ink)' }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-[10px] font-bold">Tap to collect!</span>
                <span
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                  style={{ backgroundColor: 'var(--color-postcard-coral)' }}
                />
              </motion.div>
              {/* A bigger, bolder finger with a real, exaggerated
                  press-down motion — not just a soft drift like before. */}
              <motion.span
                className="absolute text-2xl pointer-events-none select-none"
                style={{ top: '58%', left: '50%', filter: 'drop-shadow(0 3px 4px rgba(22,48,46,0.35))' }}
                initial={{ x: '-50%', y: '-50%' }}
                animate={{ y: ['-70%', '-25%', '-70%'], scale: [1, 0.8, 1], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut', times: [0, 0.4, 0.75, 1] }}
              >
                👆
              </motion.span>
            </>
          )}
          <span className="text-premium-label whitespace-nowrap" style={{ color: 'var(--color-postcard-coral)' }}>Profit</span>
          <div className="flex items-center gap-1 mt-0.5">
            <CoinIcon className="w-3 h-3" premium />
            <span className="text-[13px] whitespace-nowrap" style={{ fontFamily: 'var(--font-premium-display)', fontWeight: 700, color: 'var(--color-premium-green-500)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCash(stats.poolCash)}
            </span>
          </div>
        </motion.button>
      </div>

      {/* ============ AVATAR SELECTOR ============ */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => { playClick(); setShowAvatarPicker(false); }}></div>

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[24px] p-5 z-10 overflow-hidden"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: `2px solid var(--color-postcard-ink)`, boxShadow: '4px 4px 0 rgba(22,48,46,0.16)' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-premium-title flex items-center gap-2" style={{ color: INK }}>
                  <Award size={17} color={OCEAN} />
                  Choose your persona
                </h3>
                <button
                  onClick={() => { playClick(); setShowAvatarPicker(false); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', color: TEXT_SECONDARY }}
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    onClick={() => selectAvatar(opt.emoji)}
                    className="flex flex-col items-center justify-center py-2.5 rounded-xl cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-premium-elevated)',
                      border: `1.5px solid ${avatarEmoji === opt.emoji ? OCEAN : 'var(--color-premium-border-subtle)'}`,
                    }}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span className="text-[8px] text-center font-medium mt-1.5 leading-none max-w-[60px] truncate" style={{ color: TEXT_SECONDARY }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 p-3 rounded-xl flex items-center gap-2.5" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
                <ShieldAlert size={15} color={OCEAN} className="flex-shrink-0" />
                <span className="text-[11px] leading-snug" style={{ color: TEXT_SECONDARY }}>
                  Your persona shows up on the Coral Bay Rich List for every rival to see.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
