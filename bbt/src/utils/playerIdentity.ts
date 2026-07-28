/**
 * A stable, display-only "Player ID" derived from the player's name. Not
 * persisted, not game logic — just a render-time label.
 *
 * This is the shared home for logic that used to be duplicated separately
 * in Header.tsx and the old ProfileTab.tsx (now replaced by
 * PortfolioScreen.tsx, which correctly imports from here rather than
 * keeping its own copy). Header.tsx is still frozen and was left with its
 * own inline copy rather than being edited just to import this (a request
 * explicitly deferred by design). Any *new* component needing a player ID
 * should import from here instead of adding another copy.
 */
export function derivePlayerId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const digits = 100000 + (hash % 900000);
  return `BST-${digits}`;
}
