import { Business, SynergyRule } from '../types';
import { strategyLayerLevels, strategyLayerSynergies, StrategyLevelData } from '../data/strategyLayerData';

/** True for any district that uses the new fixed-6-level + synergy system
 *  (currently all 10 districts) — false would mean "use the legacy
 *  continuous growth-factor formula instead," kept as an escape hatch
 *  rather than assuming every district always uses this system. */
export function districtUsesStrategyLayer(districtId: string): boolean {
  return districtId in strategyLayerLevels;
}

export function getStrategyLevelData(districtId: string, businessId: string): StrategyLevelData | null {
  const levels = strategyLayerLevels[districtId];
  if (!levels) return null;
  return levels.find(l => l.id === businessId) ?? null;
}

export function getSynergyRules(districtId: string): SynergyRule[] {
  return strategyLayerSynergies[districtId] ?? [];
}

/** The actual cost to go from a business's current level to the next one.
 *  Returns null if already at max level (6) — the "Upgrade" button should
 *  be hidden/disabled in that case, not shown with a cost of 0. */
export function getNextLevelCost(districtId: string, businessId: string, currentLevel: number): number | null {
  const data = getStrategyLevelData(districtId, businessId);
  if (!data) return null;
  if (currentLevel <= 0) return data.buyCost;
  if (currentLevel >= 6) return null;
  return data.upgradeCosts[currentLevel - 1];
}

/** Raw income at a given level, BEFORE any synergy bonus is applied.
 *  Returns 0 for level 0 (not owned). */
export function getBaseIncomeAtLevel(districtId: string, businessId: string, level: number): number {
  if (level <= 0) return 0;
  const data = getStrategyLevelData(districtId, businessId);
  if (!data) return 0;
  return data.income[Math.min(level, 6) - 1];
}

/** Every synergy currently ACTIVE on a given business, given which
 *  businesses in the district are owned right now (level >= 1). Used
 *  both for the actual income calculation and for the UI badge showing
 *  "which bonuses are active on this card right now." */
export function getActiveSynergiesFor(districtId: string, businessId: string, ownedIds: Set<string>): SynergyRule[] {
  const rules = getSynergyRules(districtId);
  return rules.filter(r => r.targetId === businessId && r.requiresIds.every(id => ownedIds.has(id)));
}

/** Every synergy this business would newly activate FOR OTHER BUSINESSES
 *  if it were owned right now (used for the "buying this unlocks N
 *  bonuses elsewhere" preview — critical per the UI requirement that a
 *  hidden synergy system teaches a player nothing). Excludes synergies
 *  already active without this business (i.e. only genuinely NEW ones). */
export function getSynergiesUnlockedByOwning(districtId: string, businessId: string, ownedIds: Set<string>): SynergyRule[] {
  const rules = getSynergyRules(districtId);
  return rules.filter(r => {
    if (!r.requiresIds.includes(businessId)) return false;
    const alreadyActive = r.requiresIds.every(id => ownedIds.has(id));
    if (alreadyActive) return false; // already active some other way, not "newly unlocked"
    const wouldBeActive = r.requiresIds.every(id => id === businessId || ownedIds.has(id));
    return wouldBeActive;
  });
}

/** The final, synergy-adjusted profitPerMin for one business, given its
 *  current level and which businesses in the district are owned. This is
 *  always a DERIVED value — never stored statically — since buying a
 *  different business in the district can change this number without
 *  this business itself changing level at all. */
export function computeSynergyAdjustedProfit(districtId: string, businessId: string, level: number, ownedIds: Set<string>): number {
  const base = getBaseIncomeAtLevel(districtId, businessId, level);
  if (base === 0) return 0;
  const activeSynergies = getActiveSynergiesFor(districtId, businessId, ownedIds);
  const totalBonus = activeSynergies.reduce((sum, s) => sum + s.bonusPercent, 0);
  return Math.floor(base * (1 + totalBonus));
}

/** Recomputes profitPerMin for EVERY business in a district — call this
 *  after any purchase/upgrade anywhere in the district, since a single
 *  new purchase can change the active synergies (and therefore the
 *  income) of businesses that didn't themselves change level. */
export function recomputeDistrictProfits(districtId: string, businesses: Business[]): Business[] {
  const ownedIds = new Set(businesses.filter(b => b.level > 0).map(b => b.id));
  return businesses.map(b => {
    if (!districtUsesStrategyLayer(districtId)) return b; // legacy formula untouched
    const data = getStrategyLevelData(districtId, b.id);
    if (!data) return b;
    return { ...b, profitPerMin: computeSynergyAdjustedProfit(districtId, b.id, b.level, ownedIds) };
  });
}

/** Total cost to own every business in a district at Level 1 — used for
 *  the dynamic pool ceiling. Strategy-layer equivalent of the legacy
 *  getDistrictTotalCost, kept separate since it reads buyCost from the
 *  fixed level tables rather than baseCost/costMultiplier. */
export function getStrategyDistrictL1Cost(districtId: string): number {
  const levels = strategyLayerLevels[districtId];
  if (!levels) return 0;
  return levels.reduce((sum, l) => sum + l.buyCost, 0);
}
