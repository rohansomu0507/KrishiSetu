import React, { useState, useEffect, useMemo } from 'react';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Plus,
  Save,
  Truck,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  X
} from 'lucide-react';
import {
  ApplicantRecord,
  subscribeApplicants,
  saveApplicant,
  getGovStandards,
  subscribeGovStandards,
  validateSellerCropPrice,
  GovStandardRecord,
  MandiStoreRecord,
  subscribeMandiStores,
  CURRENT_ADMIN_EMAIL,
} from '../services/firebase';
import { CROPS } from '../services/mandiData';
import { CropType } from '../types';

interface SellerCropManagementViewProps {
  onPlanDispatch?: (cropId: CropType, tonnes: number) => void;
}

export const SellerCropManagementView: React.FC<SellerCropManagementViewProps> = ({
  onPlanDispatch,
}) => {
  const [applicantLots, setApplicantLots] = useState<ApplicantRecord[]>([]);
  const [govStandards, setGovStandards] = useState<GovStandardRecord[]>([]);
  const [mandiStores, setMandiStores] = useState<MandiStoreRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // New Crop Lot Form State
  const [farmerName, setFarmerName] = useState('Ramesh Gowda');
  const [phoneNumber, setPhoneNumber] = useState('+91 98450 12345');
  const [farmerId, setFarmerId] = useState('KA-KLR-2026-908');
  const [villageDistrict, setVillageDistrict] = useState('Chintamani, Kolar');
  const [state, setState] = useState('Karnataka');
  const [cropId, setCropId] = useState<CropType>('tomatoes');
  const [variety, setVariety] = useState('Hybrid Shivam');
  const [quantityTonnes, setQuantityTonnes] = useState<number>(5.0);
  const [harvestDate, setHarvestDate] = useState<string>(
    () => new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [askingPricePerQuintal, setAskingPricePerQuintal] = useState<number>(2250);
  const [allocatedMandiName, setAllocatedMandiName] = useState('Bangalore Yeshwanthpur APMC');
  const [storageType, setStorageType] = useState<'cold_storage' | 'apmc_shed' | 'warehouse'>('cold_storage');

  useEffect(() => {
    const unsubApps = subscribeApplicants((data) => setApplicantLots(data));
    const unsubStds = subscribeGovStandards((data) => setGovStandards(data));
    const unsubStores = subscribeMandiStores((data) => setMandiStores(data));
    return () => {
      unsubApps();
      unsubStds();
      unsubStores();
    };
  }, []);

  // Update variety when crop changes
  const handleCropChange = (newCropId: CropType) => {
    setCropId(newCropId);
    const cropMeta = CROPS[newCropId];
    if (cropMeta && cropMeta.varieties.length > 0) {
      setVariety(cropMeta.varieties[0]);
    }
    // Set a sensible starting asking price based on crop's base price
    if (cropMeta) {
      setAskingPricePerQuintal(cropMeta.basePricePerQuintal);
    }
  };

  // Live Government Standard validation
  const validation = useMemo(() => {
    return validateSellerCropPrice(cropId, askingPricePerQuintal);
  }, [cropId, askingPricePerQuintal, govStandards]);

  const activeStandard = validation.standard;

  // Calculate financial realization
  const grossValue = (quantityTonnes * 10) * askingPricePerQuintal; // tonnes * 10 = quintals
  const approxFreight = quantityTonnes * 850; // ₹850/tonne average freight
  const approxHandling = (quantityTonnes * 10) * 35; // ₹35/q handling
  const estimatedNetRealization = Math.max(0, grossValue - approxFreight - approxHandling);

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmitCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Strictly enforce Government Maximum Price Ceiling limit
    if (askingPricePerQuintal > activeStandard.maxPriceCeiling) {
      setFormError(
        `Government Limitation Enforced: Asking price of ₹${askingPricePerQuintal}/q exceeds the statutory APMC Ceiling Price of ₹${activeStandard.maxPriceCeiling}/q. Under Government regulations, products cannot be listed above the mandated cap.`
      );
      return;
    }

    try {
      await saveApplicant({
        farmerName,
        phoneNumber,
        farmerId,
        villageDistrict,
        state,
        cropName: CROPS[cropId]?.name || 'Tomatoes',
        cropId,
        variety,
        quantityTonnes,
        harvestDate,
        allocatedMandiName,
        allocatedDispatchDate: harvestDate,
        askingPricePerQuintal,
        estimatedNetRealization,
        govComplianceStatus: validation.status,
        govComplianceNote: validation.message,
        status: 'registered',
      });

      setSubmitSuccessMsg(
        `Successfully stored ${quantityTonnes} Tonnes of ${CROPS[cropId]?.name} compliant with Government standards!`
      );
      setShowAddForm(false);
      setTimeout(() => setSubmitSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(`Failed to store produce: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Produce Seller Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-stone-900 text-white shadow-sm border border-emerald-600/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
              <Sprout className="w-3.5 h-3.5" />
              <span>Farmer & Produce Seller Terminal</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Store & Manage Crop Harvest Lots
            </h1>
            <p className="text-xs text-stone-200 max-w-2xl leading-relaxed">
              Store your upcoming harvest lots under statutory Government price protections. The system automatically validates your asking price against Government Minimum Support Price (MSP) floors and Maximum Price Ceilings.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Close Form' : 'Store New Crop Lot'}</span>
          </button>
        </div>
      </div>

      {submitSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{submitSuccessMsg}</span>
        </div>
      )}

      {/* Produce Declaration Form with Live Government Price Limit Validation */}
      {showAddForm && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Declare New Harvest Lot (Government Standards Enforced)</span>
              </h2>
              <p className="text-xs text-stone-500">
                All declarations are synchronized with APMC market registries and wholesale buyers.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Ref: GOI-MSP-2026
            </span>
          </div>

          <form onSubmit={handleSubmitCrop} className="space-y-4 text-xs">
            {/* Farmer Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Farmer / Producer Name
                </label>
                <input
                  type="text"
                  required
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Farm Location & District
                </label>
                <input
                  type="text"
                  required
                  value={villageDistrict}
                  onChange={(e) => setVillageDistrict(e.target.value)}
                  placeholder="e.g. Chintamani, Kolar"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Crop Specification */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Crop Type
                </label>
                <select
                  value={cropId}
                  onChange={(e) => handleCropChange(e.target.value as CropType)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-medium"
                >
                  {Object.values(CROPS).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.hindiName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Variety / Grade
                </label>
                <select
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  {(CROPS[cropId]?.varieties || []).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Expected Harvest Quantity (Tonnes)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  required
                  value={quantityTonnes}
                  onChange={(e) => setQuantityTonnes(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Harvest Date
                </label>
                <input
                  type="date"
                  required
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* KEY REQUIREMENT: Asking Price with LIVE Government Standards Limit Check */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block font-bold text-stone-900 dark:text-stone-100 text-xs">
                    Farmer Expected Asking Price (₹/quintal)
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Validated against Government Minimum Support Price (MSP) and Ceiling caps.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">Govt Floor (MSP): </span>
                    <span className="font-mono font-bold text-xs">₹{activeStandard.minPriceFloor.toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-px bg-stone-300 dark:bg-stone-700" />
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400">Govt Ceiling Cap: </span>
                    <span className="font-mono font-bold text-xs">₹{activeStandard.maxPriceCeiling.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={100}
                    step={10}
                    value={askingPricePerQuintal}
                    onChange={(e) => setAskingPricePerQuintal(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-12 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-stone-100 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-stone-400">/quintal</span>
                </div>

                {/* Real-time Compliance Indicator */}
                <div>
                  {validation.status === 'compliant' && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Government Compliant: </span>
                        <span>Within authorized price bracket.</span>
                      </div>
                    </div>
                  )}

                  {validation.status === 'warning_below_msp' && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Below Govt Floor (MSP): </span>
                        <span>₹{activeStandard.minPriceFloor}/q guaranteed floor applies.</span>
                      </div>
                    </div>
                  )}

                  {validation.status === 'warning_above_ceiling' && (
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center gap-2 text-xs">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <div>
                        <span className="font-bold">Exceeds Govt Ceiling Cap: </span>
                        <span>Max allowable is ₹{activeStandard.maxPriceCeiling}/q.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target Mandi & Storage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Intake Mandi Facility
                </label>
                <select
                  value={allocatedMandiName}
                  onChange={(e) => setAllocatedMandiName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="Bangalore Yeshwanthpur APMC">Bangalore Yeshwanthpur APMC</option>
                  <option value="Kolar APMC Yard & Produce Sheds">Kolar APMC Yard & Produce Sheds</option>
                  <option value="Chennai Koyambedu Terminal">Chennai Koyambedu Terminal</option>
                  <option value="Madanapalle Tomato Market">Madanapalle Tomato Market</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Storage Condition
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="cold_storage">Agro Cold Storage Hub ({activeStandard.storageSubsidyPercent}% Govt Subsidy)</option>
                  <option value="apmc_shed">APMC Intake Shed (Ambient)</option>
                  <option value="warehouse">Covered Mandi Warehouse</option>
                </select>
              </div>
            </div>

            {/* Realization Summary */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-stone-500">Gross Produce Value:</span>
                <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  ₹{grossValue.toLocaleString()} ({quantityTonnes * 10} Quintals @ ₹{askingPricePerQuintal}/q)
                </div>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Estimated Net Realization (After Freight & Handling):
                </span>
                <div className="font-mono font-bold text-base text-emerald-800 dark:text-emerald-300">
                  ₹{estimatedNetRealization.toLocaleString()}
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-start gap-2.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError(null);
                }}
                className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={askingPricePerQuintal > activeStandard.maxPriceCeiling}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>
                  {askingPricePerQuintal > activeStandard.maxPriceCeiling
                    ? 'Exceeds Gov Ceiling Limit (Cannot Submit)'
                    : 'Store Produce Lot in Mandi Database'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stored Produce Batches Directory */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs space-y-0">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>My Stored Produce Lots ({applicantLots.length} Registered)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Produce stored in APMC yards and cold storages under Government standards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 font-mono text-stone-700 dark:text-stone-300">
              Total: {applicantLots.reduce((s, a) => s + a.quantityTonnes, 0).toFixed(1)} Tonnes
            </span>
          </div>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {applicantLots.map((lot) => {
            const std = govStandards.find(
              (s) => s.cropName.toLowerCase().includes(lot.cropName.toLowerCase()) || s.cropId === lot.cropId
            ) || govStandards[0];
            const asking = lot.askingPricePerQuintal || Math.round(lot.estimatedNetRealization / (lot.quantityTonnes * 10));

            return (
              <div
                key={lot.id}
                className="p-4 sm:p-5 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {lot.cropName} ({lot.variety})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px]">
                      {lot.quantityTonnes} Tonnes
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Govt Compliant</span>
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lot.villageDistrict}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Harvest: {lot.harvestDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {lot.allocatedMandiName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-start md:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider">Asking Price</div>
                    <div className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">
                      ₹{asking.toLocaleString()} <span className="text-[10px] font-normal text-stone-500">/q</span>
                    </div>
                    {std && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        MSP: ₹{std.minPriceFloor} - ₹{std.maxPriceCeiling}
                      </div>
                    )}
                  </div>

                  <div className="text-right border-l border-stone-200 dark:border-stone-800 pl-4">
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider">Est. Net Value</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      ₹{lot.estimatedNetRealization.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-500">After transport & handling</div>
                  </div>

                  {onPlanDispatch && (
                    <button
                      onClick={() => onPlanDispatch(lot.cropId || 'tomatoes', lot.quantityTonnes)}
                      className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Plan Mandi Sale</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
