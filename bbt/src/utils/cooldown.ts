export const CLAIM_COOLDOWN_MS = 60000; // 60 seconds — the confirmed cooldown after a double-claim or a scratch-card ad claim

/** Returns 0 if no cooldown is active (the action is allowed right now),
 *  or the number of whole seconds remaining until it is. `lastTimestamp`
 *  of 0 (never happened yet) always returns 0 — a player who has never
 *  triggered the cooldown-starting action isn't blocked by one. */
export function getCooldownRemainingSeconds(lastTimestamp: number, cooldownMs: number = CLAIM_COOLDOWN_MS): number {
  if (!lastTimestamp) return 0;
  const elapsed = Date.now() - lastTimestamp;
  const remaining = cooldownMs - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/** Formats a countdown as a real clock — "1h 59m 00s", "45m 12s", or
 *  just "38s" once under a minute — rather than a raw second count,
 *  which reads as confusing/broken for anything longer than a minute
 *  or two (the new 2-hour pool cooldown in particular). Omits any
 *  leading unit that's zero, so a short cooldown doesn't show "0h 0m 38s". */
export function formatCooldownClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}
