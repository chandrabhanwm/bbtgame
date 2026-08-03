import { Business } from '../types';
import { districtUsesStrategyLayer, getStrategyLevelData, getStrategyDistrictL1Cost } from '../utils/strategyEngine';

/**
 * Raw property data for every district, exactly as given: id, display name,
 * emoji, buy price, and income/min. Nothing here is invented — only the
 * *mechanical* fields needed to plug into the existing upgrade system
 * (cost multiplier, unlock gate, theme color) are derived, using the same
 * pattern the original Badeban-era Gandhi Nagar data already used.
 */

export interface DistrictPropertySeed {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseProfitPerMin: number;
  description: string;
}

export interface DistrictEconomy {
  /** Matches a district id in cityMapData.ts */
  districtId: string;
  label: string;
  properties: DistrictPropertySeed[];
}

export const districtEconomies: DistrictEconomy[] = [
  {
    districtId: 'badeban',
    label: 'Badeban — Entry Market',
    properties: [
      { id: 'tea_stall', name: 'Lighthouse Chai Corner', emoji: '☕', baseCost: 12500, baseProfitPerMin: 278, description: 'Hot kadak chai for the whole market.' },
      { id: 'kirana_store', name: 'Mehta Kirana Store', emoji: '🛒', baseCost: 25000, baseProfitPerMin: 455, description: 'Daily groceries and household basics.' },
      { id: 'dairy_shop', name: 'Parekh Dairy Shop', emoji: '🥛', baseCost: 50000, baseProfitPerMin: 714, description: 'Fresh milk, curd, and paneer every morning.' },
      { id: 'bakery', name: 'Harborside Bakery & Sweets', emoji: '🍞', baseCost: 100000, baseProfitPerMin: 1111, description: 'Warm bread, buns, and cream biscuits.' },
      { id: 'bike_repair', name: 'Kapadia Autoparts', emoji: '🔧', baseCost: 200000, baseProfitPerMin: 1667, description: 'Spare parts and accessories for every two-wheeler.' },
      { id: 'medical', name: 'Shah Medical Store', emoji: '💊', baseCost: 375000, baseProfitPerMin: 2344, description: 'Medicines and essentials, open late.' },
      { id: 'restaurant', name: 'Anchor Grill', emoji: '🍽', baseCost: 750000, baseProfitPerMin: 3409, description: 'Sit-down meals for the market crowd.' },
      { id: 'budget_lodge', name: 'Grand Mahal Banquet Hall', emoji: '💒', baseCost: 1500000, baseProfitPerMin: 5000, description: 'A grand venue for weddings and community functions.' },
    ],
  },
  {
    districtId: 'katra',
    label: 'Katra — Wholesale & Local Commerce',
    properties: [
      { id: 'vegetable_market', name: 'Vegetable Market', emoji: '🥬', baseCost: 20000, baseProfitPerMin: 419, description: 'Fresh produce sold by the crate.' },
      { id: 'fruit_shop', name: 'Fruit Shop', emoji: '🍎', baseCost: 45000, baseProfitPerMin: 772, description: 'Seasonal fruit, sold fast at fair prices.' },
      { id: 'general_store', name: 'General Store', emoji: '🧺', baseCost: 87500, baseProfitPerMin: 1179, description: 'A bit of everything, wholesale rates.' },
      { id: 'footwear_shop', name: 'Footwear Shop', emoji: '👞', baseCost: 175000, baseProfitPerMin: 1834, description: 'Shoes and sandals for every budget.' },
      { id: 'garment_store', name: 'Garment Store', emoji: '👕', baseCost: 350000, baseProfitPerMin: 2752, description: 'Bulk clothing for shops across CoralBay.' },
      { id: 'mini_bank', name: 'Mini Bank', emoji: '🏦', baseCost: 750000, baseProfitPerMin: 4422, description: 'Savings, loans, and cash counters.' },
      { id: 'shopping_complex_katra', name: 'Shopping Complex', emoji: '🏬', baseCost: 2000000, baseProfitPerMin: 8576, description: 'Multiple shops under one busy roof.' },
      { id: 'commercial_plaza', name: 'Commercial Plaza', emoji: '🏢', baseCost: 4500000, baseProfitPerMin: 14151, description: 'Office space and retail, side by side.' },
    ],
  },
  {
    districtId: 'company_bagh',
    label: 'Company Bagh — Family & Lifestyle',
    properties: [
      { id: 'ice_cream_parlour', name: 'Ice Cream Parlour', emoji: '🍦', baseCost: 62500, baseProfitPerMin: 1177, description: 'Cold treats for evening strolls in the park.' },
      { id: 'cafe', name: 'Café', emoji: '☕', baseCost: 150000, baseProfitPerMin: 2311, description: 'A quiet corner for coffee and conversation.' },
      { id: 'nursery', name: 'Nursery', emoji: '🌸', baseCost: 375000, baseProfitPerMin: 4540, description: 'Plants, saplings, and garden supplies.' },
      { id: 'kids_zone', name: 'Kids Zone', emoji: '🎈', baseCost: 1000000, baseProfitPerMin: 9416, description: 'Rides and games for family weekends.' },
      { id: 'food_court', name: 'Food Court', emoji: '🍕', baseCost: 2000000, baseProfitPerMin: 14124, description: 'Every cuisine, one shared seating area.' },
      { id: 'gym', name: 'Gym', emoji: '🏋️', baseCost: 5000000, baseProfitPerMin: 26483, description: 'Weights, machines, and morning regulars.' },
      { id: 'mini_cinema', name: 'Mini Cinema', emoji: '🎬', baseCost: 12500000, baseProfitPerMin: 48151, description: 'A small screen with a loyal crowd.' },
      { id: 'premium_hotel', name: 'Premium Hotel', emoji: '🏨', baseCost: 30000000, baseProfitPerMin: 84746, description: 'The best address near the park.' },
    ],
  },
  {
    districtId: 'pakke_bazar',
    label: 'Pakke Bazar — Retail Hub',
    properties: [
      { id: 'ladies_fashion', name: 'Ladies Fashion', emoji: '👗', baseCost: 75000, baseProfitPerMin: 1344, description: 'Sarees, kurtas, and festive wear.' },
      { id: 'cosmetics', name: 'Cosmetics', emoji: '💄', baseCost: 187500, baseProfitPerMin: 2749, description: 'Beauty essentials and gift sets.' },
      { id: 'mobile_shop', name: 'Mobile Shop', emoji: '📱', baseCost: 500000, baseProfitPerMin: 5760, description: 'Latest phones and quick repairs.' },
      { id: 'electronics', name: 'Electronics', emoji: '💻', baseCost: 1250000, baseProfitPerMin: 11201, description: 'Laptops, TVs, and home appliances.' },
      { id: 'watch_store', name: 'Watch Store', emoji: '⌚', baseCost: 3000000, baseProfitPerMin: 20161, description: 'Timepieces from daily-wear to display cases.' },
      { id: 'jewellery', name: 'Jewellery', emoji: '💍', baseCost: 7500000, baseProfitPerMin: 37802, description: 'Gold and silver, hallmarked and trusted.' },
      { id: 'department_store', name: 'Department Store', emoji: '🛒', baseCost: 18750000, baseProfitPerMin: 68732, description: 'Everything under one bazaar roof.' },
      { id: 'luxury_mall', name: 'Luxury Mall', emoji: '🏬', baseCost: 50000000, baseProfitPerMin: 134409, description: 'CoralBay\'s biggest shopping destination.' },
    ],
  },
  {
    districtId: 'bus_stand',
    label: 'Bus Stand — High Traffic',
    properties: [
      { id: 'bus_cafe', name: 'Coastal Snack Corner', emoji: '☕', baseCost: 87500, baseProfitPerMin: 1507, description: 'Tea and snacks between departures.' },
      { id: 'dhaba', name: 'Seaside Tiffin House', emoji: '🍛', baseCost: 225000, baseProfitPerMin: 3171, description: 'Hearty meals for travelers on the move.' },
      { id: 'luggage_store', name: 'Luggage Store', emoji: '🎒', baseCost: 625000, baseProfitPerMin: 6921, description: 'Bags and trunks for every journey.' },
      { id: 'taxi_stand', name: 'Taxi Stand', emoji: '🚖', baseCost: 1500000, baseProfitPerMin: 12920, description: 'Rides to anywhere in CoralBay.' },
      { id: 'petrol_pump', name: 'Petrol Pump', emoji: '⛽', baseCost: 3750000, baseProfitPerMin: 24225, description: 'Fuel for the whole transport hub.' },
      { id: 'transit_hotel', name: 'Transit Hotel', emoji: '🏨', baseCost: 10000000, baseProfitPerMin: 48450, description: 'A bed for the overnight traveler.' },
      { id: 'bus_depot', name: 'Bus Depot', emoji: '🚌', baseCost: 25000000, baseProfitPerMin: 88090, description: 'Fleet maintenance and dispatch.' },
      { id: 'transport_terminal', name: 'Transport Terminal', emoji: '🚍', baseCost: 75000000, baseProfitPerMin: 193798, description: 'The whole region routes through here.' },
    ],
  },
  {
    districtId: 'district_hospital',
    label: 'District Hospital',
    properties: [
      { id: 'pharmacy', name: 'Pharmacy', emoji: '💊', baseCost: 100000, baseProfitPerMin: 1671, description: 'Prescriptions filled around the clock.' },
      { id: 'diagnostic_lab', name: 'Diagnostic Lab', emoji: '🩺', baseCost: 250000, baseProfitPerMin: 3418, description: 'Tests and scans, results same day.' },
      { id: 'dental_clinic', name: 'Dental Clinic', emoji: '🦷', baseCost: 625000, baseProfitPerMin: 6713, description: 'Checkups and treatment chairs, always full.' },
      { id: 'optical_store', name: 'Optical Store', emoji: '👓', baseCost: 1500000, baseProfitPerMin: 12531, description: 'Glasses and eye tests on-site.' },
      { id: 'ambulance_service', name: 'Ambulance Service', emoji: '🚑', baseCost: 3750000, baseProfitPerMin: 23496, description: 'Fast response, day or night.' },
      { id: 'private_hospital', name: 'Private Hospital', emoji: '🏥', baseCost: 10000000, baseProfitPerMin: 46992, description: 'Full-service care with modern wards.' },
      { id: 'medical_research_center', name: 'Medical Research Center', emoji: '🧬', baseCost: 25000000, baseProfitPerMin: 85441, description: 'Studies and trials backed by the district.' },
      { id: 'super_specialty_hospital', name: 'Super Specialty Hospital', emoji: '❤️', baseCost: 75000000, baseProfitPerMin: 187970, description: 'The region\'s top-tier medical center.' },
    ],
  },
  {
    districtId: 'plastic_complex',
    label: 'Plastic Complex — Industrial Area',
    properties: [
      { id: 'plastic_unit', name: 'Plastic Unit', emoji: '🧱', baseCost: 250000, baseProfitPerMin: 3968, description: 'Molding and small plastic goods.' },
      { id: 'packaging_factory', name: 'Packaging Factory', emoji: '📦', baseCost: 750000, baseProfitPerMin: 9740, description: 'Boxes and wrap for every shop in CoralBay.' },
      { id: 'warehouse', name: 'Warehouse', emoji: '🚚', baseCost: 2000000, baseProfitPerMin: 20408, description: 'Storage and dispatch at scale.' },
      { id: 'manufacturing_plant', name: 'Manufacturing Plant', emoji: '🏭', baseCost: 5000000, baseProfitPerMin: 39683, description: 'Round-the-clock production lines.' },
      { id: 'industrial_workshop', name: 'Industrial Workshop', emoji: '⚙️', baseCost: 12500000, baseProfitPerMin: 74405, description: 'Custom parts and heavy repairs.' },
      { id: 'logistics_hub', name: 'Logistics Hub', emoji: '🚛', baseCost: 30000000, baseProfitPerMin: 133929, description: 'Freight moving in and out daily.' },
      { id: 'industrial_park', name: 'Industrial Park', emoji: '🏢', baseCost: 75000000, baseProfitPerMin: 243506, description: 'Multiple factories sharing infrastructure.' },
      { id: 'mega_industrial_estate', name: 'Mega Industrial Estate', emoji: '🌐', baseCost: 200000000, baseProfitPerMin: 476190, description: 'CoralBay\'s largest industrial footprint.' },
    ],
  },
  {
    districtId: 'railway_station',
    label: 'Railway Station',
    properties: [
      { id: 'platform_tea_stall', name: 'Platform Tea Stall', emoji: '☕', baseCost: 150000, baseProfitPerMin: 2415, description: 'Chai through the window, every stop.' },
      { id: 'book_stall', name: 'Book Stall', emoji: '📚', baseCost: 450000, baseProfitPerMin: 5929, description: 'Paperbacks and newspapers for the journey.' },
      { id: 'food_plaza', name: 'Food Plaza', emoji: '🍱', baseCost: 1250000, baseProfitPerMin: 12940, description: 'Quick meals between trains.' },
      { id: 'gift_shop', name: 'Gift Shop', emoji: '🎁', baseCost: 3000000, baseProfitPerMin: 24155, description: 'Souvenirs and last-minute gifts.' },
      { id: 'cab_booking', name: 'Cab Booking', emoji: '🚖', baseCost: 7500000, baseProfitPerMin: 45290, description: 'Rides booked the moment you arrive.' },
      { id: 'railway_hotel', name: 'Railway Hotel', emoji: '🏨', baseCost: 20000000, baseProfitPerMin: 90580, description: 'A room steps from the platform.' },
      { id: 'cargo_terminal', name: 'Cargo Terminal', emoji: '🚉', baseCost: 50000000, baseProfitPerMin: 164690, description: 'Freight loaded onto every outbound train.' },
      { id: 'railway_commercial_hub', name: 'Railway Commercial Hub', emoji: '🚄', baseCost: 125000000, baseProfitPerMin: 301932, description: 'A small city built around the station.' },
    ],
  },
  {
    districtId: 'court_area',
    label: 'Court Area',
    properties: [
      { id: 'photocopy_shop', name: 'Photocopy Shop', emoji: '📑', baseCost: 37500, baseProfitPerMin: 744, description: 'Copies and stamp paper, no queue.' },
      { id: 'typing_center', name: 'Typing Center', emoji: '🖨️', baseCost: 87500, baseProfitPerMin: 1420, description: 'Affidavits and applications typed fast.' },
      { id: 'law_book_store', name: 'Law Book Store', emoji: '📚', baseCost: 200000, baseProfitPerMin: 2551, description: 'Reference texts for every case.' },
      { id: 'lawyers_cafe', name: "Lawyers' Café", emoji: '☕', baseCost: 450000, baseProfitPerMin: 4464, description: 'Where cases get discussed over chai.' },
      { id: 'legal_consultancy', name: 'Legal Consultancy', emoji: '🏢', baseCost: 1000000, baseProfitPerMin: 7440, description: 'Advice for businesses and individuals.' },
      { id: 'corporate_law_office', name: 'Corporate Law Office', emoji: '🏛️', baseCost: 2000000, baseProfitPerMin: 11161, description: 'Contracts and compliance for big clients.' },
      { id: 'arbitration_center', name: 'Arbitration Center', emoji: '⚖️', baseCost: 5000000, baseProfitPerMin: 20292, description: 'Disputes settled outside the courtroom.' },
      { id: 'legal_business_tower', name: 'Legal Business Tower', emoji: '🏢', baseCost: 11250000, baseProfitPerMin: 33482, description: 'CoralBay\'s tallest address for law firms.' },
    ],
  },
  {
    districtId: 'purani_basti',
    label: 'Purani CoralBay — Old Market',
    properties: [
      { id: 'sweet_shop', name: 'Sweet Shop', emoji: '🫓', baseCost: 125000, baseProfitPerMin: 2042, description: 'Milk sweets from a century-old recipe.' },
      { id: 'spice_store', name: 'Spice Store', emoji: '🥣', baseCost: 375000, baseProfitPerMin: 5013, description: 'Ground fresh, sold by the sack.' },
      { id: 'handicraft_shop', name: 'Handicraft Shop', emoji: '🪔', baseCost: 1000000, baseProfitPerMin: 10504, description: 'Handmade pottery, brass, and lamps.' },
      { id: 'textile_shop', name: 'Textile Shop', emoji: '🧵', baseCost: 2000000, baseProfitPerMin: 16340, description: 'Bolts of cloth from local weavers.' },
      { id: 'antique_store', name: 'Antique Store', emoji: '🏺', baseCost: 5000000, baseProfitPerMin: 30637, description: 'Old CoralBay\'s treasures, carefully kept.' },
      { id: 'heritage_restaurant', name: 'Heritage Restaurant', emoji: '🍛', baseCost: 15000000, baseProfitPerMin: 68934, description: 'Recipes passed down four generations.' },
      { id: 'heritage_market', name: 'Heritage Market', emoji: '🏛️', baseCost: 37500000, baseProfitPerMin: 125334, description: 'A living museum you can shop in.' },
      { id: 'cultural_plaza', name: 'Cultural Plaza', emoji: '🎭', baseCost: 100000000, baseProfitPerMin: 245098, description: 'Festivals and shows, year-round.' },
    ],
  },
];

export function getDistrictEconomy(districtId: string): DistrictEconomy | undefined {
  return districtEconomies.find((d) => d.districtId === districtId);
}

/** Total cost to buy every business in a district once each (Level 1) —
 *  used by the pool's dynamic ceiling, which scales as a percentage of
 *  the player's CURRENT district cost rather than one flat rupee amount
 *  for the whole game. Verified via simulation: a flat ceiling works for
 *  early, cheap districts but becomes trivially easy to hit within
 *  minutes once profitPerMin grows in later districts — scaling the
 *  ceiling to the current district's own cost keeps it meaningful at
 *  every stage instead of only the first one. */
export function getDistrictTotalCost(districtId: string): number {
  if (districtUsesStrategyLayer(districtId)) return getStrategyDistrictL1Cost(districtId);
  const economy = getDistrictEconomy(districtId);
  if (!economy) return 0;
  return economy.properties.reduce((sum, p) => sum + p.baseCost, 0);
}

// Position-based theme colors, reused from the original tier palette so
// every district's property list reads consistently regardless of which
// district it belongs to.
const TIER_THEME: { color: string; gradient: string }[] = [
  { color: '#10b981', gradient: 'from-emerald-500 to-emerald-600' },
  { color: '#f59e0b', gradient: 'from-amber-500 to-amber-600' },
  { color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
  { color: '#22c55e', gradient: 'from-green-500 to-green-600' },
  { color: '#ef4444', gradient: 'from-red-500 to-red-600' },
  { color: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
  { color: '#eab308', gradient: 'from-yellow-400 to-amber-500' },
  { color: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
];

/**
 * Converts a district's raw property list into the exact Business[] shape
 * the rest of the app (StreetView, ShopDetailSheet, App.tsx's game loop)
 * already knows how to render and upgrade. Only the first property starts
 * unlocked (level 1); the rest gate open at ~1.5x the previous property's
 * price, mirroring the original Badeban-era unlock curve.
 */
export function buildBusinessesForDistrict(districtId: string): Business[] {
  const economy = getDistrictEconomy(districtId);
  if (!economy) return [];
  const usesStrategyLayer = districtUsesStrategyLayer(districtId);

  return economy.properties.map((p, i) => {
    const theme = TIER_THEME[i % TIER_THEME.length];
    const isFirst = i === 0;
    const prevBaseCost = i > 0 ? economy.properties[i - 1].baseCost : 0;

    // Strategy-layer districts: the real buy cost and L1 income come from
    // the fixed level tables, not baseCost/baseProfitPerMin (which are
    // kept on the seed only for districts still on the legacy formula).
    const strategyData = usesStrategyLayer ? getStrategyLevelData(districtId, p.id) : null;
    const initialCost = strategyData ? strategyData.buyCost : p.baseCost;
    const initialProfit = strategyData ? strategyData.income[0] : p.baseProfitPerMin;

    return {
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      cost: initialCost,
      baseCost: p.baseCost,
      costMultiplier: 1.15 + i * 0.035,
      profitPerMin: initialProfit,
      baseProfitPerMin: p.baseProfitPerMin,
      unlockAt: isFirst ? 0 : Math.round(prevBaseCost * 1.5),
      // "Moment Zero" — no business anywhere is pre-owned. Every
      // business, in every district, starts genuinely unowned and only
      // ever counts toward profit once the player actually buys it.
      // Originally this was scoped to Badeban's Tea Stall alone,
      // leaving every other district's first business pre-owned at
      // level 1 — that mismatch is exactly what let phantom,
      // never-purchased profit feed the pool for every new player,
      // regardless of district lock status. This is now a genuinely
      // progressive economy: reaching or unlocking a district means
      // nothing on its own; only ownership does.
      level: 0,
      status: 'locked',
      description: p.description,
      themeColor: theme.color,
      gradient: theme.gradient,
      maxLevel: usesStrategyLayer ? 6 : undefined,
    };
  });
}
