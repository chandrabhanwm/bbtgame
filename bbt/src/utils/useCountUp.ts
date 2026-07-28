import { useEffect, useRef, useState } from 'react';

/**
 * Animates a displayed number smoothly toward `value` whenever it changes,
 * instead of snapping instantly. Small changes (e.g. the per-second passive
 * tick) animate fast; big jumps (a purchase, a collected reward) animate
 * slightly slower so the player can actually see the number move.
 */
export function useCountUp(value: number, options?: { minDurationMs?: number; maxDurationMs?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const minDuration = options?.minDurationMs ?? 220;
  const maxDuration = options?.maxDurationMs ?? 700;

  useEffect(() => {
    const from = fromRef.current;
    const delta = value - from;
    if (Math.abs(delta) < 0.01) {
      setDisplayValue(value);
      return;
    }

    // Bigger jumps get a slightly longer, more visible count-up.
    const magnitude = Math.min(1, Math.abs(delta) / Math.max(1, Math.abs(from)));
    const duration = minDuration + magnitude * (maxDuration - minDuration);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + delta * eased;
      setDisplayValue(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return displayValue;
}
