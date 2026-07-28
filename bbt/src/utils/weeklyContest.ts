import { PlayerStats } from '../types';

const POINTS_PER_ACTION = 10;
const DAILY_UPGRADE_POINTS_CAP = 20; // matches the "15-20/day" range agreed on — the upper end, since it's a genuine cap, not a guess

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC — same reasoning as the weekly reset below
}

/** The timestamp of the most recent Monday 00:00 UTC. Using UTC
 *  deliberately, not the player's local timezone — this is a shared,
 *  citywide contest with a single real winner list, so every player's
 *  week needs to start and end at the same real moment, not whenever
 *  midnight happens to fall wherever they are. */
function mostRecentMondayUTC(): number {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday, 0, 0, 0, 0));
  return monday.getTime();
}

/** True for the entire UTC calendar day of Sunday — the frozen review
 *  window. Points stop accumulating for this whole day (Saturday night
 *  UTC through Sunday night UTC), giving a stable, unchanging snapshot
 *  to actually pick winners from, rather than a number that keeps
 *  shifting depending on exactly when it's checked. The Monday 00:00
 *  reset (via mostRecentMondayUTC rolling over) still fires normally
 *  right after this window ends. */
function isWithinFreezeWindow(): boolean {
  return new Date().getUTCDay() === 0; // 0 = Sunday in getUTCDay()
}

type ContestAction = 'buy_or_upgrade' | 'claim';

interface ContestPointsResult {
  stats: PlayerStats;
  pointsAwarded: boolean;
}

/**
 * Applies weekly contest scoring to a stats update — action-based only,
 * never wealth-based, per the confirmed design. Handles the weekly
 * reset (if a new week has started since this player's own
 * weeklyPointsWeekStart) and the daily upgrade-specific farming cap,
 * both inline, so every caller gets correct behavior without
 * duplicating that logic.
 *
 * isNewBusiness distinguishes a first-time purchase from a regular
 * upgrade — both currently earn the same points, but the anti-farming
 * cap applies only to upgrades (buying is already naturally limited to
 * a finite number of businesses per district).
 *
 * Returns pointsAwarded alongside the updated stats — callers use this
 * to decide whether to show the "+10 contest points" celebration.
 * Showing it when the freeze window or the daily cap actually blocked
 * the points would be showing the player a number that isn't real.
 */
export function applyContestPoints(prev: PlayerStats, action: ContestAction, isNewBusiness: boolean = false): ContestPointsResult {
  const currentWeekStart = mostRecentMondayUTC();

  if (isWithinFreezeWindow()) {
    // Frozen for review — the action itself still happens (handled by
    // the caller), it just never earns contest points today. Still
    // correctly carries weekStart forward so nothing looks stale once
    // Monday's real reset fires right after this window ends.
    return { stats: { ...prev, weeklyPointsWeekStart: currentWeekStart }, pointsAwarded: false };
  }

  const weekRolledOver = prev.weeklyPointsWeekStart !== currentWeekStart;
  const weeklyPointsBase = weekRolledOver ? 0 : prev.weeklyPoints;

  const today = todayDateString();
  const dayRolledOver = prev.dailyUpgradePointsDate !== today;
  const dailyUpgradePointsBase = dayRolledOver ? 0 : prev.dailyUpgradePointsCount;

  if (action === 'buy_or_upgrade') {
    const isCappableUpgrade = !isNewBusiness;
    if (isCappableUpgrade && dailyUpgradePointsBase >= DAILY_UPGRADE_POINTS_CAP) {
      // Cap reached — the action itself still happens (handled by the
      // caller), it just doesn't earn any more contest points today.
      return {
        stats: {
          ...prev,
          weeklyPoints: weeklyPointsBase,
          weeklyPointsWeekStart: currentWeekStart,
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
        weeklyPointsWeekStart: currentWeekStart,
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
      weeklyPointsWeekStart: currentWeekStart,
    },
    pointsAwarded: true,
  };
}
