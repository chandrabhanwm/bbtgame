import { DailyGoal, Business } from '../types';
import { getDistrictProgress } from './districtProgress';

const GOAL_REWARD = 1500; // flat, guaranteed, no ad — a genuine free daily win

/**
 * Picks one of the 4 goal types at random. "reach_completion" specifically
 * re-rolls if the current district is already at 90%+ completion — a
 * target only 5-10% away isn't really a goal, it's already basically done.
 */
export function generateDailyGoal(currentDistrictId: string, businessesByDistrict: Record<string, Business[]>): DailyGoal {
  const currentCompletion = getDistrictProgress(businessesByDistrict[currentDistrictId] ?? []).completionPercent;
  const canOfferCompletionGoal = currentCompletion < 90;

  const types: DailyGoal['type'][] = canOfferCompletionGoal
    ? ['upgrade_2', 'buy_1', 'collect_pool_2', 'reach_completion']
    : ['upgrade_2', 'buy_1', 'collect_pool_2'];

  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'reach_completion') {
    return {
      type,
      target: Math.min(100, currentCompletion + 15),
      districtId: currentDistrictId,
      progressCount: 0,
      claimed: false,
      rewardAmount: GOAL_REWARD,
    };
  }

  const target = type === 'collect_pool_2' ? 2 : type === 'upgrade_2' ? 2 : 1; // buy_1 = 1
  return { type, target, progressCount: 0, claimed: false, rewardAmount: GOAL_REWARD };
}

/** Whether the goal's condition is currently met — checked live against
 *  current game state, not cached, so it's always correct even if
 *  something changes the underlying data between renders. */
export function isDailyGoalComplete(goal: DailyGoal, businessesByDistrict: Record<string, Business[]>): boolean {
  if (goal.type === 'reach_completion') {
    const progress = getDistrictProgress(businessesByDistrict[goal.districtId ?? ''] ?? []);
    return progress.completionPercent >= goal.target;
  }
  return goal.progressCount >= goal.target;
}

/** Display text and a short progress fraction string, computed fresh —
 *  never stored, so it can't go stale relative to the goal's real state. */
export function getDailyGoalDisplay(goal: DailyGoal, businessesByDistrict: Record<string, Business[]>, districtName?: string): { label: string; progressText: string } {
  switch (goal.type) {
    case 'upgrade_2':
      return { label: 'Upgrade any 2 businesses today', progressText: `${Math.min(goal.progressCount, goal.target)}/${goal.target}` };
    case 'buy_1':
      return { label: 'Buy 1 new business today', progressText: `${Math.min(goal.progressCount, goal.target)}/${goal.target}` };
    case 'collect_pool_2':
      return { label: 'Collect your Profit 2 times today', progressText: `${Math.min(goal.progressCount, goal.target)}/${goal.target}` };
    case 'reach_completion': {
      const progress = getDistrictProgress(businessesByDistrict[goal.districtId ?? ''] ?? []);
      return {
        label: `Reach ${goal.target}% completion in ${districtName ?? 'your district'}`,
        progressText: `${Math.min(progress.completionPercent, goal.target)}%/${goal.target}%`,
      };
    }
  }
}
