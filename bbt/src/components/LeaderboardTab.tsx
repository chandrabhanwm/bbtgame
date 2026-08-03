import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Store, TrendingUp as UpgradeIcon, Wallet, Gift } from 'lucide-react';
import { LeaderboardEntry } from '../services/SaveService';
import { CoinIcon } from './CoinIcon';
import { formatCash } from '../utils/formatCash';
import { playClick } from '../utils/audio';
import { formatCooldownClock } from '../utils/cooldown';

interface LeaderboardTabProps {
  /** Real players, fetched from Firestore — replaces the old hardcoded
   *  fictional rival list entirely. */
  leaderboard: Array<LeaderboardEntry & { uid: string }>;
  /** This player's own uid, to highlight their row if they're in the list. */
  myUid: string | null;
  /** This player's real rank, which may place them outside the fetched
   *  top list entirely — shown separately below if so. */
  myRank: number | null;
  playerName: string;
  playerAvatar: string;
  playerNetWorth: number;
  /** The player's own current income/min — the new primary ranking value
   *  for the Overall tab, replacing net worth. */
  playerProfitPerMin: number;
  /** Secondary stat shown alongside rank — how many buy/upgrade actions
   *  this player has made, NOT a distinct-businesses-owned count. Shown
   *  for context, never used to sort or rank. */
  playerBusinessesBoughtCount: number;
  playerLevel: number;
  /** Weekly contest — same real-player-fetch pattern as the overall
   *  leaderboard above, just ordered by weeklyPoints instead of net
   *  worth. */
  weeklyContestBoard: Array<LeaderboardEntry & { uid: string }>;
  myWeeklyRank: number | null;
  myWeeklyPoints: number;
  /** Real wall-clock ms timestamp of the last leaderboard fetch — drives
   *  the visible "updating in Xm" countdown, so a 15-minute refresh
   *  interval reads as "on its own schedule" rather than "stale/broken." */
  lastLeaderboardFetchAt: number;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  leaderboard,
  myUid,
  myRank,
  playerName,
  playerAvatar,
  playerNetWorth,
  playerProfitPerMin,
  playerBusinessesBoughtCount,
  playerLevel,
  weeklyContestBoard,
  myWeeklyRank,
  myWeeklyPoints,
  lastLeaderboardFetchAt,
}) => {
  const [view, setView] = useState<'overall' | 'weekly'>('weekly');

  // A plain re-render tick, once a second — this is what makes the
  // "updating in Xm" countdown clock actually drain live, the same
  // pattern already used for the scratch-card and Profit cooldowns.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const LEADERBOARD_REFRESH_MS = 15 * 60 * 1000;
  const msSinceLastFetch = Date.now() - lastLeaderboardFetchAt;
  const msUntilNextFetch = Math.max(0, LEADERBOARD_REFRESH_MS - msSinceLastFetch);
  const secondsUntilNextFetch = Math.ceil(msUntilNextFetch / 1000);

  const activeBoard = view === 'overall' ? leaderboard : weeklyContestBoard;
  const topThree = activeBoard.slice(0, 3);
  const remaining = activeBoard.slice(3);
  const amInTopList = myUid !== null && activeBoard.some((e) => e.uid === myUid);
  const myActiveRank = view === 'overall' ? myRank : myWeeklyRank;

  return (
    <div id="leaderboard-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Overall / Weekly Contest toggle */}
      <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
        {(['overall', 'weekly'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { playClick(); setView(v); }}
            className="flex-1 py-2 rounded-xl text-[11.5px] font-bold cursor-pointer"
            style={{
              backgroundColor: view === v ? 'var(--color-premium-gold-400)' : 'transparent',
              color: view === v ? 'var(--color-premium-text-inverse)' : 'var(--color-premium-text-secondary)',
            }}
          >
            {v === 'overall' ? 'Overall' : 'Points'}
          </button>
        ))}
      </div>

      {/* A clear text countdown to the next real refresh — makes the
          15-minute interval read as "on its own schedule," not as
          stale or broken. Previously paired with a visual
          CountdownClock ring showing the exact same remaining time —
          removed, since the two together were genuinely redundant, not
          complementary. */}
      <div
        className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1px solid var(--color-premium-border)' }}
      >
        <div>
          <div className="text-[10.5px] font-bold" style={{ color: 'var(--color-premium-text)' }}>
            Leaderboard updates in {formatCooldownClock(secondsUntilNextFetch)}
          </div>
          <div className="text-[9px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
            Rankings refresh automatically every 15 minutes.
          </div>
        </div>
      </div>

      {view === 'overall' ? (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)', color: 'var(--color-premium-text)' }}
        >
          <TrendingUp size={12} color="var(--color-premium-gold-400)" />
          <span>Empire Rankings</span>
        </div>
      ) : (
        <HowToEarnRow />
      )}

      {activeBoard.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* A player's own row should always show their real, current
              name and avatar — not whatever was last fetched from
              Firestore up to 3 minutes ago. Without this, renaming
              yourself shows up instantly on Home/Portfolio (which read
              live state) but could lag on the leaderboard until the
              next periodic fetch, which reads as a sync bug even though
              nothing is actually broken underneath. */}
          {(() => {
            const withLiveSelf = (entry: LeaderboardEntry & { uid: string }) =>
              entry.uid === myUid
                ? { ...entry, playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth, level: playerLevel, weeklyPoints: myWeeklyPoints }
                : entry;

            return (
              <>
                {/* Top 3 spotlight */}
                <div className="grid grid-cols-3 gap-2.5">
                  {topThree.map((entry, i) => (
                    <motion.div
                      key={entry.uid}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: i * 0.05 }}
                    >
                      <SpotlightCard entry={withLiveSelf(entry)} rank={i + 1} isMe={entry.uid === myUid} valueType={view === 'overall' ? 'cash' : 'points'} />
                    </motion.div>
                  ))}
                </div>

                {/* Remaining rankings — clean list, thin separators */}
                {remaining.length > 0 && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
                  >
                    {remaining.map((entry, i) => (
                      <RankRow key={entry.uid} entry={withLiveSelf(entry)} rank={i + 4} isLast={i === remaining.length - 1} isMe={entry.uid === myUid} valueType={view === 'overall' ? 'cash' : 'points'} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          {/* If the player isn't in the fetched top list, show their own
              real rank separately — real players can be ranked far below
              the top list shown above, and they still deserve to see
              where they stand. */}
          {!amInTopList && myActiveRank !== null && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-gold-400)' }}
            >
              <RankRow
                entry={{ uid: myUid ?? 'me', playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth, profitPerMin: playerProfitPerMin, level: playerLevel, updatedAt: Date.now(), weeklyPoints: myWeeklyPoints, currentDistrictId: '', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: playerBusinessesBoughtCount, poolClaimsCount: 0 }}
                rank={myActiveRank}
                isLast
                isMe
                valueType={view === 'overall' ? 'cash' : 'points'}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const HowToEarnRow: React.FC = () => {
  const items = [
    { icon: Store, label: 'Buy', color: '#c96b3f' },
    { icon: UpgradeIcon, label: 'Upgrade', color: '#4a90d9' },
    { icon: Wallet, label: 'Claim', color: '#f2c14e' },
    { icon: Gift, label: 'Scratch card', color: '#e05a9e' },
    { icon: Users, label: 'Refer a friend', color: '#5ac97a' },
  ];
  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-premium-surface)', border: '1px solid var(--color-premium-border)' }}>
      <div className="text-[10.5px] font-bold mb-2" style={{ color: 'var(--color-premium-text)' }}>
        Every one of these earns +10 points
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {items.map(({ icon: Icon, label, color }) => (
          <div key={label} className="rounded-xl py-2 flex flex-col items-center gap-1" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
              <Icon size={14} color={color} />
            </div>
            <span className="text-[7px] font-bold text-center leading-tight" style={{ color: 'var(--color-premium-text)' }}>{label}</span>
            <span className="text-[9.5px] font-bold" style={{ color: 'var(--color-premium-green-500)' }}>+10</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpotlightCard: React.FC<{ entry: LeaderboardEntry & { uid: string }; rank: number; isMe: boolean; valueType: 'cash' | 'points' }> = ({ entry, rank, isMe, valueType }) => (
  <div
    className="rounded-2xl p-2.5 flex flex-col items-center text-center"
    style={{
      backgroundColor: 'var(--color-premium-surface)',
      border: `1.5px solid ${isMe ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border)'}`,
    }}
  >
    <div className="relative w-10 h-10 mb-1.5">
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-lg"
        style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border-strong)' }}
      >
        {entry.avatarEmoji}
      </div>
      <div
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
      >
        {rank}
      </div>
    </div>

    <span className="text-[10.5px] font-bold leading-tight truncate w-full" style={{ color: 'var(--color-premium-text)' }}>
      {entry.playerName}
    </span>
    {isMe && (
      <span className="text-[8px] font-bold mt-0.5" style={{ color: 'var(--color-premium-gold-400)' }}>YOU</span>
    )}

    {valueType === 'cash' ? (
      <>
        <div className="flex items-center gap-1 mt-1.5 font-bold text-[11px]" style={{ color: 'var(--color-premium-green-500)' }}>
          <CoinIcon className="w-3 h-3" premium />
          {formatCash(entry.profitPerMin)}/min
        </div>
        <div className="text-[7.5px] font-medium mt-0.5" style={{ color: 'var(--color-premium-text-secondary)' }}>
          {entry.businessesBoughtCount} businesses
        </div>
      </>
    ) : (
      <div className="font-bold text-[11px] mt-1.5" style={{ color: 'var(--color-premium-gold-400)' }}>
        {entry.weeklyPoints} pts
      </div>
    )}
    <div className="text-[8px] font-medium mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
      Level {entry.level}
    </div>
  </div>
);

const RankRow: React.FC<{ entry: LeaderboardEntry & { uid: string }; rank: number; isLast: boolean; isMe: boolean; valueType: 'cash' | 'points' }> = ({ entry, rank, isLast, isMe, valueType }) => (
  <div
    className={`flex items-center gap-3 px-3 py-2.5 ${isMe ? 'bg-[var(--color-premium-gold-400)]/[0.06]' : ''}`}
    style={{
      borderBottom: isLast ? 'none' : '1px solid var(--color-premium-border)',
      borderLeft: isMe ? '2.5px solid var(--color-premium-gold-400)' : '2.5px solid transparent',
    }}
  >
    <span className="w-8 text-center text-[11px] font-bold flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>
      #{rank}
    </span>

    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
    >
      {entry.avatarEmoji}
    </div>

    <div className="flex-1 min-w-0">
      <span className="text-[11.5px] font-bold truncate block" style={{ color: isMe ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text)' }}>
        {entry.playerName}{isMe ? ' (You)' : ''}
      </span>
      <span className="text-[8.5px] font-medium" style={{ color: 'var(--color-premium-text-secondary)' }}>
        Level {entry.level}
      </span>
    </div>

    <div className="text-right flex-shrink-0">
      {valueType === 'cash' ? (
        <>
          <div className="flex items-center justify-end gap-1 font-bold text-[11px]" style={{ color: 'var(--color-premium-green-500)' }}>
            <CoinIcon className="w-3 h-3" premium />
            {formatCash(entry.profitPerMin)}/min
          </div>
          <div className="text-[8px] font-medium" style={{ color: 'var(--color-premium-text-secondary)' }}>
            {entry.businessesBoughtCount} businesses
          </div>
        </>
      ) : (
        <div className="font-bold text-[11px]" style={{ color: 'var(--color-premium-gold-400)' }}>
          {entry.weeklyPoints} pts
        </div>
      )}
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div
    className="rounded-2xl p-8 flex flex-col items-center text-center"
    style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
  >
    <Users size={28} color="var(--color-premium-text-secondary)" strokeWidth={1.5} />
    <span className="text-[13px] font-bold mt-3" style={{ color: 'var(--color-premium-text)' }}>
      Rankings loading
    </span>
    <span className="text-[11px] font-medium mt-1 max-w-[220px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
      Give it a moment — real player rankings are being fetched.
    </span>
  </div>
);
