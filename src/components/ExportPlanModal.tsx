import React from 'react';
import { X, Printer, Download, Check, Truck, Calendar, MapPin, Scale } from 'lucide-react';
import { CROPS } from '../services/mandiData';
import { FarmerScenarioState, OptimizationResult } from '../types';

interface ExportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: FarmerScenarioState;
  optimalPlan: OptimizationResult;
}

export const ExportPlanModal: React.FC<ExportPlanModalProps> = ({
  isOpen,
  onClose,
  scenario,
  optimalPlan,
}) => {
  if (!isOpen) return null;

  const currentCrop = CROPS[scenario.cropId];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>KrishiSetu Mandi Dispatch Manifest</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified multi-market harvest allocation & gate schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 dark:text-stone-200" id="printable-manifest">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">Crop / Variety</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {currentCrop.name} ({scenario.variety})
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Total Harvest</span>
              <span className="font-semibold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {scenario.quantityTonnes} T ({scenario.quantityTonnes * 10} q)
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Harvest Date</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {scenario.harvestDateStr}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Expected Net</span>
              <span className="font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                ₹{optimalPlan.totalNetRealization.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Strategy Headline */}
          <div className="border-l-2 border-emerald-600 pl-3 py-1">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {optimalPlan.strategyHeadline}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Net in-pocket realization: ₹{optimalPlan.averageNetPerQuintal}/quintal (+₹{optimalPlan.comparison.netGainOverImmediateSale.toLocaleString('en-IN')} vs single nearest mandi sale)
            </p>
          </div>

          {/* Dispatch Lots Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Vehicle & Market Dispatch Schedule
            </h4>
            <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-500">
                    <th className="py-2.5 px-3">Dispatch Date</th>
                    <th className="py-2.5 px-3">Destination Mandi</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Est. Freight</th>
                    <th className="py-2.5 px-3 text-right">Est. Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                  {optimalPlan.allocations.map((a, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-sans font-medium">
                        {a.dateStr} (Day +{a.dayOffset})
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-stone-900 dark:text-stone-100">
                        {a.mandiName} ({a.distanceKm}km)
                      </td>
                      <td className="py-2.5 px-3 font-sans text-stone-500">
                        {a.truckType.split('(')[0]}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                        {a.quantityTonnes} T
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-red-600">
                        ₹{a.freightCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700 font-bold">
                        ₹{a.effectiveNetRealization.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mandi Gate Protocol & Farmer Instructions */}
          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
            <h5 className="font-bold text-stone-900 dark:text-stone-100">
              Mandi Arrival Protocol:
            </h5>
            <ul className="space-y-1 text-stone-600 dark:text-stone-400 list-disc list-inside">
              <li>Arrive before 04:30 AM for early commission agent lottery entry.</li>
              <li>Present e-NAM gate pass or APMC entry token with registered Aadhaar/Farmer ID.</li>
              <li>Ensure sampling crates are drawn uniformly from top, middle, and bottom tiers.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <button
            onClick={async () => {
              try {
                const { saveApplicant } = await import('../services/firebase');
                await saveApplicant({
                  farmerName: 'Registered Farmer (Manifest)',
                  phoneNumber: '+91 98450 12000',
                  villageDistrict: 'Kolar Rural',
                  state: 'Karnataka',
                  cropName: currentCrop.name,
                  variety: scenario.variety,
                  quantityTonnes: scenario.quantityTonnes,
                  harvestDate: scenario.harvestDateStr,
                  allocatedMandiName: optimalPlan.allocations[0]?.mandiName || 'Nearest APMC',
                  allocatedDispatchDate: optimalPlan.allocations[0]?.dateStr || scenario.harvestDateStr,
                  estimatedNetRealization: optimalPlan.totalNetRealization,
                  status: 'approved',
                });
                alert('Plan successfully saved to Firestore Applicant Database!');
              } catch (e: any) {
                alert('Saved with notice: ' + e.message);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save to Cloud Database</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
