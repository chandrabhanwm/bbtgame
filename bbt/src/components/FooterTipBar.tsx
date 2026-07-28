import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp } from 'lucide-react';

const GOLD = 'var(--color-premium-gold-400)';
const FALLBACK_MESSAGE = 'Upgrade businesses to increase income and unlock more opportunities!';
const ROTATE_MS = 4500;

interface FooterTipBarProps {
  /** Most recent events first, capped at 5 by the caller. In-memory only
   *  — this ticker is deliberately not an achievement log or a saved
   *  activity history, just a living reflection of what just happened
   *  this session. Empty (or omitted) falls back to the original tip. */
  newsEvents?: string[];
}

/**
 * Business News — a rotating strip at the bottom of the business grid,
 * cycling through recent events (or the original static tip when there
 * are none yet) every ~4.5 seconds. Same visual shell as before,
 * including the decorative skyline, just with rotating content instead
 * of one fixed sentence.
 */
export const FooterTipBar: React.FC<FooterTipBarProps> = ({ newsEvents = [] }) => {
  const [index, setIndex] = useState(0);
  const messages = newsEvents.length > 0 ? newsEvents : [FALLBACK_MESSAGE];

  useEffect(() => {
    setIndex(0); // if the list changes (a new event pushed in), start from the newest
  }, [newsEvents.length]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="w-full glossy-3d rounded-2xl px-3.5 py-3 relative overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1.5">
        <TrendingUp size={13} color={GOLD} className="flex-shrink-0" />
        <span className="text-[11px] font-bold" style={{ color: 'var(--color-premium-text)' }}>Business News</span>
      </div>

      <div className="relative z-10 flex-1 min-w-0 h-[16px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 text-[11px] font-medium leading-snug truncate"
            style={{ color: 'var(--color-premium-text-secondary)' }}
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Decorative skyline silhouette, right side — thin gold line art,
          low opacity, purely visual */}
      <svg
        viewBox="0 0 160 60"
        className="absolute right-0 bottom-0 h-[60%] w-[40%] pointer-events-none"
        style={{ opacity: 0.14 }}
        preserveAspectRatio="xMaxYMax meet"
      >
        <g fill="none" stroke={GOLD} strokeWidth="1.5">
          <rect x="4" y="30" width="14" height="30" />
          <rect x="20" y="18" width="12" height="42" />
          <rect x="34" y="36" width="10" height="24" />
          <line x1="39" y1="36" x2="39" y2="24" />
          <rect x="46" y="10" width="16" height="50" />
          <line x1="54" y1="10" x2="54" y2="2" />
          <rect x="64" y="26" width="12" height="34" />
          <rect x="78" y="40" width="10" height="20" />
          <rect x="90" y="14" width="14" height="46" />
          <rect x="106" y="32" width="12" height="28" />
          <rect x="120" y="22" width="10" height="38" />
          <rect x="132" y="38" width="12" height="22" />
          <rect x="146" y="16" width="10" height="44" />
          <line x1="151" y1="16" x2="151" y2="6" />
        </g>
      </svg>
    </div>
  );
};
