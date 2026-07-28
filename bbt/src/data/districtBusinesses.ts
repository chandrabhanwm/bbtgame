import { Business } from '../types';

export interface DistrictPropertySeed {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseProfitPerMin: number;
  description: string;
}

export interface DistrictEconomy {
  districtId: string;
  label: string;
  properties: DistrictPropertySeed[];
}

export const districtEconomies: DistrictEconomy[] = [
  {
    districtId: 'harbor_pier',
    label: 'Harbor Pier — Entry Market',
    properties: [
      { id: 'coconut_stand', name: 'Coconut Juice Stand', emoji: '🥥', baseCost: 12500, baseProfitPerMin: 250, description: 'Fresh coconut water straight off the pier.' },
      { id: 'beach_mart', name: 'Beach Mart', emoji: '🛒', baseCost: 25000, baseProfitPerMin: 550, description: 'Sunscreen, snacks, and beach-day basics.' },
      { id: 'gelato_cart', name: 'Gelato Cart', emoji: '🍨', baseCost: 50000, baseProfitPerMin: 1125, description: 'Cool scoops for hot afternoons on the boardwalk.' },
      { id: 'bakery', name: 'Sandy Toes Bakery', emoji: '🥐', baseCost: 100000, baseProfitPerMin: 2250, description: 'Warm croissants and coastal pastries.' },
      { id: 'surf_rentals', name: 'Surf & Board Rentals', emoji: '🏄', baseCost: 200000, baseProfitPerMin: 4500, description: 'Boards and gear for every wave.' },
      { id: 'first_aid_hut', name: 'First Aid Hut', emoji: '⛑️', baseCost: 375000, baseProfitPerMin: 8750, description: 'Quick care for sunburns and scrapes, open late.' },
      { id: 'seafood_shack', name: 'Seafood Shack', emoji: '🦐', baseCost: 750000, baseProfitPerMin: 18750, description: 'Grilled catch of the day, feet in the sand.' },
      { id: 'beach_bungalow', name: 'Beach Bungalow Resort', emoji: '🏝️', baseCost: 1500000, baseProfitPerMin: 37500, description: 'Cozy overwater-style stays for visiting guests.' },
    ],
  },
  {
    districtId: 'fish_market',
    label: 'Fish Market — Wholesale & Local Commerce',
    properties: [
      { id: 'fish_stall', name: 'Fish Stall', emoji: '🐟', baseCost: 20000, baseProfitPerMin: 450, description: 'Fresh catch sold by the crate, straight off the boats.' },
      { id: 'fruit_market', name: 'Tropical Fruit Market', emoji: '🍍', baseCost: 45000, baseProfitPerMin: 1000, description: 'Mangoes, pineapples, and papayas at fair prices.' },
      { id: 'bait_and_tackle', name: 'Bait & Tackle Shop', emoji: '🎣', baseCost: 87500, baseProfitPerMin: 2000, description: 'Everything a local angler needs.' },
      { id: 'sandal_shop', name: 'Sandal & Flip-Flop Shop', emoji: '🩴', baseCost: 175000, baseProfitPerMin: 4000, description: 'Footwear for every beach walk.' },
      { id: 'sarong_store', name: 'Sarong & Swimwear Store', emoji: '👙', baseCost: 350000, baseProfitPerMin: 8000, description: 'Bright fabrics for every visitor.' },
      { id: 'island_credit_union', name: 'Island Credit Union', emoji: '🏦', baseCost: 750000, baseProfitPerMin: 17500, description: 'Savings and loans for local traders.' },
      { id: 'harbor_shopping_complex', name: 'Harbor Shopping Complex', emoji: '🏬', baseCost: 2000000, baseProfitPerMin: 45000, description: 'Dozens of stalls under one busy roof.' },
      { id: 'waterfront_plaza', name: 'Waterfront Commercial Plaza', emoji: '🏢', baseCost: 4500000, baseProfitPerMin: 100000, description: 'Office space and retail along the bay.' },
    ],
  },
  {
    districtId: 'palm_gardens',
    label: 'Palm Gardens — Family & Lifestyle',
    properties: [
      { id: 'ice_cream_parlour', name: 'Palm Grove Ice Cream', emoji: '🍦', baseCost: 62500, baseProfitPerMin: 1250, description: 'Cold treats under the swaying palms.' },
      { id: 'beach_cafe', name: 'Beach Café', emoji: '☕', baseCost: 150000, baseProfitPerMin: 3000, description: 'Iced coffee and ocean views.' },
      { id: 'botanical_nursery', name: 'Botanical Nursery', emoji: '🌺', baseCost: 375000, baseProfitPerMin: 8000, description: 'Tropical plants and flowering hibiscus.' },
      { id: 'kids_water_park', name: 'Kids Water Park', emoji: '🎡', baseCost: 1000000, baseProfitPerMin: 20000, description: 'Splash pads and slides for family weekends.' },
      { id: 'island_food_court', name: 'Island Food Court', emoji: '🍤', baseCost: 2000000, baseProfitPerMin: 40000, description: 'Every island cuisine, one shared deck.' },
      { id: 'beachside_gym', name: 'Beachside Gym', emoji: '🏋️', baseCost: 5000000, baseProfitPerMin: 105000, description: 'Open-air workouts with a sea breeze.' },
      { id: 'outdoor_cinema', name: 'Outdoor Cinema', emoji: '🎬', baseCost: 12500000, baseProfitPerMin: 250000, description: 'Movies under the stars, toes in the sand.' },
      { id: 'resort_hotel', name: 'Palm Gardens Resort Hotel', emoji: '🏨', baseCost: 30000000, baseProfitPerMin: 600000, description: 'The finest address in the gardens.' },
    ],
  },
  {
    districtId: 'boardwalk_plaza',
    label: 'Boardwalk Plaza — Retail Hub',
    properties: [
      { id: 'resort_fashion', name: 'Resort Fashion Boutique', emoji: '👗', baseCost: 75000, baseProfitPerMin: 1500, description: 'Sundresses, sarongs, and festive wear.' },
      { id: 'beach_cosmetics', name: 'Beach Cosmetics', emoji: '💄', baseCost: 187500, baseProfitPerMin: 3750, description: 'Sunscreen, gift sets, and beauty essentials.' },
      { id: 'phone_kiosk', name: 'Boardwalk Phone Kiosk', emoji: '📱', baseCost: 500000, baseProfitPerMin: 10500, description: 'Latest phones and quick repairs.' },
      { id: 'electronics_store', name: 'Electronics Store', emoji: '💻', baseCost: 1250000, baseProfitPerMin: 25000, description: 'Laptops, cameras, and home gadgets.' },
      { id: 'watch_boutique', name: 'Watch Boutique', emoji: '⌚', baseCost: 3000000, baseProfitPerMin: 60000, description: 'Timepieces from everyday to display cases.' },
      { id: 'pearl_jewellery', name: 'Pearl & Coral Jewellery', emoji: '💍', baseCost: 7500000, baseProfitPerMin: 150000, description: 'Ocean gems, hallmarked and trusted.' },
      { id: 'department_store', name: 'Boardwalk Department Store', emoji: '🛍️', baseCost: 18750000, baseProfitPerMin: 375000, description: 'Everything under one boardwalk roof.' },
      { id: 'grand_mall', name: 'Grand Boardwalk Mall', emoji: '🏬', baseCost: 50000000, baseProfitPerMin: 1000000, description: "Coral Bay's biggest shopping destination." },
    ],
  },
  {
    districtId: 'ferry_terminal',
    label: 'Ferry Terminal — High Traffic',
    properties: [
      { id: 'ferry_cafe', name: 'Ferry Café', emoji: '☕', baseCost: 87500, baseProfitPerMin: 1750, description: 'Coffee and snacks between crossings.' },
      { id: 'dockside_diner', name: 'Dockside Diner', emoji: '🍛', baseCost: 225000, baseProfitPerMin: 4500, description: 'Hearty meals for travelers on the move.' },
      { id: 'luggage_stand', name: 'Luggage & Beach Gear Stand', emoji: '🎒', baseCost: 625000, baseProfitPerMin: 12500, description: 'Bags, coolers, and travel essentials.' },
      { id: 'water_taxi_stand', name: 'Water Taxi Stand', emoji: '🚤', baseCost: 1500000, baseProfitPerMin: 30000, description: 'Quick rides to anywhere along the coast.' },
      { id: 'fuel_dock', name: 'Fuel Dock', emoji: '⛽', baseCost: 3750000, baseProfitPerMin: 75000, description: 'Fuel for the whole harbor fleet.' },
      { id: 'transit_inn', name: 'Transit Inn', emoji: '🏨', baseCost: 10000000, baseProfitPerMin: 200000, description: 'A bed for the overnight traveler.' },
      { id: 'ferry_depot', name: 'Ferry Depot', emoji: '⛴️', baseCost: 25000000, baseProfitPerMin: 500000, description: 'Fleet maintenance and dispatch.' },
      { id: 'transport_terminal', name: 'Coral Bay Transport Terminal', emoji: '🚏', baseCost: 75000000, baseProfitPerMin: 1500000, description: 'The whole coast routes through here.' },
    ],
  },
  {
    districtId: 'seaside_clinic',
    label: 'Seaside Clinic',
    properties: [
      { id: 'beach_pharmacy', name: 'Beach Pharmacy', emoji: '💊', baseCost: 100000, baseProfitPerMin: 2000, description: 'Prescriptions filled around the clock.' },
      { id: 'diagnostic_lab', name: 'Diagnostic Lab', emoji: '🩺', baseCost: 250000, baseProfitPerMin: 5000, description: 'Tests and scans, results same day.' },
      { id: 'dental_clinic', name: 'Seaside Dental Clinic', emoji: '🦷', baseCost: 625000, baseProfitPerMin: 12500, description: 'Bright smiles for locals and visitors.' },
      { id: 'optical_store', name: 'Optical Store', emoji: '👓', baseCost: 1500000, baseProfitPerMin: 30000, description: 'Sunglasses and eye tests on-site.' },
      { id: 'lifeguard_response', name: 'Lifeguard Response Unit', emoji: '🚑', baseCost: 3750000, baseProfitPerMin: 75000, description: 'Fast response, day or night.' },
      { id: 'private_hospital', name: 'Seaside Private Hospital', emoji: '🏥', baseCost: 10000000, baseProfitPerMin: 200000, description: 'Full-service care with ocean-view wards.' },
      { id: 'marine_research_center', name: 'Marine Medical Research Center', emoji: '🧬', baseCost: 25000000, baseProfitPerMin: 500000, description: 'Studies and trials backed by the district.' },
      { id: 'super_specialty_hospital', name: 'Coral Bay Specialty Hospital', emoji: '❤️', baseCost: 75000000, baseProfitPerMin: 1500000, description: "The region's top-tier medical center." },
    ],
  },
  {
    districtId: 'boatworks',
    label: 'Boatworks — Industrial Yard',
    properties: [
      { id: 'net_workshop', name: 'Net & Rope Workshop', emoji: '🪢', baseCost: 250000, baseProfitPerMin: 5000, description: 'Fishing nets and rigging, made to order.' },
      { id: 'crate_factory', name: 'Crate & Packing Factory', emoji: '📦', baseCost: 750000, baseProfitPerMin: 15000, description: 'Boxes and ice for every catch shipped out.' },
      { id: 'dockside_warehouse', name: 'Dockside Warehouse', emoji: '🚚', baseCost: 2000000, baseProfitPerMin: 40000, description: 'Storage and dispatch at scale.' },
      { id: 'boat_manufacturing', name: 'Boat Manufacturing Plant', emoji: '🛥️', baseCost: 5000000, baseProfitPerMin: 100000, description: 'Round-the-clock hull production.' },
      { id: 'marine_workshop', name: 'Marine Repair Workshop', emoji: '⚙️', baseCost: 12500000, baseProfitPerMin: 250000, description: 'Custom parts and heavy engine repairs.' },
      { id: 'shipping_hub', name: 'Shipping & Logistics Hub', emoji: '🚛', baseCost: 30000000, baseProfitPerMin: 600000, description: 'Freight moving in and out daily.' },
      { id: 'industrial_marina', name: 'Industrial Marina Park', emoji: '🏢', baseCost: 75000000, baseProfitPerMin: 1500000, description: 'Multiple boatyards sharing infrastructure.' },
      { id: 'mega_shipyard', name: 'Mega Shipyard Estate', emoji: '🌐', baseCost: 200000000, baseProfitPerMin: 4000000, description: "Coral Bay's largest industrial footprint." },
    ],
  },
  {
    districtId: 'lighthouse_port',
    label: 'Lighthouse Port',
    properties: [
      { id: 'dock_coffee_stand', name: 'Dock Coffee Stand', emoji: '☕', baseCost: 150000, baseProfitPerMin: 3000, description: 'Coffee through the window, every ferry.' },
      { id: 'paperback_stall', name: 'Paperback & Postcard Stall', emoji: '📚', baseCost: 450000, baseProfitPerMin: 9000, description: 'Beach reads and postcards for the journey.' },
      { id: 'port_food_plaza', name: 'Port Food Plaza', emoji: '🍱', baseCost: 1250000, baseProfitPerMin: 25000, description: 'Quick meals between sailings.' },
      { id: 'souvenir_shop', name: 'Lighthouse Souvenir Shop', emoji: '🎁', baseCost: 3000000, baseProfitPerMin: 60000, description: 'Shells, gifts, and last-minute treasures.' },
      { id: 'water_taxi_booking', name: 'Water Taxi Booking', emoji: '🚤', baseCost: 7500000, baseProfitPerMin: 150000, description: 'Rides booked the moment you dock.' },
      { id: 'lighthouse_inn', name: 'Lighthouse Inn', emoji: '🏨', baseCost: 20000000, baseProfitPerMin: 400000, description: 'A room steps from the water.' },
      { id: 'cargo_dock', name: 'Cargo Dock', emoji: '⚓', baseCost: 50000000, baseProfitPerMin: 1000000, description: 'Freight loaded onto every outbound ship.' },
      { id: 'port_commercial_hub', name: 'Port Commercial Hub', emoji: '🚢', baseCost: 125000000, baseProfitPerMin: 2500000, description: 'A small city built around the harbor.' },
    ],
  },
  {
    districtId: 'town_hall',
    label: 'Town Hall District',
    properties: [
      { id: 'permit_office_copies', name: 'Permit Copy Shop', emoji: '📑', baseCost: 37500, baseProfitPerMin: 750, description: 'Copies and permits, no queue.' },
      { id: 'notary_stand', name: 'Notary & Forms Stand', emoji: '🖨️', baseCost: 87500, baseProfitPerMin: 1750, description: 'Applications filled out fast.' },
      { id: 'civic_bookstore', name: 'Civic Bookstore', emoji: '📚', baseCost: 200000, baseProfitPerMin: 4000, description: 'Reference texts for every ordinance.' },
      { id: 'clerks_cafe', name: "Clerks' Café", emoji: '☕', baseCost: 450000, baseProfitPerMin: 9000, description: 'Where town business gets discussed over coffee.' },
      { id: 'legal_consultancy', name: 'Coastal Legal Consultancy', emoji: '🏢', baseCost: 1000000, baseProfitPerMin: 21250, description: 'Advice for businesses and residents.' },
      { id: 'corporate_law_office', name: 'Corporate Law Office', emoji: '🏛️', baseCost: 2000000, baseProfitPerMin: 42500, description: 'Contracts and compliance for big clients.' },
      { id: 'dispute_resolution_center', name: 'Dispute Resolution Center', emoji: '⚖️', baseCost: 5000000, baseProfitPerMin: 105000, description: 'Disputes settled outside the courtroom.' },
      { id: 'civic_tower', name: 'Coral Bay Civic Tower', emoji: '🏢', baseCost: 11250000, baseProfitPerMin: 225000, description: 'The tallest address for town business.' },
    ],
  },
  {
    districtId: 'old_fishing_village',
    label: 'Old Fishing Village — Heritage',
    properties: [
      { id: 'candy_shop', name: 'Saltwater Taffy Shop', emoji: '🍬', baseCost: 125000, baseProfitPerMin: 2500, description: 'Sweet treats from a century-old recipe.' },
      { id: 'spice_and_smoke', name: 'Smokehouse & Spice Store', emoji: '🌶️', baseCost: 375000, baseProfitPerMin: 7500, description: 'Smoked fish and spice blends, sold by the sack.' },
      { id: 'handicraft_shop', name: 'Shell Craft Shop', emoji: '🐚', baseCost: 1000000, baseProfitPerMin: 20000, description: 'Handmade shell jewelry and driftwood art.' },
      { id: 'weavers_shop', name: "Weaver's Textile Shop", emoji: '🧵', baseCost: 2000000, baseProfitPerMin: 40000, description: 'Woven mats and cloth from local artisans.' },
      { id: 'antique_store', name: 'Maritime Antique Store', emoji: '⚓', baseCost: 5000000, baseProfitPerMin: 100000, description: "Old Coral Bay's treasures, carefully kept." },
      { id: 'heritage_restaurant', name: 'Heritage Seafood Restaurant', emoji: '🍤', baseCost: 15000000, baseProfitPerMin: 300000, description: 'Recipes passed down four generations of fishermen.' },
      { id: 'heritage_market', name: 'Heritage Fish Market', emoji: '🏛️', baseCost: 37500000, baseProfitPerMin: 750000, description: 'A living museum you can shop in.' },
      { id: 'cultural_plaza', name: 'Cultural Plaza', emoji: '🎭', baseCost: 100000000, baseProfitPerMin: 2000000, description: 'Festivals and shows, year-round.' },
    ],
  },
];

export function getDistrictEconomy(districtId: string): DistrictEconomy | undefined {
  return districtEconomies.find((d) => d.districtId === districtId);
}

const TIER_THEME: { color: string; gradient: string }[] = [
  { color: '#14b8a6', gradient: 'from-teal-500 to-teal-600' },
  { color: '#f59e0b', gradient: 'from-amber-500 to-amber-600' },
  { color: '#0ea5e9', gradient: 'from-sky-500 to-sky-600' },
  { color: '#22c55e', gradient: 'from-green-500 to-green-600' },
  { color: '#f97316', gradient: 'from-orange-500 to-orange-600' },
  { color: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
  { color: '#eab308', gradient: 'from-yellow-400 to-amber-500' },
  { color: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
];

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
      level: 0,
      status: 'locked',
      description: p.description,
      themeColor: theme.color,
      gradient: theme.gradient,
    };
  });
}
