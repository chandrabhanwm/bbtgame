import { Business, PlayerStats } from '../types';
import { isDailyGoalComplete } from '../utils/dailyGoal';
import { playCoin } from '../utils/audio';
import { applyContestPoints, todayDateString } from '../utils/weeklyContest';
import { getCooldownRemainingSeconds } from '../utils/cooldown';
import { progressionConfig } from '../config/progressionConfig';

interface UseClaimHandlersParams {
  stats: PlayerStats;
  businessesByDistrict: Record<string, Business[]>;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  triggerCashPulse: () => void;
  triggerMoneyFlight: () => void;
}

/**
 * Every way a player actually receives cash outside of a business
 * purchase/upgrade — extracted out of App.tsx as its own domain per the
 * Phase 0 architecture cleanup. Behavior preserved exactly; this is a
 * relocation, not a rewrite.
 *
 * Covers: claiming the pool, doubling a claim via ad, scratching and
 * claiming a daily reward card, and claiming the daily goal. Each one
 * ends the same way — cash pulse, coin flight, coin sound — which is
 * exactly why grouping them together makes sense as one file.
 */
export function useClaimHandlers({ stats, businessesByDistrict, setStats, triggerCashPulse, triggerMoneyFlight }: UseClaimHandlersParams) {
  /** Claims the pool — now gated by a genuine cooldown
   *  (progressionConfig.poolClaimCooldownMinutes) between any two
   *  claims, not just the double-claim's own short cooldown. Added
   *  specifically because real player data showed the pool becoming an
   *  effectively unlimited money source once profitPerMin grew large
   *  enough to refill the pool to its ceiling within minutes — a
   *  cooldown on the claim action itself is what actually throttles
   *  that, independent of how fast the pool underneath it fills. */
  const handleClaimPool = (): number => {
    const cooldownRemaining = getCooldownRemainingSeconds(stats.lastPoolClaimAt, progressionConfig.poolClaimCooldownMinutes * 60000);
    if (cooldownRemaining > 0) return 0;
    const claimed = stats.poolCash;
    if (claimed <= 0) return 0;
    setStats((prev) => {
      const goal = prev.dailyGoal;
      const goalMatches = goal && !goal.claimed && goal.type === 'collect_pool_2' && prev.poolCash > 0;
      const { stats: withContestPoints } = applyContestPoints(prev, 'claim');
      return {
        ...withContestPoints,
        cash: prev.cash + prev.poolCash,
        poolCash: 0,
        lastPoolClaimAt: Date.now(),
        dailyGoal: goalMatches ? { ...goal, progressCount: goal.progressCount + 1 } : prev.dailyGoal,
      };
    });
    triggerCashPulse();
    triggerMoneyFlight();
    playCoin();
    return claimed;
  };

  /** Called after the player watches the rewarded ad offered right after
   *  a claim — adds a reduced bonus (progressionConfig.doubleClaimBonusPercent,
   *  currently +50%, down from an original unlimited +100%) and is capped
   *  at progressionConfig.doubleClaimCapPerDay uses per real calendar day.
   *  Both changes came directly from real player data showing unlimited,
   *  full-value doubling was a major contributor to runaway economy
   *  growth. Also starts the 60-second cooldown before the next claim,
   *  since this is the point where the ad-watching flow actually
   *  finishes. Returns whether the double was actually applied, so the
   *  UI can tell the difference between "doubled" and "cap already hit
   *  today" rather than silently doing nothing. */
  const handleDoubleClaim = (amount: number): boolean => {
    const today = todayDateString();
    const dayRolledOver = stats.dailyDoubleClaimDate !== today;
    const usedToday = dayRolledOver ? 0 : stats.dailyDoubleClaimCount;
    if (usedToday >= progressionConfig.doubleClaimCapPerDay) {
      // Cap already reached today — no bonus, no cooldown reset, and the
      // caller can check the returned false to show "come back tomorrow"
      // instead of the normal doubled-success animation.
      return false;
    }
    const bonus = Math.round(amount * progressionConfig.doubleClaimBonusPercent);
    setStats((prev) => ({
      ...prev,
      cash: prev.cash + bonus,
      lastProfitDoubleClaimAt: Date.now(),
      dailyDoubleClaimCount: usedToday + 1,
      dailyDoubleClaimDate: today,
    }));
    triggerCashPulse();
    triggerMoneyFlight();
    playCoin();
    return true;
  };

  /** Free, instant — just flips the card's own scratched flag so the UI
   *  shows the value that was already generated at the last reset. No
   *  cash changes hands here at all; that only happens on claim. */
  const handleScratchCard = (index: number) => {
    setStats((prev) => ({
      ...prev,
      rewardCards: prev.rewardCards.map((c, i) => (i === index ? { ...c, scratched: true } : c)),
    }));
  };

  /** Called after the player watches the rewarded ad for a specific
   *  scratched card — adds that card's own value to cash and marks it
   *  claimed so it can't be claimed twice before the next reset. Also
   *  starts the 60-second cooldown before the *next* card can be
   *  claimed — this is what creates the sequential "claim, wait, claim
   *  the next" rhythm across all three cards. */
  const handleClaimCard = (index: number) => {
    setStats((prev) => {
      const card = prev.rewardCards[index];
      if (!card || !card.scratched || card.claimed) return prev;
      return {
        ...prev,
        cash: prev.cash + card.value,
        rewardCards: prev.rewardCards.map((c, i) => (i === index ? { ...c, claimed: true } : c)),
        lastCardClaimAt: Date.now(),
      };
    });
    triggerCashPulse();
    triggerMoneyFlight();
    playCoin();
  };

  /** Daily goal claim — Notable tier only (cash pulse), not the Milestone
   *  celebration. Deliberate: the plan is explicit that a daily win
   *  shouldn't compete with district completion for celebration weight. */
  const handleClaimDailyGoal = () => {
    setStats((prev) => {
      if (!prev.dailyGoal || prev.dailyGoal.claimed) return prev;
      if (!isDailyGoalComplete(prev.dailyGoal, businessesByDistrict)) return prev;
      return {
        ...prev,
        cash: prev.cash + prev.dailyGoal.rewardAmount,
        dailyGoal: { ...prev.dailyGoal, claimed: true },
      };
    });
    triggerCashPulse();
    triggerMoneyFlight();
    playCoin();
  };

  /** Share & Earn — rewards coins for actually completing a native
   *  share (WhatsApp, copy link, etc.), not just for tapping the
   *  button. navigator.share() only resolves once the OS-level share
   *  sheet reports success; if the player backs out or cancels it,
   *  most browsers reject the promise (commonly with an AbortError),
   *  and no reward is given. Deliberately repeatable/uncapped per
   *  product decision — the real gate here is "did a share actually
   *  happen," not a daily limit.
   *
   *  Falls back to copying the message to the clipboard on
   *  browsers/devices without the Web Share API (e.g. most desktop
   *  browsers) — clipboard copy always "succeeds" once permission is
   *  granted, so that path rewards on copy rather than on a completed
   *  share, since there's no further signal to wait for. */
  const handleShareAndEarn = async (): Promise<{ ok: boolean; reason?: 'cancelled' | 'unsupported' | 'error' }> => {
    const shareText = `I'm building my business empire in Basti! Come build yours 🏙️`;
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Basti', text: shareText, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      } else {
        return { ok: false, reason: 'unsupported' };
      }
    } catch (err: any) {
      // AbortError (and equivalent "closed without sharing" cases) means
      // the player backed out of the share sheet — no reward, and not
      // treated as a real error either.
      if (err?.name === 'AbortError') return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'error' };
    }

    setStats((prev) => ({ ...prev, cash: prev.cash + progressionConfig.shareRewardAmount }));
    triggerCashPulse();
    triggerMoneyFlight();
    playCoin();
    return { ok: true };
  };

  return { handleClaimPool, handleDoubleClaim, handleScratchCard, handleClaimCard, handleClaimDailyGoal, handleShareAndEarn };
}
