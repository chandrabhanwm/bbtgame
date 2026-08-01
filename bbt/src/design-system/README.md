# Premium Design System

Foundation only. **Nothing in the live game currently uses this.** This is
the design system every *future* screen should be built against, per the
brief that created it — a full redesign pass adopts it screen by screen,
later, as a separate task.

Direction: luxury / executive / business-empire / premium.
Explicitly not: cartoon, toy, kids, candy, high-saturation-colorful.

This is intentionally a different visual language from the existing
bright "toy" system in `index.css` (marigold/money/parchment/ink tokens,
Baloo 2 font). That system is untouched and still powers every live
screen. The two are not meant to coexist in the same component — this one
replaces it wholesale in a future pass, not incrementally alongside it.

## Files

- `tokens.ts` — raw primitive values (color, type, spacing, radius,
  shadow, animation, icon). The single source of truth.
- `theme.ts` — semantic layer mapping tokens to component meaning
  (`buttonTheme.primary`, `cardTheme.business`, `badgeTheme.income`, etc.)
  plus the design rules below, encoded as a `designRules` array.
- `premium-theme.css` — the same tokens as real CSS custom properties and
  Tailwind utility classes, namespaced `premium-*` (e.g. `bg-premium-surface`,
  `text-premium-money`, `shadow-premium-glow-gold`) so nothing collides
  with the existing token names. Imported once, additively, at the top of
  `index.css` — defining these variables has zero visual effect until a
  component actually references them.
- `components/` — reference implementations (`PremiumButton`, `PremiumCard`,
  `PremiumBadge`) showing how each variant should actually be built. Not
  imported anywhere in the app yet.

## The 12 rules (from the brief, kept here so they travel with the system)

1. No gradients everywhere — use them sparingly, for gold accents only.
2. Gold is for emphasis only (primary CTAs, active states, premium
   badges) — not a general accent.
3. Money is always green. Never gold, never any other hue.
4. Cards remain dark — no light-card variant exists in this system.
5. Typography carries the hierarchy — reach for weight/size before a
   border or background change.
6. Whitespace separates content before borders do.
7. Avoid visual clutter — fewer decorative elements is the default.
8. Everything should feel expensive: restraint over density.

## How a future component should consume this

```tsx
import { PremiumCard, PremiumBadge } from '@/design-system';

<PremiumCard variant="business">
  <span className="text-premium-title">Chai Stall</span>
  <PremiumBadge variant="income">₹100/min</PremiumBadge>
</PremiumCard>
```

Or via the raw Tailwind utilities directly:

```tsx
<div className="bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] rounded-[var(--radius-premium-card)] p-[var(--spacing-premium-lg)] shadow-premium-card">
  ...
</div>
```

## What this does NOT do

- Does not touch `Header.tsx`, `StreetView.tsx`, `AreaCard.tsx`,
  `DistrictSummaryCard.tsx`, `ShopDetailSheet.tsx`, `CityMapScreen.tsx`,
  `DistrictNode.tsx`, or any other live screen/component.
- Does not touch any game logic, state, engine, or the existing
  `index.css` toy-theme tokens.
- Does not change anything the player currently sees.
