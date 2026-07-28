/**
 * Legacy — the voluntary reset mechanic. Locked design, from the full
 * economy discussion:
 *
 * - The reward table (net worth -> Legacy Points) is GLOBAL and FIXED.
 *   It never changes, so players always know exactly what a given net
 *   worth is worth.
 * - What rises is the MINIMUM net worth required before the next reset
 *   is even allowed — indexed by legacyCount (how many times the player
 *   has already reset). First reset needs ₹50L, second needs ₹1Cr, third
 *   needs ₹2Cr, and so on, using this same table.
 * - The actual reward is looked up from the player's REAL net worth at
 *   the moment they choose to reset — which can be higher than the
 *   minimum required, if they waited longer.
 * - Legacy Points are permanent and cumulative, +1% global income each,
 *   applied as a flat multiplier on top of the tiered profit curve.
 */
export const LEGACY_MILESTONES = [
  { netWorth: 5000000, points: 5, label: '₹50 Lakh' },
  { netWorth: 10000000, points: 10, label: '₹1 Crore' },
  { netWorth: 20000000, points: 15, label: '₹2 Crore' },
  { netWorth: 50000000, points: 25, label: '₹5 Crore' },
  { netWorth: 100000000, points: 40, label: '₹10 Crore' },
  { netWorth: 200000000, points: 60, label: '₹20 Crore' },
];

export interface LegacyStatus {
  /** The minimum net worth required before resetting is allowed at all,
   *  for whichever reset number comes next. */
  minRequired: number;
  minRequiredLabel: string;
  /** Whether the player currently qualifies to reset right now. */
  eligible: boolean;
  /** How many Legacy Points resetting RIGHT NOW would actually award,
   *  based on real current net worth (may exceed the minimum tier if
   *  the player waited longer than they had to). */
  previewPoints: number;
}

export function getLegacyStatus(netWorth: number, legacyCount: number): LegacyStatus {
  const tierIndex = Math.min(legacyCount, LEGACY_MILESTONES.length - 1);
  const minTier = LEGACY_MILESTONES[tierIndex];

  let previewPoints = 0;
  for (const m of LEGACY_MILESTONES) {
    if (netWorth >= m.netWorth) previewPoints = m.points;
  }

  return {
    minRequired: minTier.netWorth,
    minRequiredLabel: minTier.label,
    eligible: netWorth >= minTier.netWorth,
    previewPoints,
  };
}

/** The permanent global income multiplier from accumulated Legacy Points —
 *  applied as a flat bonus on top of the tiered profit curve, e.g. 15
 *  points = a permanent +15% to all income, forever, surviving every
 *  future reset. */
export function getLegacyIncomeMultiplier(legacyPoints: number): number {
  return 1 + legacyPoints * 0.01;
}
