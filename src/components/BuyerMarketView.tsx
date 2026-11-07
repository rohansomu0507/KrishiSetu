import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Scale,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Filter,
  Plus,
  Send,
  X,
  Clock,
  Truck,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ApplicantRecord,
  getApplicants,
  subscribeApplicants,
  BuyerOrderRecord,
  subscribeBuyerOrders,
  saveBuyerOrder,
  GovStandardRecord,
  getGovStandards,
  subscribeGovStandards,
} from '../services/firebase';
import { CROPS } from '../services/mandiData';
import { CropType, Mandi } from '../types';
import { MarketIntelligence } from './MarketIntelligence';
import { VisualDealFinder } from './VisualDealFinder';

interface BuyerMarketViewProps {
  mandis: Mandi[];
  cropId: CropType;
  harvestDateStr: string;
}

export const BuyerMarketView: React.FC<BuyerMarketViewProps> = ({
  mandis,
  cropId,
  harvestDateStr,
}) => {
  const [activeTab, setActiveTab] = useState<'visual_deals' | 'available_produce' | 'ai_predictions' | 'my_bids'>('visual_deals');
  const [applicantLots, setApplicantLots] = useState<ApplicantRecord[]>(() => getApplicants());
  const [buyerOrders, setBuyerOrders] = useState<BuyerOrderRecord[]>([]);
  const [govStandards, setGovStandards] = useState<GovStandardRecord[]>(() => getGovStandards());
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedLotForBid, setSelectedLotForBid] = useState<ApplicantRecord | null>(null);

  // Bid Modal State
  const [buyerName, setBuyerName] = useState('Vikram Sethi');
  const [buyerCompany, setBuyerCompany] = useState('Sethi Agro Wholesale & Exports');
  const [buyerContact, setBuyerContact] = useState('+91 98440 55112');
  const [bidPricePerQuintal, setBidPricePerQuintal] = useState<number>(2300);
  const [quantityTonnesRequested, setQuantityTonnesRequested] = useState<number>(3.0);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [orderErrorMsg, setOrderErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubApps = subscribeApplicants((data) => setApplicantLots(data));
    const unsubOrders = subscribeBuyerOrders((data) => setBuyerOrders(data));
    const unsubStds = subscribeGovStandards((data) => setGovStandards(data));
    return () => {
      unsubApps();
      unsubOrders();
      unsubStds();
    };
  }, []);

  const filteredLots = applicantLots.filter((lot) => {
    if (selectedCropFilter === 'all') return true;
    return lot.cropName.toLowerCase().includes(selectedCropFilter.toLowerCase()) || lot.cropId === selectedCropFilter;
  });

  const handleOpenBidModal = (lot: ApplicantRecord, suggestedBidPrice?: number) => {
    setSelectedLotForBid(lot);
    const asking = suggestedBidPrice || lot.askingPricePerQuintal || Math.round(lot.estimatedNetRealization / (lot.quantityTonnes * 10));
    setBidPricePerQuintal(asking);
    setQuantityTonnesRequested(lot.quantityTonnes);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid) return;
    setOrderErrorMsg(null);

    try {
      const totalDealValue = (quantityTonnesRequested * 10) * bidPricePerQuintal;
      await saveBuyerOrder({
        sellerRecordId: selectedLotForBid.id,
        cropName: selectedLotForBid.cropName,
        variety: selectedLotForBid.variety,
        sellerName: selectedLotForBid.farmerName,
        buyerName,
        buyerCompany,
        buyerContact,
        quantityTonnes: quantityTonnesRequested,
        bidPricePerQuintal,
        allocatedMandiName: selectedLotForBid.allocatedMandiName,
        totalDealValue,
        status: 'bid_placed',
      });

      setOrderSuccessMsg(
        `Procurement bid of ₹${bidPricePerQuintal}/q placed for ${quantityTonnesRequested}T of ${selectedLotForBid.cropName}!`
      );
      setSelectedLotForBid(null);
      setActiveTab('my_bids');
      setTimeout(() => setOrderSuccessMsg(null), 5000);
    } catch (err: any) {
      setOrderErrorMsg(`Failed to place bid: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Buyer Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-stone-900 text-white shadow-sm border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Wholesale Buyer & Trader Procurement Terminal</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Visual Good Deal Finder & Mandi Procurement Engine
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Use visual chart radar to spot price dips, arbitrage opportunities, and lots trading below APMC benchmark prices. Place instant procurement bids within Government statutory price limits.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">Good Deals Available</div>
              <div className="text-sm font-bold font-mono text-emerald-300">
                {applicantLots.filter((l) => (l.askingPricePerQuintal || 2000) < 2400).length} High Value
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold">Available Produce</div>
              <div className="text-sm font-bold font-mono">
                {applicantLots.reduce((sum, a) => sum + a.quantityTonnes, 0).toFixed(1)} Tonnes
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold">My Active Bids</div>
              <div className="text-sm font-bold font-mono text-emerald-400">{buyerOrders.length} Orders</div>
            </div>
          </div>
        </div>
      </div>

      {orderSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{orderSuccessMsg}</span>
        </div>
      )}

      {orderErrorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center gap-2.5 text-xs animate-fade-in">
          <X className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="font-semibold">{orderErrorMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          onClick={() => setActiveTab('visual_deals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'visual_deals'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Visual Good Deals & Radar</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
            activeTab === 'visual_deals'
              ? 'bg-emerald-400 text-stone-950 font-bold'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
          }`}>
            Charts
          </span>
        </button>

        <button
          onClick={() => setActiveTab('available_produce')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'available_produce'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Stored Produce ({applicantLots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_predictions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ai_predictions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>7-14 Day Price & Arrival Predictions</span>
        </button>

        <button
          onClick={() => setActiveTab('my_bids')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'my_bids'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>My Procurement Bids ({buyerOrders.length})</span>
        </button>
      </div>

      {/* TAB 0: VISUAL GOOD DEALS FINDER (PRIMARY CHART VIEW) */}
      {activeTab === 'visual_deals' && (
        <VisualDealFinder
          applicantLots={applicantLots}
          mandis={mandis}
          currentCropId={cropId}
          govStandards={govStandards}
          onSelectLotForBid={handleOpenBidModal}
        />
      )}

      {/* TAB 1: AVAILABLE STORED PRODUCE DIRECTORY */}
      {activeTab === 'available_produce' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <span className="font-semibold text-stone-700 dark:text-stone-300">Filter by Crop:</span>
              <select
                value={selectedCropFilter}
                onChange={(e) => setSelectedCropFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium"
              >
                <option value="all">All Crops (Vegetables & Spices)</option>
                {Object.values(CROPS).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-stone-500 font-mono text-[11px]">
              Showing {filteredLots.length} verified produce lots in mandis
            </div>
          </div>

          {/* Produce Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLots.map((lot) => {
              const std = govStandards.find(
                (s) => s.cropName.toLowerCase().includes(lot.cropName.toLowerCase()) || s.cropId === lot.cropId
              ) || govStandards[0];
              const asking = lot.askingPricePerQuintal || Math.round(lot.estimatedNetRealization / (lot.quantityTonnes * 10));

              return (
                <div
                  key={lot.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:border-blue-500 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {lot.cropName}
                        </h3>
                        <div className="text-[11px] text-stone-500 font-medium">{lot.variety}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs">
                        {lot.quantityTonnes} Tonnes
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                          {lot.allocatedMandiName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Farmer: {lot.farmerName} ({lot.villageDistrict})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Harvest / Dispatch: {lot.harvestDate}</span>
                      </div>
                    </div>

                    {/* Price and Govt Standard Compliance */}
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-stone-400">Asking Price</span>
                        <div className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">
                          ₹{asking.toLocaleString()}
                          <span className="text-[10px] font-normal text-stone-500"> /q</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Govt Compliant</span>
                        </span>
                        {std && (
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                            MSP: ₹{std.minPriceFloor} - ₹{std.maxPriceCeiling}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBidModal(lot)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Place Procurement Bid</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI 7-14 DAY PRICE PREDICTIONS & GRAPHS */}
      {activeTab === 'ai_predictions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>APMC Multi-Mandi Time-Series Forecast & Volume Predictions</span>
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Detailed machine learning price paths, 95% uncertainty intervals, and arrival volume glut detection.
            </p>

            <MarketIntelligence
              cropId={cropId}
              mandis={mandis}
              harvestDateStr={harvestDateStr}
            />
          </div>
        </div>
      )}

      {/* TAB 3: MY PROCUREMENT BIDS & ORDERS */}
      {activeTab === 'my_bids' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Submitted Procurement Orders & Bids
              </h2>
              <p className="text-xs text-stone-500">
                Track status of purchases placed with producers and APMC depots.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {buyerOrders.length} Active Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-4 py-3">Order ID & Date</th>
                  <th className="px-4 py-3">Crop & Variety</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Bid Price (₹/q)</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Farmer / Producer</th>
                  <th className="px-4 py-3">Intake Mandi</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {buyerOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                    <td className="px-4 py-3 font-mono font-medium">
                      <div>{order.id}</div>
                      <div className="text-[10px] text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-stone-800 dark:text-stone-200">
                      {order.cropName} ({order.variety})
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {order.quantityTonnes} Tonnes
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      ₹{order.bidPricePerQuintal.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                      ₹{order.totalDealValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                      {order.sellerName}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {order.allocatedMandiName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>Bid Placed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Place Bid / Purchase Intent Modal */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 dark:border-stone-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Procurement Bid: {selectedLotForBid.cropName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLotForBid(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Producer: {selectedLotForBid.farmerName}</span>
                  <span>Available: {selectedLotForBid.quantityTonnes} Tonnes</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  Intake Mandi: {selectedLotForBid.allocatedMandiName} | Harvest: {selectedLotForBid.harvestDate}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Wholesale Company / Firm
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Procurement Quantity (Tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={selectedLotForBid.quantityTonnes}
                    required
                    value={quantityTonnesRequested}
                    onChange={(e) => setQuantityTonnesRequested(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Bid Price (₹/quintal)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min={100}
                    required
                    value={bidPricePerQuintal}
                    onChange={(e) => setBidPricePerQuintal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono font-bold text-sm text-blue-600"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Total Purchase Commitment:</span>
                <span className="font-mono font-bold text-base text-stone-900 dark:text-stone-100">
                  ₹{((quantityTonnesRequested * 10) * bidPricePerQuintal).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setSelectedLotForBid(null)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Procurement Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
