import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Activity,
  Radio,
  Building2,
  Phone,
  Clock,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  MapPin,
  Truck,
  Scale,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { PAN_INDIA_APMCS, APMCDetails } from '../services/panIndiaApmcData';
import { CROPS } from '../services/mandiData';
import { MayuraLogo } from './MayuraLogo';

export const PanIndiaLiveApmcView: React.FC = () => {
  const [apmcList, setApmcList] = useState<APMCDetails[]>(PAN_INDIA_APMCS);
  const [selectedCropId, setSelectedCropId] = useState<string>('tomatoes');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [lastTickTime, setLastTickTime] = useState<Date>(new Date());
  const [tickCounter, setTickCounter] = useState(0);
  const [selectedApmcForModal, setSelectedApmcForModal] = useState<APMCDetails | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; mandiName: string; price: number; time: string } | null>(null);

  // Live WebSocket/Tick Simulation: Every 2.5 seconds, micro-update prices and arrivals
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setApmcList((prev) =>
        prev.map((apmc) => {
          // Randomly update 1 or 2 commodities with micro price movement (-15 to +20 ₹)
          const updatedPrices = apmc.livePrices.map((p) => {
            if (Math.random() > 0.4) {
              const delta = Math.floor((Math.random() - 0.46) * 18);
              const newModal = Math.max(p.minPrice + 50, p.modalPrice + delta);
              const newArrival = Math.max(10, p.todayArrivalTonnes + Math.floor(Math.random() * 4));
              const newChange = Number((p.changePercent24h + (delta / p.modalPrice) * 10).toFixed(2));
              return {
                ...p,
                modalPrice: newModal,
                todayArrivalTonnes: newArrival,
                changePercent24h: newChange,
              };
            }
            return p;
          });

          // Micro-update the last intraday tick
          const lastTick = apmc.intradayTicks[apmc.intradayTicks.length - 1];
          const cropObj = updatedPrices.find((c) => c.cropId === selectedCropId);
          const updatedTicks = [...apmc.intradayTicks];
          if (cropObj && lastTick) {
            updatedTicks[updatedTicks.length - 1] = {
              ...lastTick,
              price: cropObj.modalPrice,
              arrivals: cropObj.todayArrivalTonnes,
            };
          }

          return {
            ...apmc,
            livePrices: updatedPrices,
            intradayTicks: updatedTicks,
          };
        })
      );

      setLastTickTime(new Date());
      setTickCounter((prev) => prev + 1);
    }, 2400);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedCropId]);

  // Filtered Mandis based on Zone & Search
  const filteredApmcs = useMemo(() => {
    return apmcList.filter((apmc) => {
      const matchesZone = selectedZone === 'All' || apmc.zone === selectedZone;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        apmc.name.toLowerCase().includes(q) ||
        apmc.state.toLowerCase().includes(q) ||
        apmc.district.toLowerCase().includes(q) ||
        apmc.code.toLowerCase().includes(q) ||
        apmc.secretaryName.toLowerCase().includes(q);
      return matchesZone && matchesSearch;
    });
  }, [apmcList, selectedZone, searchQuery]);

  // Top 5 Mandis for the Live Multi-line Chart
  const chartMandis = useMemo(() => {
    return filteredApmcs.slice(0, 5);
  }, [filteredApmcs]);

  // Current Crop Config
  const cropConfig = (CROPS as any)[selectedCropId] || CROPS.tomatoes;

  // Chart Geometry & Calculations
  const chartWidth = 740;
  const chartHeight = 260;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  // Find min and max price across all selected mandis for this crop
  const { minPriceOverall, maxPriceOverall, timeLabels } = useMemo(() => {
    let minP = 999999;
    let maxP = 0;
    const times = ['04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM (Live)'];

    chartMandis.forEach((m) => {
      const priceObj = m.livePrices.find((p) => p.cropId === selectedCropId);
      if (priceObj) {
        if (priceObj.minPrice < minP) minP = priceObj.minPrice;
        if (priceObj.maxPrice > maxP) maxP = priceObj.maxPrice;
      }
      m.intradayTicks.forEach((t) => {
        if (t.price < minP) minP = t.price;
        if (t.price > maxP) maxP = t.price;
      });
    });

    if (minP === 999999) minP = 1500;
    if (maxP === 0) maxP = 3500;

    // Add 8% buffer
    const range = maxP - minP;
    const finalMin = Math.max(0, Math.floor((minP - range * 0.1) / 50) * 50);
    const finalMax = Math.ceil((maxP + range * 0.1) / 50) * 50;

    return { minPriceOverall: finalMin, maxPriceOverall: finalMax, timeLabels: times };
  }, [chartMandis, selectedCropId]);

  const priceRange = maxPriceOverall - minPriceOverall || 1;

  const getX = (idx: number, total: number) => padLeft + (idx / Math.max(1, total - 1)) * plotWidth;
  const getY = (price: number) => padTop + plotHeight - ((price - minPriceOverall) / priceRange) * plotHeight;

  // Color palette for chart lines
  const mandiColors = [
    { stroke: '#2563EB', fill: '#DBEAFE', text: 'text-blue-600', name: 'Blue' },
    { stroke: '#059669', fill: '#D1FAE5', text: 'text-emerald-600', name: 'Emerald' },
    { stroke: '#D97706', fill: '#FEF3C7', text: 'text-amber-600', name: 'Amber' },
    { stroke: '#9333EA', fill: '#F3E8FF', text: 'text-purple-600', name: 'Purple' },
    { stroke: '#E11D48', fill: '#FFE4E6', text: 'text-rose-600', name: 'Rose' },
  ];

  // Total Pan-India Summary Stats
  const totalVolumeToday = useMemo(() => {
    return apmcList.reduce((acc, a) => {
      const p = a.livePrices.find((c) => c.cropId === selectedCropId);
      return acc + (p?.todayArrivalTonnes || 0);
    }, 0);
  }, [apmcList, selectedCropId]);

  const nationalAveragePrice = useMemo(() => {
    let sum = 0;
    let count = 0;
    apmcList.forEach((a) => {
      const p = a.livePrices.find((c) => c.cropId === selectedCropId);
      if (p) {
        sum += p.modalPrice;
        count++;
      }
    });
    return count > 0 ? Math.round(sum / count) : cropConfig.basePricePerQuintal;
  }, [apmcList, selectedCropId, cropConfig]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* Top Banner: Mayura Indian Bird Branding & Live Ticker */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
        {/* Decorative backdrop peacock feather pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-15 pointer-events-none flex items-center justify-end pr-4">
          <MayuraLogo size={220} className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <MayuraLogo size={48} className="w-12 h-12" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Mayura APMC Pulse
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-400 text-stone-900 shadow-xs">
                  मयूर · National Bird of India
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Pan-India Live Exchange
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                Real-time high-frequency mandi price feeds, arrival logistics, and statutory APMC infrastructure details across 18+ major agricultural terminals in India.
              </p>
            </div>
          </div>

          {/* Live Streaming Controller & Heartbeat Beacon */}
          <div className="flex items-center gap-3 shrink-0 bg-white/10 dark:bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isLiveStreaming && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isLiveStreaming ? 'bg-emerald-500' : 'bg-stone-400'
                  }`}
                ></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {isLiveStreaming ? 'Live Feed Connected' : 'Feed Paused'}
                </span>
                <span className="text-[9px] text-stone-300 font-mono">
                  {lastTickTime.toLocaleTimeString('en-IN', { hour12: false })} (Tick #{tickCounter})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title={isLiveStreaming ? 'Pause live ticker' : 'Resume live ticker'}
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Pan-India Metric Strip */}
        <div className="mt-5 pt-4 border-t border-emerald-700/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase">National Modal Rate</span>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              ₹{nationalAveragePrice.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-200">/quintal</span>
            </div>
            <span className="text-[9px] text-emerald-300/80">Composite across Indian Mandis</span>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase">Total Tracked Inflow</span>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              {totalVolumeToday.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-200">Tonnes</span>
            </div>
            <span className="text-[9px] text-emerald-300/80">Daily Mandi Gate Arrivals</span>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase">Connected APMCs</span>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              {apmcList.length} <span className="text-xs font-normal text-emerald-200">Flagship Hubs</span>
            </div>
            <span className="text-[9px] text-emerald-300/80">100% e-NAM Synced</span>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase">Highest Arbitrage Corridor</span>
            <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5 truncate">
              Kolar ➔ Azadpur (+₹420)
            </div>
            <span className="text-[9px] text-emerald-300/80">Inter-Mandi Gross Spread</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Commodity Selection & Zone Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        {/* Commodity Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 mr-1.5 shrink-0">
            Commodity:
          </span>
          {[
            { id: 'tomatoes', label: 'Tomatoes (टमाटर)', icon: '🍅' },
            { id: 'onions', label: 'Onions (प्याज़)', icon: '🧅' },
            { id: 'potatoes', label: 'Potatoes (आलू)', icon: '🥔' },
            { id: 'chillies', label: 'Chillies (मिर्च)', icon: '🌶️' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCropId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCropId === c.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Zone Buttons */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 mr-1 shrink-0">
            Zone:
          </span>
          {['All', 'North', 'South', 'West', 'Central', 'East'].map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedZone === zone
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Main Section: Working Live Chart & Real-Time Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Working Live Updating Multi-APMC Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Activity className="w-4 h-4 animate-pulse" />
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                  Live Intraday Price Waveform ({cropConfig.name})
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-mono">
                  LIVE UPDATING
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Simultaneous comparison across flagship Indian APMC wholesale auctions.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {chartMandis.map((m, idx) => {
                const color = mandiColors[idx % mandiColors.length];
                return (
                  <div key={m.id} className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.stroke }} />
                    <span className="truncate max-w-[120px]">{m.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Multi-Line Chart Container */}
          <div className="relative bg-stone-50/80 dark:bg-stone-950/60 rounded-xl p-3 border border-stone-200 dark:border-stone-800 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[560px] select-none"
            >
              {/* Background horizontal grid lines & Price labels */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                const y = padTop + plotHeight * ratio;
                const price = Math.round(maxPriceOverall - ratio * priceRange);
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartWidth - padRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-stone-200 dark:text-stone-800"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-stone-400 dark:fill-stone-500 text-[10px] font-mono font-medium"
                    >
                      ₹{price}
                    </text>
                  </g>
                );
              })}

              {/* Time X-axis labels */}
              {timeLabels.map((time, idx) => {
                const x = getX(idx, timeLabels.length);
                return (
                  <g key={idx}>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotHeight}
                      stroke="currentColor"
                      className="text-stone-200/50 dark:text-stone-800/50"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={padTop + plotHeight + 18}
                      textAnchor="middle"
                      className="fill-stone-400 dark:fill-stone-500 text-[10px] font-mono"
                    >
                      {time}
                    </text>
                  </g>
                );
              })}

              {/* Draw Lines for each Mandi */}
              {chartMandis.map((mandi, mIdx) => {
                const color = mandiColors[mIdx % mandiColors.length];
                const ticks = mandi.intradayTicks;
                const cropPrice = mandi.livePrices.find((p) => p.cropId === selectedCropId);
                const currentPrice = cropPrice?.modalPrice || 2500;

                // Path Points
                const points = ticks.map((t, tIdx) => {
                  const x = getX(tIdx, timeLabels.length);
                  // Scale according to current crop
                  const pRatio = cropPrice ? cropPrice.modalPrice / (mandi.livePrices[0]?.modalPrice || 1) : 1;
                  const price = tIdx === ticks.length - 1 ? currentPrice : Math.round(t.price * pRatio);
                  const y = getY(price);
                  return { x, y, price, time: t.time };
                });

                const pathData = points
                  .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                  .join(' ');

                return (
                  <g key={mandi.id}>
                    {/* Glow stroke */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={color.stroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data dots */}
                    {points.map((pt, pIdx) => {
                      const isLast = pIdx === points.length - 1;
                      return (
                        <g key={pIdx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isLast ? 4.5 : 3}
                            fill={isLast ? color.stroke : '#FFFFFF'}
                            stroke={color.stroke}
                            strokeWidth="2"
                            className="cursor-pointer transition-transform hover:scale-150"
                            onMouseEnter={() =>
                              setHoveredPoint({
                                x: pt.x,
                                y: pt.y,
                                mandiName: mandi.name,
                                price: pt.price,
                                time: pt.time,
                              })
                            }
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {isLast && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="8"
                              fill={color.stroke}
                              opacity="0.25"
                              className="animate-ping"
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <g transform={`translate(${Math.min(chartWidth - 140, Math.max(20, hoveredPoint.x - 70))}, ${Math.max(10, hoveredPoint.y - 45)})`}>
                  <rect
                    width="140"
                    height="38"
                    rx="6"
                    className="fill-stone-900 dark:fill-white drop-shadow-lg"
                  />
                  <text
                    x="8"
                    y="16"
                    className="fill-white dark:fill-stone-900 text-[10px] font-bold"
                  >
                    {hoveredPoint.mandiName.split(' ')[0]} ({hoveredPoint.time})
                  </text>
                  <text
                    x="8"
                    y="30"
                    className="fill-emerald-400 dark:fill-emerald-700 text-[11px] font-extrabold font-mono"
                  >
                    ₹{hoveredPoint.price.toLocaleString('en-IN')}/quintal
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-1">
            <span>• Chart updates in real time with high-frequency mandi arrivals</span>
            <span>All values in ₹ per Quintal (100 kg)</span>
          </div>
        </div>

        {/* Right Col: Live Arbitrage Corridors & Ticker */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                <Truck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Live Arbitrage Corridors
              </h3>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">High Spread</span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                from: 'Kolar (KA)',
                to: 'Azadpur Delhi (DL)',
                fromPrice: 2420,
                toPrice: 2840,
                diff: 420,
                dist: '2,150 km',
                mode: 'Reefer Truck / Rail',
              },
              {
                from: 'Lasalgaon (MH)',
                to: 'Koyambedu (TN)',
                fromPrice: 2050,
                toPrice: 2520,
                diff: 470,
                dist: '1,280 km',
                mode: '10T Multi-Axle',
              },
              {
                from: 'Madanapalle (AP)',
                to: 'Vashi Mumbai (MH)',
                fromPrice: 2340,
                toPrice: 2950,
                diff: 610,
                dist: '980 km',
                mode: 'Standard Truck',
              },
              {
                from: 'Burdwan (WB)',
                to: 'Azadpur Delhi (DL)',
                fromPrice: 2620,
                toPrice: 2840,
                diff: 220,
                dist: '1,340 km',
                mode: 'Rail Container',
              },
            ].map((route, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {route.from} ➔ {route.to}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                    +₹{route.diff}/q
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <span>
                    Rates: ₹{route.fromPrice} vs ₹{route.toPrice}
                  </span>
                  <span className="font-medium text-stone-600 dark:text-stone-300">
                    {route.dist} · {route.mode}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              Mayura Algorithmic Dispatch
            </div>
            <p className="leading-relaxed">
              Consolidating full 10-tonne loads for inter-state transit yields up to 22% higher net realization after diesel freight and toll charges.
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Pan-India APMC Directory & Infrastructure Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Pan-India APMC Mandi Infrastructure Directory ({filteredApmcs.length} Mandis)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Official market committee records, cold chains, testing labs, and administrative contacts.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by state, mandi, code..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* APMC Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApmcs.map((apmc) => {
            const currentCropPrice = apmc.livePrices.find((p) => p.cropId === selectedCropId);

            return (
              <div
                key={apmc.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {apmc.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {apmc.zone} Zone
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                        {apmc.name}
                      </h3>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{apmc.district}, {apmc.state}</span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        apmc.currentStatus.includes('Peak')
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {apmc.currentStatus}
                    </span>
                  </div>

                  {/* Live Price for Current Crop */}
                  {currentCropPrice && (
                    <div className="p-3 my-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-750 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                          {currentCropPrice.cropName} Modal Rate
                        </span>
                        <div className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                          ₹{currentCropPrice.modalPrice.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] font-normal text-stone-500">/quintal</span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Range: ₹{currentCropPrice.minPrice} – ₹{currentCropPrice.maxPrice}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block">
                          Today's Arrival
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">
                          {currentCropPrice.todayArrivalTonnes} Tonnes
                        </span>
                        <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-bold">
                          {currentCropPrice.changePercent24h >= 0 ? (
                            <span className="text-emerald-600 flex items-center">
                              <ArrowUpRight className="w-3 h-3" />
                              +{currentCropPrice.changePercent24h}%
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center">
                              <ArrowDownRight className="w-3 h-3" />
                              {currentCropPrice.changePercent24h}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandi Infrastructure Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 text-stone-600 dark:text-stone-300">
                    <div className="flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Cold Store: <strong className="font-mono">{apmc.coldStorageCapacityTonnes.toLocaleString('en-IN')} T</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Capacity: <strong className="font-mono">{apmc.handlingCapacityTonnesPerDay.toLocaleString('en-IN')} T/d</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>e-NAM: <strong className="text-emerald-700 dark:text-emerald-400">Integrated</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{apmc.operatingHours.split('(')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action button */}
                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <div className="text-[10px] text-stone-500 truncate max-w-[170px]">
                    Sec: <strong>{apmc.secretaryName}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApmcForModal(apmc)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
                  >
                    <span>View All Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* APMC Full Detail Modal */}
      {selectedApmcForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                    {selectedApmcForModal.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-400 text-stone-900 font-bold">
                    {selectedApmcForModal.zone} India Zone
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  {selectedApmcForModal.name}
                </h2>
                <div className="text-xs text-emerald-200 mt-0.5">
                  {selectedApmcForModal.hindiName}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApmcForModal(null)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Secretary & Contact Bar */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Market Secretary / Administrator</span>
                  <div className="font-bold text-stone-800 dark:text-stone-200 text-sm mt-0.5">
                    {selectedApmcForModal.secretaryName}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedApmcForModal.helplinePhone}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Trading Timings & Status</span>
                  <div className="font-medium text-stone-800 dark:text-stone-200 mt-0.5">
                    {selectedApmcForModal.operatingHours}
                  </div>
                  <div className="mt-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                    Status: {selectedApmcForModal.currentStatus}
                  </div>
                </div>
              </div>

              {/* Live Commodities Traded Table */}
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Live Commodity Auctions Today
                </h4>
                <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-500 uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Commodity</th>
                        <th className="py-2 px-3 text-right">Modal Rate</th>
                        <th className="py-2 px-3 text-right">Min – Max</th>
                        <th className="py-2 px-3 text-right">Today Arrivals</th>
                        <th className="py-2 px-3 text-right">24h Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-750 font-mono text-[11px]">
                      {selectedApmcForModal.livePrices.map((p, idx) => (
                        <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                          <td className="py-2 px-3 font-bold font-sans text-stone-800 dark:text-stone-200">
                            {p.cropName}
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                            ₹{p.modalPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-right text-stone-500">
                            ₹{p.minPrice} – ₹{p.maxPrice}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {p.todayArrivalTonnes} T
                          </td>
                          <td className="py-2 px-3 text-right">
                            {p.changePercent24h >= 0 ? (
                              <span className="text-emerald-600 font-bold">+{p.changePercent24h}%</span>
                            ) : (
                              <span className="text-rose-600 font-bold">{p.changePercent24h}%</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Infrastructure & Statutory Details */}
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-2">
                  APMC Infrastructure & Logistics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Annual Turnover</span>
                    <strong className="font-mono text-sm text-stone-800 dark:text-stone-200">
                      ₹{selectedApmcForModal.annualTurnoverCrores.toLocaleString('en-IN')} Cr
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Cold Storage</span>
                    <strong className="font-mono text-sm text-stone-800 dark:text-stone-200">
                      {selectedApmcForModal.coldStorageCapacityTonnes.toLocaleString('en-IN')} Tonnes
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Mandi Cess Rate</span>
                    <strong className="font-mono text-sm text-stone-800 dark:text-stone-200">
                      {selectedApmcForModal.mandiCessPercent}% Cess
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Highway Connectivity</span>
                    <strong className="text-xs text-stone-800 dark:text-stone-200 truncate block">
                      {selectedApmcForModal.nearestHighway}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">Railway Goods Siding</span>
                    <strong className="text-xs text-stone-800 dark:text-stone-200 block">
                      {selectedApmcForModal.railwaySidingAccess ? '✅ Available' : '❌ Not Available'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 block">e-NAM Portal Code</span>
                    <strong className="font-mono text-xs text-emerald-700 dark:text-emerald-400 block">
                      {selectedApmcForModal.eNamMandiCode}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedApmcForModal(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 font-bold rounded-lg text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
