/**
 * THEME — semantic layer on top of tokens.ts
 * ============================================================
 * tokens.ts defines *what the values are*. This file defines *what they
 * mean* for a given kind of component — a Business Card's background, a
 * Danger button's text color, a Locked badge's border. Every future
 * component should consume THIS file (or the CSS variables it mirrors,
 * see premium-theme.css), not raw hex codes, and not tokens.ts directly
 * unless it's inventing a genuinely new component category.
 */

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from './tokens';

// ---------------------------------------------------------------------
// 6. BUTTON SYSTEM
// ---------------------------------------------------------------------
export const buttonTheme = {
  primary: {
    background: `linear-gradient(180deg, ${colorTokens.gold[100]} 0%, ${colorTokens.gold[400]} 100%)`,
    text: colorTokens.text.inverse,
    border: colorTokens.gold[600],
    shadow: shadowTokens.button,
  },
  secondary: {
    background: colorTokens.background.elevated,
    text: colorTokens.text.primary,
    border: colorTokens.border.default,
    shadow: shadowTokens.button,
  },
  danger: {
    background: colorTokens.error[600],
    text: colorTokens.text.primary,
    border: colorTokens.error[400],
    shadow: shadowTokens.button,
  },
  disabled: {
    background: colorTokens.background.surface,
    text: colorTokens.text.disabled,
    border: colorTokens.border.subtle,
    shadow: 'none',
  },
  icon: {
    background: colorTokens.background.elevated,
    text: colorTokens.text.secondary,
    border: colorTokens.border.default,
    size: 40, // px, square/circular icon button footprint
  },
  floating: {
    background: `linear-gradient(180deg, ${colorTokens.gold[100]} 0%, ${colorTokens.gold[400]} 100%)`,
    text: colorTokens.text.inverse,
    border: colorTokens.gold[600],
    shadow: shadowTokens.floating,
  },
  states: {
    hover: { overlay: colorTokens.state.hoverOverlay, shadow: shadowTokens.hover },
    pressed: { overlay: colorTokens.state.pressedOverlay, shadow: shadowTokens.pressed, transform: 'scale(0.97)' },
    loading: { opacity: 0.6, cursor: 'wait' },
  },
  radius: radiusTokens.button,
  padding: `${spacingTokens.sm}px ${spacingTokens.lg}px`,
  typography: typographyTokens.button,
} as const;

// ---------------------------------------------------------------------
// 7. CARD SYSTEM
// ---------------------------------------------------------------------
const cardBase = {
  radius: radiusTokens.card,
  border: colorTokens.border.default,
  shadow: shadowTokens.card,
};

export const cardTheme = {
  information: {
    ...cardBase,
    background: colorTokens.background.surface,
    padding: spacingTokens.lg,
  },
  business: {
    ...cardBase,
    background: colorTokens.background.surface,
    border: colorTokens.border.default,
    padding: spacingTokens.md,
    shadow: shadowTokens.card,
  },
  district: {
    ...cardBase,
    background: colorTokens.background.elevated,
    border: colorTokens.gold[600],
    padding: spacingTokens.lg,
    shadow: shadowTokens.floating,
  },
  reward: {
    ...cardBase,
    background: colorTokens.background.elevated,
    border: colorTokens.gold[400],
    padding: spacingTokens.xl,
    shadow: shadowTokens.glowGold,
  },
  popup: {
    ...cardBase,
    radius: radiusTokens.dialog,
    background: colorTokens.background.overlay,
    border: colorTokens.border.strong,
    padding: spacingTokens['2xl'],
    shadow: shadowTokens.dialog,
  },
} as const;

// ---------------------------------------------------------------------
// 9. BADGE SYSTEM
// ---------------------------------------------------------------------
export const badgeTheme = {
  // Owned businesses show a solid green "LEVEL X" pill in the approved
  // design — not a gold-bordered chip. Money-adjacent status (owned,
  // active) reads as green throughout, consistent with rule 12.
  level: {
    background: colorTokens.badge.green,
    text: colorTokens.text.primary,
    border: colorTokens.badge.green,
  },
  // Locked businesses show their buy price as a solid blue pill.
  price: {
    background: colorTokens.badge.blue,
    text: colorTokens.text.primary,
    border: colorTokens.badge.blue,
  },
  income: {
    background: colorTokens.background.elevated,
    text: colorTokens.success[500], // money is always green, per rule 12
    border: colorTokens.success[700],
  },
  category: {
    background: 'transparent',
    text: colorTokens.text.secondary,
    border: colorTokens.border.subtle,
  },
  locked: {
    background: colorTokens.background.base,
    text: colorTokens.text.disabled,
    border: colorTokens.border.subtle,
  },
  comingSoon: {
    background: colorTokens.background.base,
    text: colorTokens.gold[100],
    border: colorTokens.gold[600],
  },
  radius: radiusTokens.pill,
  padding: `${spacingTokens.xs}px ${spacingTokens.sm}px`,
  typography: typographyTokens.label,
} as const;

/**
 * Business category badge colors — a bounded, reused set (six colors),
 * keyed by category name rather than hardcoded per business. This is what
 * businessCategoryPresentation.ts (the id -> category mapping) reads its
 * colors from, so category colors live in exactly one place.
 */
export const categoryBadgeTheme = {
  'FOOD & BEVERAGE': { background: colorTokens.badge.brown, text: colorTokens.badge.textCream },
  'RESTAURANT': { background: colorTokens.badge.red, text: colorTokens.text.primary },
  'GROCERY': { background: colorTokens.badge.blue, text: colorTokens.text.primary },
  'DAIRY': { background: colorTokens.badge.green, text: colorTokens.text.primary },
  'BAKERY': { background: colorTokens.badge.orange, text: colorTokens.text.primary },
  'AUTOMOTIVE': { background: colorTokens.badge.gray, text: colorTokens.text.primary },
  'HEALTHCARE': { background: colorTokens.badge.teal, text: colorTokens.text.primary },
  'EVENTS': { background: colorTokens.badge.purple, text: colorTokens.text.primary },
  'GENERAL': { background: colorTokens.badge.gray, text: colorTokens.text.primary },
} as const;

// ---------------------------------------------------------------------
// Rules (12) — encoded as guidance, not enforceable at compile time, but
// documented here so it travels with the theme rather than living only
// in a design doc someone has to remember to re-read.
// ---------------------------------------------------------------------
export const designRules = [
  'Gradients are the exception, not the default — reserve them for gold accents (buttons, premium badges), never backgrounds at large.',
  'Gold is for emphasis only: primary CTAs, active/selected states, premium badges. It is not a general accent to sprinkle around.',
  'Money is always green (success tokens) — never gold, never any other hue, in any component, ever.',
  'Cards stay dark (background/surface/elevated tokens) — no light-card variants in this system.',
  'Typography carries the hierarchy. Reach for a heavier weight or larger size before reaching for a border or a background change.',
  'Prefer whitespace (spacingTokens) over borders to separate adjacent content — a border is a fallback, not a default.',
  'Avoid visual clutter: a component should default to fewer decorative elements, not more.',
  'Every visual choice should read as "this cost more to make" — restraint over density.',
] as const;
