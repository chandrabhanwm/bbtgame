export interface PrestigeBadge {
  /** Player level required to hold this badge — the single global level
   *  (stats.level), not a business or district level. Deliberately
   *  spaced out increasingly further apart at higher tiers, since the
   *  underlying XP curve (×1.5 per level) already makes each level
   *  exponentially harder to reach — a badge system on a linear stat
   *  would feel arbitrary; on this stat, "further apart" mirrors "harder
   *  to earn," which is what makes the top tiers feel like real prestige
   *  rather than just another number. */
  level: number;
  icon: string;
  name: string;
}

/** Ordered low -> high. Every other piece of the prestige system
 *  (Header badge, Leaderboard badge, the unlock celebration, and the
 *  Prestige trophy-case screen) reads from this single list — change a
 *  threshold or add a tier here and it's consistent everywhere. */
export const PRESTIGE_BADGES: PrestigeBadge[] = [
  { level: 5, icon: '⚜️', name: 'Elite' },
  { level: 10, icon: '👑', name: 'District Lord' },
  { level: 15, icon: '🦁', name: 'Business Lion' },
  { level: 20, icon: '💰', name: 'Wealth Baron' },
  { level: 25, icon: '🔱', name: 'Empire Builder' },
  { level: 30, icon: '💠', name: 'Master Tycoon' },
  { level: 40, icon: '🏛️', name: 'Magnate' },
  { level: 50, icon: '🛡️', name: 'The Governor' },
  { level: 65, icon: '🏆', name: 'Grand Champion' },
  { level: 80, icon: '💎', name: 'Diamond Tycoon' },
  { level: 100, icon: '💎', name: 'Platinum Elite' },
  { level: 125, icon: '🥇', name: 'Supreme Champion' },
  { level: 150, icon: '🔥', name: 'The Dominant' },
  { level: 200, icon: '👑', name: 'Maharaja' },
  { level: 250, icon: '👑', name: 'The Legend' },
];

/** The highest badge a player at this level has actually earned, or
 *  null if they're below level 5 (no badge yet — level 1-4 is
 *  deliberately badge-free, so the very first one still feels like
 *  reaching something rather than starting with a freebie). */
export function getCurrentPrestigeBadge(level: number): PrestigeBadge | null {
  let current: PrestigeBadge | null = null;
  for (const badge of PRESTIGE_BADGES) {
    if (level >= badge.level) current = badge;
    else break;
  }
  return current;
}

/** The next badge still ahead of this level, or null if they're already
 *  past The Legend (the top tier) — used by the trophy-case screen to
 *  show "X levels to go" on the next locked badge. */
export function getNextPrestigeBadge(level: number): PrestigeBadge | null {
  return PRESTIGE_BADGES.find((b) => b.level > level) ?? null;
}
