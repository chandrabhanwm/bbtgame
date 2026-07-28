/**
 * Formats a cash amount the way Western tycoon-game UIs conventionally do:
 * full comma-grouped digits below 1 million, abbreviated to "X.XXM" / "X.XXB"
 * (with trailing zeros trimmed) at or above it. This keeps the string short
 * enough to never overflow a fixed-width header slot, no matter how large
 * the player's cash grows.
 *
 * Examples:
 *   142300      -> "$142,300"
 *   1245600     -> "$1.25M"
 *   82400000    -> "$82.4M"
 *   1528000000  -> "$1.53B"
 */
export function formatCash(amount: number): string {
  const value = Math.max(0, amount);

  if (value >= 1000000000) {
    const billions = Math.round((value / 1000000000) * 100) / 100;
    return `$${billions}B`;
  }

  if (value >= 1000000) {
    const millions = Math.round((value / 1000000) * 100) / 100;
    return `$${millions}M`;
  }

  return `$${Math.floor(value).toLocaleString('en-US')}`;
}
