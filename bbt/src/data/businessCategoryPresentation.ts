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
  // Badeban
  tea_stall: 'FOOD & BEVERAGE',
  restaurant: 'RESTAURANT',
  kirana_store: 'GROCERY',
  dairy_shop: 'DAIRY',
  bakery: 'BAKERY',
  bike_repair: 'AUTOMOTIVE',
  medical: 'HEALTHCARE',
  budget_lodge: 'EVENTS',
  // Katra
  vegetable_market: 'GROCERY',
  fruit_shop: 'GROCERY',
  general_store: 'RETAIL',
  footwear_shop: 'RETAIL',
  garment_store: 'RETAIL',
  mini_bank: 'FINANCE',
  shopping_complex_katra: 'RETAIL',
  commercial_plaza: 'REAL ESTATE',
  // Company Bagh
  ice_cream_parlour: 'FOOD & BEVERAGE',
  cafe: 'FOOD & BEVERAGE',
  nursery: 'RETAIL',
  kids_zone: 'EVENTS',
  food_court: 'FOOD & BEVERAGE',
  gym: 'EVENTS',
  mini_cinema: 'EVENTS',
  premium_hotel: 'EVENTS',
  // Pakke Bazar
  ladies_fashion: 'RETAIL',
  cosmetics: 'RETAIL',
  mobile_shop: 'RETAIL',
  electronics: 'RETAIL',
  watch_store: 'RETAIL',
  jewellery: 'RETAIL',
  department_store: 'RETAIL',
  luxury_mall: 'RETAIL',
  // Bus Stand
  bus_cafe: 'FOOD & BEVERAGE',
  dhaba: 'FOOD & BEVERAGE',
  luggage_store: 'RETAIL',
  taxi_stand: 'TRANSPORT',
  petrol_pump: 'TRANSPORT',
  transit_hotel: 'EVENTS',
  bus_depot: 'TRANSPORT',
  transport_terminal: 'TRANSPORT',
  // District Hospital
  pharmacy: 'HEALTHCARE',
  diagnostic_lab: 'HEALTHCARE',
  dental_clinic: 'HEALTHCARE',
  optical_store: 'HEALTHCARE',
  ambulance_service: 'HEALTHCARE',
  private_hospital: 'HEALTHCARE',
  medical_research_center: 'HEALTHCARE',
  super_specialty_hospital: 'HEALTHCARE',
  // Plastic Complex
  plastic_unit: 'INDUSTRIAL',
  packaging_factory: 'INDUSTRIAL',
  warehouse: 'INDUSTRIAL',
  manufacturing_plant: 'INDUSTRIAL',
  industrial_workshop: 'INDUSTRIAL',
  logistics_hub: 'INDUSTRIAL',
  industrial_park: 'REAL ESTATE',
  mega_industrial_estate: 'REAL ESTATE',
  // Railway Station
  platform_tea_stall: 'FOOD & BEVERAGE',
  book_stall: 'RETAIL',
  food_plaza: 'FOOD & BEVERAGE',
  gift_shop: 'RETAIL',
  cab_booking: 'TRANSPORT',
  railway_hotel: 'EVENTS',
  cargo_terminal: 'INDUSTRIAL',
  railway_commercial_hub: 'REAL ESTATE',
  // Court Area
  photocopy_shop: 'GENERAL',
  typing_center: 'GENERAL',
  law_book_store: 'RETAIL',
  lawyers_cafe: 'FOOD & BEVERAGE',
  legal_consultancy: 'LEGAL SERVICES',
  corporate_law_office: 'LEGAL SERVICES',
  arbitration_center: 'LEGAL SERVICES',
  legal_business_tower: 'REAL ESTATE',
  // Purani Basti
  sweet_shop: 'FOOD & BEVERAGE',
  spice_store: 'GROCERY',
  handicraft_shop: 'RETAIL',
  textile_shop: 'RETAIL',
  antique_store: 'RETAIL',
  heritage_restaurant: 'FOOD & BEVERAGE',
  heritage_market: 'RETAIL',
  cultural_plaza: 'REAL ESTATE',
};

export function getBusinessCategory(businessId: string): CategoryPresentation {
  const label = CATEGORY_BY_BUSINESS_ID[businessId] ?? 'GENERAL';
  const theme = categoryBadgeTheme[label];
  return { label, badgeBg: theme.background, badgeText: theme.text };
}
