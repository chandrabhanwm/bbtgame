export interface Business {
  id: string;
  name: string;
  level: number;
  cost: number;
  baseCost: number;
  costMultiplier: number;
  profitPerMin: number;
  baseProfitPerMin: number;
  unlockAt: number;
  status: 'locked' | 'unlocked';
  emoji: string;
  gradient: string;
  description: string;
  themeColor: string; // Hex code for building accents
  /** Optional level cap, used only by the 'all_maxed' completion rule.
   *  Unset for every business today — leaving upgrades uncapped exactly
   *  as before. Reserved for a future slice. */
  maxLevel?: number;
}

/** A single Daily Reward Card. The value is generated at reset time (not
 *  at scratch time) — the reward already "exists" under the foil before
 *  anyone touches it, same as a real scratch card, so re-opening the app
 *  before scratching never changes what's underneath. tier drives which
 *  icon shows once revealed — it travels with the card regardless of
 *  which position (1/2/3) it gets shuffled into each reset. */
export interface RewardCard {
  scratched: boolean;
  value: number;
  claimed: boolean;
  tier: 'small' | 'medium' | 'rare';
}

/** One goal per day, resetting on the exact same 24-hour cycle as the
 *  Daily Reward Cards — deliberately not a separate timer. progressCount
 *  is a simple incrementing counter for count-based goals (upgrade/buy/
 *  collect); 'reach_completion' goals instead check the live completion %
 *  of districtId directly, so progressCount is unused for that type. */
export interface DailyGoal {
  type: 'upgrade_2' | 'buy_1' | 'collect_pool_2' | 'reach_completion';
  target: number;
  districtId?: string;
  progressCount: number;
  claimed: boolean;
  rewardAmount: number;
}

export interface PlayerStats {
  cash: number;
  profitPerMin: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  /** Claim pool — ticks every second at profitPerMin (already the true
   *  combined total across every district, confirmed directly in the
   *  reducer that computes it), accrues in real time even while the app
   *  is closed (via lastPoolClaimAt), caps at 3 hours' worth, and resets
   *  to zero once claimed. */
  poolCash: number;
  /** Real wall-clock ms timestamp of the last pool claim — the basis for
   *  computing offline accrual on next load. Client-clock based
   *  (Date.now()) rather than server-validated: a fine, deliberate
   *  tradeoff for a single-player game with no competitive/real-money
   *  stakes riding on it yet. Revisit only if that changes. */
  lastPoolClaimAt: number;
  /** Three Daily Reward Cards, replacing the old flat Daily Income Boost.
   *  Same one-consistent-rule-everywhere principle as the pool: any
   *  scratched-but-unclaimed value expires at reset rather than carrying
   *  forward, same as unclaimed pool income does. */
  rewardCards: RewardCard[];
  lastCardsResetAt: number;
  /** "Moment Zero" — whether the player has ever made their very first
   *  real purchase / upgrade. Gates the one-time elevated celebration
   *  distinct from the routine Notable-tier feedback every purchase/
   *  upgrade after that gets. Persisted (unlike the celebration itself)
   *  specifically so a returning player never sees this twice. */
  hasMadeFirstPurchase: boolean;
  hasMadeFirstUpgrade: boolean;
  /** Today's goal, or null before the very first one generates. Resets
   *  alongside the Daily Reward Cards (same lastCardsResetAt), not on
   *  its own separate schedule. */
  dailyGoal: DailyGoal | null;
  /** Permanent record of every achievement ID ever unlocked — checked
   *  alongside the live condition (computeAchievements ORs the two), so
   *  once something is true it stays true forever, even across a future
   *  Legacy reset that clears businesses/districts/cash. This is the
   *  fix for the exact bug we identified: without this, resetting
   *  businesses to zero would silently re-lock achievements a player
   *  had already genuinely earned. */
  unlockedAchievementIds: string[];
  /** How many times the player has ever reset via Legacy. Used as the
   *  index into the fixed milestone table to determine the MINIMUM net
   *  worth required before the next reset is even allowed — this rises
   *  each time (₹50L, then ₹1Cr, then ₹2Cr...), so players can't spam
   *  tiny resets, while the reward table itself never changes. */
  legacyCount: number;
  /** Permanent, cumulative — never reset by anything, including Legacy
   *  itself. +1% global income per point. */
  legacyPoints: number;
  /** How many times the finger-tap hint on the Profit box has been shown
   *  — caps at 3, ever, then never shows again. Persisted so it doesn't
   *  reset on every app reopen. */
  profitTapHintShownCount: number;
  /** Real wall-clock ms timestamp of the last successful "Double it?" ad
   *  claim on the Profit pool — the 60-second cooldown before the next
   *  claim is measured from here. Separate from lastPoolClaimAt, which
   *  tracks the regular (non-doubled) claim for offline accrual. */
  lastProfitDoubleClaimAt: number;
  /** Real wall-clock ms timestamp of the last scratch-card ad claim —
   *  gates the next not-yet-claimed card behind the same 60-second
   *  cooldown, creating the sequential "claim one, wait, claim the
   *  next" rhythm across all three cards. */
  lastCardClaimAt: number;
  /** This week's contest points — action-based (buy, upgrade, claim,
   *  open app), never wealth-based. Resets to 0 the first time this
   *  player opens the app after a new week (Monday 00:00 UTC) starts. */
  weeklyPoints: number;
  /** Real wall-clock ms timestamp of the Monday 00:00 UTC this player's
   *  current weeklyPoints count is measured from — comparing this
   *  against the actual most-recent Monday is what triggers the reset. */
  weeklyPointsWeekStart: number;
  /** How many of today's weeklyPoints came specifically from upgrade
   *  actions — the one action type cheap and repeatable enough to farm,
   *  so it alone gets a daily cap. Resets at real local midnight, not
   *  tied to the weekly cycle. */
  dailyUpgradePointsCount: number;
  /** The calendar day (YYYY-MM-DD) dailyUpgradePointsCount was last
   *  reset for — comparing against today's date is what triggers that
   *  reset. */
  dailyUpgradePointsDate: string;
}

// LeaderboardUser removed — the old fictional-rival leaderboard is gone,
// replaced entirely by real player data (LeaderboardEntry, defined in
// services/SaveService.ts, fetched from Firestore).

export interface CityArea {
  id: string;
  name: string;
  status: 'active' | 'locked';
  unlockCost: number;
  progress: number;
  image: string;
}
