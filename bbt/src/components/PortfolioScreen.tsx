import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Settings as SettingsIcon, ChevronRight, ChevronDown, Fingerprint, Zap, Sparkles, LogOut } from 'lucide-react';
import { PlayerStats, Business } from '../types';
import { bastiCity } from '../data/cityMapData';
import { getDistrictProgress, getEmpireTotalInvested } from '../utils/districtProgress';
import { derivePlayerId } from '../utils/playerIdentity';
import { computeAchievements } from '../utils/achievements';
import { getLegacyStatus } from '../utils/legacy';
import { CoinIcon } from './CoinIcon';
import { formatCash } from '../utils/formatCash';
import { playClick, playUnlock } from '../utils/audio';
import { getCooldownRemainingSeconds, CLAIM_COOLDOWN_MS } from '../utils/cooldown';
import { CountdownClock } from './CountdownClock';

interface PortfolioScreenProps {
  stats: PlayerStats;
  businessesByDistrict: Record<string, Business[]>;
  avatarEmoji: string;
  playerName: string;
  playerEmail?: string | null;
  onSignOut: () => void;
  onOpenSettings?: () => void;
  /** Returns the claimed amount, so the UI can show "+₹X Collected!" and
   *  offer to double that exact amount. */
  onClaimPool: () => number;
  onDoubleClaim: (amount: number) => void;
  /** Switches the Home tab to the given district and navigates there. */
  onManageDistrict: (districtId: string) => void;
  onEstablishLegacy: () => void;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({
  stats,
  businessesByDistrict,
  avatarEmoji,
  playerName,
  playerEmail,
  onSignOut,
  onOpenSettings,
  onClaimPool,
  onDoubleClaim,
  onManageDistrict,
  onEstablishLegacy,
}) => {
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<'idle' | 'collected' | 'claimed' | 'cooldown'>('idle');
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0);
  const [lastClaimedAmount, setLastClaimedAmount] = useState(0);

  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));
  const playerId = derivePlayerId(playerName);

  // Achievements now come from the shared computeAchievements() utility —
  // the same function App.tsx's global unlock-detection effect uses, so
  // there's one definition of "unlocked," not two that could drift apart.
  const achievements = computeAchievements(stats, businessesByDistrict);

  // Districts with at least one owned business, with their real progress
  const districtsOwned = bastiCity.districts
    .map((d) => ({ district: d, progress: getDistrictProgress(businessesByDistrict[d.id] ?? []) }))
    .filter((entry) => entry.progress.businessesOwned > 0);

  const totalBusinessesOwned = districtsOwned.reduce((sum, e) => sum + e.progress.businessesOwned, 0);
  const totalBusinessesPossible = bastiCity.districts.length * 8;
  const netWorth = stats.cash + getEmpireTotalInvested(businessesByDistrict);
  const legacyStatus = getLegacyStatus(netWorth, stats.legacyCount);

  const poolCap = stats.profitPerMin * 180; // 3 hours, matching App.tsx's own cap
  const poolPct = poolCap > 0 ? Math.min(100, Math.round((stats.poolCash / poolCap) * 100)) : 0;

  const handleClaim = () => {
    const cooldownSeconds = getCooldownRemainingSeconds(stats.lastProfitDoubleClaimAt);
    if (cooldownSeconds > 0) {
      playClick();
      setCooldownSecondsRemaining(cooldownSeconds);
      setClaimState('cooldown');
      setTimeout(() => setClaimState((cur) => (cur === 'cooldown' ? 'idle' : cur)), 1800);
      return;
    }
    playClick();
    const amount = onClaimPool();
    setLastClaimedAmount(amount);
    setClaimState('collected');
  };

  const handleDouble = () => {
    playUnlock();
    onDoubleClaim(lastClaimedAmount);
    setClaimState('claimed');
    setTimeout(() => setClaimState('idle'), 2000);
  };

  const dismissOffer = () => setClaimState('idle');

  return (
    <div id="portfolio-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Hero — same avatar-ring / XP-bar language as the Header */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)' }}
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-gold-400)' }}
          >
            {avatarEmoji}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] truncate" style={{ color: 'var(--color-premium-text)' }}>
            {playerName}
          </h3>
          <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--color-premium-gold-400)' }}>
            Level {stats.level} · {xpPct}%
          </div>
          <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--color-premium-gold-400)' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1.5 justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <Fingerprint size={10} color="var(--color-premium-text-secondary)" className="flex-shrink-0" />
              <span className="text-[9.5px] font-medium truncate" style={{ color: 'var(--color-premium-text-secondary)' }}>
                {playerEmail || `ID ${playerId}`}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 flex-shrink-0 ml-2 cursor-pointer"
            >
              <LogOut size={10} color="var(--color-premium-red-400)" />
              <span className="text-[9.5px] font-semibold" style={{ color: 'var(--color-premium-red-400)' }}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Empire stats — Net Worth first, then Businesses, then Districts */}
      <div className="grid grid-cols-3 gap-2.5">
        <BottomStat label="Net Worth" value={formatCash(netWorth)} money />
        <BottomStat label="Businesses" value={`${totalBusinessesOwned} / ${totalBusinessesPossible}`} />
        <BottomStat label="Districts" value={`${districtsOwned.length} / ${bastiCity.districts.length}`} />
      </div>

      {/* Combined Income + Claim Pool */}
      <div
        className="glossy-3d rounded-2xl p-3"
      >
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TEXT_SECONDARY }}>
          Combined Income
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <CoinIcon className="w-3.5 h-3.5" premium />
          <span className="font-bold text-[18px]" style={{ color: GREEN }}>
            {formatCash(stats.profitPerMin)}<span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>/min</span>
          </span>
        </div>

        <div className="rounded-xl p-2.5 mt-2.5" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
          <AnimatePresence mode="wait">
            {claimState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Ready to Collect</span>
                    <div className="font-bold text-[16px] mt-0.5 flex items-center gap-1" style={{ color: GREEN }}>
                      <CoinIcon className="w-3.5 h-3.5" premium />
                      {formatCash(stats.poolCash)}
                    </div>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={stats.poolCash <= 0}
                    className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-[12px] cursor-pointer"
                    style={{
                      backgroundColor: stats.poolCash > 0 ? GOLD : 'var(--color-premium-track)',
                      color: stats.poolCash > 0 ? 'var(--color-premium-text-inverse)' : TEXT_SECONDARY,
                    }}
                  >
                    Claim
                  </button>
                </div>
                <div className="w-full h-[5px] rounded-full mt-2.5 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: GOLD }}
                    animate={{ width: `${poolPct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[8.5px] font-medium mt-1 block" style={{ color: TEXT_SECONDARY }}>
                  Caps at 3 hours of income — keep checking in so nothing goes to waste
                </span>
              </motion.div>
            )}

            {claimState === 'collected' && (
              <motion.div key="collected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-1">
                <div className="text-[13px] font-bold flex items-center justify-center gap-1.5" style={{ color: GREEN }}>
                  + {formatCash(lastClaimedAmount)} <span>✓</span>
                </div>
                <div className="font-bold text-[17px] mt-0.5" style={{ color: GREEN }}>Collected!</div>

                <button
                  onClick={handleDouble}
                  className="w-full mt-3 py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
                >
                  <Sparkles size={13} />
                  Double it? +{formatCash(lastClaimedAmount)} more
                </button>
                <button onClick={dismissOffer} className="text-[9.5px] font-semibold mt-2 cursor-pointer" style={{ color: TEXT_SECONDARY }}>
                  No thanks
                </button>
              </motion.div>
            )}

            {claimState === 'claimed' && (
              <motion.div key="claimed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-2.5">
                <div className="font-bold text-[15px] flex items-center justify-center gap-1.5" style={{ color: GREEN }}>
                  <Zap size={15} fill={GREEN} />
                  Doubled! +{formatCash(lastClaimedAmount)}
                </div>
              </motion.div>
            )}

            {claimState === 'cooldown' && (
              <motion.div key="cooldown" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-2 flex flex-col items-center">
                <CountdownClock secondsRemaining={cooldownSecondsRemaining} totalSeconds={CLAIM_COOLDOWN_MS / 1000} size={60} />
                <div className="font-bold text-[13px] mt-2" style={{ color: 'var(--color-premium-text)' }}>
                  Please wait
                </div>
                <div className="text-[9.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
                  A short cooldown after doubling your last claim.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legacy — the voluntary reset. Shows current permanent bonus,
          and either the next reset's requirement (not yet eligible) or
          a real call-to-action with the actual point preview
          (eligible right now). */}
      <div className="glossy-3d rounded-2xl p-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">🌟</span>
          <span className="text-[12px] font-bold" style={{ color: 'var(--color-premium-text)' }}>Legacy</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Legacy Points</div>
            <div className="font-bold text-[15px]" style={{ color: GOLD }}>{stats.legacyPoints}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Permanent Bonus</div>
            <div className="font-bold text-[15px]" style={{ color: GREEN }}>+{stats.legacyPoints}% income</div>
          </div>
        </div>

        <div className="rounded-xl p-3 mt-3" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
          {legacyStatus.eligible ? (
            <>
              <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--color-premium-text)' }}>
                You've proven your business empire. Restart from the beginning and carry your experience forward.
              </p>
              <button
                onClick={onEstablishLegacy}
                className="w-full mt-2.5 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer"
                style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
              >
                🌟 Establish Your Legacy — +{legacyStatus.previewPoints} LP
              </button>
            </>
          ) : (
            <p className="text-[10.5px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              Reach <span className="font-bold" style={{ color: GOLD }}>{legacyStatus.minRequiredLabel}</span> net worth to unlock your next Legacy reset.
            </p>
          )}
        </div>
      </div>

      {/* Districts Owned In — expandable per-district business breakdown */}
      <SectionLabel>Districts Owned In</SectionLabel>
      <div className="space-y-2.5">
        {districtsOwned.length === 0 && (
          <p className="text-[10.5px] px-1" style={{ color: TEXT_SECONDARY }}>
            You don't own any businesses yet — head to Home to get started.
          </p>
        )}
        {districtsOwned.map(({ district, progress }) => {
          const isExpanded = expandedDistrict === district.id;
          const businesses = businessesByDistrict[district.id] ?? [];
          const owned = businesses.filter((b) => b.level > 0);

          return (
            <div
              key={district.id}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
            >
              <button
                onClick={() => { playClick(); setExpandedDistrict(isExpanded ? null : district.id); }}
                className="w-full p-3.5 flex items-center gap-3 cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
                >
                  {district.emoji}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-[12.5px] truncate" style={{ color: 'var(--color-premium-text)' }}>{district.name}</h4>
                  <span className="text-[9.5px]" style={{ color: TEXT_SECONDARY }}>
                    {progress.businessesOwned}/8 shops · {progress.completionPercent}% complete
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-bold text-[12px]" style={{ color: GREEN }}>{formatCash(progress.income)}/min</span>
                  <ChevronDown size={14} color={TEXT_SECONDARY} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3.5 space-y-2">
                      {owned.map((b) => (
                        <div key={b.id} className="flex items-center gap-2 text-[11px]">
                          <span className="text-sm flex-shrink-0">{b.emoji}</span>
                          <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--color-premium-text)' }}>
                            {b.name} · Lvl {b.level}
                          </span>
                          <span className="font-semibold flex-shrink-0" style={{ color: GREEN }}>
                            {formatCash(b.profitPerMin)}/min
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={() => onManageDistrict(district.id)}
                        className="w-full mt-1.5 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                        style={{ backgroundColor: 'var(--color-premium-elevated)', color: GOLD }}
                      >
                        Manage in {district.name} <ChevronRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Achievements — minimal single icon, no colorful badges */}
      <SectionLabel icon={<Award size={13} color="var(--color-premium-gold-400)" />}>Achievements</SectionLabel>
      <div className="space-y-2.5">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="rounded-2xl p-3 flex items-center gap-3"
            style={{
              backgroundColor: 'var(--color-premium-surface)',
              border: `1.5px solid ${ach.unlocked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border)'}`,
              opacity: ach.unlocked ? 1 : 0.6,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
            >
              <Award size={17} color={ach.unlocked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text-secondary)'} strokeWidth={1.75} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <h4 className="font-bold text-[11px] truncate" style={{ color: ach.unlocked ? 'var(--color-premium-text)' : 'var(--color-premium-text-secondary)' }}>
                  {ach.title}
                </h4>
                {ach.unlocked && (
                  <span
                    className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-premium-elevated)', color: 'var(--color-premium-green-500)', border: '1px solid var(--color-premium-green-500)' }}
                  >
                    Unlocked
                  </span>
                )}
              </div>
              <p className="text-[9.5px] leading-snug mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                {ach.desc}
              </p>
              <div className="w-full h-1 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${ach.progress}%`, backgroundColor: ach.unlocked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border-strong)' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Settings shortcut — navigates to the Settings screen */}
      <button
        onClick={() => { playClick(); onOpenSettings?.(); }}
        className="w-full rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
        >
          <SettingsIcon size={16} color="var(--color-premium-text-secondary)" />
        </div>
        <span className="flex-1 text-left font-bold text-[12px]" style={{ color: 'var(--color-premium-text)' }}>
          Settings
        </span>
        <ChevronRight size={16} color="var(--color-premium-text-secondary)" />
      </button>

    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex items-center gap-1.5 px-1 pt-1">
    {icon}
    <h3 className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {children}
    </h3>
  </div>
);

const BottomStat: React.FC<{ label: string; value: string; money?: boolean }> = ({ label, value, money }) => (
  <div
    className="glossy-3d rounded-2xl p-3 flex flex-col items-center text-center"
  >
    <span className="text-[7.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {label}
    </span>
    <span
      className="font-bold text-[13px] mt-1 flex items-center gap-1"
      style={{ color: money ? 'var(--color-premium-green-500)' : 'var(--color-premium-text)' }}
    >
      {money && <CoinIcon className="w-3 h-3" premium />}
      {value}
    </span>
  </div>
);
