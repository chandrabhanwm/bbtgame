import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2 } from 'lucide-react';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';
import { playClick } from '../utils/audio';
import { progressionConfig } from '../config/progressionConfig';
import { LiquidCTAButton } from './LiquidCTAButton';

interface ShareAndEarnCardProps {
  onShare: () => Promise<{ ok: boolean; reason?: 'cancelled' | 'unsupported' | 'error' }>;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * Share & Earn — replaces the Daily Goal card in the home tab's top
 * slot. Rewards coins for actually completing a native share (see
 * handleShareAndEarn), not just for tapping the button — so the button
 * itself stays enabled and repeatable rather than flipping to a
 * claimed/disabled state the way the daily goal card did.
 */
export const ShareAndEarnCard: React.FC<ShareAndEarnCardProps> = ({ onShare }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleTap = async () => {
    if (isSharing) return;
    playClick();
    setIsSharing(true);
    try {
      await onShare();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="glossy-3d rounded-xl px-3 py-2 flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: GOLD }}
      >
        <Share2 size={13} color="var(--color-premium-text-inverse)" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
          <span className="text-[8px] font-bold uppercase mr-1" style={{ color: TEXT_SECONDARY }}>
            Share:
          </span>
          Invite friends to Basti
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold" style={{ color: TEXT_SECONDARY }}>
            Every share earns you coins
          </span>
          <span className="flex items-center gap-0.5 text-[8.5px] font-semibold" style={{ color: GREEN }}>
            <CoinIcon className="w-2 h-2" premium />
            +{formatCash(progressionConfig.shareRewardAmount)}
          </span>
        </div>
      </div>

      <LiquidCTAButton
        onClick={handleTap}
        disabled={isSharing}
        roundedClassName="rounded-lg"
        className="flex-shrink-0 px-2.5 py-1.5 text-[10px]"
      >
        {isSharing ? '...' : 'Share'}
      </LiquidCTAButton>
    </div>
  );
};
