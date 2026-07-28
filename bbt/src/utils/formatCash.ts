/**
 * Formats a cash amount the way Indian tycoon-game UIs conventionally do:
 * full comma-grouped digits below 1 crore, abbreviated to "X.XX Cr" (with
 * trailing zeros trimmed) at or above it. This keeps the string short
 * enough to never overflow a fixed-width header slot, no matter how large
 * the player's cash grows.
 *
 * Examples:
 *   142300      -> "₹1,42,300"
 *   1245600     -> "₹12,45,600"
 *   82400000    -> "₹8.24 Cr"
 *   1528000000  -> "₹152.8 Cr"
 */
export function formatCash(amount: number): string {
  const value = Math.max(0, amount);

  if (value >= 10000000) {
    const crores = Math.round((value / 10000000) * 100) / 100;
    return `₹${crores} Cr`;
  }

  return `₹${Math.floor(value).toLocaleString('en-IN')}`;
}
