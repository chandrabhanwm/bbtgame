/**
 * City Map data model.
 *
 * This is the single source of truth for the City Map screen. Adding a new
 * district or city later means editing this file only — CityMapScreen,
 * DistrictNode, and RoadPath all render purely from this data and never
 * hardcode positions or connections.
 */

export type DistrictStatus = 'locked' | 'unlocked' | 'completed';

export type UnlockRequirementType = 'always' | 'net_worth' | 'district_completed' | 'player_level';

export interface UnlockRequirement {
  type: UnlockRequirementType;
  /** Cash threshold for 'net_worth', or level number for 'player_level'. */
  value?: number;
  /** District id that must be completed, for 'district_completed'. */
  districtId?: string;
  /** Human-readable label for locked-district messaging, e.g. "$500,000 Net Worth". */
  label: string;
}

export interface District {
  id: string;
  name: string;
  /** Lucide icon name, resolved to a component in DistrictNode. */
  icon: DistrictIconName;
  /** Display emoji for headers/labels, e.g. "⚓" for Harbor Pier. */
  emoji: string;
  /** Position in an abstract map coordinate space (not pixels/screen space). */
  x: number;
  y: number;
  /**
   * Base/initial unlock state — true only for the starting district.
   * This is NOT the live unlock status once the progression engine is
   * running; DistrictContext's isDistrictUnlocked() is the source of
   * truth at runtime. Kept here as the seed value and as a fallback.
   */
  unlocked: boolean;
  completed: boolean;
  /** Short flavor text shown in the district preview/details. */
  description: string;
  /** What it takes to unlock this district. Omitted/'always' for districts
   *  that start unlocked. */
  unlockRequirement?: UnlockRequirement;
}

export type DistrictIconName =
  | 'anchor'
  | 'fish'
  | 'landmark'
  | 'trees'
  | 'store'
  | 'sailboat'
  | 'hospital'
  | 'building'
  | 'ship'
  | 'factory';

export interface Road {
  id: string;
  from: string;
  to: string;
}

export interface City {
  id: string;
  name: string;
  districts: District[];
  roads: Road[];
}

// Unlock thresholds below are a reasonable starting progression curve, not
// numbers you specified beyond the one net-worth example — easy to retune,
// since every district reads from exactly one field here. Ordered roughly
// by road distance from Harbor Pier so district_completed chains follow
// adjacent roads rather than jumping across the map.
const districts: District[] = [
  { id: 'lighthouse_port', name: 'Lighthouse Port', icon: 'ship', emoji: '🚢', x: 60, y: 60, unlocked: false, completed: false, description: 'A busy harbor where every ship brings new visitors to Coral Bay.', unlockRequirement: { type: 'district_completed', districtId: 'old_fishing_village', label: 'Complete Old Fishing Village' } },
  { id: 'boatworks', name: 'Boatworks', icon: 'factory', emoji: '🛠️', x: 360, y: 60, unlocked: false, completed: false, description: 'The industrial yard powering boatbuilding and repair for the whole coast.', unlockRequirement: { type: 'district_completed', districtId: 'lighthouse_port', label: 'Complete Lighthouse Port' } },
  { id: 'old_fishing_village', name: 'Old Fishing Village', icon: 'building', emoji: '🏘️', x: 60, y: 210, unlocked: false, completed: false, description: 'The old harbor — heritage crafts and recipes passed down for generations.', unlockRequirement: { type: 'district_completed', districtId: 'seaside_clinic', label: 'Complete Seaside Clinic' } },
  { id: 'seaside_clinic', name: 'Seaside Clinic', icon: 'hospital', emoji: '🏥', x: 330, y: 210, unlocked: false, completed: false, description: "The coast's medical hub, from the beach pharmacy to the specialty wing.", unlockRequirement: { type: 'district_completed', districtId: 'ferry_terminal', label: 'Complete Ferry Terminal' } },
  { id: 'ferry_terminal', name: 'Ferry Terminal', icon: 'sailboat', emoji: '⛴️', x: 210, y: 360, unlocked: false, completed: false, description: "Coral Bay's transit hub — diners, water taxis, and travelers passing through all day.", unlockRequirement: { type: 'district_completed', districtId: 'boardwalk_plaza', label: 'Complete Boardwalk Plaza' } },
  { id: 'boardwalk_plaza', name: 'Boardwalk Plaza', icon: 'store', emoji: '🛍️', x: 210, y: 510, unlocked: false, completed: false, description: "The paved boardwalk strip — fashion, electronics, and Coral Bay's biggest mall.", unlockRequirement: { type: 'district_completed', districtId: 'palm_gardens', label: 'Complete Palm Gardens' } },
  { id: 'palm_gardens', name: 'Palm Gardens', icon: 'trees', emoji: '🌴', x: 210, y: 660, unlocked: false, completed: false, description: 'A leafy palm-lined district built for families, food, and weekend leisure.', unlockRequirement: { type: 'district_completed', districtId: 'town_hall', label: 'Complete Town Hall' } },
  { id: 'town_hall', name: 'Town Hall', icon: 'landmark', emoji: '⚖️', x: 60, y: 810, unlocked: false, completed: false, description: "Where Coral Bay's civic business gets done, one permit at a time.", unlockRequirement: { type: 'district_completed', districtId: 'fish_market', label: 'Complete Fish Market' } },
  { id: 'fish_market', name: 'Fish Market', icon: 'fish', emoji: '🐟', x: 210, y: 810, unlocked: false, completed: false, description: 'A wholesale hub — fresh catch, textiles, and the shops that supply the rest of the coast.', unlockRequirement: { type: 'district_completed', districtId: 'harbor_pier', label: 'Complete Harbor Pier' } },
  { id: 'harbor_pier', name: 'Harbor Pier', icon: 'anchor', emoji: '⚓', x: 360, y: 810, unlocked: true, completed: false, description: 'The entry pier where every Coral Bay business empire begins.', unlockRequirement: { type: 'always', label: 'Starting district' } },
];

const roads: Road[] = [
  { id: 'road_lighthouse_oldvillage', from: 'lighthouse_port', to: 'old_fishing_village' },
  { id: 'road_boatworks_clinic', from: 'boatworks', to: 'seaside_clinic' },
  { id: 'road_oldvillage_clinic', from: 'old_fishing_village', to: 'seaside_clinic' },
  { id: 'road_oldvillage_ferry', from: 'old_fishing_village', to: 'ferry_terminal' },
  { id: 'road_clinic_ferry', from: 'seaside_clinic', to: 'ferry_terminal' },
  { id: 'road_ferry_boardwalk', from: 'ferry_terminal', to: 'boardwalk_plaza' },
  { id: 'road_boardwalk_palmgardens', from: 'boardwalk_plaza', to: 'palm_gardens' },
  { id: 'road_palmgardens_townhall', from: 'palm_gardens', to: 'town_hall' },
  { id: 'road_townhall_fishmarket', from: 'town_hall', to: 'fish_market' },
  { id: 'road_fishmarket_harborpier', from: 'fish_market', to: 'harbor_pier' },
  { id: 'road_lighthouse_boatworks', from: 'lighthouse_port', to: 'boatworks' },
];

export const coralBayCity: City = {
  id: 'coral_bay',
  name: 'Coral Bay',
  districts,
  roads,
};

export function getDistrict(city: City, id: string): District | undefined {
  return city.districts.find((d) => d.id === id);
}

/** A road counts as "alive" if either end is unlocked — the frontier road
 *  leading toward the next district glows and carries traffic, inviting
 *  the player toward it, while everything further out stays dim.
 *  isUnlocked is injected so callers can use live/dynamic unlock status
 *  (from DistrictContext) rather than the static seed flag on District. */
export function isRoadActive(city: City, road: Road, isUnlocked: (districtId: string) => boolean): boolean {
  const from = getDistrict(city, road.from);
  const to = getDistrict(city, road.to);
  if (!from || !to) return false;
  return isUnlocked(from.id) || isUnlocked(to.id);
}
