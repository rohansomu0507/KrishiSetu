import { CropConfig, CropType, Mandi, OriginCluster, DayForecast, HistoricalPriceArrivalPoint } from '../types';

export const CROPS: Record<CropType, CropConfig> = {
  tomatoes: {
    id: 'tomatoes',
    name: 'Tomatoes',
    hindiName: 'टमाटर',
    varieties: ['Hybrid Shivam', 'Desi Local', 'Abhinav 1057', 'Saaho F1'],
    basePricePerQuintal: 2450,
    priceVolatility: 'High',
    ambientPerishabilityRatePercentPerDay: 4.2,
    coldStorePerishabilityRatePercentPerDay: 0.9,
    maxRecommendedHoldDays: 4,
    description: 'High perishability, rapid skin softening, highly sensitive to transport shocks and temperature.',
  },
  onions: {
    id: 'onions',
    name: 'Onions',
    hindiName: 'प्याज़',
    varieties: ['Nashik Red', 'Garwa Late Kharif', 'Bhima Super', 'White Onion'],
    basePricePerQuintal: 2150,
    priceVolatility: 'Medium',
    ambientPerishabilityRatePercentPerDay: 0.5,
    coldStorePerishabilityRatePercentPerDay: 0.15,
    maxRecommendedHoldDays: 30,
    description: 'Semi-perishable bulb crop. Can be held in aerated chawls for several weeks, price driven by terminal arrivals.',
  },
  potatoes: {
    id: 'potatoes',
    name: 'Potatoes',
    hindiName: 'आलू',
    varieties: ['Jyoti Special', 'Kufri Chipsona', 'Kufri Bahar', 'Lal Gulaab'],
    basePricePerQuintal: 1550,
    priceVolatility: 'Low',
    ambientPerishabilityRatePercentPerDay: 0.25,
    coldStorePerishabilityRatePercentPerDay: 0.08,
    maxRecommendedHoldDays: 45,
    description: 'Storable tuber. Cold storage access allows delaying sales by weeks to capture post-harvest price recovery.',
  },
  chillies: {
    id: 'chillies',
    name: 'Green Chillies',
    hindiName: 'हरी मिर्च',
    varieties: ['G4 Super Hot', 'Teja Fresh', 'Armoor Special', 'Bullet Chilli'],
    basePricePerQuintal: 4800,
    priceVolatility: 'High',
    ambientPerishabilityRatePercentPerDay: 3.1,
    coldStorePerishabilityRatePercentPerDay: 0.7,
    maxRecommendedHoldDays: 6,
    description: 'High-value spice vegetable. Sensitive to moisture loss and pod blackening during transit.',
  },
  cauliflower: {
    id: 'cauliflower',
    name: 'Cauliflower',
    hindiName: 'फूलगोभी',
    varieties: ['Snowball 16', 'Pusa Deepali', 'Madhuri Hybrid'],
    basePricePerQuintal: 1950,
    priceVolatility: 'Medium',
    ambientPerishabilityRatePercentPerDay: 3.5,
    coldStorePerishabilityRatePercentPerDay: 0.8,
    maxRecommendedHoldDays: 5,
    description: 'Bulky curd vegetable requiring prompt dispatch or cold chain to prevent yellowing and loose curds.',
  },
};

// Base Mandi Definitions for each cluster
export const REGIONAL_CLUSTERS: OriginCluster[] = [
  {
    id: 'kolar-south',
    name: 'Kolar & Chintamani Tomato Belt',
    district: 'Kolar',
    state: 'Karnataka',
    defaultCrop: 'tomatoes',
    mandis: [
      {
        id: 'kolar-apmc',
        name: 'Kolar APMC Yard',
        district: 'Kolar',
        state: 'Karnataka',
        distanceKm: 18,
        transitHours: 0.75,
        handlingCapacityTonnesPerDay: 140,
        mandiCessPercent: 1.5,
        unloadingChargePerQuintal: 28,
        coldStorageAvailable: false,
        buyerLiquidity: 'High',
        dailyForecasts: [],
      },
      {
        id: 'bangalore-yeshwanthpur',
        name: 'Bangalore Yeshwanthpur APMC',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        distanceKm: 74,
        transitHours: 2.5,
        handlingCapacityTonnesPerDay: 380,
        mandiCessPercent: 1.5,
        unloadingChargePerQuintal: 35,
        coldStorageAvailable: true,
        buyerLiquidity: 'Very High',
        dailyForecasts: [],
      },
      {
        id: 'madanapalle-apmc',
        name: 'Madanapalle APMC Market',
        district: 'Annamayya',
        state: 'Andhra Pradesh',
        distanceKm: 92,
        transitHours: 3.0,
        handlingCapacityTonnesPerDay: 260,
        mandiCessPercent: 1.0,
        unloadingChargePerQuintal: 30,
        coldStorageAvailable: false,
        buyerLiquidity: 'High',
        dailyForecasts: [],
      },
      {
        id: 'chennai-koyambedu',
        name: 'Chennai Koyambedu Terminal',
        district: 'Chennai',
        state: 'Tamil Nadu',
        distanceKm: 285,
        transitHours: 8.5,
        handlingCapacityTonnesPerDay: 650,
        mandiCessPercent: 1.0,
        unloadingChargePerQuintal: 42,
        coldStorageAvailable: true,
        buyerLiquidity: 'Very High',
        dailyForecasts: [],
      },
    ],
  },
  {
    id: 'nashik-west',
    name: 'Nashik & Niphad Onion Belt',
    district: 'Nashik',
    state: 'Maharashtra',
    defaultCrop: 'onions',
    mandis: [
      {
        id: 'lasalgaon-apmc',
        name: 'Lasalgaon APMC (Asia Onion Hub)',
        district: 'Nashik',
        state: 'Maharashtra',
        distanceKm: 24,
        transitHours: 0.9,
        handlingCapacityTonnesPerDay: 480,
        mandiCessPercent: 1.05,
        unloadingChargePerQuintal: 25,
        coldStorageAvailable: true,
        buyerLiquidity: 'Very High',
        dailyForecasts: [],
      },
      {
        id: 'pimpalgaon-apmc',
        name: 'Pimpalgaon Baswant APMC',
        district: 'Nashik',
        state: 'Maharashtra',
        distanceKm: 14,
        transitHours: 0.5,
        handlingCapacityTonnesPerDay: 320,
        mandiCessPercent: 1.05,
        unloadingChargePerQuintal: 24,
        coldStorageAvailable: false,
        buyerLiquidity: 'High',
        dailyForecasts: [],
      },
      {
        id: 'mumbai-vashi',
        name: 'Navi Mumbai Vashi APMC Terminal',
        district: 'Thane',
        state: 'Maharashtra',
        distanceKm: 178,
        transitHours: 5.5,
        handlingCapacityTonnesPerDay: 580,
        mandiCessPercent: 1.25,
        unloadingChargePerQuintal: 38,
        coldStorageAvailable: true,
        buyerLiquidity: 'Very High',
        dailyForecasts: [],
      },
      {
        id: 'surat-apmc',
        name: 'Surat APMC Agricultural Market',
        district: 'Surat',
        state: 'Gujarat',
        distanceKm: 235,
        transitHours: 7.0,
        handlingCapacityTonnesPerDay: 360,
        mandiCessPercent: 1.0,
        unloadingChargePerQuintal: 34,
        coldStorageAvailable: true,
        buyerLiquidity: 'High',
        dailyForecasts: [],
      },
    ],
  },
  {
    id: 'agra-north',
    name: 'Agra & Aligarh Potato Belt',
    district: 'Agra',
    state: 'Uttar Pradesh',
    defaultCrop: 'potatoes',
    mandis: [
      {
        id: 'agra-apmc',
        name: 'Agra Sikandra APMC Mandi',
        district: 'Agra',
        state: 'Uttar Pradesh',
        distanceKm: 16,
        transitHours: 0.6,
        handlingCapacityTonnesPerDay: 220,
        mandiCessPercent: 1.5,
        unloadingChargePerQuintal: 22,
        coldStorageAvailable: true,
        buyerLiquidity: 'High',
        dailyForecasts: [],
      },
      {
        id: 'aligarh-mandi',
        name: 'Aligarh APMC Yard',
        district: 'Aligarh',
        state: 'Uttar Pradesh',
        distanceKm: 78,
        transitHours: 2.2,
        handlingCapacityTonnesPerDay: 180,
        mandiCessPercent: 1.5,
        unloadingChargePerQuintal: 25,
        coldStorageAvailable: true,
        buyerLiquidity: 'Moderate',
        dailyForecasts: [],
      },
      {
        id: 'delhi-azadpur',
        name: 'Delhi Azadpur National Mandi',
        district: 'North Delhi',
        state: 'Delhi',
        distanceKm: 215,
        transitHours: 5.5,
        handlingCapacityTonnesPerDay: 950,
        mandiCessPercent: 1.0,
        unloadingChargePerQuintal: 40,
        coldStorageAvailable: true,
        buyerLiquidity: 'Very High',
        dailyForecasts: [],
      },
      {
        id: 'kanpur-apmc',
        name: 'Kanpur Chakeri Mandi',
        district: 'Kanpur',
        state: 'Uttar Pradesh',
        distanceKm: 250,
        transitHours: 6.5,
        handlingCapacityTonnesPerDay: 310,
        mandiCessPercent: 1.5,
        unloadingChargePerQuintal: 30,
        coldStorageAvailable: true,
        buyerLiquidity: 'High',
        dailyForecasts: [],
      },
    ],
  },
];

/**
 * Generates synthetic realistic 60-day historical time-series
 * demonstrating price-arrival inverse elasticity and seasonal waves.
 */
export function getHistoricalData(cropId: CropType, mandiId: string, days = 60): HistoricalPriceArrivalPoint[] {
  const crop = CROPS[cropId];
  const basePrice = crop.basePricePerQuintal;
  const history: HistoricalPriceArrivalPoint[] = [];

  // Deterministic seed based on string hash
  let seed = 0;
  for (let i = 0; i < (cropId + mandiId).length; i++) {
    seed = (seed << 5) - seed + (cropId + mandiId).charCodeAt(i);
  }

  const pseudoRandom = (step: number) => {
    const x = Math.sin(seed + step * 997) * 10000;
    return x - Math.floor(x);
  };

  const today = new Date();

  for (let i = days; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Day of week cycle: Sunday/Monday higher demand, Wednesday/Thursday higher arrivals
    const dayOfWeek = d.getDay();
    const weekendDemandFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.08 : 0.98;

    // Macro arrival wave (sinusoidal harvest wave)
    const harvestWave = Math.sin((i / 14) * Math.PI) * 0.2;
    const arrivalNoise = (pseudoRandom(i * 3) - 0.5) * 0.3;
    const baseArrival = 1200 + (mandiId.includes('koyambedu') || mandiId.includes('azadpur') || mandiId.includes('vashi') ? 2000 : 0);
    const dailyArrival = Math.round(baseArrival * (1 + harvestWave + arrivalNoise));

    // Elasticity: higher arrivals dampen price
    const arrivalDeltaPct = (dailyArrival - baseArrival) / baseArrival;
    const priceElasticity = -0.35; // typical vegetable elasticity
    const priceEffect = arrivalDeltaPct * priceElasticity;

    const noise = (pseudoRandom(i * 7) - 0.5) * 0.08;
    const price = Math.round(basePrice * (1 + priceEffect + noise) * weekendDemandFactor);

    history.push({
      date: dateStr,
      daysAgo: i,
      price: Math.max(300, price),
      arrivals: dailyArrival,
      mandiId,
    });
  }

  return history;
}

/**
 * Builds 14-day daily forecasts for each mandi with confidence intervals,
 * arrival shocks, and baseline moving average comparison.
 */
export function generateMandiForecasts(
  mandi: Mandi,
  cropId: CropType,
  harvestDateStr: string
): DayForecast[] {
  const crop = CROPS[cropId];
  const baseCropPrice = crop.basePricePerQuintal;

  // Terminal vs Local premium: Large metro terminals pay 12-28% higher gross price
  const isTerminal = mandi.distanceKm > 120;
  const isMediumHub = mandi.distanceKm > 40 && mandi.distanceKm <= 120;
  const terminalMultiplier = isTerminal ? 1.22 : isMediumHub ? 1.10 : 0.98;

  const baseMandiPrice = Math.round(baseCropPrice * terminalMultiplier);
  const baseArrivals = isTerminal ? 3200 : isMediumHub ? 1800 : 950;

  const forecasts: DayForecast[] = [];
  const harvestDate = new Date(harvestDateStr);

  // Generate for 14 forward days (dayOffset 0 = harvest date, 1 = +1 day ... 14)
  for (let offset = 0; offset <= 14; offset++) {
    const fDate = new Date(harvestDate);
    fDate.setDate(fDate.getDate() + offset);
    const dateStr = fDate.toISOString().split('T')[0];
    const dayOfWeek = fDate.getDay();

    // Weekend premium (hotels, caterers, urban retail surges on Fri/Sat/Sun)
    const weekendBoost = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 1.06 : 0.99;

    // Anticipated arrival trend:
    // In day 3-5, a local supply pulse is expected in some regions
    const arrivalShockFactor = (mandi.id.includes('kolar') && offset >= 2 && offset <= 4) ? 1.38 :
      (mandi.id.includes('madanapalle') && offset >= 4 && offset <= 6) ? 1.25 : 1.0;

    const arrivalRandomness = 0.96 + ((offset * 13) % 9) * 0.01;
    const expectedArrivals = Math.round(baseArrivals * arrivalShockFactor * arrivalRandomness);
    const normalArrivals = baseArrivals;

    // Price elasticity response to arrival glut
    const arrivalSurgeRatio = expectedArrivals / normalArrivals;
    const priceSuppression = arrivalSurgeRatio > 1.25 ? -0.12 : arrivalSurgeRatio > 1.1 ? -0.05 : 0.02;

    // Time trend: slight upward recovery after mid-week glut clears
    const recoveryTrend = offset > 5 ? 0.03 * (offset - 5) : 0;

    const expectedPrice = Math.round(baseMandiPrice * (1 + priceSuppression + recoveryTrend) * weekendBoost);

    // Confidence intervals widen as forecast horizons increase
    // Day 0: ±4%, Day 7: ±12%, Day 14: ±20%
    const uncertaintySpan = 0.04 + offset * 0.012;
    const minPrice = Math.round(expectedPrice * (1 - uncertaintySpan));
    const maxPrice = Math.round(expectedPrice * (1 + uncertaintySpan));

    // Baseline 3-year historical benchmark price (slow moving average without arrival shock sensitivity)
    const benchmarkPrice = Math.round(baseMandiPrice * (1 + (Math.sin(offset / 3) * 0.02)));

    // Anomaly flags
    const arrivalGlutAlert = arrivalSurgeRatio >= 1.25;
    const priceMovementAlert = expectedPrice > benchmarkPrice * 1.07 ? 'surge' :
      expectedPrice < benchmarkPrice * 0.93 ? 'slump' : 'stable';

    const confidencePercent = Math.max(55, Math.round(96 - offset * 2.8));

    forecasts.push({
      dayOffset: offset,
      dateStr,
      expectedPrice,
      minPrice,
      maxPrice,
      benchmarkPrice,
      expectedArrivals,
      normalArrivals,
      arrivalGlutAlert,
      priceMovementAlert,
      confidencePercent,
    });
  }

  return forecasts;
}

/**
 * Returns populated cluster with dynamic 14-day forecasts for the chosen crop and harvest date
 */
export function getPopulatedCluster(
  clusterId: string,
  cropId: CropType,
  harvestDateStr: string
): OriginCluster {
  const baseCluster = REGIONAL_CLUSTERS.find((c) => c.id === clusterId) || REGIONAL_CLUSTERS[0];
  const mandisWithForecasts: Mandi[] = baseCluster.mandis.map((m) => ({
    ...m,
    dailyForecasts: generateMandiForecasts(m, cropId, harvestDateStr),
  }));

  return {
    ...baseCluster,
    mandis: mandisWithForecasts,
  };
}
