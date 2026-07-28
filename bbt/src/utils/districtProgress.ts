import { Business } from '../types';
import { progressionConfig } from '../config/progressionConfig';
import { calculateTieredProfit } from './profitCurve';

/**
 * All district-progress numbers (income, completion, stars, level) are
 * derived on the fly from a district's Business[] rather than stored as
 * separate persisted fields. Business[] is already persisted per district,
 * so this avoids a second source of truth that could drift out of sync —
 * these functions are the only place this math lives.
 */

export function getDistrictIncome(businesses: Business[]): number {
  return businesses.reduce((sum, b) => {
    if (b.level === 0) return sum;
    return sum + calculateTieredProfit(b.baseProfitPerMin, b.level);
  }, 0);
}

/** What a district could earn if every business were purchased once (but
 *  not further upgraded) — used by the locked-district preview to answer
 *  "what am I unlocking?" before anything has actually been bought. */
export function getDistrictPotentialIncome(businesses: Business[]): number {
  return businesses.reduce((sum, b) => sum + b.baseProfitPerMin, 0);
}

/** Sum of every business's baseCost — the true cost of building out this
 *  entire district from scratch, regardless of what's actually been
 *  bought so far. Used to scale the completion reward to the district's
 *  real expense instead of paying a flat amount everywhere. */
export function getDistrictTotalBuildoutCost(businesses: Business[]): number {
  return businesses.reduce((sum, b) => sum + b.baseCost, 0);
}

/** The actual completion reward for a district — a percentage
 *  (progressionConfig.completionRewardPercent) of its total buildout
 *  cost, so an expensive district's completion pays proportionally more
 *  than a cheap one's, instead of every district paying the same flat
 *  amount regardless of how much it actually cost to build out. */
export function getDistrictCompletionReward(businesses: Business[]): number {
  return Math.round(getDistrictTotalBuildoutCost(businesses) * progressionConfig.completionRewardPercent);
}

export function getDistrictBusinessesOwned(businesses: Business[]): number {
  return businesses.filter((b) => b.level > 0).length;
}

export function getDistrictCompletionPercent(businesses: Business[]): number {
  if (businesses.length === 0) return 0;
  const owned = getDistrictBusinessesOwned(businesses);
  return Math.round((owned / businesses.length) * 100);
}

/**
 * Completion rule is read from progressionConfig.completionRule, not
 * hardcoded — 'all_purchased' (default, matches prior slice's behavior
 * exactly) or 'all_maxed' (every business at its maxLevel; see the config
 * file for why this is currently unreachable in practice).
 */
export function isDistrictCompleted(businesses: Business[]): boolean {
  if (businesses.length === 0) return false;
  if (progressionConfig.completionRule === 'all_maxed') {
    return businesses.every((b) => b.maxLevel !== undefined && b.level >= b.maxLevel);
  }
  return businesses.every((b) => b.level > 0);
}

/** One star per progressionConfig.starThresholdPercent of completion,
 *  capped at progressionConfig.maxStars — both configurable, not hardcoded. */
export function getDistrictStars(businesses: Business[]): number {
  if (businesses.length === 0) return progressionConfig.defaultStars;
  const pct = getDistrictCompletionPercent(businesses);
  return Math.min(progressionConfig.maxStars, Math.floor(pct / progressionConfig.starThresholdPercent));
}

/** District Level: sum of every business's level in the district — a
 *  depth-of-investment metric distinct from "businesses owned" (a count). */
export function getDistrictLevel(businesses: Business[]): number {
  return businesses.reduce((sum, b) => sum + b.level, 0);
}

export interface DistrictProgressSummary {
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  completed: boolean;
  stars: number;
  districtLevel: number;
}

export function getDistrictProgress(businesses: Business[]): DistrictProgressSummary {
  return {
    income: getDistrictIncome(businesses),
    businessesOwned: getDistrictBusinessesOwned(businesses),
    businessesTotal: businesses.length,
    completionPercent: getDistrictCompletionPercent(businesses),
    completed: isDistrictCompleted(businesses),
    stars: getDistrictStars(businesses),
    districtLevel: getDistrictLevel(businesses),
  };
}

/** Total amount actually spent buying and upgrading a single business —
 *  the sum of every level-up's cost paid so far, computed with the exact
 *  same rounding App.tsx's handleUpgrade uses per level, so this always
 *  matches what really left the player's cash balance. A level-0 (never
 *  purchased) business contributes 0. */
export function getBusinessTotalInvested(business: Business): number {
  let total = 0;
  for (let lvl = 1; lvl <= business.level; lvl++) {
    total += Math.round(business.baseCost * Math.pow(business.costMultiplier, lvl));
  }
  return total;
}

/** Same, summed across every business in every district — the "invested"
 *  half of Net Worth (cash + this). */
export function getEmpireTotalInvested(businessesByDistrict: Record<string, Business[]>): number {
  return Object.values(businessesByDistrict).reduce((grandTotal, districtBusinesses) => {
    return grandTotal + districtBusinesses.reduce((sum, b) => sum + getBusinessTotalInvested(b), 0);
  }, 0);
}
