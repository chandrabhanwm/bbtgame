import { Business, PlayerStats } from '../types';
import { isDailyGoalComplete } from '../utils/dailyGoal';
import { playCoin } from '../utils/audio';

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
  const handleClaimPool = (): number => {
    const claimed = stats.poolCash;
    if (claimed <= 0) return 0;
    setStats((prev) => {
      const goal = prev.dailyGoal;
      const goalMatches = goal && !goal.claimed && goal.type === 'collect_pool_2' && prev.poolCash > 0;
      return {
        ...prev,
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
   *  a claim — adds the same amount again, doubling what they just got.
   *  Also starts the 60-second cooldown before the next claim, since
   *  this is the point where the ad-watching flow actually finishes. */
  const handleDoubleClaim = (amount: number) => {
    setStats((prev) => ({ ...prev, cash: prev.cash + amount, lastProfitDoubleClaimAt: Date.now() }));
    triggerCashPulse();
    triggerMoneyFlight();
    playCoin();
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

  return { handleClaimPool, handleDoubleClaim, handleScratchCard, handleClaimCard, handleClaimDailyGoal };
}
