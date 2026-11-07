import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import { CropType } from '../types';

export interface PresetScenario {
  id: string;
  title: string;
  cropId: CropType;
  variety: string;
  quantityTonnes: number;
  originClusterId: string;
  harvestDaysOffset: number;
  description: string;
  keyQuestion: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'sample-tomatoes-5t',
    title: '★ Official Sample Scenario: 5 Tonnes Tomatoes in 5 Days',
    cropId: 'tomatoes',
    variety: 'Hybrid Shivam',
    quantityTonnes: 5.0,
    originClusterId: 'kolar-south',
    harvestDaysOffset: 5,
    description: 'Farmer expects 5 tonnes of tomatoes in 5 days in Kolar belt. Comparing Kolar APMC (18km), Bangalore Yeshwanthpur (74km), Madanapalle (92km), and Chennai Koyambedu (285km).',
    keyQuestion: 'Should the farmer sell at Kolar to minimize freight, ship to Chennai/Bangalore for premium rates, wait 2 days for weekend hotel demand, or split the harvest across markets?',
  },
  {
    id: 'nashik-onions-12t',
    title: 'Scenario 2: 12 Tonnes Nashik Onions (Semi-Perishable)',
    cropId: 'onions',
    variety: 'Nashik Red',
    quantityTonnes: 12.0,
    originClusterId: 'nashik-west',
    harvestDaysOffset: 2,
    description: 'Medium-scale onion grower in Niphad evaluating whether to dump immediately at Lasalgaon APMC during arrival peak or hold in aerated chawl to ship to Navi Mumbai Vashi terminal.',
    keyQuestion: 'Can holding for 7 days overcome storage loss and freight to capture high metropolitan prices?',
  },
  {
    id: 'agra-potatoes-8t',
    title: 'Scenario 3: 8 Tonnes Agra Potatoes with Cold Storage',
    cropId: 'potatoes',
    variety: 'Kufri Chipsona',
    quantityTonnes: 8.0,
    originClusterId: 'agra-north',
    harvestDaysOffset: 3,
    description: 'Potato farmer near Agra weighing local Sikandra Mandi against trucking 215 km to Delhi Azadpur National Terminal or holding in cold storage.',
    keyQuestion: 'Does the Azadpur premium justify ₹40/q handling and interstate toll/diesel costs for bulk tubers?',
  },
  {
    id: 'chillies-3t',
    title: 'Scenario 4: 3.5 Tonnes Green Chillies (High-Value Perishable)',
    cropId: 'chillies',
    variety: 'G4 Super Hot',
    quantityTonnes: 3.5,
    originClusterId: 'kolar-south',
    harvestDaysOffset: 1,
    description: 'High-value spice crop with rapid pod shriveling and high price volatility across urban retail auction yards.',
    keyQuestion: 'How does transit vibration stress affect net realizations over journeys longer than 4 hours?',
  },
];

interface PresetScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
  currentCropId: CropType;
}

export const PresetScenariosModal: React.FC<PresetScenariosModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Select Farmer Harvest Scenario
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Load realistic benchmark datasets with predefined mandis, harvest dates, and crop dynamics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {PRESET_SCENARIOS.map((preset) => {
            const isSample = preset.id === 'sample-tomatoes-5t';
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md ${
                  isSample
                    ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                        {preset.title}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {preset.description}
                    </p>
                    <div className="pt-1 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{preset.keyQuestion}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
