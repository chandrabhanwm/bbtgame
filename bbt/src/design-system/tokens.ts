/**
 * DESIGN TOKENS — Basti Business Tycoon, Premium Design System
 * ============================================================
 * Raw primitive values only. Nothing here knows about buttons, cards, or
 * any specific component — that mapping lives in theme.ts. This file is
 * the single source of truth every other part of the system reads from.
 *
 * Direction: luxury / executive / business-empire / premium.
 * Explicitly NOT: cartoon, toy, kids, candy, high-saturation-colorful.
 * This does not touch or replace the existing bright "toy" token system
 * in index.css — it is new, additive, and unused by any live screen
 * until a future redesign pass adopts it.
 */

/**
 * DESIGN TOKENS — Basti Business Tycoon, Premium Design System
 * ============================================================
 * Raw primitive values only. Nothing here knows about buttons, cards, or
 * any specific component — that mapping lives in theme.ts. This file is
 * the single source of truth every other part of the system reads from.
 *
 * Direction: luxury / executive / business-empire / premium.
 * Explicitly NOT: cartoon, toy, kids, candy, high-saturation-colorful.
 * This does not touch or replace the existing bright "toy" token system
 * in index.css — it is new, additive, and unused by any live screen
 * until a future redesign pass adopts it.
 *
 * Updated to match the approved pixel-reference Home Screen: every value
 * below is now the real, in-use color for Header, District Hero, Boost
 * strip, Business grid, Footer tip, and Bottom nav — there is exactly one
 * design system in this project, not two competing ones.
 */

export const colorTokens = {
  // Background layers — deep near-black, warm-neutral. Each step is a
  // little lighter, used for depth/elevation rather than borders alone.
  background: {
    base: '#0A0A0B', // page/canvas background, deepest layer
    surface: '#131110', // card surface — District Hero, Boost strip, grid cards, footer tip, bottom nav, header pills
    elevated: '#1C1913', // modal / inner-tile surface, one step up from surface
    overlay: '#1C1913', // dialog / modal surface
    track: '#2A2620', // empty progress bar / XP bar track
  },

  border: {
    subtle: 'rgba(212, 167, 44, 0.15)', // hairline dividers, icon-circle tints
    default: 'rgba(212, 167, 44, 0.25)', // secondary card border (bottom nav, grid cards, footer tip)
    strong: 'rgba(212, 167, 44, 0.45)', // primary card border (header pills, District Hero, boost strip, cash pill)
  },

  // Gold is the ONE accent color and is used heavily in this approved
  // design (borders, active states, primary text emphasis) — still never
  // used as a full background wash.
  gold: {
    100: '#F0C24B', // brightest — the cash-balance hero number specifically
    400: '#D4A72C', // primary gold — text, icons, active nav pill, borders
    600: '#A8842A', // deep gold — pressed state, gradients
    glow: 'rgba(212, 167, 44, 0.18)',
  },

  // Money is ALWAYS green, per rule 12 — never gold, never any other hue.
  success: {
    300: '#6FE3A6',
    500: '#22C55E', // primary "money" green
    700: '#16803F',
    glow: 'rgba(34, 197, 94, 0.20)',
  },

  warning: {
    400: '#E0A458',
    600: '#B87F36',
  },

  error: {
    400: '#EF4444',
    600: '#C23636',
  },

  // Information — the one non-money, non-gold accent, used sparingly
  // (e.g. neutral status indicators) so the palette never exceeds three
  // accent colors total (gold, green, info).
  info: {
    400: '#60A5FA',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#9B9895', // muted warm gray — every secondary/muted label in the Home Screen
    disabled: '#5B626C',
    inverse: '#0A0A0B', // for text set on gold/light surfaces (e.g. active bottom-nav pill)
  },

  // Star rating's unfilled state — distinct from track/border since it's
  // an icon color, not a background or a border.
  starEmpty: '#4A4640',

  // Business/category badge colors — a bounded, reused set (not per-business
  // hardcoding): category chips and price/level pills draw from these same
  // six colors rather than each screen inventing its own.
  badge: {
    brown: '#8B5A2B', // Food & Beverage
    blue: '#2563EB', // Grocery / Mobile & Electronics / locked-price pill
    green: '#16A34A', // Dairy / Healthcare / owned-level pill
    orange: '#C2650B', // Bakery
    gray: '#4B5563', // Automotive / default / locked "coming soon"
    purple: '#7C3AED', // Events
    red: '#DC2626', // Restaurant (split from Food & Beverage, which stays brown for Tea Stall)
    teal: '#0D9488', // Healthcare (was sharing green with Dairy — a real collision, both appear in every district's grid together)
    textCream: '#F5E6C8', // text color used specifically on the brown badge for contrast
  },

  // District Hero banner overlay treatment (vignette + bottom fade so
  // overlaid name/subtitle text always stays legible over any artwork).
  overlay: {
    vignette: 'rgba(0, 0, 0, 0.4)',
    fade: 'rgba(10, 10, 11, 0.95)',
    scrim: 'rgba(10, 10, 11, 0.7)', // modal/sheet backdrop dimming
  },

  // Non-color interaction overlays, layered on top of any surface color
  // for hover/press feedback instead of swapping the base color outright.
  state: {
    hoverOverlay: 'rgba(255, 255, 255, 0.04)',
    pressedOverlay: 'rgba(0, 0, 0, 0.25)',
  },

  // Neutral elevation shadow — used for the soft "soft elevation" cue
  // under map nodes and similar elements. Deliberately not gold/green;
  // shadows read as neutral depth, not accent color.
  shadowNeutral: '#000000',
} as const;

export const fontFamily = {
  // ONE family for the whole system, per the brief. Sora: modern,
  // geometric-but-warm, wide weight range, reads premium/executive rather
  // than playful — used for everything from Display down to Caption.
  base: '"Sora", ui-sans-serif, system-ui, sans-serif',
} as const;

export interface TypographyStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform?: 'none' | 'uppercase';
}

export const typographyTokens: Record<string, TypographyStyle> = {
  display: { fontFamily: fontFamily.base, fontWeight: 700, fontSize: '32px', lineHeight: '1.1', letterSpacing: '-0.02em' },
  heading: { fontFamily: fontFamily.base, fontWeight: 700, fontSize: '24px', lineHeight: '1.2', letterSpacing: '-0.01em' },
  title: { fontFamily: fontFamily.base, fontWeight: 600, fontSize: '18px', lineHeight: '1.3', letterSpacing: '0em' },
  subtitle: { fontFamily: fontFamily.base, fontWeight: 500, fontSize: '14px', lineHeight: '1.4', letterSpacing: '0em' },
  body: { fontFamily: fontFamily.base, fontWeight: 400, fontSize: '14px', lineHeight: '1.6', letterSpacing: '0em' },
  caption: { fontFamily: fontFamily.base, fontWeight: 600, fontSize: '11px', lineHeight: '1.4', letterSpacing: '0.06em', textTransform: 'uppercase' },
  button: { fontFamily: fontFamily.base, fontWeight: 600, fontSize: '14px', lineHeight: '1', letterSpacing: '0.03em', textTransform: 'uppercase' },
  label: { fontFamily: fontFamily.base, fontWeight: 700, fontSize: '10px', lineHeight: '1.2', letterSpacing: '0.08em', textTransform: 'uppercase' },
  number: { fontFamily: fontFamily.base, fontWeight: 700, fontSize: '20px', lineHeight: '1', letterSpacing: '-0.01em' },
  money: { fontFamily: fontFamily.base, fontWeight: 700, fontSize: '22px', lineHeight: '1', letterSpacing: '-0.01em' },
};

/** Spacing scale — every future layout uses ONLY these values. */
export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radiusTokens = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  pill: '999px',
  // Semantic aliases so components don't have to know the raw scale
  card: '16px', // = lg
  dialog: '24px', // = xl
  button: '10px', // = md
} as const;

export const shadowTokens = {
  card: '0 1px 3px rgba(0, 0, 0, 0.28)',
  floating: '0 4px 16px rgba(0, 0, 0, 0.32)',
  dialog: '0 12px 32px rgba(0, 0, 0, 0.4)',
  button: '0 1px 2px rgba(0, 0, 0, 0.25)',
  hover: '0 2px 8px rgba(0, 0, 0, 0.3)',
  pressed: 'inset 0 1px 3px rgba(0, 0, 0, 0.35)',
  glowGold: `0 0 20px ${colorTokens.gold.glow}`,
  glowGreen: `0 0 18px ${colorTokens.success.glow}`,
} as const;

export const animationTokens = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    base: '220ms',
    slow: '350ms',
    deliberate: '500ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    // A restrained, premium "settle" curve — smooth arrival with no
    // cartoon-ish bounce/overshoot, used for card and dialog motion.
    premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  /** Named presets for the exact motions the brief calls out — duration
   *  + easing + the transform/property they apply to, in one place. */
  presets: {
    cardHover: { duration: '220ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)', transform: 'translateY(-2px)' },
    cardTap: { duration: '100ms', easing: 'cubic-bezier(0.4, 0, 1, 1)', transform: 'scale(0.98)' },
    buttonPress: { duration: '100ms', easing: 'cubic-bezier(0.4, 0, 1, 1)', transform: 'scale(0.96)' },
    moneyCounter: { duration: '500ms', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    progressBar: { duration: '350ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    fade: { duration: '220ms', easing: 'cubic-bezier(0, 0, 0.2, 1)' },
    popup: { duration: '350ms', easing: 'cubic-bezier(0.22, 1, 0.36, 1)', transform: 'translateY(12px) scale(0.98)' },
    toast: { duration: '220ms', easing: 'cubic-bezier(0, 0, 0.2, 1)', transform: 'translateY(8px)' },
  },
} as const;

export const iconTokens = {
  size: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  strokeWidth: 1.75, // one refined weight across the system — thinner
                      // than a cartoon icon set, not hairline-thin either
  color: {
    default: colorTokens.text.secondary,
    active: colorTokens.gold[400],
    money: colorTokens.success[500],
    onDark: colorTokens.text.primary,
  },
  gapToText: spacingTokens.sm, // 8px, standard icon-to-label spacing
} as const;
