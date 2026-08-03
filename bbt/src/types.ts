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
  /** Strategy-layer fields — set only for businesses using the new
   *  fixed 6-level + synergy system (all 10 districts, per the verified
   *  spec). When present, `levelCosts`/`levelIncomes` are authoritative
   *  and `cost`/`profitPerMin`/`costMultiplier` are derived from them
   *  rather than the old continuous growth-factor formula. Absent means
   *  "use the legacy formula" — kept optional so nothing breaks if a
   *  business is ever added without strategy-layer data. */
  levelCosts?: number[]; // exactly 6 entries: [buyCost, L1→L2, L2→L3, L3→L4, L4→L5, L5→L6]
  levelIncomes?: number[]; // exactly 6 entries: income/min at L1..L6, BEFORE synergy bonuses
}

/** A single synergy rule within one district. `requiresIds` are business
 *  ids that must ALL be owned (level >= 1) for this bonus to apply to
 *  `targetId`. Never crosses district boundaries — requiresIds and
 *  targetId always refer to businesses within the same district. */
export interface SynergyRule {
  id: string;
  name: string;
  requiresIds: string[];
  targetId: string;
  bonusPercent: number; // e.g. 0.25 for +25%
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
   *  is closed (via lastPoolClaimAt), caps at 4 hours' worth, and resets
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
  /** How many times the pool's "Double it?" bonus has been used today —
   *  capped per progressionConfig.doubleClaimCapPerDay. Reduced from
   *  unlimited uses at +100% specifically because unlimited doubling
   *  was found, via real player data, to be a major contributor to
   *  runaway economy growth. Resets at real local midnight, same
   *  pattern as dailyUpgradePointsCount above. */
  dailyDoubleClaimCount: number;
  /** The calendar day (YYYY-MM-DD) dailyDoubleClaimCount was last reset
   *  for — comparing against today's date is what triggers that reset. */
  dailyDoubleClaimDate: string;

  /** Cumulative seconds the app has been actively open — incremented
   *  once per second alongside the existing live pool tick, so it's
   *  measuring genuine active time, not wall-clock time the app was
   *  merely installed. Synced to the leaderboard doc as "Total Play
   *  Time" for the requested per-player analytics view. */
  totalPlayTimeSeconds: number;
  /** How many times this player has completed watching a simulated ad
   *  (Header double-claim, Portfolio double-claim, or a scratch card) —
   *  a genuine count, separate from the Firebase Analytics ad_watched
   *  event, which only shows aggregate totals across all players, not
   *  a per-player breakdown. */
  adsWatchedCount: number;
  /** How many times this player has bought or upgraded a business —
   *  every successful tap on a business card, first purchase or a
   *  further level, each counts once. */
  businessesBoughtCount: number;
  /** How many times this player has successfully claimed the Profit
   *  pool (Header or Portfolio, either one) — separate from how many
   *  times they've doubled it, which is tracked by
   *  dailyDoubleClaimCount above but resets daily, while this one
   *  never resets. */
  poolClaimsCount: number;

  /** Whether this player has made at least one pool claim since the
   *  2-hour cooldown was introduced. Defaults to false for every save,
   *  new or existing — an existing player's old lastPoolClaimAt could
   *  otherwise unexpectedly lock them out for up to 2 hours the moment
   *  this update deploys, even though they never agreed to or expected
   *  this new restriction. The very first claim after this feature
   *  exists always succeeds regardless of that old timestamp; the
   *  cooldown only starts counting from that point onward. */
  hasClaimedSincePoolCooldown: boolean;

  /** Which points-leaderboard season this player's weeklyPoints belong
   *  to — compared against progressionConfig.pointsSeasonId. Mismatch
   *  means a manual reset was triggered since this player last played;
   *  their points reset to zero and this catches up to match. The
   *  points system itself now runs forever with no automatic reset —
   *  this is the only way points ever go back to zero. */
  pointsSeasonId: number;

  /** How many referral bonuses this player has RECEIVED as a referrer
   *  today (someone they invited signed up) — capped at 10/day per the
   *  agreed limit. Separate from how many people they've referred
   *  in total, which isn't capped anywhere. */
  dailyReferralClaimsCount: number;
  dailyReferralClaimsDate: string;
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
