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
