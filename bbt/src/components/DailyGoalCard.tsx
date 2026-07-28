import React from 'react';
import { motion } from 'motion/react';
import { Target } from 'lucide-react';
import { DailyGoal, Business } from '../types';
import { isDailyGoalComplete, getDailyGoalDisplay } from '../utils/dailyGoal';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';
import { playClick } from '../utils/audio';

interface DailyGoalCardProps {
  goal: DailyGoal;
  businessesByDistrict: Record<string, Business[]>;
  districtName?: string;
  onClaim: () => void;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * Today's goal — one guaranteed, no-ad cash reward for a small in-session
 * task, distinct from the ad-gated pool claim and reward cards. Claim
 * button pattern matches the reward cards exactly, per the plan.
 */
export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ goal, businessesByDistrict, districtName, onClaim }) => {
  const complete = isDailyGoalComplete(goal, businessesByDistrict);
  const { label, progressText } = getDailyGoalDisplay(goal, businessesByDistrict, districtName);

  const handleClaim = () => {
    if (!complete || goal.claimed) return;
    playClick();
    onClaim();
  };

  return (
    <div className="glossy-3d rounded-xl px-3 py-2 flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: goal.claimed ? 'var(--color-premium-green-500)' : GOLD }}
      >
        <Target size={13} color="var(--color-premium-text-inverse)" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
          <span className="text-[8px] font-bold uppercase mr-1" style={{ color: TEXT_SECONDARY }}>Goal:</span>
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold" style={{ color: complete ? GREEN : TEXT_SECONDARY }}>
            {progressText}
          </span>
          {!goal.claimed && (
            <span className="flex items-center gap-0.5 text-[8.5px] font-semibold" style={{ color: GREEN }}>
              <CoinIcon className="w-2 h-2" premium />
              +{formatCash(goal.rewardAmount)}
            </span>
          )}
        </div>
      </div>

      {goal.claimed ? (
        <span className="text-[8.5px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: TEXT_SECONDARY }}>
          ✓ Claimed
        </span>
      ) : (
        <motion.button
          whileTap={complete ? { scale: 0.95 } : undefined}
          onClick={handleClaim}
          disabled={!complete}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
          style={{
            backgroundColor: complete ? GOLD : 'var(--color-premium-track)',
            color: complete ? 'var(--color-premium-text-inverse)' : TEXT_SECONDARY,
          }}
        >
          Claim
        </motion.button>
      )}
    </div>
  );
};
