import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Share2, Check } from 'lucide-react';
import { playClick } from '../utils/audio';

interface ShareEarnCardProps {
  referrerUid: string;
  bonusCoins: number;
}

const GOLD = 'var(--color-premium-gold-400)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * Replaces the old Daily Goal card on Home. Each player's link is just
 * their own uid as a ?ref= query param — read on the new signup's
 * first load (see utils/referral.ts) and turned into a referral record
 * the moment that signup is confirmed genuinely new. Uses the native
 * share sheet (navigator.share) where the platform supports it — real
 * iOS/Android PWA installs do — falling back to copy-to-clipboard
 * everywhere else (most desktop browsers).
 */
export const ShareEarnCard: React.FC<ShareEarnCardProps> = ({ referrerUid, bonusCoins }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}?ref=${referrerUid}`;
  const shareMessage = `Join me on CoralBay Business Tycoon! We both get ₹${bonusCoins.toLocaleString('en-IN')} when you sign up: ${referralLink}`;

  const handleShare = async () => {
    playClick();
    if (navigator.share) {
      try {
        await navigator.share({ text: shareMessage });
      } catch {
        // User cancelled the share sheet — not an error, nothing to do.
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard access denied — rare, silently do nothing rather
        // than show a confusing error for something this minor.
      }
    }
  };

  return (
    <div className="glossy-3d rounded-xl px-3 py-2 flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: GOLD }}
      >
        <Gift size={13} color="var(--color-premium-text-inverse)" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
          Share &amp; Earn
        </div>
        <div className="text-[9px] font-semibold" style={{ color: TEXT_SECONDARY }}>
          You + your friend each get ₹{bonusCoins.toLocaleString('en-IN')}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer flex items-center gap-1"
        style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
      >
        {copied ? <><Check size={11} /> Copied</> : <><Share2 size={11} /> Share</>}
      </motion.button>
    </div>
  );
};
