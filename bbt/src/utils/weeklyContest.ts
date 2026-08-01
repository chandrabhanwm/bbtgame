import { PlayerStats } from '../types';
import { progressionConfig } from '../config/progressionConfig';

const POINTS_PER_ACTION = 10;
const DAILY_UPGRADE_POINTS_CAP = 20; // matches the "15-20/day" range agreed on — the upper end, since it's a genuine cap, not a guess

export function todayDateString(): string {
  // Local timezone, deliberately — NOT UTC. For a player in India
  // (UTC+5:30), UTC midnight is actually 5:30 AM local time, so a
  // UTC-based date string was resetting daily caps at the wrong real
  // moment. getFullYear/getMonth/getDate are all local-timezone methods
  // in JavaScript, unlike getUTCFullYear etc.
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Same local-date-string logic as todayDateString, but for an
 *  arbitrary past timestamp — used to check "did the calendar day
 *  change since X happened" (e.g. the scratch cards' last reset)
 *  without needing a separate stored date-string field alongside the
 *  existing timestamp. */
export function localDateStringOf(timestampMs: number): string {
  const d = new Date(timestampMs);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type ContestAction = 'buy_or_upgrade' | 'claim' | 'scratch_card' | 'referral';

interface ContestPointsResult {
  stats: PlayerStats;
  pointsAwarded: boolean;
}

/**
 * Applies points-leaderboard scoring to a stats update — action-based
 * only, never wealth-based, per the confirmed design. This now runs as
 * a permanent, all-time leaderboard with NO automatic weekly reset and
 * NO Sunday freeze window — both were removed deliberately. The only
 * way points ever reset to zero is a manual bump of
 * progressionConfig.pointsSeasonId (see that file for how to trigger
 * one), detected below by comparing it against what's stored on this
 * player's own save.
 *
 * Five actions currently earn points: buying a business, upgrading a
 * business, claiming the pool, claiming a scratch card, and a
 * successful referral signup — each worth POINTS_PER_ACTION. The daily
 * upgrade cap below is the one anti-farming safeguard that still
 * applies, specifically because points now accumulate forever with no
 * weekly reset to naturally limit any exploit — a farming hole here
 * would compound indefinitely instead of resetting itself away every
 * Monday like the old system did.
 *
 * isNewBusiness distinguishes a first-time purchase from a regular
 * upgrade — both currently earn the same points, but the anti-farming
 * cap applies only to upgrades (buying is already naturally limited to
 * a finite number of businesses per district). Scratch cards and
 * referrals aren't subject to this cap since they're already
 * independently rate-limited elsewhere (3 cards/day, 10 referrals/day).
 *
 * Returns pointsAwarded alongside the updated stats — callers use this
 * to decide whether to show the "+10 points" celebration. Showing it
 * when the daily upgrade cap actually blocked the points would be
 * showing the player a number that isn't real.
 */
export function applyContestPoints(prev: PlayerStats, action: ContestAction, isNewBusiness: boolean = false): ContestPointsResult {
  // A season mismatch means a manual reset was triggered since this
  // player last played — their points (and the daily upgrade cap
  // alongside them) start fresh at zero, and their stored season
  // catches up to match the current one.
  const seasonRolledOver = prev.pointsSeasonId !== progressionConfig.pointsSeasonId;
  const weeklyPointsBase = seasonRolledOver ? 0 : prev.weeklyPoints;

  const today = todayDateString();
  const dayRolledOver = seasonRolledOver || prev.dailyUpgradePointsDate !== today;
  const dailyUpgradePointsBase = dayRolledOver ? 0 : prev.dailyUpgradePointsCount;

  if (action === 'buy_or_upgrade') {
    const isCappableUpgrade = !isNewBusiness;
    if (isCappableUpgrade && dailyUpgradePointsBase >= DAILY_UPGRADE_POINTS_CAP) {
      // Cap reached — the action itself still happens (handled by the
      // caller), it just doesn't earn any more points today.
      return {
        stats: {
          ...prev,
          weeklyPoints: weeklyPointsBase,
          pointsSeasonId: progressionConfig.pointsSeasonId,
          dailyUpgradePointsCount: dailyUpgradePointsBase,
          dailyUpgradePointsDate: today,
        },
        pointsAwarded: false,
      };
    }
    return {
      stats: {
        ...prev,
        weeklyPoints: weeklyPointsBase + POINTS_PER_ACTION,
        pointsSeasonId: progressionConfig.pointsSeasonId,
        dailyUpgradePointsCount: isCappableUpgrade ? dailyUpgradePointsBase + POINTS_PER_ACTION : dailyUpgradePointsBase,
        dailyUpgradePointsDate: today,
      },
      pointsAwarded: true,
    };
  }

  return {
    stats: {
      ...prev,
      weeklyPoints: weeklyPointsBase + POINTS_PER_ACTION,
      pointsSeasonId: progressionConfig.pointsSeasonId,
    },
    pointsAwarded: true,
  };
}
