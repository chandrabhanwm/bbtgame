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
};
