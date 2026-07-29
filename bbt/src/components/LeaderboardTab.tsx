import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users } from 'lucide-react';
import { LeaderboardEntry } from '../services/SaveService';
import { CoinIcon } from './CoinIcon';
import { formatCash } from '../utils/formatCash';

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
  playerLevel: number;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  leaderboard,
  myUid,
  myRank,
  playerName,
  playerAvatar,
  playerNetWorth,
  playerLevel,
}) => {
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);
  const amInTopList = myUid !== null && leaderboard.some((e) => e.uid === myUid);

  return (
    <div id="leaderboard-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Title — same premium pill language as Header/City Map */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)', color: 'var(--color-premium-text)' }}
      >
        <TrendingUp size={12} color="var(--color-premium-gold-400)" />
        <span>Empire Rankings</span>
      </div>

      {leaderboard.length === 0 ? (
        <EmptyState />
      ) : (
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
                <SpotlightCard entry={entry} rank={i + 1} isMe={entry.uid === myUid} />
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
                <RankRow key={entry.uid} entry={entry} rank={i + 4} isLast={i === remaining.length - 1} isMe={entry.uid === myUid} />
              ))}
            </div>
          )}

          {/* If the player isn't in the fetched top list, show their own
              real rank separately — real players can be ranked far below
              the top 20 shown above, and they still deserve to see where
              they stand. */}
          {!amInTopList && myRank !== null && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-gold-400)' }}
            >
              <RankRow
                entry={{ uid: myUid ?? 'me', playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth, level: playerLevel, updatedAt: Date.now() }}
                rank={myRank}
                isLast
                isMe
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SpotlightCard: React.FC<{ entry: LeaderboardEntry & { uid: string }; rank: number; isMe: boolean }> = ({ entry, rank, isMe }) => (
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

    <div className="flex items-center gap-1 mt-1.5 font-bold text-[11px]" style={{ color: 'var(--color-premium-green-500)' }}>
      <CoinIcon className="w-3 h-3" premium />
      {formatCash(entry.netWorth)}
    </div>
    <div className="text-[8px] font-medium mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
      Level {entry.level}
    </div>
  </div>
);

const RankRow: React.FC<{ entry: LeaderboardEntry & { uid: string }; rank: number; isLast: boolean; isMe: boolean }> = ({ entry, rank, isLast, isMe }) => (
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
      <div className="flex items-center justify-end gap-1 font-bold text-[11px]" style={{ color: 'var(--color-premium-green-500)' }}>
        <CoinIcon className="w-3 h-3" premium />
        {formatCash(entry.netWorth)}
      </div>
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
