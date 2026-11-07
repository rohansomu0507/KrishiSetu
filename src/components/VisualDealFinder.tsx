import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Sparkles,
  Zap,
  Filter,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown,
  BarChart3,
  SlidersHorizontal,
  Info,
  Scale
} from 'lucide-react';
import { ApplicantRecord, GovStandardRecord } from '../services/firebase';
import { Mandi, CropType } from '../types';
import { CROPS } from '../services/mandiData';

export interface EvaluatedDealLot {
  lot: ApplicantRecord;
  cropKey: CropType;
  mandiName: string;
  mandiDistanceKm: number;
  askingPricePerQuintal: number;
  benchmarkMandiPrice: number;
  priceDeltaPerQuintal: number; // benchmark - asking (positive = savings)
  discountPercent: number; // % off benchmark
  totalBuyerSavings: number; // ₹ savings for the whole lot
  totalLotCost: number; // ₹ total cost at asking price
  dealRating: 'super_deal' | 'great_deal' | 'fair_deal' | 'premium';
  dealScore: number; // 0 - 100
  dispatchDayOffset: number; // 0 to 13 days
  volumeTonnes: number;
  mspFloor: number;
  ceilingPrice: number;
}

interface VisualDealFinderProps {
  applicantLots: ApplicantRecord[];
  mandis: Mandi[];
  currentCropId: CropType;
  govStandards: GovStandardRecord[];
  onSelectLotForBid: (lot: ApplicantRecord, suggestedBidPrice: number) => void;
}

export const VisualDealFinder: React.FC<VisualDealFinderProps> = ({
  applicantLots,
  mandis,
  currentCropId,
  govStandards,
  onSelectLotForBid,
}) => {
  // Chart visual mode: timeline | scatter | arbitrage
  const [chartMode, setChartMode] = useState<'timeline' | 'scatter' | 'arbitrage'>('timeline');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<'all' | 'super' | 'great' | 'fair'>('all');
  const [selectedMandiFilter, setSelectedMandiFilter] = useState<string>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(10000);
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(0);
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [activeSelectedLotId, setActiveSelectedLotId] = useState<string | null>(null);

  // Active crop metadata
  const cropConfig = CROPS[currentCropId] || CROPS.tomatoes;

  // Safe fallback government standard ensuring activeGovStd is NEVER undefined
  const defaultStandard: GovStandardRecord = useMemo(() => ({
    id: `default_${currentCropId || 'tomatoes'}`,
    cropId: currentCropId || 'tomatoes',
    cropName: cropConfig?.name || 'Produce',
    minPriceFloor: 1400,
    maxPriceCeiling: 3800,
    dailyMandiIntakeQuotaTonnes: 150,
    fairAverageQualityMoistureMax: 14,
    storageSubsidyPercent: 30,
    issuedByAuthority: 'APMC Market Regulation Board',
    circularNumber: 'GOI/APMC-REG/2026-01',
    effectiveDate: '2026-04-01',
    lastUpdated: '2026-11-01',
    updatedBy: 'APMC Market Regulation Board',
    enforcementNotes: 'Statutory floor and ceiling limits active across all APMC mandis.',
  }), [currentCropId, cropConfig]);

  const activeGovStd: GovStandardRecord = useMemo(() => {
    if (govStandards && govStandards.length > 0) {
      const match = govStandards.find((s) => s.cropId === currentCropId);
      if (match) return match;
      if (govStandards[0]) return govStandards[0];
    }
    return defaultStandard;
  }, [govStandards, currentCropId, defaultStandard]);

  const mspFloorPrice = activeGovStd?.minPriceFloor ?? 1400;
  const ceilingMaxPrice = activeGovStd?.maxPriceCeiling ?? 3800;

  // Resolve target mandi for 14-day forecasts
  const primaryMandi = mandis.find((m) => m.id === selectedMandiFilter) || mandis[0];
  const forecasts = primaryMandi?.dailyForecasts || [];

  // 1. Evaluate every applicant lot against APMC Mandi benchmarks
  const evaluatedLots: EvaluatedDealLot[] = useMemo(() => {
    return applicantLots.map((lot) => {
      // Determine crop key
      const cropKey: CropType = (lot.cropId as CropType) ||
        (Object.keys(CROPS).find((k) =>
          lot.cropName.toLowerCase().includes(k)
        ) as CropType) ||
        currentCropId;

      const std = govStandards.find((s) => s.cropId === cropKey) || activeGovStd;
      const mspFloor = std?.minPriceFloor || 1400;
      const ceilingPrice = std?.maxPriceCeiling || 3800;

      // Match target mandi
      const matchingMandi =
        mandis.find(
          (m) =>
            m.id === lot.allocatedMandiId ||
            m.name.toLowerCase().includes(lot.allocatedMandiName.toLowerCase())
        ) || mandis[0];

      // Calculate dispatch day offset (0 to 13)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const harvestDateObj = new Date(lot.harvestDate || lot.allocatedDispatchDate);
      harvestDateObj.setHours(0, 0, 0, 0);
      const diffTime = harvestDateObj.getTime() - now.getTime();
      const rawOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const dispatchDayOffset = Math.max(0, Math.min(13, isNaN(rawOffset) ? 0 : rawOffset));

      // Benchmark price from mandi daily forecast (or crop base price)
      const mandiDayForecast = matchingMandi?.dailyForecasts?.[dispatchDayOffset];
      const benchmarkMandiPrice =
        mandiDayForecast?.expectedPrice || CROPS[cropKey]?.basePricePerQuintal || 2400;

      // Asking price per quintal
      const askingPricePerQuintal =
        lot.askingPricePerQuintal && lot.askingPricePerQuintal > 0
          ? lot.askingPricePerQuintal
          : Math.round(lot.estimatedNetRealization / (lot.quantityTonnes * 10)) ||
            benchmarkMandiPrice;

      // Delta and discount
      const priceDeltaPerQuintal = benchmarkMandiPrice - askingPricePerQuintal;
      const discountPercent =
        benchmarkMandiPrice > 0
          ? Math.round(((benchmarkMandiPrice - askingPricePerQuintal) / benchmarkMandiPrice) * 1000) / 10
          : 0;

      const totalQuintals = lot.quantityTonnes * 10;
      const totalBuyerSavings = Math.round(priceDeltaPerQuintal * totalQuintals);
      const totalLotCost = Math.round(askingPricePerQuintal * totalQuintals);

      // Classification
      let dealRating: 'super_deal' | 'great_deal' | 'fair_deal' | 'premium' = 'fair_deal';
      if (discountPercent >= 14) {
        dealRating = 'super_deal';
      } else if (discountPercent >= 5) {
        dealRating = 'great_deal';
      } else if (discountPercent >= -5) {
        dealRating = 'fair_deal';
      } else {
        dealRating = 'premium';
      }

      // Deal Score (0 - 100)
      // Rewards: high discount, large volume, compliance
      let score = 50;
      score += Math.min(35, discountPercent * 1.5);
      score += Math.min(10, lot.quantityTonnes * 0.7);
      if (askingPricePerQuintal >= mspFloor && askingPricePerQuintal <= ceilingPrice) {
        score += 5;
      }
      const dealScore = Math.min(99, Math.max(25, Math.round(score)));

      return {
        lot,
        cropKey,
        mandiName: matchingMandi?.name || lot.allocatedMandiName,
        mandiDistanceKm: matchingMandi?.distanceKm || 30,
        askingPricePerQuintal,
        benchmarkMandiPrice,
        priceDeltaPerQuintal,
        discountPercent,
        totalBuyerSavings,
        totalLotCost,
        dealRating,
        dealScore,
        dispatchDayOffset,
        volumeTonnes: lot.quantityTonnes,
        mspFloor,
        ceilingPrice,
      };
    });
  }, [applicantLots, mandis, currentCropId, govStandards, activeGovStd]);

  // Set default max price on first evaluation
  useMemo(() => {
    if (evaluatedLots.length > 0 && maxPriceFilter === 10000) {
      const highestPrice = Math.max(...evaluatedLots.map((e) => e.askingPricePerQuintal));
      setMaxPriceFilter(Math.ceil(highestPrice * 1.1));
    }
  }, [evaluatedLots, maxPriceFilter]);

  // Filtered lots based on visual criteria
  const filteredDeals = useMemo(() => {
    return evaluatedLots.filter((item) => {
      // Mandi filter
      if (selectedMandiFilter !== 'all') {
        const matchesMandi =
          item.lot.allocatedMandiId === selectedMandiFilter ||
          item.mandiName.toLowerCase().includes(selectedMandiFilter.toLowerCase());
        if (!matchesMandi) return false;
      }

      // Rating filter
      if (selectedRatingFilter === 'super' && item.dealRating !== 'super_deal') return false;
      if (selectedRatingFilter === 'great' && !['super_deal', 'great_deal'].includes(item.dealRating))
        return false;
      if (selectedRatingFilter === 'fair' && item.dealRating === 'premium') return false;

      // Price slider
      if (item.askingPricePerQuintal > maxPriceFilter) return false;

      // Volume slider
      if (item.volumeTonnes < minVolumeFilter) return false;

      return true;
    });
  }, [evaluatedLots, selectedMandiFilter, selectedRatingFilter, maxPriceFilter, minVolumeFilter]);

  // Top spotlight deal (highest savings that is government compliant)
  const spotlightDeal = useMemo(() => {
    if (evaluatedLots.length === 0) return null;
    const compliant = evaluatedLots.filter((d) => d.priceDeltaPerQuintal > 0);
    if (compliant.length === 0) return evaluatedLots[0];
    return [...compliant].sort((a, b) => b.totalBuyerSavings - a.totalBuyerSavings)[0];
  }, [evaluatedLots]);

  // Active hovered or selected deal for the HUD
  const activeInspectedDeal = useMemo(() => {
    const targetId = hoveredLotId || activeSelectedLotId;
    if (!targetId) return spotlightDeal;
    return evaluatedLots.find((d) => d.lot.id === targetId) || spotlightDeal;
  }, [hoveredLotId, activeSelectedLotId, evaluatedLots, spotlightDeal]);

  // -------------------------------------------------------------
  // SVG CHART GEOMETRY & SCALING
  // -------------------------------------------------------------
  const chartWidth = 780;
  const chartHeight = 320;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;

  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  // Price Y scale
  const allChartPrices = [
    ...forecasts.map((f) => f.expectedPrice),
    ...forecasts.map((f) => f.minPrice),
    ...forecasts.map((f) => f.maxPrice),
    ...evaluatedLots.map((e) => e.askingPricePerQuintal),
    mspFloorPrice,
  ];
  const minP = Math.max(800, Math.floor(Math.min(...allChartPrices) * 0.88 / 100) * 100);
  const maxP = Math.ceil(Math.max(...allChartPrices) * 1.1 / 100) * 100;
  const pRange = maxP - minP || 1;

  const getY = (price: number) => padTop + plotH - ((price - minP) / pRange) * plotH;
  const getTimelineX = (dayIdx: number) => padLeft + (dayIdx / 13) * plotW;

  // Volume scale for scatter plot
  const maxVol = Math.max(25, ...(evaluatedLots.length > 0 ? evaluatedLots.map((e) => e.volumeTonnes * 1.2) : [25]));
  const getScatterX = (tonnes: number) => padLeft + (tonnes / maxVol) * plotW;

  // Optimal glut day (where arrivals peak, lowest market price)
  const lowestPriceDay = useMemo(() => {
    if (forecasts.length === 0) return 0;
    let minIdx = 0;
    forecasts.forEach((f, i) => {
      if (f.expectedPrice < (forecasts[minIdx]?.expectedPrice || 99999)) {
        minIdx = i;
      }
    });
    return minIdx;
  }, [forecasts]);

  // Forecast path generator
  const forecastPath = forecasts.length > 0
    ? forecasts.map((f, i) => `${i === 0 ? 'M' : 'L'} ${getTimelineX(i)} ${getY(f.expectedPrice)}`).join(' ')
    : '';

  // Forecast confidence band polygon
  const confidenceBandPolygon = forecasts.length > 0
    ? forecasts.map((f, i) => `${i === 0 ? 'M' : 'L'} ${getTimelineX(i)} ${getY(f.maxPrice)}`).join(' ') +
      ' ' +
      forecasts.slice().reverse().map((f, i) => `L ${getTimelineX(13 - i)} ${getY(f.minPrice)}`).join(' ') +
      ' Z'
    : '';

  // Value Buy Zone Shading (between MSP floor and expected market line)
  const valueZonePolygon = forecasts.length > 0
    ? forecasts.map((f, i) => `${i === 0 ? 'M' : 'L'} ${getTimelineX(i)} ${getY(f.expectedPrice)}`).join(' ') +
      ` L ${getTimelineX(13)} ${getY(mspFloorPrice)} L ${getTimelineX(0)} ${getY(mspFloorPrice)} Z`
    : '';

  return (
    <div className="space-y-6">
      {/* 1. HERO SPOTLIGHT: TOP VISUAL GOOD DEAL OF THE DAY */}
      {spotlightDeal && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 border border-emerald-500/30 text-white p-5 shadow-lg">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Visual Deal Radar · Top Arbitrage Opportunity</span>
                </span>
                <span className="text-xs text-stone-300 font-mono">
                  Deal Score: <strong className="text-emerald-400 font-bold">{spotlightDeal.dealScore}/100</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  {spotlightDeal.lot.farmerName} · {spotlightDeal.volumeTonnes}T {spotlightDeal.lot.cropName} ({spotlightDeal.lot.variety})
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-stone-950 font-bold text-xs uppercase tracking-wide">
                  {spotlightDeal.discountPercent}% Below Mandi Average
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Depot: {spotlightDeal.mandiName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Origin: {spotlightDeal.lot.villageDistrict}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dispatch: {spotlightDeal.lot.harvestDate} (Day +{spotlightDeal.dispatchDayOffset})</span>
                </div>
              </div>
            </div>

            {/* Price Callout & One-Click Bid */}
            <div className="flex items-center gap-4 self-start lg:self-center shrink-0 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div>
                <div className="text-[10px] uppercase font-semibold text-stone-400">Asking vs Mandi Price</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold font-mono text-emerald-300">
                    ₹{spotlightDeal.askingPricePerQuintal.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-stone-400 line-through">
                    ₹{spotlightDeal.benchmarkMandiPrice.toLocaleString()}/q
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Buyer Saves ₹{spotlightDeal.totalBuyerSavings.toLocaleString()} on this lot
                </div>
              </div>

              <button
                onClick={() => onSelectLotForBid(spotlightDeal.lot, spotlightDeal.askingPricePerQuintal)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-stone-950" />
                <span>Snag Deal & Bid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. VISUAL CONTROLS & CHART MODE BAR */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Interactive Visual Deal Radar & Opportunity Matrix
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Spot underpriced farmer lots visually against 14-day APMC trendlines and volume glut zones.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setChartMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'timeline'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Timeline & Price Curve
            </button>
            <button
              onClick={() => setChartMode('scatter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'scatter'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Price-Volume Matrix
            </button>
            <button
              onClick={() => setChartMode('arbitrage')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'arbitrage'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Mandi Arbitrage Spread
            </button>
          </div>
        </div>

        {/* Visual Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          {/* Deal Category Quick Toggles */}
          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
              Deal Classification
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedRatingFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedRatingFilter === 'all'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRatingFilter('super')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedRatingFilter === 'super'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                🔥 Super Bargains
              </button>
              <button
                onClick={() => setSelectedRatingFilter('great')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedRatingFilter === 'great'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                }`}
              >
                ⚡ Good Value
              </button>
            </div>
          </div>

          {/* Mandi Selector */}
          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
              APMC Mandi Hub
            </label>
            <select
              value={selectedMandiFilter}
              onChange={(e) => setSelectedMandiFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium"
            >
              <option value="all">All Regional Mandis</option>
              {mandis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.distanceKm} km)
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Max Price Cap
              </label>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                ₹{maxPriceFilter.toLocaleString()}/q
              </span>
            </div>
            <input
              type="range"
              min={mspFloorPrice}
              max={ceilingMaxPrice + 500}
              step={50}
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Min Volume Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Min Lot Volume
              </label>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                {minVolumeFilter}T
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={minVolumeFilter}
              onChange={(e) => setMinVolumeFilter(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Visual Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-stone-700 dark:text-stone-300">Chart Visual Properties:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs inline-block" />
              <span>Super Deal (&gt;14% discount)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span>Good Value (5-14% discount)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span>Fair Market (±5%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 border-t-2 border-dashed border-emerald-600 inline-block" />
              <span>Govt MSP Floor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-blue-500 inline-block" />
              <span>Mandi Expected Price</span>
            </div>
          </div>
          <div className="text-stone-400">
            Bubble Size = Lot Tonnage (Click node to bid)
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* CHART RENDER: MODE 1 (TIMELINE & PRICE CURVE OVERLAY) */}
        {/* ----------------------------------------------------------- */}
        {chartMode === 'timeline' && (
          <div className="relative w-full overflow-x-auto bg-stone-50 dark:bg-stone-950/60 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[680px] select-none"
            >
              <defs>
                {/* Value zone gradient */}
                <linearGradient id="valueZoneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                </linearGradient>

                {/* Mandi confidence ribbon */}
                <linearGradient id="confidenceRibbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>

                {/* Glow filter for super deals */}
                <filter id="superGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizontal Price Grid Lines */}
              {[minP, Math.round(minP + pRange * 0.25), Math.round(minP + pRange * 0.5), Math.round(minP + pRange * 0.75), maxP].map((p, idx) => {
                const y = getY(p);
                return (
                  <g key={`grid-${idx}`}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-stone-200 dark:text-stone-800"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-stone-400 font-mono text-[10px]"
                    >
                      ₹{p}
                    </text>
                  </g>
                );
              })}

              {/* Government MSP Floor Reference Line */}
              <line
                x1={padLeft}
                y1={getY(mspFloorPrice)}
                x2={padLeft + plotW}
                y2={getY(mspFloorPrice)}
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text
                x={padLeft + plotW - 6}
                y={getY(mspFloorPrice) - 4}
                textAnchor="end"
                className="fill-emerald-600 dark:fill-emerald-400 font-bold text-[9px]"
              >
                MSP FLOOR: ₹{mspFloorPrice}/q
              </text>

              {/* Shaded Value Buy Zone */}
              {valueZonePolygon && (
                <path d={valueZonePolygon} fill="url(#valueZoneGradient)" />
              )}

              {/* Mandi Confidence Band */}
              {confidenceBandPolygon && (
                <path d={confidenceBandPolygon} fill="url(#confidenceRibbon)" />
              )}

              {/* Mandi Forecast Expected Price Line */}
              {forecastPath && (
                <path
                  d={forecastPath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Optimal Buy Window Highlight Banner at lowest price day */}
              {forecasts.length > 0 && (
                <g>
                  <line
                    x1={getTimelineX(lowestPriceDay)}
                    y1={padTop}
                    x2={getTimelineX(lowestPriceDay)}
                    y2={padTop + plotH}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={getTimelineX(lowestPriceDay) - 45}
                    y={padTop + 2}
                    width={90}
                    height={18}
                    rx={4}
                    fill="#10b981"
                    fillOpacity="0.9"
                  />
                  <text
                    x={getTimelineX(lowestPriceDay)}
                    y={padTop + 14}
                    textAnchor="middle"
                    fill="#052e16"
                    className="font-bold text-[9px]"
                  >
                    ★ OPTIMAL BUY DAY
                  </text>
                </g>
              )}

              {/* X Axis Ticks & Days */}
              {Array.from({ length: 14 }).map((_, d) => {
                const x = getTimelineX(d);
                const isSelected = d === lowestPriceDay;
                return (
                  <g key={`day-label-${d}`}>
                    <line
                      x1={x}
                      y1={padTop + plotH}
                      x2={x}
                      y2={padTop + plotH + 5}
                      stroke="currentColor"
                      className="text-stone-300 dark:text-stone-700"
                    />
                    <text
                      x={x}
                      y={padTop + plotH + 18}
                      textAnchor="middle"
                      className={`text-[10px] font-mono ${
                        isSelected
                          ? 'fill-emerald-600 font-bold'
                          : 'fill-stone-500 dark:fill-stone-400'
                      }`}
                    >
                      {d === 0 ? 'Today' : `D+${d}`}
                    </text>
                  </g>
                );
              })}

              {/* PLOTTED DEAL LOTS (NODES) */}
              {filteredDeals.map((deal) => {
                const cx = getTimelineX(deal.dispatchDayOffset);
                const cy = getY(deal.askingPricePerQuintal);
                const benchmarkY = getY(deal.benchmarkMandiPrice);
                const isHovered = hoveredLotId === deal.lot.id;
                const isSelected = activeSelectedLotId === deal.lot.id;
                const radius = Math.max(6, Math.min(18, 5 + deal.volumeTonnes * 0.7));

                // Color by deal rating
                let fillColor = '#f59e0b';
                let strokeColor = '#d97706';
                if (deal.dealRating === 'super_deal') {
                  fillColor = '#10b981';
                  strokeColor = '#059669';
                } else if (deal.dealRating === 'great_deal') {
                  fillColor = '#0ea5e9';
                  strokeColor = '#0284c7';
                } else if (deal.dealRating === 'premium') {
                  fillColor = '#f43f5e';
                  strokeColor = '#e11d48';
                }

                return (
                  <g
                    key={`node-${deal.lot.id}`}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredLotId(deal.lot.id)}
                    onMouseLeave={() => setHoveredLotId(null)}
                    onClick={() => {
                      setActiveSelectedLotId(deal.lot.id);
                      onSelectLotForBid(deal.lot, deal.askingPricePerQuintal);
                    }}
                  >
                    {/* Vertical discount connector from mandi price to seller asking price */}
                    {deal.priceDeltaPerQuintal > 0 && (
                      <g>
                        <line
                          x1={cx}
                          y1={benchmarkY}
                          x2={cx}
                          y2={cy}
                          stroke={strokeColor}
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        {/* Discount badge tag */}
                        <rect
                          x={cx + 8}
                          y={(benchmarkY + cy) / 2 - 8}
                          width={48}
                          height={16}
                          rx={3}
                          fill={fillColor}
                          fillOpacity={isHovered ? 1 : 0.85}
                        />
                        <text
                          x={cx + 32}
                          y={(benchmarkY + cy) / 2 + 3}
                          textAnchor="middle"
                          fill="#ffffff"
                          className="font-mono font-bold text-[8.5px]"
                        >
                          -{deal.discountPercent}%
                        </text>
                      </g>
                    )}

                    {/* Outer pulse ring for super deals */}
                    {deal.dealRating === 'super_deal' && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 4}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        className="animate-pulse"
                      />
                    )}

                    {/* Main Node Bubble */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
                      filter={deal.dealRating === 'super_deal' ? 'url(#superGlow)' : undefined}
                      className="transition-all"
                    />

                    {/* Inner Volume Text if bubble is large enough */}
                    {radius >= 10 && (
                      <text
                        x={cx}
                        y={cy + 3}
                        textAnchor="middle"
                        fill="#ffffff"
                        className="font-mono font-extrabold text-[8.5px] pointer-events-none"
                      >
                        {deal.volumeTonnes}T
                      </text>
                    )}

                    {/* Seller Name Label on Hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={cx - 50}
                          y={cy - radius - 22}
                          width={100}
                          height={18}
                          rx={4}
                          fill="#18181b"
                          fillOpacity="0.95"
                        />
                        <text
                          x={cx}
                          y={cy - radius - 10}
                          textAnchor="middle"
                          fill="#ffffff"
                          className="font-sans font-semibold text-[9px]"
                        >
                          {deal.lot.farmerName} · ₹{deal.askingPricePerQuintal}/q
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* CHART RENDER: MODE 2 (PRICE-VOLUME MATRIX SCATTER) */}
        {/* ----------------------------------------------------------- */}
        {chartMode === 'scatter' && (
          <div className="relative w-full overflow-x-auto bg-stone-50 dark:bg-stone-950/60 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[680px] select-none"
            >
              {/* Wholesale Sweet Spot Quadrant Shading (Bottom-Right: High Volume, Low Price) */}
              <rect
                x={getScatterX(8)}
                y={getY(cropConfig.basePricePerQuintal)}
                width={plotW - (getScatterX(8) - padLeft)}
                height={padTop + plotH - getY(cropConfig.basePricePerQuintal)}
                fill="#10b981"
                fillOpacity="0.08"
                rx={6}
              />
              <text
                x={getScatterX(8) + 10}
                y={padTop + plotH - 12}
                fill="#059669"
                className="font-bold text-[10px] tracking-wide"
              >
                ★ WHOLESALE GOLDEN SWEET SPOT (High Volume · Deep Discount)
              </text>

              {/* Reference Grid & Thresholds */}
              <line
                x1={padLeft}
                y1={getY(cropConfig.basePricePerQuintal)}
                x2={padLeft + plotW}
                y2={getY(cropConfig.basePricePerQuintal)}
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft + plotW - 6}
                y={getY(cropConfig.basePricePerQuintal) - 4}
                textAnchor="end"
                className="fill-blue-600 font-bold text-[9px]"
              >
                MANDI BENCHMARK: ₹{cropConfig.basePricePerQuintal}/q
              </text>

              {/* Volume Vertical Midpoint */}
              <line
                x1={getScatterX(8)}
                y1={padTop}
                x2={getScatterX(8)}
                y2={padTop + plotH}
                stroke="#a8a29e"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Y Axis Grid (Price) */}
              {[minP, Math.round(minP + pRange * 0.33), Math.round(minP + pRange * 0.66), maxP].map((p, idx) => {
                const y = getY(p);
                return (
                  <g key={`scatter-grid-${idx}`}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-stone-200 dark:text-stone-800"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-stone-400 font-mono text-[10px]"
                    >
                      ₹{p}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Grid (Tonnes) */}
              {[0, 5, 10, 15, 20, 25].map((t) => {
                const x = getScatterX(t);
                return (
                  <g key={`x-vol-${t}`}>
                    <line
                      x1={x}
                      y1={padTop + plotH}
                      x2={x}
                      y2={padTop + plotH + 5}
                      stroke="currentColor"
                      className="text-stone-300 dark:text-stone-700"
                    />
                    <text
                      x={x}
                      y={padTop + plotH + 18}
                      textAnchor="middle"
                      className="fill-stone-500 font-mono text-[10px]"
                    >
                      {t}T
                    </text>
                  </g>
                );
              })}

              {/* Scatter Points */}
              {filteredDeals.map((deal) => {
                const cx = getScatterX(deal.volumeTonnes);
                const cy = getY(deal.askingPricePerQuintal);
                const isHovered = hoveredLotId === deal.lot.id;
                const isSelected = activeSelectedLotId === deal.lot.id;
                const radius = 8;

                let fillColor = '#f59e0b';
                if (deal.dealRating === 'super_deal') fillColor = '#10b981';
                else if (deal.dealRating === 'great_deal') fillColor = '#0ea5e9';
                else if (deal.dealRating === 'premium') fillColor = '#f43f5e';

                return (
                  <g
                    key={`scatter-node-${deal.lot.id}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLotId(deal.lot.id)}
                    onMouseLeave={() => setHoveredLotId(null)}
                    onClick={() => {
                      setActiveSelectedLotId(deal.lot.id);
                      onSelectLotForBid(deal.lot, deal.askingPricePerQuintal);
                    }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      x={cx + 12}
                      y={cy + 3}
                      className="fill-stone-700 dark:fill-stone-300 font-bold text-[9px]"
                    >
                      {deal.lot.farmerName.split(' ')[0]} ({deal.discountPercent}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* CHART RENDER: MODE 3 (MANDI ARBITRAGE SPREAD SPECTRUM) */}
        {/* ----------------------------------------------------------- */}
        {chartMode === 'arbitrage' && (
          <div className="space-y-3 pt-2">
            {mandis.map((mandi) => {
              const mandiLots = evaluatedLots.filter(
                (d) =>
                  d.lot.allocatedMandiId === mandi.id ||
                  d.mandiName.toLowerCase().includes(mandi.name.toLowerCase())
              );
              const lowestLot = mandiLots.length > 0
                ? [...mandiLots].sort((a, b) => a.askingPricePerQuintal - b.askingPricePerQuintal)[0]
                : null;
              const mandiExpected = mandi.dailyForecasts[0]?.expectedPrice || cropConfig.basePricePerQuintal;
              const spread = lowestLot ? mandiExpected - lowestLot.askingPricePerQuintal : 0;
              const spreadPercent = lowestLot ? Math.round((spread / mandiExpected) * 100) : 0;

              return (
                <div
                  key={mandi.id}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-stone-500" />
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {mandi.name}
                      </h4>
                      <span className="text-xs text-stone-400">({mandi.distanceKm} km from hub)</span>
                    </div>
                    <div className="text-xs text-stone-500 flex items-center gap-3">
                      <span>Mandi Auction Forecast: <strong className="font-mono text-stone-800 dark:text-stone-200">₹{mandiExpected}/q</strong></span>
                      <span>Available Lots: <strong className="font-mono text-stone-800 dark:text-stone-200">{mandiLots.length}</strong></span>
                    </div>
                  </div>

                  {lowestLot ? (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-semibold">Lowest Seller Lot</div>
                        <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{lowestLot.askingPricePerQuintal}/q
                          <span className="text-xs text-emerald-500 font-semibold ml-1.5">
                            (-{spreadPercent}%)
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Spread: ₹{spread}/q margin
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectLotForBid(lowestLot.lot, lowestLot.askingPricePerQuintal)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Bid Lowest Lot</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400 italic">
                      No direct seller lots registered at this depot yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. INSPECTED DEAL HUD CARD (DYNAMICALLY DRIVEN BY HOVER / CLICK) */}
      {activeInspectedDeal && (
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  Inspected Lot: {activeInspectedDeal.lot.farmerName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-bold font-mono text-[10px]">
                  {activeInspectedDeal.volumeTonnes} Tonnes
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                  {activeInspectedDeal.discountPercent}% Discount vs APMC Market
                </span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                Location: {activeInspectedDeal.lot.villageDistrict} · Depot: {activeInspectedDeal.mandiName} · Dispatch: {activeInspectedDeal.lot.harvestDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Total Estimated Lot Value</div>
              <div className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">
                ₹{activeInspectedDeal.totalLotCost.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Save ₹{activeInspectedDeal.totalBuyerSavings.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => onSelectLotForBid(activeInspectedDeal.lot, activeInspectedDeal.askingPricePerQuintal)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Bid at ₹{activeInspectedDeal.askingPricePerQuintal}/q</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. SYNCED VISUAL DEAL CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Verified Stored Lots Matched on Chart ({filteredDeals.length})</span>
          </h3>
          <span className="text-xs text-stone-400">
            Sorted by highest discount & financial realization
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...filteredDeals]
            .sort((a, b) => b.discountPercent - a.discountPercent)
            .map((item) => {
              const isHovered = hoveredLotId === item.lot.id;
              const isSelected = activeSelectedLotId === item.lot.id;

              return (
                <div
                  key={item.lot.id}
                  onMouseEnter={() => setHoveredLotId(item.lot.id)}
                  onMouseLeave={() => setHoveredLotId(null)}
                  className={`bg-white dark:bg-stone-900 rounded-2xl border p-4.5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                    isHovered || isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {item.lot.cropName}
                          </h4>
                          {item.dealRating === 'super_deal' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              🔥 Super Deal
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">{item.lot.variety}</div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 font-mono font-bold text-xs text-stone-700 dark:text-stone-300">
                        {item.volumeTonnes}T
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{item.mandiName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Farmer: {item.lot.farmerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Available: {item.lot.harvestDate}</span>
                      </div>
                    </div>

                    {/* Price and Deal Economics */}
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-stone-400">Asking Price</span>
                          <div className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">
                            ₹{item.askingPricePerQuintal.toLocaleString()}
                            <span className="text-[10px] font-normal text-stone-500"> /q</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-semibold text-stone-400">Mandi Benchmark</span>
                          <div className="text-xs font-mono line-through text-stone-400">
                            ₹{item.benchmarkMandiPrice.toLocaleString()}/q
                          </div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {item.discountPercent > 0 ? `-${item.discountPercent}% Off` : '+Premium'}
                          </div>
                        </div>
                      </div>

                      {item.totalBuyerSavings > 0 && (
                        <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-[11px]">
                          <span className="text-stone-500">Buyer Savings:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            Save ₹{item.totalBuyerSavings.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveSelectedLotId(item.lot.id);
                      onSelectLotForBid(item.lot, item.askingPricePerQuintal);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Place Procurement Bid</span>
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
