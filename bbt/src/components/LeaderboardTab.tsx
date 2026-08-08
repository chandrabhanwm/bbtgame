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
  /** Distinct businesses this player actually owns right now — NOT the
   *  same as playerBusinessesBoughtCount, which counts every buy+upgrade
   *  action ever taken and keeps climbing on every upgrade. This is what
   *  the table's "Businesses" column shows for the local player's own
   *  row, computed fresh from real business data rather than a synced
   *  cumulative counter. */
  playerBusinessesOwnedCount: number;
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
  playerBusinessesOwnedCount,
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
                ? { ...entry, playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth, level: playerLevel, weeklyPoints: myWeeklyPoints, businessesOwnedCount: playerBusinessesOwnedCount }
                : entry;

            return (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
              >
                {/* Header row — real table, real column labels, not a
                    row of cards masquerading as one. */}
                <div
                  className="grid gap-2 px-3 py-2"
                  style={{ gridTemplateColumns: '26px 1fr 56px 72px', backgroundColor: 'var(--color-premium-elevated)' }}
                >
                  <span className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-premium-text-secondary)' }}>Rk</span>
                  <span className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-premium-text-secondary)' }}>Player</span>
                  <span className="text-[8.5px] font-bold uppercase tracking-wide text-center" style={{ color: 'var(--color-premium-text-secondary)' }}>Businesses</span>
                  <span className="text-[8.5px] font-bold uppercase tracking-wide text-right" style={{ color: 'var(--color-premium-text-secondary)' }}>{view === 'overall' ? '₹/min' : 'Points'}</span>
                </div>

                {activeBoard.map((entry, i) => (
                  <motion.div
                    key={entry.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.03 }}
                  >
                    <TableRow
                      entry={withLiveSelf(entry)}
                      rank={i + 1}
                      isLast={i === activeBoard.length - 1}
                      isMe={entry.uid === myUid}
                      valueType={view === 'overall' ? 'cash' : 'points'}
                    />
                  </motion.div>
                ))}
              </div>
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
              <TableRow
                entry={{ uid: myUid ?? 'me', playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth, profitPerMin: playerProfitPerMin, level: playerLevel, updatedAt: Date.now(), weeklyPoints: myWeeklyPoints, currentDistrictId: '', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: playerBusinessesBoughtCount, businessesOwnedCount: playerBusinessesOwnedCount, poolClaimsCount: 0 }}
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

const TableRow: React.FC<{ entry: LeaderboardEntry & { uid: string }; rank: number; isLast: boolean; isMe: boolean; valueType: 'cash' | 'points' }> = ({ entry, rank, isLast, isMe, valueType }) => (
  <div
    className="grid gap-2 items-center px-3 py-2.5"
    style={{
      gridTemplateColumns: '26px 1fr 56px 72px',
      borderBottom: isLast ? 'none' : '1px solid var(--color-premium-border)',
      backgroundColor: isMe ? 'rgba(212,167,44,0.08)' : 'transparent',
      borderLeft: isMe ? '2.5px solid var(--color-premium-gold-400)' : '2.5px solid transparent',
    }}
  >
    <span className="text-center flex-shrink-0" style={{ fontSize: rank <= 3 ? 15 : 11, fontWeight: 700, color: rank <= 3 ? undefined : 'var(--color-premium-text-secondary)' }}>
      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
    </span>

    <div className="min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[13px] flex-shrink-0"
          style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
        >
          {entry.avatarEmoji}
        </span>
        <span className="text-[11.5px] font-bold truncate" style={{ color: isMe ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text)' }}>
          {entry.playerName}{isMe ? ' (You)' : ''}
        </span>
      </div>
      {/* Net worth as compact subtext — real column alignment stays
          reserved for Rank/Player/Businesses/Value, but this stat still
          deserves a place without cramming a 5th column into a 380px
          wide phone screen. */}
      <div className="text-[8.5px] font-medium ml-[30px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
        {formatCash(entry.netWorth)} net worth
      </div>
    </div>

    <span className="text-center text-[11px] font-bold" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {entry.businessesOwnedCount ?? 0}
    </span>

    <span className="text-right text-[11px] font-bold" style={{ color: valueType === 'cash' ? 'var(--color-premium-green-500)' : 'var(--color-premium-gold-400)' }}>
      {valueType === 'cash' ? (
        <span className="flex items-center justify-end gap-1">
          <CoinIcon className="w-3 h-3" premium />
          {formatCash(entry.profitPerMin)}
        </span>
      ) : (
        `${entry.weeklyPoints} pts`
      )}
    </span>
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
