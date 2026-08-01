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

/** Compact label for inside the small ring itself — "1h 59m" or "45m"
 *  once minutes or hours are involved (no room for seconds at this
 *  size), or the bare seconds count once under a minute, matching how
 *  a real clock reads at a glance rather than showing every digit. */
function compactClockLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${s}s`;
}

/**
 * A real, visibly-draining circular countdown — not a static line of
 * text. The ring empties smoothly as secondsRemaining ticks down, and
 * the label in the center updates every second. Previously showed the
 * raw seconds count regardless of scale — fine for a 60-second
 * double-claim cooldown, but unreadable for the 2-hour pool cooldown
 * (a number like "7182" crammed into a 72px circle). Now shows a
 * genuine clock-style label instead, scaling to whichever unit
 * actually fits.
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
        style={{ fontSize: size * (compactClockLabel(secondsRemaining).length > 3 ? 0.22 : 0.32), color: 'var(--color-premium-text)' }}
      >
        {compactClockLabel(secondsRemaining)}
      </span>
    </div>
  );
};
