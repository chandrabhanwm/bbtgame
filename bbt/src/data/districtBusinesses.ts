import { Business } from '../types';

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
      { id: 'tea_stall', name: 'Chotu Chai Stall', emoji: '☕', baseCost: 12500, baseProfitPerMin: 250, description: 'Hot kadak chai for the whole market.' },
      { id: 'kirana_store', name: 'Sharma Kirana Store', emoji: '🛒', baseCost: 25000, baseProfitPerMin: 550, description: 'Daily groceries and household basics.' },
      { id: 'dairy_shop', name: 'Verma Dairy Shop', emoji: '🥛', baseCost: 50000, baseProfitPerMin: 1125, description: 'Fresh milk, curd, and paneer every morning.' },
      { id: 'bakery', name: 'Basti Sweets & Bakery', emoji: '🍞', baseCost: 100000, baseProfitPerMin: 2250, description: 'Warm bread, buns, and cream biscuits.' },
      { id: 'bike_repair', name: 'Chawla Autoparts', emoji: '🔧', baseCost: 200000, baseProfitPerMin: 4500, description: 'Spare parts and accessories for every two-wheeler.' },
      { id: 'medical', name: 'Gupta Medical Store', emoji: '💊', baseCost: 375000, baseProfitPerMin: 8750, description: 'Medicines and essentials, open late.' },
      { id: 'restaurant', name: 'Sher-e-Punjab Dhaba', emoji: '🍽', baseCost: 750000, baseProfitPerMin: 18750, description: 'Sit-down meals for the market crowd.' },
      { id: 'budget_lodge', name: 'Chaudhary Marriage Hall', emoji: '💒', baseCost: 1500000, baseProfitPerMin: 37500, description: 'A grand venue for weddings and community functions.' },
    ],
  },
  {
    districtId: 'katra',
    label: 'Katra — Wholesale & Local Commerce',
    properties: [
      { id: 'vegetable_market', name: 'Vegetable Market', emoji: '🥬', baseCost: 20000, baseProfitPerMin: 450, description: 'Fresh produce sold by the crate.' },
      { id: 'fruit_shop', name: 'Fruit Shop', emoji: '🍎', baseCost: 45000, baseProfitPerMin: 1000, description: 'Seasonal fruit, sold fast at fair prices.' },
      { id: 'general_store', name: 'General Store', emoji: '🧺', baseCost: 87500, baseProfitPerMin: 2000, description: 'A bit of everything, wholesale rates.' },
      { id: 'footwear_shop', name: 'Footwear Shop', emoji: '👞', baseCost: 175000, baseProfitPerMin: 4000, description: 'Shoes and sandals for every budget.' },
      { id: 'garment_store', name: 'Garment Store', emoji: '👕', baseCost: 350000, baseProfitPerMin: 8000, description: 'Bulk clothing for shops across Basti.' },
      { id: 'mini_bank', name: 'Mini Bank', emoji: '🏦', baseCost: 750000, baseProfitPerMin: 17500, description: 'Savings, loans, and cash counters.' },
      { id: 'shopping_complex_katra', name: 'Shopping Complex', emoji: '🏬', baseCost: 2000000, baseProfitPerMin: 45000, description: 'Multiple shops under one busy roof.' },
      { id: 'commercial_plaza', name: 'Commercial Plaza', emoji: '🏢', baseCost: 4500000, baseProfitPerMin: 100000, description: 'Office space and retail, side by side.' },
    ],
  },
  {
    districtId: 'company_bagh',
    label: 'Company Bagh — Family & Lifestyle',
    properties: [
      { id: 'ice_cream_parlour', name: 'Ice Cream Parlour', emoji: '🍦', baseCost: 62500, baseProfitPerMin: 1250, description: 'Cold treats for evening strolls in the park.' },
      { id: 'cafe', name: 'Café', emoji: '☕', baseCost: 150000, baseProfitPerMin: 3000, description: 'A quiet corner for coffee and conversation.' },
      { id: 'nursery', name: 'Nursery', emoji: '🌸', baseCost: 375000, baseProfitPerMin: 8000, description: 'Plants, saplings, and garden supplies.' },
      { id: 'kids_zone', name: 'Kids Zone', emoji: '🎈', baseCost: 1000000, baseProfitPerMin: 20000, description: 'Rides and games for family weekends.' },
      { id: 'food_court', name: 'Food Court', emoji: '🍕', baseCost: 2000000, baseProfitPerMin: 40000, description: 'Every cuisine, one shared seating area.' },
      { id: 'gym', name: 'Gym', emoji: '🏋️', baseCost: 5000000, baseProfitPerMin: 105000, description: 'Weights, machines, and morning regulars.' },
      { id: 'mini_cinema', name: 'Mini Cinema', emoji: '🎬', baseCost: 12500000, baseProfitPerMin: 250000, description: 'A small screen with a loyal crowd.' },
      { id: 'premium_hotel', name: 'Premium Hotel', emoji: '🏨', baseCost: 30000000, baseProfitPerMin: 600000, description: 'The best address near the park.' },
    ],
  },
  {
    districtId: 'pakke_bazar',
    label: 'Pakke Bazar — Retail Hub',
    properties: [
      { id: 'ladies_fashion', name: 'Ladies Fashion', emoji: '👗', baseCost: 75000, baseProfitPerMin: 1500, description: 'Sarees, kurtas, and festive wear.' },
      { id: 'cosmetics', name: 'Cosmetics', emoji: '💄', baseCost: 187500, baseProfitPerMin: 3750, description: 'Beauty essentials and gift sets.' },
      { id: 'mobile_shop', name: 'Mobile Shop', emoji: '📱', baseCost: 500000, baseProfitPerMin: 10500, description: 'Latest phones and quick repairs.' },
      { id: 'electronics', name: 'Electronics', emoji: '💻', baseCost: 1250000, baseProfitPerMin: 25000, description: 'Laptops, TVs, and home appliances.' },
      { id: 'watch_store', name: 'Watch Store', emoji: '⌚', baseCost: 3000000, baseProfitPerMin: 60000, description: 'Timepieces from daily-wear to display cases.' },
      { id: 'jewellery', name: 'Jewellery', emoji: '💍', baseCost: 7500000, baseProfitPerMin: 150000, description: 'Gold and silver, hallmarked and trusted.' },
      { id: 'department_store', name: 'Department Store', emoji: '🛒', baseCost: 18750000, baseProfitPerMin: 375000, description: 'Everything under one bazaar roof.' },
      { id: 'luxury_mall', name: 'Luxury Mall', emoji: '🏬', baseCost: 50000000, baseProfitPerMin: 1000000, description: 'Basti\'s biggest shopping destination.' },
    ],
  },
  {
    districtId: 'bus_stand',
    label: 'Bus Stand — High Traffic',
    properties: [
      { id: 'bus_cafe', name: 'Bus Café', emoji: '☕', baseCost: 87500, baseProfitPerMin: 1750, description: 'Tea and snacks between departures.' },
      { id: 'dhaba', name: 'Dhaba', emoji: '🍛', baseCost: 225000, baseProfitPerMin: 4500, description: 'Hearty meals for travelers on the move.' },
      { id: 'luggage_store', name: 'Luggage Store', emoji: '🎒', baseCost: 625000, baseProfitPerMin: 12500, description: 'Bags and trunks for every journey.' },
      { id: 'taxi_stand', name: 'Taxi Stand', emoji: '🚖', baseCost: 1500000, baseProfitPerMin: 30000, description: 'Rides to anywhere in Basti.' },
      { id: 'petrol_pump', name: 'Petrol Pump', emoji: '⛽', baseCost: 3750000, baseProfitPerMin: 75000, description: 'Fuel for the whole transport hub.' },
      { id: 'transit_hotel', name: 'Transit Hotel', emoji: '🏨', baseCost: 10000000, baseProfitPerMin: 200000, description: 'A bed for the overnight traveler.' },
      { id: 'bus_depot', name: 'Bus Depot', emoji: '🚌', baseCost: 25000000, baseProfitPerMin: 500000, description: 'Fleet maintenance and dispatch.' },
      { id: 'transport_terminal', name: 'Transport Terminal', emoji: '🚍', baseCost: 75000000, baseProfitPerMin: 1500000, description: 'The whole region routes through here.' },
    ],
  },
  {
    districtId: 'district_hospital',
    label: 'District Hospital',
    properties: [
      { id: 'pharmacy', name: 'Pharmacy', emoji: '💊', baseCost: 100000, baseProfitPerMin: 2000, description: 'Prescriptions filled around the clock.' },
      { id: 'diagnostic_lab', name: 'Diagnostic Lab', emoji: '🩺', baseCost: 250000, baseProfitPerMin: 5000, description: 'Tests and scans, results same day.' },
      { id: 'dental_clinic', name: 'Dental Clinic', emoji: '🦷', baseCost: 625000, baseProfitPerMin: 12500, description: 'Checkups and treatment chairs, always full.' },
      { id: 'optical_store', name: 'Optical Store', emoji: '👓', baseCost: 1500000, baseProfitPerMin: 30000, description: 'Glasses and eye tests on-site.' },
      { id: 'ambulance_service', name: 'Ambulance Service', emoji: '🚑', baseCost: 3750000, baseProfitPerMin: 75000, description: 'Fast response, day or night.' },
      { id: 'private_hospital', name: 'Private Hospital', emoji: '🏥', baseCost: 10000000, baseProfitPerMin: 200000, description: 'Full-service care with modern wards.' },
      { id: 'medical_research_center', name: 'Medical Research Center', emoji: '🧬', baseCost: 25000000, baseProfitPerMin: 500000, description: 'Studies and trials backed by the district.' },
      { id: 'super_specialty_hospital', name: 'Super Specialty Hospital', emoji: '❤️', baseCost: 75000000, baseProfitPerMin: 1500000, description: 'The region\'s top-tier medical center.' },
    ],
  },
  {
    districtId: 'plastic_complex',
    label: 'Plastic Complex — Industrial Area',
    properties: [
      { id: 'plastic_unit', name: 'Plastic Unit', emoji: '🧱', baseCost: 250000, baseProfitPerMin: 5000, description: 'Molding and small plastic goods.' },
      { id: 'packaging_factory', name: 'Packaging Factory', emoji: '📦', baseCost: 750000, baseProfitPerMin: 15000, description: 'Boxes and wrap for every shop in Basti.' },
      { id: 'warehouse', name: 'Warehouse', emoji: '🚚', baseCost: 2000000, baseProfitPerMin: 40000, description: 'Storage and dispatch at scale.' },
      { id: 'manufacturing_plant', name: 'Manufacturing Plant', emoji: '🏭', baseCost: 5000000, baseProfitPerMin: 100000, description: 'Round-the-clock production lines.' },
      { id: 'industrial_workshop', name: 'Industrial Workshop', emoji: '⚙️', baseCost: 12500000, baseProfitPerMin: 250000, description: 'Custom parts and heavy repairs.' },
      { id: 'logistics_hub', name: 'Logistics Hub', emoji: '🚛', baseCost: 30000000, baseProfitPerMin: 600000, description: 'Freight moving in and out daily.' },
      { id: 'industrial_park', name: 'Industrial Park', emoji: '🏢', baseCost: 75000000, baseProfitPerMin: 1500000, description: 'Multiple factories sharing infrastructure.' },
      { id: 'mega_industrial_estate', name: 'Mega Industrial Estate', emoji: '🌐', baseCost: 200000000, baseProfitPerMin: 4000000, description: 'Basti\'s largest industrial footprint.' },
    ],
  },
  {
    districtId: 'railway_station',
    label: 'Railway Station',
    properties: [
      { id: 'platform_tea_stall', name: 'Platform Tea Stall', emoji: '☕', baseCost: 150000, baseProfitPerMin: 3000, description: 'Chai through the window, every stop.' },
      { id: 'book_stall', name: 'Book Stall', emoji: '📚', baseCost: 450000, baseProfitPerMin: 9000, description: 'Paperbacks and newspapers for the journey.' },
      { id: 'food_plaza', name: 'Food Plaza', emoji: '🍱', baseCost: 1250000, baseProfitPerMin: 25000, description: 'Quick meals between trains.' },
      { id: 'gift_shop', name: 'Gift Shop', emoji: '🎁', baseCost: 3000000, baseProfitPerMin: 60000, description: 'Souvenirs and last-minute gifts.' },
      { id: 'cab_booking', name: 'Cab Booking', emoji: '🚖', baseCost: 7500000, baseProfitPerMin: 150000, description: 'Rides booked the moment you arrive.' },
      { id: 'railway_hotel', name: 'Railway Hotel', emoji: '🏨', baseCost: 20000000, baseProfitPerMin: 400000, description: 'A room steps from the platform.' },
      { id: 'cargo_terminal', name: 'Cargo Terminal', emoji: '🚉', baseCost: 50000000, baseProfitPerMin: 1000000, description: 'Freight loaded onto every outbound train.' },
      { id: 'railway_commercial_hub', name: 'Railway Commercial Hub', emoji: '🚄', baseCost: 125000000, baseProfitPerMin: 2500000, description: 'A small city built around the station.' },
    ],
  },
  {
    districtId: 'court_area',
    label: 'Court Area',
    properties: [
      { id: 'photocopy_shop', name: 'Photocopy Shop', emoji: '📑', baseCost: 37500, baseProfitPerMin: 750, description: 'Copies and stamp paper, no queue.' },
      { id: 'typing_center', name: 'Typing Center', emoji: '🖨️', baseCost: 87500, baseProfitPerMin: 1750, description: 'Affidavits and applications typed fast.' },
      { id: 'law_book_store', name: 'Law Book Store', emoji: '📚', baseCost: 200000, baseProfitPerMin: 4000, description: 'Reference texts for every case.' },
      { id: 'lawyers_cafe', name: "Lawyers' Café", emoji: '☕', baseCost: 450000, baseProfitPerMin: 9000, description: 'Where cases get discussed over chai.' },
      { id: 'legal_consultancy', name: 'Legal Consultancy', emoji: '🏢', baseCost: 1000000, baseProfitPerMin: 21250, description: 'Advice for businesses and individuals.' },
      { id: 'corporate_law_office', name: 'Corporate Law Office', emoji: '🏛️', baseCost: 2000000, baseProfitPerMin: 42500, description: 'Contracts and compliance for big clients.' },
      { id: 'arbitration_center', name: 'Arbitration Center', emoji: '⚖️', baseCost: 5000000, baseProfitPerMin: 105000, description: 'Disputes settled outside the courtroom.' },
      { id: 'legal_business_tower', name: 'Legal Business Tower', emoji: '🏢', baseCost: 11250000, baseProfitPerMin: 225000, description: 'Basti\'s tallest address for law firms.' },
    ],
  },
  {
    districtId: 'purani_basti',
    label: 'Purani Basti — Old Market',
    properties: [
      { id: 'sweet_shop', name: 'Sweet Shop', emoji: '🫓', baseCost: 125000, baseProfitPerMin: 2500, description: 'Milk sweets from a century-old recipe.' },
      { id: 'spice_store', name: 'Spice Store', emoji: '🥣', baseCost: 375000, baseProfitPerMin: 7500, description: 'Ground fresh, sold by the sack.' },
      { id: 'handicraft_shop', name: 'Handicraft Shop', emoji: '🪔', baseCost: 1000000, baseProfitPerMin: 20000, description: 'Handmade pottery, brass, and lamps.' },
      { id: 'textile_shop', name: 'Textile Shop', emoji: '🧵', baseCost: 2000000, baseProfitPerMin: 40000, description: 'Bolts of cloth from local weavers.' },
      { id: 'antique_store', name: 'Antique Store', emoji: '🏺', baseCost: 5000000, baseProfitPerMin: 100000, description: 'Old Basti\'s treasures, carefully kept.' },
      { id: 'heritage_restaurant', name: 'Heritage Restaurant', emoji: '🍛', baseCost: 15000000, baseProfitPerMin: 300000, description: 'Recipes passed down four generations.' },
      { id: 'heritage_market', name: 'Heritage Market', emoji: '🏛️', baseCost: 37500000, baseProfitPerMin: 750000, description: 'A living museum you can shop in.' },
      { id: 'cultural_plaza', name: 'Cultural Plaza', emoji: '🎭', baseCost: 100000000, baseProfitPerMin: 2000000, description: 'Festivals and shows, year-round.' },
    ],
  },
];

export function getDistrictEconomy(districtId: string): DistrictEconomy | undefined {
  return districtEconomies.find((d) => d.districtId === districtId);
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

  return economy.properties.map((p, i) => {
    const theme = TIER_THEME[i % TIER_THEME.length];
    const isFirst = i === 0;
    const prevBaseCost = i > 0 ? economy.properties[i - 1].baseCost : 0;

    return {
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      cost: p.baseCost,
      baseCost: p.baseCost,
      costMultiplier: 1.15 + i * 0.035,
      profitPerMin: p.baseProfitPerMin,
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
    };
  });
}
