/**
 * Central configuration for the progression engine. Every number and rule
 * that governs district completion, rewards, and star ratings lives here
 * — nowhere else in the codebase should hardcode these. Retuning game
 * balance later means editing this one file.
 */

export type CompletionRule = 'all_purchased' | 'all_maxed';

export const progressionConfig = {
  /**
   * Option A ('all_purchased'): a district is completed once every
   * business in it has been bought at least once.
   * Option B ('all_maxed'): completed once every business hits its
   * maxLevel. NOTE: no business currently defines maxLevel (that field
   * was intentionally not added/enforced, to avoid changing existing
   * upgrade behavior) — so 'all_maxed' is fully wired but practically
   * unreachable until a future slice adds real level caps. This is
   * correct, not a bug: nothing can be "maxed" if nothing is capped.
   */
  completionRule: 'all_purchased' as CompletionRule,

  /** District completion reward is now a percentage of that district's
   *  total buildout cost (sum of every business's baseCost), not a flat
   *  amount — see getDistrictCompletionReward() in districtProgress.ts.
   *  Chosen at the middle of the plan's suggested 10-15% range. This is
   *  a real, deliberate change in the actual reward amounts: Badeban
   *  (the cheapest district) now pays roughly ₹1.4L instead of the old
   *  flat ₹5L, while Plastic Complex (the most expensive) now pays
   *  roughly ₹1.56Cr — the point of the change, not an accident of it. */
  completionRewardPercent: 0.12,

  /** Star rating starts here before any businesses are purchased. */
  defaultStars: 0,

  /** Every this-many percent of completion earns one star. */
  starThresholdPercent: 20,

  /** Star rating never exceeds this. */
  maxStars: 5,

  /** How long a newly-unlocked district's frontier roads stay animated
   *  on the City Map after unlocking. */
  unlockAnimationDurationMs: 4000,

  /** How long a district-completed celebration banner stays on screen. */
  celebrationDurationMs: 3500,

  /** How long roads leading away from a just-completed district pulse. */
  completionRoadPulseDurationMs: 4000,

  /**
   * ═══════════════════════════════════════════════════════════════════
   * ECONOMY REBALANCE (verified via extensive simulation against real
   * player data showing a runaway economy — a player reached ~₹11-14
   * Crore net worth within 24 hours before this rebalance). Split into
   * two categories below: ARCHITECTURE (locked, verified independently
   * of any specific number) and PLAYTEST PARAMETERS (a reasonable
   * starting point, meant to be adjusted after real players are
   * observed, not something more simulation should keep re-tuning).
   * ═══════════════════════════════════════════════════════════════════
   */

  /** ARCHITECTURE — locked. Per-district payback multiplier, applied to
   *  every business's target payback time. Index 0 = Badeban (first
   *  district) through index 9 = Plastic Complex (last). A tapered
   *  curve (not a fixed exponential rate) specifically to avoid the
   *  late game becoming punishing — differences shrink as the game
   *  progresses, giving a clear sense of "investments are getting
   *  larger" without an impossible endgame. This is what generated
   *  every business's baseProfitPerMin in districtBusinesses.ts;
   *  regenerating from this array requires re-running that derivation,
   *  it isn't read live at runtime. */
  districtPaybackMultiplier: [1.00, 1.06, 1.12, 1.18, 1.24, 1.29, 1.33, 1.36, 1.38, 1.40],

  /** ARCHITECTURE — locked. Target payback time (in minutes) for each of
   *  the 8 business positions within any district, before the district
   *  multiplier above is applied. Replaces the old, uniform ~40-50
   *  minute payback across every single business regardless of price —
   *  confirmed via audit to be the actual root cause of the runaway
   *  economy (every business paying back at nearly the same rate meant
   *  the player kept every previous business's income forever, so each
   *  purchase proportionally accelerated every future one, forever).
   *  Also creates genuine within-district strategy: the cheap early
   *  positions are fast, meaningful purchases; the expensive late
   *  positions are real, deliberate investments. */
  positionPaybackMinutes: [45, 55, 70, 90, 120, 160, 220, 300],

  /** The time window that counts toward the Profit pool — 4 hours.
   *  Previously duplicated separately in App.tsx and PortfolioScreen.tsx,
   *  which is exactly how they drifted out of sync (180 vs 240) in the
   *  first place. Both now import this single value instead. */
  poolCapMinutes: 240,

  /** PLAYTEST PARAMETER — a reasonable starting point, not a
   *  mathematically proven optimum. Replaces a flat ₹55 Lakh ceiling
   *  (which became trivially easy to hit within minutes in later
   *  districts, as profitPerMin compounded) with a percentage of the
   *  player's CURRENT district's total cost instead. Simulation
   *  confirmed the range 6-10% all produce a broadly similar,
   *  reasonable experience — real player variance (missed claims,
   *  sleep, forgetting, inefficient buying) is larger than the
   *  difference between these values, so 8% (the middle of the tested
   *  range) is the deliberate starting choice, kept adjustable after
   *  real playtesting rather than something to keep re-simulating. */
  poolCeilingRatio: 0.08,

  /** Minimum time between pool claims — a genuine cooldown, not just
   *  the double-claim's own short cooldown. Verified via simulation to
   *  comfortably allow 5+ claims across a 12-hour active day (covering
   *  the 5 daily double-claim/ad-watch opportunities) while meaningfully
   *  slowing overall pacing, which the ceiling alone could not do once
   *  profitPerMin grew large. */
  poolClaimCooldownMinutes: 120,

  /** Double-claim ("watch an ad to double it") is capped at this many
   *  uses per day and gives this bonus percentage — reduced from
   *  unlimited uses at +100% specifically because unlimited doubling
   *  was found (via real player data) to be a major contributor to
   *  runaway economy growth. */
  doubleClaimCapPerDay: 5,
  doubleClaimBonusPercent: 0.5,

  /** Manual control for the points leaderboard, which now runs forever
   *  with no automatic reset (replacing the old weekly Monday reset +
   *  Sunday freeze). Bump this number and redeploy to reset every
   *  player's points to zero — e.g. for a fresh "Season 2" — without
   *  needing to touch Firestore by hand. Kept invisible to players for
   *  now; purely a background mechanism for manual control. */
  pointsSeasonId: 1,

  /** Both the referrer and the new signup get this many coins when a
   *  referral completes — a flat, one-time grant, deliberately not
   *  tied to the pool/economy we spent so long balancing, so it can't
   *  disturb that pacing. */
  referralBonusCoins: 2000,
  /** How many referral bonuses one player can RECEIVE as a referrer
   *  per day — capped to prevent unlimited farming via repeated
   *  signups, even though the reward triggers on signup alone rather
   *  than a real engagement milestone (an accepted tradeoff for a
   *  small, trusted testing group, not a production-grade anti-fraud
   *  system). */
  dailyReferralCap: 10,
};

/** A deliberate, one-time economy reset — every business's costs and
 *  income were fundamentally re-architected (fixed 6-level tables with
 *  cross-business synergies, replacing the old uncapped, continuous
 *  growth formula) and rescaled by 1.9x. A save (local device storage
 *  OR cloud) written under a version below this number is treated as
 *  fundamentally incompatible — its levels and prices don't correspond
 *  to anything in the new system — and is ignored entirely rather than
 *  partially restored, exactly like "no save exists at all" for a
 *  genuinely new device. This forces a full, automatic reset across
 *  every existing player without needing to reach each device or
 *  account by hand. Bump this again for any future change severe enough
 *  to warrant the same treatment.*/
export const CURRENT_SAVE_VERSION = 2;
