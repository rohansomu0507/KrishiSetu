import React from 'react';
import {
  Calendar,
  Truck,
  TrendingUp,
  MapPin,
  Sliders,
  DollarSign,
  Info,
  CheckCircle2,
  RefreshCw,
  Scale,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CROPS, REGIONAL_CLUSTERS } from '../services/mandiData';
import { CropType, FarmerScenarioState, Mandi, OptimizationResult } from '../types';
import { evaluateSingleAllocation } from '../services/optimizationEngine';

interface FarmerDashboardProps {
  scenario: FarmerScenarioState;
  setScenario: React.Dispatch<React.SetStateAction<FarmerScenarioState>>;
  mandis: Mandi[];
  optimalPlan: OptimizationResult;
  onNavigateToEngine: () => void;
  onNavigateToIntelligence: () => void;
  onLoadSampleTomatoes: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  scenario,
  setScenario,
  mandis,
  optimalPlan,
  onNavigateToEngine,
  onNavigateToIntelligence,
  onLoadSampleTomatoes,
}) => {
  const currentCrop = CROPS[scenario.cropId];
  const currentCluster = REGIONAL_CLUSTERS.find((c) => c.id === scenario.originClusterId) || REGIONAL_CLUSTERS[0];

  // Evaluate candidate individual mandis for the selected selling date offset
  const mandiEvaluations = mandis.map((mandi) => {
    const item = evaluateSingleAllocation(
      mandi,
      currentCrop,
      scenario.quantityTonnes,
      scenario.sellingDateOffset,
      scenario.freightAdjustmentPercent,
      scenario.useColdStorage
    );
    const forecast = mandi.dailyForecasts.find((f) => f.dayOffset === scenario.sellingDateOffset) || mandi.dailyForecasts[0];
    const isSelected = scenario.selectedMandiIds.includes(mandi.id);

    return {
      mandi,
      evaluation: item,
      forecast,
      isSelected,
    };
  });

  // Sort by net realization descending
  const sortedEvaluations = [...mandiEvaluations].sort(
    (a, b) => b.evaluation.effectiveNetRealization - a.evaluation.effectiveNetRealization
  );

  const highestNetMandi = sortedEvaluations[0];

  const handleMandiToggle = (id: string) => {
    setScenario((prev) => {
      const exists = prev.selectedMandiIds.includes(id);
      if (exists && prev.selectedMandiIds.length === 1) {
        return prev; // keep at least one mandi
      }
      return {
        ...prev,
        selectedMandiIds: exists
          ? prev.selectedMandiIds.filter((mId) => mId !== id)
          : [...prev.selectedMandiIds, id],
      };
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Sample Scenario Hero Callout */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-900 text-white p-6 sm:p-8 shadow-lg border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
            <span>Problem Statement Demo Scenario</span>
            <span aria-hidden="true">·</span>
            <span>Kolar Belt Mandi Arbitrage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            Harvest Planning & Mandi Demand Assistant
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            Compare suitable nearby markets using 7–14 day price forecasts, arrival volume dynamics,
            truck freight rates, and spoilage degradation to maximize your net in-hand realization.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onLoadSampleTomatoes}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-xs transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Load Sample Scenario: 5T Tomatoes in 5 Days</span>
            </button>
            <button
              onClick={onNavigateToEngine}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
            >
              <span>View AI Multi-Market Split</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid: Harvest Configuration + Quick Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Harvest Input Configuration */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>1. Harvest Parameters</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Define crop details, expected harvest quantity, and origin farm location
              </p>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Step 1 of 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Crop Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Crop
              </label>
              <select
                value={scenario.cropId}
                onChange={(e) => {
                  const newCropId = e.target.value as CropType;
                  const newCrop = CROPS[newCropId];
                  setScenario((prev) => ({
                    ...prev,
                    cropId: newCropId,
                    variety: newCrop.varieties[0],
                  }));
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.values(CROPS).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.hindiName})
                  </option>
                ))}
              </select>
            </div>

            {/* Variety Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Variety / Cultivar
              </label>
              <select
                value={scenario.variety}
                onChange={(e) => setScenario((prev) => ({ ...prev, variety: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {currentCrop.varieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Expected Harvest Quantity
                </label>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                  {scenario.quantityTonnes * 10} Quintals ({Math.round(scenario.quantityTonnes * 40)} crates)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={scenario.quantityTonnes}
                  onChange={(e) =>
                    setScenario((prev) => ({
                      ...prev,
                      quantityTonnes: Math.max(0.5, parseFloat(e.target.value) || 1),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-500 font-medium">
                  Tonnes
                </span>
              </div>
            </div>

            {/* Farm Origin Cluster */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Farm Origin Location
              </label>
              <select
                value={scenario.originClusterId}
                onChange={(e) => {
                  const newClusterId = e.target.value;
                  const cluster = REGIONAL_CLUSTERS.find((c) => c.id === newClusterId);
                  if (cluster) {
                    setScenario((prev) => ({
                      ...prev,
                      originClusterId: newClusterId,
                      cropId: cluster.defaultCrop,
                      variety: CROPS[cluster.defaultCrop].varieties[0],
                      selectedMandiIds: cluster.mandis.map((m) => m.id),
                    }));
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {REGIONAL_CLUSTERS.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Harvest Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Planned Harvest Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={scenario.harvestDateStr}
                  onChange={(e) =>
                    setScenario((prev) => ({ ...prev, harvestDateStr: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Storage Facilities */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Holding & Storage Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScenario((prev) => ({ ...prev, useColdStorage: false }))}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                    !scenario.useColdStorage
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className="font-semibold">On-Farm Shade</div>
                  <div className="text-[11px] text-stone-500">₹4/q/day · {currentCrop.ambientPerishabilityRatePercentPerDay}% loss/d</div>
                </button>

                <button
                  type="button"
                  onClick={() => setScenario((prev) => ({ ...prev, useColdStorage: true }))}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                    scenario.useColdStorage
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className="font-semibold">Cold Storage</div>
                  <div className="text-[11px] text-stone-500">₹18/q/day · {currentCrop.coldStorePerishabilityRatePercentPerDay}% loss/d</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Harvest Economics Summary Card */}
        <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-700">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Harvest Net Potential
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AI Optimized</span>
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Best Expected In-Hand Realization
                </div>
                <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono tabular-nums tracking-tight mt-0.5">
                  ₹{optimalPlan.totalNetRealization.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-400 font-mono tabular-nums mt-0.5">
                  ₹{optimalPlan.averageNetPerQuintal.toLocaleString('en-IN')}/quintal in farmer pocket
                </div>
              </div>

              {optimalPlan.comparison.netGainOverImmediateSale > 0 && (
                <div className="p-3 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80">
                  <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    +₹{optimalPlan.comparison.netGainOverImmediateSale.toLocaleString('en-IN')} Advantage
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    +{optimalPlan.comparison.netGainPercent}% more net income than selling all today at nearest mandi.
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-700">
                <div className="flex justify-between">
                  <span>Gross Auction Value:</span>
                  <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                    ₹{optimalPlan.totalGrossValue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Freight:</span>
                  <span className="font-mono tabular-nums text-red-600 dark:text-red-400">
                    -₹{optimalPlan.totalFreightCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mandi Cess & Labour:</span>
                  <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                    -₹{optimalPlan.totalHandlingCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Storage & Decay Discount:</span>
                  <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    -₹{(optimalPlan.totalStorageCost + optimalPlan.totalSpoilageLoss).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToEngine}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Decision Engine & Solver</span>
          </button>
        </div>
      </div>

      {/* Interactive "What-If" Scenario Workbench */}
      <div className="bg-stone-50 dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Interactive "What-If" Decision Workbench
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            Slide values to test financial implications in real time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Slider 1: Selling Date Offset */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Dispatch Timing Offset
              </span>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                {scenario.sellingDateOffset === 0 ? 'Same Day (Day 0)' : `+${scenario.sellingDateOffset} Days Delay`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.min(currentCrop.maxRecommendedHoldDays, 7)}
              step="1"
              value={scenario.sellingDateOffset}
              onChange={(e) =>
                setScenario((prev) => ({
                  ...prev,
                  sellingDateOffset: parseInt(e.target.value, 10),
                }))
              }
              className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>Day 0 (Harvest)</span>
              <span>Day +3</span>
              <span>Day +{Math.min(currentCrop.maxRecommendedHoldDays, 7)}</span>
            </div>
          </div>

          {/* Slider 2: Diesel & Freight Adjustment */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Fuel & Freight Rate Shift
              </span>
              <span
                className={`font-mono tabular-nums font-bold ${
                  scenario.freightAdjustmentPercent > 0
                    ? 'text-red-600 dark:text-red-400'
                    : scenario.freightAdjustmentPercent < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {scenario.freightAdjustmentPercent > 0 ? `+${scenario.freightAdjustmentPercent}%` : `${scenario.freightAdjustmentPercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="40"
              step="5"
              value={scenario.freightAdjustmentPercent}
              onChange={(e) =>
                setScenario((prev) => ({
                  ...prev,
                  freightAdjustmentPercent: parseInt(e.target.value, 10),
                }))
              }
              className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>-20% (Subsidized)</span>
              <span>Baseline</span>
              <span>+40% (Diesel Hike)</span>
            </div>
          </div>

          {/* Market Selection Toggles */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Participating Mandis
            </span>
            <div className="flex flex-wrap gap-1.5">
              {mandis.map((m) => {
                const active = scenario.selectedMandiIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMandiToggle(m.id)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      active
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700 line-through'
                    }`}
                  >
                    {m.name.split(' ')[0]} ({m.distanceKm}km)
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mandi Comparison Table & Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>2. Suitable Nearby Mandis Comparison</span>
              <span className="text-xs font-normal text-stone-500">
                (7–14 Day Forecast & Transport Deductions)
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Evaluated on {scenario.quantityTonnes}T harvest for dispatch offset day +{scenario.sellingDateOffset}
            </p>
          </div>

          <button
            onClick={onNavigateToIntelligence}
            className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
          >
            <span>View 60-Day Arrival & Price Trends</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mandi Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {sortedEvaluations.map(({ mandi, evaluation, forecast, isSelected }, idx) => {
            const isTopRank = idx === 0;

            return (
              <div
                key={mandi.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  isTopRank
                    ? 'border-emerald-500/80 bg-white dark:bg-stone-900 shadow-md ring-1 ring-emerald-500/20'
                    : isSelected
                    ? 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{mandi.distanceKm} km</span>
                        <span aria-hidden="true">·</span>
                        <span>{mandi.transitHours}h transit</span>
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5 leading-snug">
                        {mandi.name}
                      </h3>
                      <div className="text-xs text-stone-500">{mandi.district}, {mandi.state}</div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        isTopRank
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Rank #{idx + 1}
                    </span>
                  </div>

                  {/* Price & Forecast Range */}
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">Gross Forecast:</span>
                      <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                        ₹{forecast.expectedPrice.toLocaleString('en-IN')}/q
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-stone-400">
                      <span>95% Confidence Band:</span>
                      <span className="font-mono tabular-nums">
                        ₹{forecast.minPrice} – ₹{forecast.maxPrice}
                      </span>
                    </div>
                    {forecast.arrivalGlutAlert && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium pt-0.5">
                        ⚠ Arrival Glut Expected ({forecast.expectedArrivals} q/d)
                      </div>
                    )}
                  </div>

                  {/* Deduction Itemization */}
                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-1">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>Transport Freight:</span>
                      </span>
                      <span className="font-mono tabular-nums text-red-600 dark:text-red-400">
                        -₹{evaluation.freightCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        <span>Mandi Cess & Labour:</span>
                      </span>
                      <span className="font-mono tabular-nums">
                        -₹{evaluation.handlingCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Spoilage & Storage Loss:</span>
                      </span>
                      <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        -₹{(evaluation.decayLossValue + evaluation.storageCost).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Final Net Realization */}
                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    Expected Net Realization:
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      ₹{evaluation.effectiveNetRealization.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-stone-600 dark:text-stone-300">
                      ₹{evaluation.netRealizationPerQuintal}/q
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Truck: {evaluation.truckType.split('(')[0]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
