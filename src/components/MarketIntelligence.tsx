import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Scale,
  Calendar,
  Layers,
  Info,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal
} from 'lucide-react';
import { CROPS, getHistoricalData } from '../services/mandiData';
import { CropType, Mandi } from '../types';

interface MarketIntelligenceProps {
  cropId: CropType;
  mandis: Mandi[];
  harvestDateStr: string;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({
  cropId,
  mandis,
  harvestDateStr,
}) => {
  const currentCrop = CROPS[cropId];
  const [selectedMandiId, setSelectedMandiId] = useState<string>(mandis[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'trends' | 'elasticity' | 'matrix'>('trends');

  const activeMandi = mandis.find((m) => m.id === selectedMandiId) || mandis[0];
  const historicalSeries = getHistoricalData(cropId, activeMandi.id, 45);
  const forecasts = activeMandi.dailyForecasts;

  // Combine historical + forecast for the time-series chart
  // Historical has prices and arrivals
  // Forecast has expected, min, max, benchmark, arrivals
  const allPrices = [
    ...historicalSeries.map((h) => h.price),
    ...forecasts.map((f) => f.maxPrice),
    ...forecasts.map((f) => f.minPrice),
  ];
  const minChartPrice = Math.max(0, Math.floor(Math.min(...allPrices) * 0.85 / 100) * 100);
  const maxChartPrice = Math.ceil(Math.max(...allPrices) * 1.12 / 100) * 100;
  const priceRange = maxChartPrice - minChartPrice || 1;

  const maxArrival = Math.max(
    ...historicalSeries.map((h) => h.arrivals),
    ...forecasts.map((f) => f.expectedArrivals)
  );

  // SVG Chart Geometry
  const chartWidth = 800;
  const chartHeight = 280;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 45;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const totalPoints = historicalSeries.length + forecasts.length;

  const getX = (index: number) => paddingLeft + (index / (totalPoints - 1)) * plotWidth;
  const getY = (val: number) => paddingTop + plotHeight - ((val - minChartPrice) / priceRange) * plotHeight;
  const getArrivalY = (arr: number) => paddingTop + plotHeight - (arr / (maxArrival * 1.25)) * (plotHeight * 0.6);

  // Path generators
  const historicalPath = historicalSeries
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(h.price)}`)
    .join(' ');

  const forecastStartIdx = historicalSeries.length - 1;
  const lastHistPrice = historicalSeries[historicalSeries.length - 1].price;

  // Expected forecast line
  const forecastPath = `M ${getX(forecastStartIdx)} ${getY(lastHistPrice)} ` +
    forecasts.map((f, i) => `L ${getX(forecastStartIdx + 1 + i)} ${getY(f.expectedPrice)}`).join(' ');

  // 3-Year Historical Moving Average Benchmark line
  const benchmarkPath = `M ${getX(forecastStartIdx)} ${getY(lastHistPrice)} ` +
    forecasts.map((f, i) => `L ${getX(forecastStartIdx + 1 + i)} ${getY(f.benchmarkPrice)}`).join(' ');

  // Confidence Envelope Polygon (Min to Max)
  const confidencePolygon =
    `M ${getX(forecastStartIdx)} ${getY(lastHistPrice)} ` +
    forecasts.map((f, i) => `L ${getX(forecastStartIdx + 1 + i)} ${getY(f.maxPrice)}`).join(' ') +
    ' ' +
    forecasts.slice().reverse().map((f, i) => `L ${getX(forecastStartIdx + forecasts.length - i)} ${getY(f.minPrice)}`).join(' ') +
    ' Z';

  // Elasticity Scatter Points (Price vs Arrival)
  const elasticityPoints = historicalSeries.map((h) => ({
    x: h.arrivals,
    y: h.price,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>Market Intelligence & Elasticity Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {currentCrop.name} ({currentCrop.hindiName}) APMC Market Dynamics
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            45-day historical price & arrival signals combined with 14-day multi-market forward forecasts
          </p>
        </div>

        {/* Mandi Selector for Deep Dive */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-stone-500 whitespace-nowrap">
            Focus Mandi:
          </label>
          <select
            value={selectedMandiId}
            onChange={(e) => setSelectedMandiId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {mandis.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.distanceKm} km)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs / Sub-View Controls */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-lg w-fit text-xs font-medium">
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'trends'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Price & Arrival Trajectory
        </button>
        <button
          onClick={() => setActiveTab('elasticity')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'elasticity'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Price vs Arrival Elasticity
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'matrix'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          Multi-Mandi Comparative Matrix
        </button>
      </div>

      {/* Tab 1: Price & Arrival Trajectory Chart */}
      {activeTab === 'trends' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {activeMandi.name}: Historical 45d Price & 14d Forecast Envelope
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Solid green: AI multi-factor forecast · Shaded: 95% confidence bounds · Dashed: 3-year baseline benchmark
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-stone-500 block" />
                <span className="text-stone-500">Historical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-600 block rounded" />
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">AI Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-stone-400 block" />
                <span className="text-stone-400">3-Yr Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-stone-200 dark:bg-stone-700 block rounded-xs" />
                <span className="text-stone-400">Daily Arrivals</span>
              </div>
            </div>
          </div>

          {/* SVG Interactive Chart Viewport */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto text-stone-600 dark:text-stone-400 select-none"
              >
                {/* Horizontal Grid lines & Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const pVal = Math.round(minChartPrice + pct * priceRange);
                  const y = paddingTop + plotHeight - pct * plotHeight;
                  return (
                    <g key={i}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity="0.08"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-stone-400"
                      >
                        ₹{pVal}
                      </text>
                    </g>
                  );
                })}

                {/* Daily Arrival Volume Bars at Bottom */}
                {historicalSeries.map((h, i) => {
                  const x = getX(i) - 3;
                  const barH = ((h.arrivals / (maxArrival * 1.25)) * (plotHeight * 0.5));
                  const y = paddingTop + plotHeight - barH;
                  return (
                    <rect
                      key={`h-bar-${i}`}
                      x={x}
                      y={y}
                      width={6}
                      height={barH}
                      fill="currentColor"
                      fillOpacity="0.12"
                      rx={1}
                    />
                  );
                })}

                {forecasts.map((f, i) => {
                  const x = getX(forecastStartIdx + 1 + i) - 3;
                  const barH = ((f.expectedArrivals / (maxArrival * 1.25)) * (plotHeight * 0.5));
                  const y = paddingTop + plotHeight - barH;
                  return (
                    <rect
                      key={`f-bar-${i}`}
                      x={x}
                      y={y}
                      width={6}
                      height={barH}
                      fill={f.arrivalGlutAlert ? '#f59e0b' : '#10b981'}
                      fillOpacity={f.arrivalGlutAlert ? '0.35' : '0.18'}
                      rx={1}
                    />
                  );
                })}

                {/* Vertical Divider between Historical and Forecast */}
                <line
                  x1={getX(forecastStartIdx)}
                  y1={paddingTop}
                  x2={getX(forecastStartIdx)}
                  y2={chartHeight - paddingBottom}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text
                  x={getX(forecastStartIdx)}
                  y={paddingTop - 8}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-emerald-600 uppercase"
                >
                  Harvest Day (Today)
                </text>

                {/* Confidence Envelope Shading */}
                <path d={confidencePolygon} fill="#10b981" fillOpacity="0.12" />

                {/* Historical Price Path */}
                <path
                  d={historicalPath}
                  fill="none"
                  stroke="#78716c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Baseline Benchmark Path (Dashed) */}
                <path
                  d={benchmarkPath}
                  fill="none"
                  stroke="#a8a29e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Expected AI Forecast Path (Bold Emerald) */}
                <path
                  d={forecastPath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Key data points dots on forecast */}
                {forecasts.map((f, i) => {
                  if (i % 2 === 0 || i === forecasts.length - 1) {
                    const cx = getX(forecastStartIdx + 1 + i);
                    const cy = getY(f.expectedPrice);
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="3.5"
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  }
                  return null;
                })}

                {/* X-axis labels */}
                <text
                  x={getX(0)}
                  y={chartHeight - 15}
                  textAnchor="start"
                  className="text-[10px] font-mono fill-stone-400"
                >
                  -45 Days
                </text>
                <text
                  x={getX(Math.floor(historicalSeries.length / 2))}
                  y={chartHeight - 15}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-stone-400"
                >
                  -22 Days
                </text>
                <text
                  x={getX(forecastStartIdx)}
                  y={chartHeight - 15}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-stone-800 dark:fill-stone-200"
                >
                  Harvest (Day 0)
                </text>
                <text
                  x={getX(forecastStartIdx + 7)}
                  y={chartHeight - 15}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-emerald-600"
                >
                  +7 Days
                </text>
                <text
                  x={getX(totalPoints - 1)}
                  y={chartHeight - 15}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-emerald-600"
                >
                  +14 Days
                </text>
              </svg>
            </div>
          </div>

          {/* Quick Metrics Bar below chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-stone-400 block text-xs">Today's Spot Rate</span>
              <div className="text-lg font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                ₹{forecasts[0].expectedPrice.toLocaleString('en-IN')}/q
              </div>
            </div>
            <div>
              <span className="text-stone-400 block text-xs">7-Day Forward Expected</span>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                ₹{forecasts[7]?.expectedPrice.toLocaleString('en-IN') || '-'}/q
              </div>
            </div>
            <div>
              <span className="text-stone-400 block text-xs">Model Forecast Gain vs Benchmark</span>
              <div className="text-lg font-bold font-mono tabular-nums text-stone-800 dark:text-stone-200">
                +₹{Math.max(0, (forecasts[7]?.expectedPrice || 0) - (forecasts[7]?.benchmarkPrice || 0))}/q
              </div>
            </div>
            <div>
              <span className="text-stone-400 block text-xs">Average Daily Arrivals</span>
              <div className="text-lg font-bold font-mono tabular-nums text-stone-800 dark:text-stone-200">
                {Math.round(activeMandi.dailyForecasts[0].expectedArrivals)} q/day
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Price vs Arrival Elasticity */}
      {activeTab === 'elasticity' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-6">
          <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Price-Arrival Inverse Elasticity Curve ({activeMandi.name})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Demonstrates supply-demand price depression: as daily arrivals surge beyond handling capacity, clearing auction prices decline
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Scatter plot simulation */}
            <div className="lg:col-span-2 bg-stone-50 dark:bg-stone-800/40 rounded-xl p-4 border border-stone-200/80 dark:border-stone-700/80">
              <svg viewBox="0 0 600 240" className="w-full h-auto text-stone-500 select-none">
                {/* Axes */}
                <line x1="50" y1="20" x2="50" y2="200" stroke="currentColor" strokeWidth="1" />
                <line x1="50" y1="200" x2="570" y2="200" stroke="currentColor" strokeWidth="1" />

                <text x="35" y="30" textAnchor="end" className="text-[10px] font-mono fill-stone-400">High ₹</text>
                <text x="35" y="195" textAnchor="end" className="text-[10px] font-mono fill-stone-400">Low ₹</text>
                <text x="50" y="220" textAnchor="start" className="text-[10px] font-mono fill-stone-400">Low Arrivals (q/d)</text>
                <text x="570" y="220" textAnchor="end" className="text-[10px] font-mono fill-stone-400">Surge Glut Arrivals (q/d)</text>

                {/* Elasticity Trend Curve */}
                <path
                  d="M 60 50 Q 250 110, 550 180"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Scatter points */}
                {elasticityPoints.map((pt, i) => {
                  const normX = 60 + ((pt.x - 600) / (maxArrival * 1.2)) * 480;
                  const normY = 200 - ((pt.y - minChartPrice) / priceRange) * 160;
                  return (
                    <circle
                      key={i}
                      cx={Math.min(560, Math.max(60, normX))}
                      cy={Math.min(195, Math.max(30, normY))}
                      r="3.5"
                      fill="#10b981"
                      fillOpacity="0.75"
                    />
                  );
                })}

                {/* Current operating point */}
                <circle cx="340" cy="125" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <text x="355" y="128" className="text-[10px] font-bold fill-amber-700 dark:fill-amber-400">
                  Current Operating Point
                </text>
              </svg>
            </div>

            {/* Elasticity Commentary */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Estimated Elasticity Coefficient: -0.34
                </span>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed text-[11px]">
                  For every 10% increase in daily truck arrivals above the 1,500 q normal threshold, spot clearing prices drop by approximately 3.4%.
                </p>
              </div>

              <div className="space-y-2 text-stone-600 dark:text-stone-300">
                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                  Handling Capacity Saturation
                </span>
                <p className="leading-relaxed">
                  When local mandis exceed {activeMandi.handlingCapacityTonnesPerDay}T/day capacity, commission agent credit tightens and distress distress sales occur after 09:00 AM auctions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Multi-Mandi Comparative Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden space-y-4 p-6">
          <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Cross-Market Structural Comparison Matrix
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Evaluating distance, capacity, price spread, and liquidity to determine optimal trade routes
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold">
                  <th className="py-3 px-4">Mandi & Hub</th>
                  <th className="py-3 px-4">Distance & Transit</th>
                  <th className="py-3 px-4 text-right">Today Spot (₹/q)</th>
                  <th className="py-3 px-4 text-right">7-Day Forecast (₹/q)</th>
                  <th className="py-3 px-4 text-right">Avg Arrivals (q/d)</th>
                  <th className="py-3 px-4">Buyer Liquidity</th>
                  <th className="py-3 px-4">Cold Storage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                {mandis.map((m) => {
                  const spot = m.dailyForecasts[0]?.expectedPrice || 0;
                  const f7 = m.dailyForecasts[7]?.expectedPrice || 0;
                  const diff = f7 - spot;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-stone-900 dark:text-stone-100">
                        <div>{m.name}</div>
                        <div className="text-[11px] font-normal text-stone-400">{m.district}, {m.state}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                        {m.distanceKm} km · {m.transitHours}h
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-stone-900 dark:text-stone-100">
                        ₹{spot.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{f7.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[10px] ml-1.5 ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          ({diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-stone-600 dark:text-stone-300">
                        {m.dailyForecasts[0]?.expectedArrivals.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {m.buyerLiquidity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-stone-500">
                        {m.coldStorageAvailable ? '✓ Available' : '— None'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
