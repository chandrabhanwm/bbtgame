import React from 'react';
import { motion } from 'motion/react';

interface CountdownClockProps {
  /** Seconds remaining right now — the ring and number both derive from
   *  this plus totalSeconds, so the caller just needs to re-render this
   *  every second (a simple setInterval tick) for it to visibly drain. */
  secondsRemaining: number;
  totalSeconds: number;
  /** Diameter in pixels. Defaults to a size that reads clearly as "a
   *  clock," not a small decorative badge. */
  size?: number;
}

/**
 * A real, visibly-draining circular countdown — not a static line of
 * text. The ring empties smoothly as secondsRemaining ticks down, and
 * the number in the center updates every second, giving the "clock
 * running down to unlock" feeling directly, rather than describing it
 * in words.
 */
export const CountdownClock: React.FC<CountdownClockProps> = ({ secondsRemaining, totalSeconds, size = 64 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-premium-track)"
          strokeWidth={4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-premium-gold-400)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </svg>
      <span
        className="font-bold tabular-nums"
        style={{ fontSize: size * 0.32, color: 'var(--color-premium-text)' }}
      >
        {secondsRemaining}
      </span>
    </div>
  );
};
