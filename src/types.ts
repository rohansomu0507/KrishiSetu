export type UserRole = 'government' | 'seller' | 'buyer';

export type CropType = 'tomatoes' | 'onions' | 'potatoes' | 'chillies' | 'cauliflower';

export interface CropConfig {
  id: CropType;
  name: string;
  hindiName: string;
  varieties: string[];
  basePricePerQuintal: number; // in INR
  priceVolatility: 'High' | 'Medium' | 'Low';
  ambientPerishabilityRatePercentPerDay: number; // % weight/quality loss per day at ambient
  coldStorePerishabilityRatePercentPerDay: number;
  maxRecommendedHoldDays: number;
  description: string;
}

export interface DayForecast {
  dayOffset: number; // 0 = Harvest Day, 1 = +1 Day, etc.
  dateStr: string;
  expectedPrice: number; // ₹/quintal
  minPrice: number; // lower 95% bound
  maxPrice: number; // upper 95% bound
  benchmarkPrice: number; // 3-year historical moving average baseline
  expectedArrivals: number; // quintals/day
  normalArrivals: number;
  arrivalGlutAlert: boolean;
  priceMovementAlert: 'surge' | 'slump' | 'stable';
  confidencePercent: number;
}

export interface Mandi {
  id: string;
  name: string;
  district: string;
  state: string;
  distanceKm: number;
  transitHours: number;
  handlingCapacityTonnesPerDay: number;
  mandiCessPercent: number;
  unloadingChargePerQuintal: number;
  coldStorageAvailable: boolean;
  buyerLiquidity: 'Very High' | 'High' | 'Moderate';
  dailyForecasts: DayForecast[];
}

export interface OriginCluster {
  id: string;
  name: string;
  state: string;
  district: string;
  defaultCrop: CropType;
  mandis: Mandi[];
}

export interface AllocationItem {
  dayOffset: number;
  dateStr: string;
  mandiId: string;
  mandiName: string;
  distanceKm: number;
  quantityTonnes: number;
  quantityQuintals: number;
  expectedPricePerQuintal: number;
  grossValue: number;
  freightCost: number;
  handlingCost: number;
  storageCost: number;
  decayLossValue: number;
  effectiveNetRealization: number;
  netRealizationPerQuintal: number;
  truckType: string;
}

export interface OptimizationResult {
  totalTonnage: number;
  totalGrossValue: number;
  totalFreightCost: number;
  totalHandlingCost: number;
  totalStorageCost: number;
  totalSpoilageLoss: number;
  totalNetRealization: number;
  averageNetPerQuintal: number;
  allocations: AllocationItem[];
  strategyHeadline: string;
  comparison: {
    sellTodayNearestNet: number;
    sellTodayNearestPerQ: number;
    holdAllPeakNet: number;
    holdAllPeakPerQ: number;
    optimalNet: number;
    optimalPerQ: number;
    netGainOverImmediateSale: number;
    netGainPercent: number;
  };
  rationalePoints: string[];
}

export interface FarmerScenarioState {
  cropId: CropType;
  variety: string;
  quantityTonnes: number;
  originClusterId: string;
  harvestDateStr: string; // ISO YYYY-MM-DD
  sellingDateOffset: number; // 0 = sell on harvest date, 1 = +1 day, etc.
  freightAdjustmentPercent: number; // e.g. -20% to +40%
  selectedMandiIds: string[];
  useColdStorage: boolean;
}

export interface HistoricalPriceArrivalPoint {
  date: string;
  daysAgo: number;
  price: number;
  arrivals: number;
  mandiId: string;
}

export interface AIAdvisorResponse {
  source?: string;
  status?: string;
  strategyHeadline?: string;
  executiveSummary?: string;
  justification?: string[];
  stressTests?: Array<{
    condition: string;
    impact: string;
  }>;
  actionChecklist?: string[];
}
