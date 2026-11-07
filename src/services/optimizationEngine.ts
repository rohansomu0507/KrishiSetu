import { AllocationItem, CropConfig, Mandi, OptimizationResult } from '../types';

export interface EvaluationParams {
  crop: CropConfig;
  totalTonnes: number;
  harvestDateStr: string;
  availableMandis: Mandi[];
  freightAdjustmentPercent: number; // e.g. 0, +20, -15
  useColdStorage: boolean;
  userSellingDayOffset?: number; // optional manual override
}

/**
 * Calculates realistic transport freight cost based on distance and load size in India
 */
export function calculateFreightCost(
  distanceKm: number,
  tonnes: number,
  freightAdjustmentPercent = 0
): { cost: number; truckType: string } {
  if (tonnes <= 0 || distanceKm <= 0) {
    return { cost: 0, truckType: 'None' };
  }

  let baseMobilization = 800;
  let ratePerKmPerTonne = 5.2; // ₹ per km per tonne
  let truckType = 'Mini Pickup (Bolero Maxi / Tata Ace)';

  if (tonnes > 2 && tonnes <= 5.5) {
    baseMobilization = 1400;
    ratePerKmPerTonne = 4.1;
    truckType = 'Light Commercial Vehicle (Eicher / Dost)';
  } else if (tonnes > 5.5) {
    baseMobilization = 2400;
    ratePerKmPerTonne = 3.4;
    truckType = 'Heavy Duty Truck (14ft / 19ft LPT)';
  }

  // Base freight = base + (distance * rate * tonnes)
  const rawCost = baseMobilization + distanceKm * ratePerKmPerTonne * tonnes;
  const adjustedCost = rawCost * (1 + freightAdjustmentPercent / 100);

  return {
    cost: Math.round(adjustedCost),
    truckType,
  };
}

/**
 * Evaluates a specific harvest allocation of X tonnes to a specific mandi on dayOffset
 */
export function evaluateSingleAllocation(
  mandi: Mandi,
  crop: CropConfig,
  tonnes: number,
  dayOffset: number,
  freightAdjustmentPercent: number,
  useColdStorage: boolean
): AllocationItem {
  const quintals = tonnes * 10;
  const forecast = mandi.dailyForecasts.find((f) => f.dayOffset === dayOffset) || mandi.dailyForecasts[0];
  const expectedPricePerQuintal = forecast.expectedPrice;

  // 1. Gross Value
  const grossValue = quintals * expectedPricePerQuintal;

  // 2. Freight Cost
  const { cost: freightCost, truckType } = calculateFreightCost(
    mandi.distanceKm,
    tonnes,
    freightAdjustmentPercent
  );

  // 3. Mandi Cess & Handling
  const cess = grossValue * (mandi.mandiCessPercent / 100);
  const handlingUnloading = quintals * mandi.unloadingChargePerQuintal;
  const handlingCost = Math.round(cess + handlingUnloading);

  // 4. Storage & Holding Cost
  let storageCost = 0;
  if (dayOffset > 0) {
    const dailyRatePerQ = useColdStorage ? 18 : 4; // ₹18/q cold store vs ₹4/q on-farm shed
    storageCost = Math.round(quintals * dailyRatePerQ * dayOffset);
  }

  // 5. Spoilage & Quality Discount
  // Ambient decay vs cold storage decay
  const dailyDecayRate = useColdStorage
    ? crop.coldStorePerishabilityRatePercentPerDay
    : crop.ambientPerishabilityRatePercentPerDay;

  const storageDecayPercent = dailyDecayRate * dayOffset;

  // Long transit vibration & temperature shock adds small discount for perishable goods (>150km)
  const transitStressPercent = mandi.distanceKm > 150 && crop.priceVolatility === 'High' ? 1.8 : 0.4;
  const totalDecayPercent = Math.min(28, storageDecayPercent + transitStressPercent);
  const decayLossValue = Math.round((grossValue * totalDecayPercent) / 100);

  // 6. Effective Net Realization
  const effectiveNetRealization = Math.max(0, grossValue - freightCost - handlingCost - storageCost - decayLossValue);
  const netRealizationPerQuintal = quintals > 0 ? Math.round(effectiveNetRealization / quintals) : 0;

  return {
    dayOffset,
    dateStr: forecast.dateStr,
    mandiId: mandi.id,
    mandiName: mandi.name,
    distanceKm: mandi.distanceKm,
    quantityTonnes: tonnes,
    quantityQuintals: quintals,
    expectedPricePerQuintal,
    grossValue,
    freightCost,
    handlingCost,
    storageCost,
    decayLossValue,
    effectiveNetRealization,
    netRealizationPerQuintal,
    truckType,
  };
}

/**
 * Optimizes harvest allocation across candidate mandis and days [0..7]
 * considering handling capacity, freight batching, and perishability.
 */
export function solveOptimalHarvestPlan(params: EvaluationParams): OptimizationResult {
  const { crop, totalTonnes, availableMandis, freightAdjustmentPercent, useColdStorage } = params;

  if (!availableMandis || availableMandis.length === 0) {
    throw new Error('At least one mandi must be selected.');
  }

  // Find nearest mandi for baseline comparison
  const sortedByDist = [...availableMandis].sort((a, b) => a.distanceKm - b.distanceKm);
  const nearestMandi = sortedByDist[0];

  // Baseline 1: Sell 100% on Harvest Day (Day 0) at Nearest Mandi
  const baselineImmediate = evaluateSingleAllocation(
    nearestMandi,
    crop,
    totalTonnes,
    0,
    freightAdjustmentPercent,
    useColdStorage
  );

  // Baseline 2: Find the single day/mandi with maximum gross price and send 100% there
  let maxGrossPrice = -1;
  let peakMandi = availableMandis[0];
  let peakDayOffset = 0;

  for (const m of availableMandis) {
    for (let d = 0; d <= Math.min(5, crop.maxRecommendedHoldDays); d++) {
      const f = m.dailyForecasts.find((fc) => fc.dayOffset === d);
      if (f && f.expectedPrice > maxGrossPrice) {
        maxGrossPrice = f.expectedPrice;
        peakMandi = m;
        peakDayOffset = d;
      }
    }
  }

  const baselinePeak = evaluateSingleAllocation(
    peakMandi,
    crop,
    totalTonnes,
    peakDayOffset,
    freightAdjustmentPercent,
    useColdStorage
  );

  // Candidate Strategic Plans:
  // We evaluate:
  // 1. Single mandi dispatch (100% to each mandi on day 0, 1, 2, 3)
  // 2. Split dispatch between Terminal Market & Local APMC (e.g., 60/40 or 70/30)
  // 3. Staggered harvest (50% on Day 0 to capture early rates, 50% on Day 2/3 to bypass glut)

  let bestAllocations: AllocationItem[] = [baselineImmediate];
  let bestNetTotal = baselineImmediate.effectiveNetRealization;
  let strategyHeadline = 'Immediate Same-Day Dispatch at Nearest APMC';

  // Evaluate candidate single-batch runs
  for (const mandi of availableMandis) {
    const maxHold = Math.min(crop.maxRecommendedHoldDays, 6);
    for (let day = 0; day <= maxHold; day++) {
      const item = evaluateSingleAllocation(
        mandi,
        crop,
        totalTonnes,
        day,
        freightAdjustmentPercent,
        useColdStorage
      );
      if (item.effectiveNetRealization > bestNetTotal) {
        bestNetTotal = item.effectiveNetRealization;
        bestAllocations = [item];
        strategyHeadline = day === 0
          ? `Direct Full Dispatch to ${mandi.name} (Day 0)`
          : `Targeted Delay (${day} Days) to ${mandi.name}`;
      }
    }
  }

  // Evaluate Split Plans if totalTonnes >= 3 (worth splitting into multiple mini-trucks or batches)
  if (totalTonnes >= 3.0 && availableMandis.length >= 2) {
    const terminalMandi = availableMandis.find((m) => m.distanceKm > 60) || availableMandis[1];
    const localMandi = nearestMandi;

    const splitRatios = [
      { t: 0.6, l: 0.4 },
      { t: 0.7, l: 0.3 },
      { t: 0.5, l: 0.5 },
    ];

    for (const ratio of splitRatios) {
      const tTonnes = Math.round(totalTonnes * ratio.t * 10) / 10;
      const lTonnes = Math.round((totalTonnes - tTonnes) * 10) / 10;

      // Strategy A: Ship bulk to terminal on day 0, sell remainder at local on day 2
      const item1 = evaluateSingleAllocation(
        terminalMandi,
        crop,
        tTonnes,
        0,
        freightAdjustmentPercent,
        useColdStorage
      );
      const item2 = evaluateSingleAllocation(
        localMandi,
        crop,
        lTonnes,
        Math.min(2, crop.maxRecommendedHoldDays),
        freightAdjustmentPercent,
        useColdStorage
      );

      const splitNet = item1.effectiveNetRealization + item2.effectiveNetRealization;
      if (splitNet > bestNetTotal) {
        bestNetTotal = splitNet;
        bestAllocations = [item1, item2];
        strategyHeadline = `Strategic Split: ${Math.round(ratio.t * 100)}% Terminal (${terminalMandi.district}) + ${Math.round(ratio.l * 100)}% Local (${localMandi.district})`;
      }

      // Strategy B: Ship to local on day 0, wait 3 days to send premium to terminal after local glut
      const item3 = evaluateSingleAllocation(
        localMandi,
        crop,
        lTonnes,
        0,
        freightAdjustmentPercent,
        useColdStorage
      );
      const item4 = evaluateSingleAllocation(
        terminalMandi,
        crop,
        tTonnes,
        Math.min(3, crop.maxRecommendedHoldDays),
        freightAdjustmentPercent,
        useColdStorage
      );

      const splitNet2 = item3.effectiveNetRealization + item4.effectiveNetRealization;
      if (splitNet2 > bestNetTotal) {
        bestNetTotal = splitNet2;
        bestAllocations = [item3, item4];
        strategyHeadline = `Bypass-Glut Split: ${Math.round(ratio.l * 100)}% Day 0 Local + ${Math.round(ratio.t * 100)}% Day 3 Terminal`;
      }
    }
  }

  // Calculate aggregate metrics for best plan
  const totalGrossValue = bestAllocations.reduce((sum, a) => sum + a.grossValue, 0);
  const totalFreightCost = bestAllocations.reduce((sum, a) => sum + a.freightCost, 0);
  const totalHandlingCost = bestAllocations.reduce((sum, a) => sum + a.handlingCost, 0);
  const totalStorageCost = bestAllocations.reduce((sum, a) => sum + a.storageCost, 0);
  const totalSpoilageLoss = bestAllocations.reduce((sum, a) => sum + a.decayLossValue, 0);
  const totalNetRealization = bestAllocations.reduce((sum, a) => sum + a.effectiveNetRealization, 0);

  const totalQuintals = totalTonnes * 10;
  const averageNetPerQuintal = totalQuintals > 0 ? Math.round(totalNetRealization / totalQuintals) : 0;

  const netGainOverImmediateSale = totalNetRealization - baselineImmediate.effectiveNetRealization;
  const netGainPercent = baselineImmediate.effectiveNetRealization > 0
    ? Math.round((netGainOverImmediateSale / baselineImmediate.effectiveNetRealization) * 1000) / 10
    : 0;

  // Build natural rationale points
  const rationalePoints: string[] = [];

  if (bestAllocations.length > 1) {
    rationalePoints.push(
      `Harvest split captures terminal market premium for ${bestAllocations[0].quantityTonnes}T while hedging against transport freight risk on the remaining ${bestAllocations[1].quantityTonnes}T.`
    );
  } else if (bestAllocations[0].mandiId !== nearestMandi.id) {
    rationalePoints.push(
      `Higher gross auction rates at ${bestAllocations[0].mandiName} (₹${bestAllocations[0].expectedPricePerQuintal}/q) sufficiently exceed the extra freight cost (₹${bestAllocations[0].freightCost.toLocaleString('en-IN')}) by ₹${netGainOverImmediateSale.toLocaleString('en-IN')}.`
    );
  } else {
    rationalePoints.push(
      `Heavy freight over long distances would erode margins for this crop/tonnage. Local dispatch minimizes diesel expenses and eliminates transit spoilage.`
    );
  }

  if (bestAllocations.some((a) => a.dayOffset > 0)) {
    const maxDay = Math.max(...bestAllocations.map((a) => a.dayOffset));
    rationalePoints.push(
      `Holding part of the harvest for ${maxDay} days avoids the local APMC supply glut and captures weekend urban retail demand, earning an extra ~₹${Math.max(0, netGainOverImmediateSale).toLocaleString('en-IN')}.`
    );
  } else {
    rationalePoints.push(
      `Immediate Day 0 sale protects high moisture content; delaying without specialized cooling would lose ~${crop.ambientPerishabilityRatePercentPerDay}% weight daily.`
    );
  }

  return {
    totalTonnage: totalTonnes,
    totalGrossValue,
    totalFreightCost,
    totalHandlingCost,
    totalStorageCost,
    totalSpoilageLoss,
    totalNetRealization,
    averageNetPerQuintal,
    allocations: bestAllocations,
    strategyHeadline,
    comparison: {
      sellTodayNearestNet: baselineImmediate.effectiveNetRealization,
      sellTodayNearestPerQ: baselineImmediate.netRealizationPerQuintal,
      holdAllPeakNet: baselinePeak.effectiveNetRealization,
      holdAllPeakPerQ: baselinePeak.netRealizationPerQuintal,
      optimalNet: totalNetRealization,
      optimalPerQ: averageNetPerQuintal,
      netGainOverImmediateSale,
      netGainPercent,
    },
    rationalePoints,
  };
}
