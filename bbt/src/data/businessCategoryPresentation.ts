import { categoryBadgeTheme } from '../design-system/theme';

/**
 * Pure presentation mapping: business id -> category badge label. Colors
 * are no longer hardcoded here — they're looked up from categoryBadgeTheme
 * in the design system, so there is exactly one place badge colors live.
 *
 * This mapping itself is NOT part of the Business data model (types.ts /
 * districtBusinesses.ts) — it exists only so the business grid card can
 * show a category chip, without adding a field to the real economy data
 * or touching any gameplay value.
 */

export interface CategoryPresentation {
  label: keyof typeof categoryBadgeTheme;
  badgeBg: string;
  badgeText: string;
}

const CATEGORY_BY_BUSINESS_ID: Record<string, keyof typeof categoryBadgeTheme> = {
  tea_stall: 'FOOD & BEVERAGE',
  restaurant: 'RESTAURANT',
  kirana_store: 'GROCERY',
  dairy_shop: 'DAIRY',
  bakery: 'BAKERY',
  bike_repair: 'AUTOMOTIVE',
  medical: 'HEALTHCARE',
  budget_lodge: 'EVENTS',
};

export function getBusinessCategory(businessId: string): CategoryPresentation {
  const label = CATEGORY_BY_BUSINESS_ID[businessId] ?? 'GENERAL';
  const theme = categoryBadgeTheme[label];
  return { label, badgeBg: theme.background, badgeText: theme.text };
}
