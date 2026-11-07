import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Scale,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Save,
  X,
  History,
  Layers,
  Check
} from 'lucide-react';
import {
  GovStandardRecord,
  subscribeGovStandards,
  saveGovStandard,
  ApplicantRecord,
  subscribeApplicants,
  CURRENT_ADMIN_EMAIL,
} from '../services/firebase';
import { CROPS } from '../services/mandiData';
import { CropType } from '../types';

interface GovernmentStandardsViewProps {
  onSwitchToStores?: () => void;
  onSwitchToAudit?: () => void;
}

export const GovernmentStandardsView: React.FC<GovernmentStandardsViewProps> = () => {
  const [standards, setStandards] = useState<GovStandardRecord[]>([]);
  const [applicantLots, setApplicantLots] = useState<ApplicantRecord[]>([]);
  const [editingStandard, setEditingStandard] = useState<GovStandardRecord | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubStandards = subscribeGovStandards((data) => setStandards(data));
    const unsubApplicants = subscribeApplicants((data) => setApplicantLots(data));
    return () => {
      unsubStandards();
      unsubApplicants();
    };
  }, []);

  const handleEditClick = (std: GovStandardRecord) => {
    setEditingStandard({ ...std });
  };

  const handleSaveStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStandard) return;
    setSaveErrorMsg(null);

    try {
      await saveGovStandard(editingStandard, CURRENT_ADMIN_EMAIL);
      setSaveSuccessMsg(`Updated statutory regulatory standards for ${editingStandard.cropName}`);
      setEditingStandard(null);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(`Failed to save: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Government Authority Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white shadow-sm border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>Ministry of Agriculture & APMC Regulatory Directorate</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Market Price Standards & Regulatory Ceilings
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Define statutory Minimum Support Price (MSP) floors to protect farmer incomes and Maximum Wholesale Price Ceilings to curb market speculation. All sellers and mandis must adhere to these mandated bands.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">Active Gazettes</div>
              <div className="text-sm font-bold font-mono">5 Regulated Crops</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">Compliance Rate</div>
              <div className="text-sm font-bold font-mono text-emerald-400">100% Adherence</div>
            </div>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center gap-2.5 text-xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="font-semibold">{saveErrorMsg}</span>
        </div>
      )}

      {/* Grid of Regulated Crop Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standards.map((std) => {
          const cropMeta = CROPS[std.cropId as CropType] || CROPS.tomatoes;
          // Count active lots for this crop
          const matchingLots = applicantLots.filter(
            (a) => a.cropName.toLowerCase().includes(std.cropId.toLowerCase()) || a.cropId === std.cropId
          );
          const nonCompliantLots = matchingLots.filter(
            (l) =>
              l.askingPricePerQuintal &&
              (l.askingPricePerQuintal < std.minPriceFloor || l.askingPricePerQuintal > std.maxPriceCeiling)
          );

          return (
            <div
              key={std.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {std.cropName}
                      </h3>
                      <span className="text-[11px] text-stone-500 font-medium">({cropMeta.hindiName})</span>
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                      Ref: {std.circularNumber}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditClick(std)}
                    className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Edit Min/Max Standard"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Primary Price Bracket: Min MSP Floor vs Max Ceiling */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Govt MSP Floor</span>
                    </div>
                    <div className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">
                      ₹{std.minPriceFloor.toLocaleString()}
                      <span className="text-[10px] font-normal text-stone-500"> /q</span>
                    </div>
                    <div className="text-[10px] text-stone-500">Statutory Min Floor</div>
                  </div>

                  <div className="space-y-1 border-l border-stone-200 dark:border-stone-700 pl-2.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Govt Ceiling Cap</span>
                    </div>
                    <div className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">
                      ₹{std.maxPriceCeiling.toLocaleString()}
                      <span className="text-[10px] font-normal text-stone-500"> /q</span>
                    </div>
                    <div className="text-[10px] text-stone-500">Maximum Anti-Gouging</div>
                  </div>
                </div>

                {/* Specifications List */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span>APMC Daily Intake Cap:</span>
                    <span className="font-semibold font-mono text-stone-800 dark:text-stone-200">
                      {std.dailyMandiIntakeQuotaTonnes} Tonnes/day
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span>Max Allowable Moisture (FAQ):</span>
                    <span className="font-semibold font-mono text-stone-800 dark:text-stone-200">
                      {std.fairAverageQualityMoistureMax}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span>Govt Cold Storage Subsidy:</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                      {std.storageSubsidyPercent}% Rebate
                    </span>
                  </div>
                </div>

                {/* Enforcement Directive Note */}
                <div className="p-2.5 rounded-lg bg-stone-100/70 dark:bg-stone-800/40 text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
                  <span className="font-semibold text-stone-800 dark:text-stone-300">Directive: </span>
                  {std.enforcementNotes}
                </div>
              </div>

              {/* Status and Active Lots */}
              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">Eff: {std.effectiveDate}</span>
                </div>

                {nonCompliantLots.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{nonCompliantLots.length} Flagged Lot</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Compliant</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Produce Compliance Monitoring Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Seller Produce Adherence Audit</span>
            </h2>
            <p className="text-xs text-stone-500">
              Verifying all incoming farmer harvest declarations against gazetted price caps & MSP floors.
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            Total Declared Produce: {applicantLots.reduce((sum, a) => sum + a.quantityTonnes, 0).toFixed(1)} Tonnes
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="px-4 py-3">Farmer / Producer</th>
                <th className="px-4 py-3">Crop & Variety</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Seller Asking Price</th>
                <th className="px-4 py-3">Govt Limits (Min - Max)</th>
                <th className="px-4 py-3">Compliance Verification</th>
                <th className="px-4 py-3">APMC Intake Mandi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {applicantLots.map((lot) => {
                const std = standards.find(
                  (s) => s.cropName.toLowerCase().includes(lot.cropName.toLowerCase()) || s.cropId === lot.cropId
                ) || standards[0];
                const asking = lot.askingPricePerQuintal || Math.round(lot.estimatedNetRealization / (lot.quantityTonnes * 10));
                const isBelowMsp = std && asking < std.minPriceFloor;
                const isAboveCeil = std && asking > std.maxPriceCeiling;

                return (
                  <tr key={lot.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-stone-900 dark:text-stone-100">
                      <div>{lot.farmerName}</div>
                      <div className="text-[11px] text-stone-400 font-normal">{lot.villageDistrict}, {lot.state}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800 dark:text-stone-200">{lot.cropName}</div>
                      <div className="text-[11px] text-stone-400">{lot.variety}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {lot.quantityTonnes} Tonnes
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      ₹{asking.toLocaleString()} /q
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {std ? (
                        <div className="space-y-0.5">
                          <span className="text-emerald-700 dark:text-emerald-400">Min: ₹{std.minPriceFloor}</span>
                          <span className="text-stone-400"> | </span>
                          <span className="text-amber-700 dark:text-amber-400">Max: ₹{std.maxPriceCeiling}</span>
                        </div>
                      ) : (
                        'Standard Pending'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isBelowMsp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Below Govt MSP</span>
                        </span>
                      ) : isAboveCeil ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-semibold text-[11px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Exceeds Ceiling</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                          <Check className="w-3 h-3" />
                          <span>Govt Compliant</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {lot.allocatedMandiName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Standard Modal */}
      {editingStandard && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 dark:border-stone-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Update Standards: {editingStandard.cropName}
                </h3>
              </div>
              <button
                onClick={() => setEditingStandard(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStandard} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Statutory Min MSP Floor (₹/quintal)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={editingStandard.minPriceFloor}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        minPriceFloor: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono font-semibold"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">Protects growers during harvest</p>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Maximum Price Ceiling (₹/quintal)
                  </label>
                  <input
                    type="number"
                    required
                    min={editingStandard.minPriceFloor}
                    value={editingStandard.maxPriceCeiling}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        maxPriceCeiling: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono font-semibold"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">Anti-hoarding and consumer cap</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Daily APMC Intake Quota (Tonnes)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingStandard.dailyMandiIntakeQuotaTonnes}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        dailyMandiIntakeQuotaTonnes: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Govt Storage Subsidy (% Rebate)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={editingStandard.storageSubsidyPercent}
                    onChange={(e) =>
                      setEditingStandard({
                        ...editingStandard,
                        storageSubsidyPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Enforcement Directive / Regulatory Circular
                </label>
                <textarea
                  rows={2}
                  value={editingStandard.enforcementNotes}
                  onChange={(e) =>
                    setEditingStandard({
                      ...editingStandard,
                      enforcementNotes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingStandard(null)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Promulgate Standards</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
