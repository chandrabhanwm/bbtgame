import { Business, PlayerStats } from '../types';
import { calculateTieredProfit } from '../utils/profitCurve';

const LEVEL_UP_CASH_BONUS = 1000;

interface MilestoneState {
  icon: string;
  title: string;
  message: string;
  bonusText: string;
  color: 'gold' | 'green';
}

interface UseBusinessActionsParams {
  stats: PlayerStats;
  cashRef: React.MutableRefObject<number>;
  currentDistrictName: string;
  setBusinesses: (updater: Business[] | ((prev: Business[]) => Business[])) => void;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  setMilestone: (m: MilestoneState | null) => void;
  setShowConfetti: (v: boolean) => void;
  setJustUpdatedBusinessId: (updater: string | null | ((prev: string | null) => string | null)) => void;
  triggerCashPulse: () => void;
  pushNewsEvent: (message: string) => void;
  playLevelUp: () => void;
}

/**
 * The core economy handler — buying and upgrading a business, and the
 * XP/level-up system that action feeds into. Extracted out of App.tsx
 * as its own domain per the Phase 0 architecture cleanup. Behavior
 * preserved exactly; this is a relocation, not a rewrite, including the
 * specific stale-closure fix already documented below.
 */
export function useBusinessActions({
  stats, cashRef, currentDistrictName, setBusinesses, setStats, setMilestone,
  setShowConfetti, setJustUpdatedBusinessId, triggerCashPulse, pushNewsEvent, playLevelUp,
}: UseBusinessActionsParams) {
  const triggerXpGain = (xpAmount: number) => {
    setStats((prev) => {
      let currentXp = prev.xp + xpAmount;
      let currentLvl = prev.level;
      let nextThreshold = prev.nextLevelXp;
      let cashBonus = 0;
      let leveledUp = false;

      // Handle rolling over multiple thresholds in a single XP gain
      while (currentXp >= nextThreshold) {
        currentXp -= nextThreshold;
        currentLvl += 1;
        cashBonus += LEVEL_UP_CASH_BONUS;
        nextThreshold = Math.round(nextThreshold * 1.5);
        leveledUp = true;
      }

      if (leveledUp) {
        setTimeout(() => {
          playLevelUp();
          setMilestone({
            icon: '👑',
            title: 'Level Up!',
            message: `LEVEL UP! You reached Level ${currentLvl}! 🎉`,
            bonusText: `Earned +₹${LEVEL_UP_CASH_BONUS.toLocaleString('en-IN')} bonus cash`,
            color: 'gold',
          });
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1300);
        }, 100);
      }

      return {
        ...prev,
        xp: currentXp,
        level: currentLvl,
        nextLevelXp: nextThreshold,
        cash: prev.cash + cashBonus,
      };
    });
  };

  // BUY & UPGRADE BUSINESS ACTIONS
  //
  // Previously, the level-up guard read `stats.cash` from this function's
  // render-time closure (stale), while the cash deduction below it used a
  // fresh functional setStats check — an asymmetry that let rapid repeated
  // taps level a business up without the second cash deduction actually
  // succeeding. Fixed by making the affordability decision, the cash
  // deduction, and the level-up all happen from the single functional
  // setBusinesses updater below, using cashRef (always current) instead of
  // the stale closure — so a business now only ever upgrades in the exact
  // same step that payment is confirmed to succeed.
  const handleUpgrade = (id: string): boolean => {
    let purchaseSucceeded = false;

    setBusinesses((prev) => {
      return prev.map((b) => {
        if (b.id !== id) return b;

        // Single source of truth for "can we afford this": cashRef,
        // checked and updated synchronously right here, not the stats
        // closure. `prev` (via the outer .map) is likewise always the
        // true current business state, never a stale snapshot.
        if (cashRef.current < b.cost) {
          return b;
        }

        purchaseSucceeded = true;
        cashRef.current -= b.cost; // deduct immediately so a second rapid
                                    // call sees the post-deduction balance
                                    // even before React re-renders

        const isUnlocking = b.level === 0;
        const newLvl = b.level + 1;
        const nextCost = Math.round(b.baseCost * Math.pow(b.costMultiplier, newLvl));
        const nextProfit = calculateTieredProfit(b.baseProfitPerMin, newLvl);

        if (isUnlocking) {
          pushNewsEvent(`🏪 ${b.name} purchased`);
        } else if (newLvl === 3) {
          pushNewsEvent(`🎉 ${b.name} reached Level 3`);
        } else if (newLvl === 5) {
          pushNewsEvent(`⭐ ${b.name} reached Level 5`);
        } else if (newLvl === 10) {
          pushNewsEvent(`👑 ${b.name} reached Level 10`);
        }

        // "Moment Zero" — the player's very first purchase and very first
        // upgrade each get the full Milestone treatment once, gated by a
        // persisted flag so a returning player never sees this twice.
        // Every purchase/upgrade after this still gets the Notable-tier
        // card animation (below) — this is additional, not instead of.
        if (isUnlocking && !stats.hasMadeFirstPurchase) {
          playLevelUp();
          setMilestone({
            icon: '🏪',
            title: 'Your First Business!',
            message: `${b.name} is now serving ${currentDistrictName}.`,
            bonusText: 'Every empire starts with one shop.',
            color: 'gold',
          });
        } else if (!isUnlocking && !stats.hasMadeFirstUpgrade) {
          playLevelUp();
          setMilestone({
            icon: '📈',
            title: 'Your First Upgrade!',
            message: `${b.name} is now Level ${newLvl} — growing your income.`,
            bonusText: 'Upgrades are how every business becomes worth more.',
            color: 'gold',
          });
        }

        setStats((statsPrev) => {
          const goal = statsPrev.dailyGoal;
          const goalMatchesThisAction =
            goal && !goal.claimed &&
            ((goal.type === 'buy_1' && isUnlocking) || (goal.type === 'upgrade_2' && !isUnlocking));

          return {
            ...statsPrev,
            cash: statsPrev.cash - b.cost,
            hasMadeFirstPurchase: statsPrev.hasMadeFirstPurchase || isUnlocking,
            hasMadeFirstUpgrade: statsPrev.hasMadeFirstUpgrade || !isUnlocking,
            dailyGoal: goalMatchesThisAction ? { ...goal, progressCount: goal.progressCount + 1 } : statsPrev.dailyGoal,
          };
        });
        triggerXpGain(isUnlocking ? 45 : 20);
        triggerCashPulse();
        setJustUpdatedBusinessId(b.id);
        setTimeout(() => setJustUpdatedBusinessId((cur) => (cur === b.id ? null : cur)), 700);

        return {
          ...b,
          level: newLvl,
          cost: nextCost,
          profitPerMin: nextProfit,
          status: 'unlocked',
        };
      });
    });

    return purchaseSucceeded;
  };

  return { handleUpgrade };
}
