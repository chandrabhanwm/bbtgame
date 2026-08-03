/**
 * Strategy-layer data — multi-level businesses (6 fixed levels each) plus
 * cross-business synergy bonuses, for all 10 districts. Verified extensively
 * via simulation against the game's real pool mechanics (2hr cooldown, 8%
 * dynamic ceiling, 5 daily doubles at +50%) before implementation.
 *
 * All values here are already scaled by 1.9x from the originally-designed
 * numbers, per the deliberate decision to bring the total game economy to
 * roughly ₹100-110 Cr rather than ₹200+ Cr — this scaling preserves every
 * verified pacing and balance result exactly, since it divides every cost
 * AND every income value by the same factor.
 */
import { SynergyRule } from '../types';

export interface StrategyLevelData {
  id: string;
  buyCost: number;
  upgradeCosts: number[]; // 5 entries: L1→L2 through L5→L6
  income: number[]; // 6 entries: income/min at L1..L6, before synergy
}

export const strategyLayerLevels: Record<string, StrategyLevelData[]> = {
  badeban: [
    { id: 'tea_stall', buyCost: 6800, upgradeCosts: [1600, 4200, 6300, 8400, 12100], income: [146, 191, 267, 346, 423, 571] },
    { id: 'kirana_store', buyCost: 13200, upgradeCosts: [3700, 8400, 12600, 17400, 23700], income: [239, 345, 497, 655, 813, 1097] },
    { id: 'dairy_shop', buyCost: 26300, upgradeCosts: [7900, 15800, 23700, 31600, 42100], income: [376, 601, 888, 1184, 1471, 1985] },
    { id: 'bakery', buyCost: 52600, upgradeCosts: [15800, 31600, 42100, 57900, 73700], income: [585, 1036, 1609, 2136, 2662, 3594] },
    { id: 'bike_repair', buyCost: 105300, upgradeCosts: [31600, 63200, 84200, 110500, 142100], income: [877, 1779, 2927, 3980, 4985, 6729] },
    { id: 'medical', buyCost: 210500, upgradeCosts: [63200, 121100, 157900, 210500, 263200], income: [1234, 3038, 5238, 7212, 9126, 12319] },
    { id: 'restaurant', buyCost: 421100, upgradeCosts: [131600, 236800, 315800, 394700, 500000], income: [1794, 5553, 9859, 13806, 17395, 23483] },
    { id: 'budget_lodge', buyCost: 789500, upgradeCosts: [236800, 447400, 578900, 684200, 842100], income: [2632, 9398, 17532, 24769, 30989, 41835] },
  ],
  katra: [
    { id: 'vegetable_market', buyCost: 10500, upgradeCosts: [3200, 6300, 8400, 11100, 14700], income: [213, 276, 387, 503, 614, 828] },
    { id: 'fruit_shop', buyCost: 23700, upgradeCosts: [7400, 13700, 18900, 24700, 33200], income: [407, 529, 741, 963, 1174, 1585] },
    { id: 'general_store', buyCost: 46100, upgradeCosts: [13700, 26800, 36800, 48400, 64200], income: [621, 807, 1131, 1469, 1793, 2420] },
    { id: 'footwear_shop', buyCost: 92100, upgradeCosts: [27900, 53700, 73700, 96800, 128900], income: [965, 1254, 1756, 2283, 2785, 3759] },
    { id: 'garment_store', buyCost: 184200, upgradeCosts: [55300, 106800, 147400, 193700, 257900], income: [1443, 1875, 2625, 3413, 4163, 5621] },
    { id: 'mini_bank', buyCost: 394700, upgradeCosts: [118400, 228900, 315800, 414700, 552600], income: [2197, 2857, 3999, 5199, 6343, 8563] },
    { id: 'shopping_complex_katra', buyCost: 1052600, upgradeCosts: [315800, 610500, 842100, 1105300, 1473700], income: [4270, 5551, 7772, 10103, 12326, 16640] },
    { id: 'commercial_plaza', buyCost: 2368400, upgradeCosts: [710500, 1373700, 1894700, 2486800, 3315800], income: [7373, 9585, 13419, 17445, 21283, 28732] },
  ],
  court_area: [
    { id: 'photocopy_shop', buyCost: 19700, upgradeCosts: [5800, 11600, 15800, 20500, 27900], income: [377, 491, 687, 893, 1089, 1471] },
    { id: 'typing_center', buyCost: 46100, upgradeCosts: [13700, 26800, 36800, 48400, 64200], income: [748, 973, 1363, 1772, 2162, 2918] },
    { id: 'law_book_store', buyCost: 105300, upgradeCosts: [31600, 61100, 84200, 110500, 147400], income: [1344, 1747, 2446, 3180, 3879, 5237] },
    { id: 'lawyers_cafe', buyCost: 236800, upgradeCosts: [71100, 137400, 189500, 248900, 331600], income: [2347, 3052, 4272, 5554, 6775, 9147] },
    { id: 'legal_consultancy', buyCost: 526300, upgradeCosts: [157900, 305300, 421100, 552600, 736800], income: [3901, 5071, 7099, 9228, 11258, 15199] },
    { id: 'corporate_law_office', buyCost: 1052600, upgradeCosts: [315800, 610500, 842100, 1105300, 1473700], income: [5545, 7209, 10093, 13121, 16007, 21609] },
    { id: 'arbitration_center', buyCost: 2631600, upgradeCosts: [789500, 1526300, 2105300, 2763200, 3684200], income: [10103, 13134, 18388, 23904, 29163, 39371] },
    { id: 'legal_business_tower', buyCost: 5921100, upgradeCosts: [1776300, 3434200, 4736800, 6217400, 8289500], income: [17446, 22679, 31751, 41276, 50357, 67983] },
  ],
  company_bagh: [
    { id: 'ice_cream_parlour', buyCost: 32900, upgradeCosts: [10000, 18900, 26300, 34700, 46300], income: [596, 775, 1085, 1411, 1722, 2324] },
    { id: 'cafe', buyCost: 78900, upgradeCosts: [23700, 45800, 63200, 83200, 110500], income: [1218, 1583, 2216, 2881, 3515, 4745] },
    { id: 'nursery', buyCost: 197400, upgradeCosts: [59500, 114200, 157900, 207400, 276300], income: [2392, 3109, 4353, 5658, 6903, 9319] },
    { id: 'kids_zone', buyCost: 526300, upgradeCosts: [157900, 305300, 421100, 552600, 736800], income: [4951, 6436, 9011, 11714, 14292, 19294] },
    { id: 'food_court', buyCost: 1052600, upgradeCosts: [315800, 610500, 842100, 1105300, 1473700], income: [7404, 9625, 13475, 17518, 21372, 28852] },
    { id: 'gym', buyCost: 2631600, upgradeCosts: [789500, 1526300, 2105300, 2763200, 3684200], income: [13158, 17105, 23947, 31132, 37981, 51274] },
    { id: 'mini_cinema', buyCost: 6578900, upgradeCosts: [1973700, 3815800, 5263200, 6907900, 9210500], income: [23974, 31166, 43633, 56723, 69202, 93422] },
    { id: 'premium_hotel', buyCost: 15789500, upgradeCosts: [4736800, 9157900, 12631600, 16578900, 22105300], income: [44157, 57404, 80365, 104475, 127459, 172069] },
  ],
  pakke_bazar: [
    { id: 'ladies_fashion', buyCost: 39500, upgradeCosts: [12100, 23200, 31600, 41600, 55300], income: [681, 885, 1239, 1612, 1966, 2655] },
    { id: 'cosmetics', buyCost: 98700, upgradeCosts: [29500, 57400, 78900, 103700, 138400], income: [1448, 1883, 2636, 3427, 4182, 5645] },
    { id: 'mobile_shop', buyCost: 263200, upgradeCosts: [78900, 152600, 210500, 276300, 368400], income: [3035, 3945, 5523, 7180, 8759, 11825] },
    { id: 'electronics', buyCost: 657900, upgradeCosts: [197400, 381600, 526300, 691100, 921100], income: [5889, 7656, 10719, 13935, 17001, 22951] },
    { id: 'watch_store', buyCost: 1578900, upgradeCosts: [473700, 915800, 1263200, 1657900, 2210500], income: [10569, 13739, 19235, 25006, 30507, 41184] },
    { id: 'jewellery', buyCost: 3947400, upgradeCosts: [1184200, 2289500, 3157900, 4144700, 5526300], income: [18782, 24416, 34183, 44437, 54214, 73188] },
    { id: 'department_store', buyCost: 9868400, upgradeCosts: [2960500, 5723700, 7894700, 10362100, 13815800], income: [34221, 44487, 62282, 80967, 98779, 133352] },
    { id: 'luxury_mall', buyCost: 26315800, upgradeCosts: [7894700, 15263200, 21052600, 27631600, 36842100], income: [70034, 91045, 127463, 165702, 202156, 272911] },
  ],
  bus_stand: [
    { id: 'bus_cafe', buyCost: 46100, upgradeCosts: [13700, 26800, 36800, 48400, 64200], income: [764, 994, 1391, 1808, 2206, 2978] },
    { id: 'dhaba', buyCost: 118400, upgradeCosts: [35800, 68400, 94700, 124200, 165800], income: [1671, 2172, 3040, 3952, 4822, 6509] },
    { id: 'luggage_store', buyCost: 328900, upgradeCosts: [98900, 191100, 263200, 345300, 460500], income: [3646, 4740, 6636, 8626, 10524, 14208] },
    { id: 'taxi_stand', buyCost: 789500, upgradeCosts: [236800, 457900, 631600, 828900, 1105300], income: [6793, 8831, 12364, 16073, 19608, 26472] },
    { id: 'petrol_pump', buyCost: 1973700, upgradeCosts: [592100, 1144700, 1578900, 2072600, 2763200], income: [12699, 16508, 23112, 30045, 36655, 49485] },
    { id: 'transit_hotel', buyCost: 5263200, upgradeCosts: [1578900, 3052600, 4210500, 5526300, 7368400], income: [24072, 31293, 43811, 56954, 69484, 93803] },
    { id: 'bus_depot', buyCost: 13157900, upgradeCosts: [3947400, 7631600, 10526300, 13815800, 18421100], income: [43859, 57017, 79824, 103772, 126602, 170912] },
    { id: 'transport_terminal', buyCost: 39473700, upgradeCosts: [11842100, 22894700, 31578900, 41447400, 55263200], income: [100979, 131273, 183782, 238916, 291478, 393495] },
  ],
  district_hospital: [
    { id: 'pharmacy', buyCost: 52600, upgradeCosts: [15800, 30500, 42100, 55300, 73700], income: [847, 1101, 1542, 2004, 2445, 3301] },
    { id: 'diagnostic_lab', buyCost: 131600, upgradeCosts: [39500, 76300, 105300, 138400, 184200], income: [1801, 2341, 3277, 4260, 5197, 7016] },
    { id: 'dental_clinic', buyCost: 328900, upgradeCosts: [98900, 191100, 263200, 345300, 460500], income: [3537, 4598, 6437, 8368, 10209, 13782] },
    { id: 'optical_store', buyCost: 789500, upgradeCosts: [236800, 457900, 631600, 828900, 1105300], income: [6589, 8566, 11992, 15590, 19020, 25677] },
    { id: 'ambulance_service', buyCost: 1973700, upgradeCosts: [592100, 1144700, 1578900, 2072600, 2763200], income: [12317, 16012, 22417, 29142, 35553, 47997] },
    { id: 'private_hospital', buyCost: 5263200, upgradeCosts: [1578900, 3052600, 4210500, 5526300, 7368400], income: [23348, 30352, 42493, 55241, 67394, 90982] },
    { id: 'medical_research_center', buyCost: 13157900, upgradeCosts: [3947400, 7631600, 10526300, 13815800, 18421100], income: [42541, 55303, 77424, 100651, 122794, 165772] },
    { id: 'super_specialty_hospital', buyCost: 39473700, upgradeCosts: [11842100, 22894700, 31578900, 41447400, 55263200], income: [97942, 127325, 178255, 231731, 282712, 381662] },
  ],
  purani_basti: [
    { id: 'sweet_shop', buyCost: 65800, upgradeCosts: [20000, 38400, 52600, 68900, 92100], income: [1035, 1346, 1884, 2449, 2988, 4034] },
    { id: 'spice_store', buyCost: 197400, upgradeCosts: [59500, 114200, 157900, 207400, 276300], income: [2641, 3433, 4806, 6248, 7623, 10291] },
    { id: 'handicraft_shop', buyCost: 526300, upgradeCosts: [157900, 305300, 421100, 552600, 736800], income: [5534, 7195, 10073, 13094, 15975, 21566] },
    { id: 'textile_shop', buyCost: 1052600, upgradeCosts: [315800, 610500, 842100, 1105300, 1473700], income: [8592, 11169, 15636, 20327, 24799, 33479] },
    { id: 'antique_store', buyCost: 2631600, upgradeCosts: [789500, 1526300, 2105300, 2763200, 3684200], income: [16061, 20879, 29231, 37999, 46359, 62585] },
    { id: 'heritage_restaurant', buyCost: 7894700, upgradeCosts: [2368400, 4578900, 6315800, 8289500, 11052600], income: [34249, 44524, 62334, 81034, 98861, 133463] },
    { id: 'heritage_market', buyCost: 19736800, upgradeCosts: [5921100, 11447400, 15789500, 20723700, 27631600], income: [62403, 81124, 113574, 147646, 180128, 243173] },
    { id: 'cultural_plaza', buyCost: 52631600, upgradeCosts: [15789500, 30526300, 42105300, 55263200, 73684200], income: [127709, 166022, 232430, 302159, 368634, 497655] },
  ],
  railway_station: [
    { id: 'platform_tea_stall', buyCost: 78900, upgradeCosts: [23700, 45800, 63200, 83200, 110500], income: [1224, 1592, 2228, 2897, 3534, 4771] },
    { id: 'book_stall', buyCost: 236800, upgradeCosts: [71100, 137400, 189500, 248900, 331600], income: [3124, 4061, 5685, 7391, 9017, 12173] },
    { id: 'food_plaza', buyCost: 657900, upgradeCosts: [197400, 381600, 526300, 691100, 921100], income: [6817, 8863, 12408, 16131, 19679, 26567] },
    { id: 'gift_shop', buyCost: 1578900, upgradeCosts: [473700, 915800, 1263200, 1657900, 2210500], income: [12700, 16510, 23114, 30048, 36659, 49489] },
    { id: 'cab_booking', buyCost: 3947400, upgradeCosts: [1184200, 2289500, 3157900, 4144700, 5526300], income: [23742, 30864, 43210, 56173, 68531, 92517] },
    { id: 'railway_hotel', buyCost: 10526300, upgradeCosts: [3157900, 6105300, 8421100, 11052600, 14736800], income: [45004, 58505, 81907, 106479, 129904, 175371] },
    { id: 'cargo_terminal', buyCost: 26315800, upgradeCosts: [7894700, 15263200, 21052600, 27631600, 36842100], income: [81998, 106598, 149237, 194008, 236689, 319531] },
    { id: 'railway_commercial_hub', buyCost: 65789500, upgradeCosts: [19736800, 38157900, 52631600, 69078900, 92105300], income: [157323, 204519, 286327, 372226, 454115, 613056] },
  ],
  plastic_complex: [
    { id: 'plastic_unit', buyCost: 131600, upgradeCosts: [39500, 76300, 105300, 138400, 184200], income: [2011, 2614, 3660, 4758, 5805, 7836] },
    { id: 'packaging_factory', buyCost: 394700, upgradeCosts: [118400, 228900, 315800, 414700, 552600], income: [5132, 6671, 9339, 12142, 14813, 19997] },
    { id: 'warehouse', buyCost: 1052600, upgradeCosts: [315800, 610500, 842100, 1105300, 1473700], income: [10752, 13978, 19569, 25439, 31036, 41899] },
    { id: 'manufacturing_plant', buyCost: 2631600, upgradeCosts: [789500, 1526300, 2105300, 2763200, 3684200], income: [20865, 27124, 37974, 49366, 60226, 81306] },
    { id: 'industrial_workshop', buyCost: 6578900, upgradeCosts: [1973700, 3815800, 5263200, 6907900, 9210500], income: [39004, 50705, 70987, 92283, 112585, 151990] },
    { id: 'logistics_hub', buyCost: 15789500, upgradeCosts: [4736800, 9157900, 12631600, 16578900, 22105300], income: [66542, 86504, 121106, 157437, 192074, 259299] },
    { id: 'industrial_park', buyCost: 39473700, upgradeCosts: [11842100, 22894700, 31578900, 41447400, 55263200], income: [121241, 157613, 220658, 286855, 349964, 472451] },
    { id: 'mega_industrial_estate', buyCost: 105263200, upgradeCosts: [31578900, 61052600, 84210500, 110526300, 147368400], income: [248121, 322557, 451579, 587053, 716205, 966876] },
  ],
};

export const strategyLayerSynergies: Record<string, SynergyRule[]> = {
  badeban: [
    { id: 'badeban_s1', name: 'Dairy Catalyst', requiresIds: ['dairy_shop'], targetId: 'tea_stall', bonusPercent: 0.25 },
    { id: 'badeban_s2', name: 'Dairy Catalyst', requiresIds: ['dairy_shop'], targetId: 'bakery', bonusPercent: 0.25 },
    { id: 'badeban_s3', name: 'Chai→Kirana Boost', requiresIds: ['tea_stall'], targetId: 'kirana_store', bonusPercent: 0.15 },
    { id: 'badeban_s4', name: 'Bakery Triple Combo', requiresIds: ['tea_stall', 'dairy_shop'], targetId: 'bakery', bonusPercent: 0.4 },
    { id: 'badeban_s5', name: 'Medical Safety Synergy', requiresIds: ['medical'], targetId: 'bike_repair', bonusPercent: 0.2 },
    { id: 'badeban_s6', name: 'Medical Safety Synergy', requiresIds: ['medical'], targetId: 'restaurant', bonusPercent: 0.2 },
    { id: 'badeban_s7', name: 'Grill Dining Combo', requiresIds: ['kirana_store', 'dairy_shop'], targetId: 'restaurant', bonusPercent: 0.5 },
    { id: 'badeban_s8', name: 'Grand Mahal Apex', requiresIds: ['restaurant', 'medical'], targetId: 'budget_lodge', bonusPercent: 0.6 },
  ],
  katra: [
    { id: 'katra_k1', name: 'Fresh Produce Duo', requiresIds: ['fruit_shop'], targetId: 'vegetable_market', bonusPercent: 0.25 },
    { id: 'katra_k2', name: 'Fresh Produce Duo', requiresIds: ['fruit_shop'], targetId: 'general_store', bonusPercent: 0.25 },
    { id: 'katra_k3', name: 'Market Footfall', requiresIds: ['vegetable_market'], targetId: 'fruit_shop', bonusPercent: 0.15 },
    { id: 'katra_k4', name: 'Triple Market Combo', requiresIds: ['vegetable_market', 'fruit_shop'], targetId: 'general_store', bonusPercent: 0.4 },
    { id: 'katra_k5', name: 'Banking Access', requiresIds: ['mini_bank'], targetId: 'footwear_shop', bonusPercent: 0.2 },
    { id: 'katra_k6', name: 'Banking Access', requiresIds: ['mini_bank'], targetId: 'garment_store', bonusPercent: 0.2 },
    { id: 'katra_k7', name: 'Fashion District Combo', requiresIds: ['footwear_shop', 'garment_store'], targetId: 'shopping_complex_katra', bonusPercent: 0.5 },
    { id: 'katra_k8', name: 'Commercial Apex', requiresIds: ['shopping_complex_katra', 'mini_bank'], targetId: 'commercial_plaza', bonusPercent: 0.6 },
  ],
  court_area: [
    { id: 'court_area_c1', name: 'Paperwork Duo', requiresIds: ['typing_center'], targetId: 'photocopy_shop', bonusPercent: 0.25 },
    { id: 'court_area_c2', name: 'Paperwork Duo', requiresIds: ['typing_center'], targetId: 'law_book_store', bonusPercent: 0.25 },
    { id: 'court_area_c3', name: 'Document Flow', requiresIds: ['photocopy_shop'], targetId: 'typing_center', bonusPercent: 0.15 },
    { id: 'court_area_c4', name: 'Research Triple Combo', requiresIds: ['photocopy_shop', 'typing_center'], targetId: 'law_book_store', bonusPercent: 0.4 },
    { id: 'court_area_c5', name: 'Legal Network', requiresIds: ['legal_consultancy'], targetId: 'lawyers_cafe', bonusPercent: 0.2 },
    { id: 'court_area_c6', name: 'Legal Network', requiresIds: ['legal_consultancy'], targetId: 'corporate_law_office', bonusPercent: 0.2 },
    { id: 'court_area_c7', name: 'Dispute Resolution Combo', requiresIds: ['lawyers_cafe', 'corporate_law_office'], targetId: 'arbitration_center', bonusPercent: 0.5 },
    { id: 'court_area_c8', name: 'Legal Apex', requiresIds: ['arbitration_center', 'legal_consultancy'], targetId: 'legal_business_tower', bonusPercent: 0.6 },
  ],
  company_bagh: [
    { id: 'company_bagh_cb1', name: 'Sweet Treats Duo', requiresIds: ['cafe'], targetId: 'ice_cream_parlour', bonusPercent: 0.25 },
    { id: 'company_bagh_cb2', name: 'Sweet Treats Duo', requiresIds: ['cafe'], targetId: 'food_court', bonusPercent: 0.25 },
    { id: 'company_bagh_cb3', name: 'Park Refreshment', requiresIds: ['ice_cream_parlour'], targetId: 'cafe', bonusPercent: 0.15 },
    { id: 'company_bagh_cb4', name: 'Food & Fun Combo', requiresIds: ['ice_cream_parlour', 'cafe'], targetId: 'food_court', bonusPercent: 0.4 },
    { id: 'company_bagh_cb5', name: 'Family Fun Synergy', requiresIds: ['kids_zone'], targetId: 'nursery', bonusPercent: 0.2 },
    { id: 'company_bagh_cb6', name: 'Family Fun Synergy', requiresIds: ['kids_zone'], targetId: 'gym', bonusPercent: 0.2 },
    { id: 'company_bagh_cb7', name: 'Wellness Combo', requiresIds: ['nursery', 'gym'], targetId: 'mini_cinema', bonusPercent: 0.5 },
    { id: 'company_bagh_cb8', name: 'Premium Getaway Apex', requiresIds: ['mini_cinema', 'kids_zone'], targetId: 'premium_hotel', bonusPercent: 0.6 },
  ],
  pakke_bazar: [
    { id: 'pakke_bazar_pb1', name: 'Style Duo', requiresIds: ['cosmetics'], targetId: 'ladies_fashion', bonusPercent: 0.25 },
    { id: 'pakke_bazar_pb2', name: 'Style Duo', requiresIds: ['cosmetics'], targetId: 'watch_store', bonusPercent: 0.25 },
    { id: 'pakke_bazar_pb3', name: 'Fashion Footfall', requiresIds: ['ladies_fashion'], targetId: 'cosmetics', bonusPercent: 0.15 },
    { id: 'pakke_bazar_pb4', name: 'Complete Look Combo', requiresIds: ['ladies_fashion', 'cosmetics'], targetId: 'watch_store', bonusPercent: 0.4 },
    { id: 'pakke_bazar_pb5', name: 'Tech Bundle', requiresIds: ['electronics'], targetId: 'mobile_shop', bonusPercent: 0.2 },
    { id: 'pakke_bazar_pb6', name: 'Tech Bundle', requiresIds: ['electronics'], targetId: 'department_store', bonusPercent: 0.2 },
    { id: 'pakke_bazar_pb7', name: 'Accessory Elite Combo', requiresIds: ['watch_store', 'mobile_shop'], targetId: 'jewellery', bonusPercent: 0.5 },
    { id: 'pakke_bazar_pb8', name: 'Retail Apex', requiresIds: ['jewellery', 'department_store'], targetId: 'luxury_mall', bonusPercent: 0.6 },
  ],
  bus_stand: [
    { id: 'bus_stand_bs1', name: 'Traveler Refreshment Duo', requiresIds: ['dhaba'], targetId: 'bus_cafe', bonusPercent: 0.25 },
    { id: 'bus_stand_bs2', name: 'Traveler Refreshment Duo', requiresIds: ['dhaba'], targetId: 'luggage_store', bonusPercent: 0.25 },
    { id: 'bus_stand_bs3', name: 'Hungry Travelers', requiresIds: ['bus_cafe'], targetId: 'dhaba', bonusPercent: 0.15 },
    { id: 'bus_stand_bs4', name: 'Rest Stop Combo', requiresIds: ['bus_cafe', 'dhaba'], targetId: 'luggage_store', bonusPercent: 0.4 },
    { id: 'bus_stand_bs5', name: 'Fleet Fuel Synergy', requiresIds: ['petrol_pump'], targetId: 'taxi_stand', bonusPercent: 0.2 },
    { id: 'bus_stand_bs6', name: 'Fleet Fuel Synergy', requiresIds: ['petrol_pump'], targetId: 'bus_depot', bonusPercent: 0.2 },
    { id: 'bus_stand_bs7', name: 'Overnight Transit Combo', requiresIds: ['taxi_stand', 'bus_depot'], targetId: 'transit_hotel', bonusPercent: 0.5 },
    { id: 'bus_stand_bs8', name: 'Transport Apex', requiresIds: ['transit_hotel', 'petrol_pump'], targetId: 'transport_terminal', bonusPercent: 0.6 },
  ],
  district_hospital: [
    { id: 'district_hospital_dh1', name: 'Prescription Duo', requiresIds: ['diagnostic_lab'], targetId: 'pharmacy', bonusPercent: 0.25 },
    { id: 'district_hospital_dh2', name: 'Prescription Duo', requiresIds: ['diagnostic_lab'], targetId: 'optical_store', bonusPercent: 0.25 },
    { id: 'district_hospital_dh3', name: 'Health Checkup Flow', requiresIds: ['pharmacy'], targetId: 'diagnostic_lab', bonusPercent: 0.15 },
    { id: 'district_hospital_dh4', name: 'Full Body Checkup Combo', requiresIds: ['pharmacy', 'diagnostic_lab'], targetId: 'dental_clinic', bonusPercent: 0.4 },
    { id: 'district_hospital_dh5', name: 'Critical Care Network', requiresIds: ['private_hospital'], targetId: 'ambulance_service', bonusPercent: 0.2 },
    { id: 'district_hospital_dh6', name: 'Critical Care Network', requiresIds: ['private_hospital'], targetId: 'medical_research_center', bonusPercent: 0.2 },
    { id: 'district_hospital_dh7', name: 'Comprehensive Data Combo', requiresIds: ['diagnostic_lab', 'dental_clinic'], targetId: 'medical_research_center', bonusPercent: 0.5 },
    { id: 'district_hospital_dh8', name: 'Medical Apex', requiresIds: ['medical_research_center', 'private_hospital'], targetId: 'super_specialty_hospital', bonusPercent: 0.6 },
  ],
  purani_basti: [
    { id: 'purani_basti_pub1', name: 'Traditional Flavors Duo', requiresIds: ['spice_store'], targetId: 'sweet_shop', bonusPercent: 0.25 },
    { id: 'purani_basti_pub2', name: 'Traditional Flavors Duo', requiresIds: ['spice_store'], targetId: 'handicraft_shop', bonusPercent: 0.25 },
    { id: 'purani_basti_pub3', name: 'Local Market Buzz', requiresIds: ['sweet_shop'], targetId: 'spice_store', bonusPercent: 0.15 },
    { id: 'purani_basti_pub4', name: 'Authentic Bazaar Combo', requiresIds: ['sweet_shop', 'spice_store'], targetId: 'handicraft_shop', bonusPercent: 0.4 },
    { id: 'purani_basti_pub5', name: 'Heritage Craft Network', requiresIds: ['antique_store'], targetId: 'textile_shop', bonusPercent: 0.2 },
    { id: 'purani_basti_pub6', name: 'Heritage Craft Network', requiresIds: ['antique_store'], targetId: 'heritage_restaurant', bonusPercent: 0.2 },
    { id: 'purani_basti_pub7', name: 'Cultural Immersion Combo', requiresIds: ['textile_shop', 'heritage_restaurant'], targetId: 'heritage_market', bonusPercent: 0.5 },
    { id: 'purani_basti_pub8', name: 'Cultural Apex', requiresIds: ['heritage_market', 'antique_store'], targetId: 'cultural_plaza', bonusPercent: 0.6 },
  ],
  railway_station: [
    { id: 'railway_station_rs1', name: 'Platform Waiting Duo', requiresIds: ['book_stall'], targetId: 'platform_tea_stall', bonusPercent: 0.25 },
    { id: 'railway_station_rs2', name: 'Platform Waiting Duo', requiresIds: ['book_stall'], targetId: 'food_plaza', bonusPercent: 0.25 },
    { id: 'railway_station_rs3', name: 'Reader\'s Refreshment', requiresIds: ['platform_tea_stall'], targetId: 'book_stall', bonusPercent: 0.15 },
    { id: 'railway_station_rs4', name: 'Traveler Comfort Combo', requiresIds: ['platform_tea_stall', 'book_stall'], targetId: 'food_plaza', bonusPercent: 0.4 },
    { id: 'railway_station_rs5', name: 'Departure Rush Network', requiresIds: ['cab_booking'], targetId: 'gift_shop', bonusPercent: 0.2 },
    { id: 'railway_station_rs6', name: 'Departure Rush Network', requiresIds: ['cab_booking'], targetId: 'cargo_terminal', bonusPercent: 0.2 },
    { id: 'railway_station_rs7', name: 'Logistics Combo', requiresIds: ['gift_shop', 'cargo_terminal'], targetId: 'railway_hotel', bonusPercent: 0.5 },
    { id: 'railway_station_rs8', name: 'Railway Apex', requiresIds: ['railway_hotel', 'cargo_terminal'], targetId: 'railway_commercial_hub', bonusPercent: 0.6 },
  ],
  plastic_complex: [
    { id: 'plastic_complex_pc1', name: 'Material Supply Duo', requiresIds: ['packaging_factory'], targetId: 'plastic_unit', bonusPercent: 0.25 },
    { id: 'plastic_complex_pc2', name: 'Material Supply Duo', requiresIds: ['packaging_factory'], targetId: 'manufacturing_plant', bonusPercent: 0.25 },
    { id: 'plastic_complex_pc3', name: 'Production Flow', requiresIds: ['plastic_unit'], targetId: 'packaging_factory', bonusPercent: 0.15 },
    { id: 'plastic_complex_pc4', name: 'Full Production Combo', requiresIds: ['plastic_unit', 'packaging_factory'], targetId: 'manufacturing_plant', bonusPercent: 0.4 },
    { id: 'plastic_complex_pc5', name: 'Maintenance Network', requiresIds: ['industrial_workshop'], targetId: 'warehouse', bonusPercent: 0.2 },
    { id: 'plastic_complex_pc6', name: 'Maintenance Network', requiresIds: ['industrial_workshop'], targetId: 'logistics_hub', bonusPercent: 0.2 },
    { id: 'plastic_complex_pc7', name: 'Supply Chain Combo', requiresIds: ['warehouse', 'logistics_hub'], targetId: 'industrial_park', bonusPercent: 0.5 },
    { id: 'plastic_complex_pc8', name: 'Industrial Apex', requiresIds: ['industrial_park', 'industrial_workshop'], targetId: 'mega_industrial_estate', bonusPercent: 0.6 },
  ],
};
