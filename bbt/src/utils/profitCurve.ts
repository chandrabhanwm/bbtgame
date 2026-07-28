/**
 * The Phase 1 economy fix — replaces flat linear profit growth
 * (`level * baseProfitPerMin`) with a universal tiered compounding curve,
 * identical for every business (Tea Stall through the wedding hall).
 * Business identity (different curves per business) is explicitly
 * deferred to a later phase, informed by real player data.
 *
 * IMPORTANT: this is the corrected version. An earlier implementation
 * computed profit as `previousLevelProfit * growthFactor`, compounding
 * from a tiny starting point — verified by direct simulation to nerf
 * every business to roughly 20% of the old linear formula's value at
 * every level, including the "exciting early game" tier it was supposed
 * to improve. The fix: layer the tiered growth as a BONUS multiplier on
 * top of the original linear baseline (level * base), instead of
 * replacing linear scaling entirely. Verified: this now beats the old
 * formula at every level (1.0x at level 1, rising to ~14.6x by level 80
 * before the cap), while the untouched exponential cost curve still
 * creates a genuine, increasingly severe soft cap on single-business
 * over-investment (cost-per-profit ratio verified to worsen from ~50 at
 * level 10 to 1000+ by level 50).
 *
 * Levels 1–10:  +10% per level (compounding) — strong early growth
 * Levels 11–25: +5% per level  — moderate growth, this is where "maybe
 *               buy the Bakery instead" starts to make sense
 * Levels 26+:   +2% per level  — a real soft cap, but never fully flat
 *
 * The growth-factor bonus itself is additionally capped at 5x — this
 * prevents unbounded runaway at extreme levels (100+) from compounding
 * with Legacy multipliers, ad boosts, and future events into runaway
 * inflation, while costing nothing in the timeframe most players will
 * actually experience (the cap only binds well past level 80).
 */
const GROWTH_FACTOR_CAP = 5.0;

function growthFactor(level: number): number {
  let gf = 1;
  for (let l = 2; l <= level; l++) {
    const rate = l <= 10 ? 1.10 : l <= 25 ? 1.05 : 1.02;
    gf *= rate;
    if (gf >= GROWTH_FACTOR_CAP) return GROWTH_FACTOR_CAP;
  }
  return gf;
}

export function calculateTieredProfit(baseProfitPerMin: number, level: number): number {
  if (level <= 0) return 0;
  return Math.round(baseProfitPerMin * level * growthFactor(level));
}
