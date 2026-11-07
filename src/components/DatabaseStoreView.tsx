import React, { useState, useEffect } from 'react';
import {
  Database,
  Users,
  Warehouse,
  History,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Scale,
  DollarSign,
  AlertCircle,
  Truck,
  Edit2,
  RefreshCw,
  X,
  ShieldCheck,
  FileText,
  Download,
  Filter,
  Check,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import {
  ApplicantRecord,
  MandiStoreRecord,
  AdminHistoryRecord,
  BuyerOrderRecord,
  saveApplicant,
  saveMandiStore,
  subscribeApplicants,
  subscribeMandiStores,
  subscribeAdminHistory,
  subscribeBuyerOrders,
  saveBuyerOrder,
  updateApplicantStatus,
  logAdminAction,
  seedInitialMandiStoresIfEmpty,
  seedInitialAdminHistoryIfEmpty,
  CURRENT_ADMIN_EMAIL,
} from '../services/firebase';

interface DatabaseStoreViewProps {
  onPlanQuickRegistered?: () => void;
}

export const DatabaseStoreView: React.FC<DatabaseStoreViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'applicants' | 'stores' | 'buyer_orders' | 'history'>('applicants');
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [stores, setStores] = useState<MandiStoreRecord[]>([]);
  const [history, setHistory] = useState<AdminHistoryRecord[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<BuyerOrderRecord[]>([]);
  const [uiFeedback, setUiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyActionFilter, setHistoryActionFilter] = useState<string>('all');
  const [currentAdminUser, setCurrentAdminUser] = useState<string>(CURRENT_ADMIN_EMAIL);

  // New Applicant Form State
  const [newApplicant, setNewApplicant] = useState({
    farmerName: '',
    phoneNumber: '',
    farmerId: '',
    villageDistrict: '',
    state: 'Karnataka',
    cropName: 'Tomatoes',
    variety: 'Hybrid Shivam',
    quantityTonnes: 5.0,
    harvestDate: new Date().toISOString().split('T')[0],
    allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
    allocatedDispatchDate: new Date().toISOString().split('T')[0],
    estimatedNetRealization: 112000,
    status: 'registered' as const,
  });

  // New Mandi Store Form State
  const [newStore, setNewStore] = useState<MandiStoreRecord>({
    id: '',
    mandiId: 'new-mandi',
    name: '',
    district: '',
    state: 'Karnataka',
    storageType: 'cold_storage',
    totalCapacityTonnes: 500,
    availableCapacityTonnes: 200,
    dailyStorageRatePerQuintal: 15,
    unloadingFeePerQuintal: 30,
    mandiCessPercent: 1.5,
    contactOfficer: '',
    contactPhone: '',
    operatingHours: '05:00 AM - 02:00 PM',
    updatedAt: '',
  });

  // New Admin History Log State
  const [manualLog, setManualLog] = useState({
    actionType: 'system_audit' as const,
    entityName: 'APMC Regulatory Oversight',
    summary: '',
    details: '',
  });

  // Initialize and subscribe to Firestore
  useEffect(() => {
    seedInitialMandiStoresIfEmpty();
    seedInitialAdminHistoryIfEmpty();

    const unsubApplicants = subscribeApplicants((data) => setApplicants(data));
    const unsubStores = subscribeMandiStores((data) => setStores(data));
    const unsubHistory = subscribeAdminHistory((data) => setHistory(data));
    const unsubOrders = subscribeBuyerOrders((data) => setBuyerOrders(data));

    return () => {
      unsubApplicants();
      unsubStores();
      unsubHistory();
      unsubOrders();
    };
  }, []);

  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApplicant.farmerName || !newApplicant.phoneNumber) {
      setUiFeedback({ type: 'error', text: 'Please fill in required fields (Farmer Name and Phone Number).' });
      return;
    }
    try {
      await saveApplicant(newApplicant, currentAdminUser);
      setIsAddApplicantOpen(false);
      setUiFeedback({ type: 'success', text: `Registered ${newApplicant.farmerName} in APMC Master Registry.` });
      setTimeout(() => setUiFeedback(null), 4000);
      // Reset form
      setNewApplicant({
        farmerName: '',
        phoneNumber: '',
        farmerId: '',
        villageDistrict: '',
        state: 'Karnataka',
        cropName: 'Tomatoes',
        variety: 'Hybrid Shivam',
        quantityTonnes: 5.0,
        harvestDate: new Date().toISOString().split('T')[0],
        allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
        allocatedDispatchDate: new Date().toISOString().split('T')[0],
        estimatedNetRealization: 112000,
        status: 'registered',
      });
    } catch (err) {
      setUiFeedback({ type: 'error', text: 'Failed to save applicant: ' + (err as Error).message });
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.district) {
      setUiFeedback({ type: 'error', text: 'Please fill in required fields (Mandi Name and District).' });
      return;
    }
    try {
      await saveMandiStore({
        ...newStore,
        id: newStore.id || `store_${Date.now()}`,
      });
      await logAdminAction({
        actionType: 'mandi_store_updated',
        entityId: newStore.id,
        entityName: newStore.name,
        adminUser: currentAdminUser,
        summary: `Created or updated mandi facility details for ${newStore.name} (${newStore.storageType}).`,
        newValue: `Capacity: ${newStore.totalCapacityTonnes}T, Rate: ₹${newStore.dailyStorageRatePerQuintal}/q/d`,
        channel: 'Mandi Admin Registry',
      });
      setIsAddStoreOpen(false);
      setUiFeedback({ type: 'success', text: `Saved store facility ${newStore.name}.` });
      setTimeout(() => setUiFeedback(null), 4000);
    } catch (err) {
      setUiFeedback({ type: 'error', text: 'Failed to save store details: ' + (err as Error).message });
    }
  };

  const handleUpdateStatus = async (
    applicant: ApplicantRecord,
    newStatus: 'registered' | 'approved' | 'in_transit' | 'settled'
  ) => {
    try {
      await updateApplicantStatus(
        applicant.id,
        newStatus,
        `${applicant.farmerName} (${applicant.cropName})`,
        applicant.status,
        currentAdminUser
      );
      setUiFeedback({
        type: 'success',
        text: `Applicant status updated to ${newStatus.toUpperCase()}`,
      });
      setTimeout(() => setUiFeedback(null), 4000);
    } catch (err) {
      setUiFeedback({
        type: 'error',
        text: 'Failed to update status: ' + (err as Error).message,
      });
    }
  };

  const handleUpdateBuyerOrderStatus = async (
    order: BuyerOrderRecord,
    newStatus: 'bid_placed' | 'accepted' | 'verified' | 'dispatched' | 'settled'
  ) => {
    try {
      await saveBuyerOrder({
        ...order,
        status: newStatus,
      });
      await logAdminAction({
        actionType: 'system_audit',
        entityId: order.id,
        entityName: `Buyer Order: ${order.buyerCompany} -> ${order.cropName}`,
        adminUser: currentAdminUser,
        summary: `APMC Regulatory Officer updated order #${order.id.slice(0, 8)} status to ${newStatus.toUpperCase()}`,
        newValue: `Status: ${newStatus}`,
        channel: 'Buyer Procurement Desk',
      });
      setUiFeedback({
        type: 'success',
        text: `Updated buyer order #${order.id.slice(0, 8)} to ${newStatus.toUpperCase()}`,
      });
      setTimeout(() => setUiFeedback(null), 4000);
    } catch (err: any) {
      setUiFeedback({
        type: 'error',
        text: `Failed to update order status: ${err?.message || 'Unknown error'}`,
      });
    }
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLog.summary) {
      setUiFeedback({
        type: 'error',
        text: 'Please provide a summary for the administrative log.',
      });
      return;
    }
    try {
      await logAdminAction({
        actionType: manualLog.actionType,
        entityName: manualLog.entityName,
        adminUser: currentAdminUser,
        summary: manualLog.summary,
        newValue: manualLog.details || 'Administrative manual note',
        channel: 'Admin Control Console',
      });
      setIsAddHistoryOpen(false);
      setManualLog({
        actionType: 'system_audit',
        entityName: 'APMC Regulatory Oversight',
        summary: '',
        details: '',
      });
      setUiFeedback({
        type: 'success',
        text: 'Administrative decision log recorded in audit trail.',
      });
      setTimeout(() => setUiFeedback(null), 4000);
    } catch (err) {
      setUiFeedback({
        type: 'error',
        text: 'Failed to write audit history log: ' + (err as Error).message,
      });
    }
  };

  const exportHistoryCSV = () => {
    const headers = ['Timestamp', 'Action Type', 'Entity', 'Admin Officer', 'Summary', 'Channel'];
    const rows = history.map((h) => [
      `"${h.timestamp}"`,
      `"${h.actionType}"`,
      `"${h.entityName}"`,
      `"${h.adminUser}"`,
      `"${h.summary.replace(/"/g, '""')}"`,
      `"${h.channel || 'Console'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `krishisetu_admin_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch =
      a.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.farmerId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.allocatedMandiName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStores = stores.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.storageType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredHistory = history.filter((h) => {
    const matchesSearch =
      h.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.adminUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.actionType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = historyActionFilter === 'all' || h.actionType === historyActionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Database className="w-4 h-4" />
            <span>Persistent Firestore Database</span>
            <span aria-hidden="true">·</span>
            <span>Admin Data & Stored History</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Mandi Registry & Administrative Audit History
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Real-time Firestore persistence for farmer applicants, APMC storage facilities, and immutable administrative audit logs
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('applicants')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'applicants'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Applicants ({applicants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'stores'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Mandi Stores ({stores.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('buyer_orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'buyer_orders'
                  ? 'bg-white dark:bg-stone-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Buyer Deals ({buyerOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Audit History ({history.length})</span>
            </button>
          </div>

          {activeTab === 'applicants' && (
            <button
              onClick={() => setIsAddApplicantOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Applicant</span>
            </button>
          )}

          {activeTab === 'stores' && (
            <button
              onClick={() => setIsAddStoreOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mandi Store</span>
            </button>
          )}

          {activeTab === 'history' && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportHistoryCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
              <button
                onClick={() => setIsAddHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Admin Decision</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500 dark:text-stone-400">Total Applicants</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {applicants.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
            {applicants.filter((a) => a.status === 'approved').length} approved for dispatch
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500 dark:text-stone-400">Total Harvest Committed</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {applicants.reduce((sum, a) => sum + (a.quantityTonnes || 0), 0).toFixed(1)} T
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            {Math.round(applicants.reduce((sum, a) => sum + (a.quantityTonnes || 0), 0) * 10)} Quintals
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500 dark:text-stone-400">Mandi Stores Tracked</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {stores.length} Facilities
          </div>
          <div className="text-[11px] text-stone-400">
            {stores.reduce((sum, s) => sum + (s.totalCapacityTonnes || 0), 0).toLocaleString('en-IN')}T Capacity
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500 dark:text-stone-400">Stored Admin History</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {history.length} Logs
          </div>
          <div className="text-[11px] text-stone-400">Immutable Audit Trail</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'applicants'
                ? 'Search farmer name, crop, mandi...'
                : activeTab === 'stores'
                ? 'Search store name, district...'
                : 'Search audit logs, entity, officer...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'applicants' && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <span className="text-stone-400">Status:</span>
            {['all', 'registered', 'approved', 'in_transit', 'settled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <span className="text-stone-400">Action:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'applicant_approval', label: 'Approvals' },
              { id: 'applicant_registration', label: 'Registrations' },
              { id: 'mandi_store_updated', label: 'Mandi Stores' },
              { id: 'system_audit', label: 'Audits' },
            ].map((act) => (
              <button
                key={act.id}
                onClick={() => setHistoryActionFilter(act.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  historyActionFilter === act.id
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View 1: Applicants with Admin Action Buttons */}
      {activeTab === 'applicants' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-semibold">
                  <th className="py-3 px-4">Applicant / Farmer</th>
                  <th className="py-3 px-4">Origin Village</th>
                  <th className="py-3 px-4">Crop & Variety</th>
                  <th className="py-3 px-4 text-right">Harvest Quantity</th>
                  <th className="py-3 px-4">Target Mandi Gate</th>
                  <th className="py-3 px-4 text-right">Est. Net Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 font-sans">
                      No applicant records found in database. Click "Register Applicant" above to add the first harvest registration.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-stone-900 dark:text-stone-100">
                        <div>{app.farmerName}</div>
                        <div className="text-[11px] font-normal text-stone-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{app.phoneNumber}</span>
                          {app.farmerId && <span>· ID: {app.farmerId}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-stone-600 dark:text-stone-300">
                        {app.villageDistrict || 'Kolar'} ({app.state || 'Karnataka'})
                      </td>
                      <td className="py-3.5 px-4 font-sans text-stone-800 dark:text-stone-200">
                        <div className="font-medium">{app.cropName}</div>
                        <div className="text-[11px] text-stone-400">{app.variety}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-stone-900 dark:text-stone-100">
                        {app.quantityTonnes} T ({app.quantityTonnes * 10} q)
                      </td>
                      <td className="py-3.5 px-4 font-sans text-stone-700 dark:text-stone-300">
                        <div className="font-medium">{app.allocatedMandiName}</div>
                        <div className="text-[11px] text-stone-400">Dispatch: {app.allocatedDispatchDate}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{app.estimatedNetRealization?.toLocaleString('en-IN') || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            app.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : app.status === 'in_transit'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              : app.status === 'settled'
                              ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === 'registered' && (
                            <button
                              onClick={() => handleUpdateStatus(app, 'approved')}
                              className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                          )}
                          {app.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(app, 'in_transit')}
                              className="px-2 py-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-100"
                            >
                              Dispatch
                            </button>
                          )}
                          {app.status === 'in_transit' && (
                            <button
                              onClick={() => handleUpdateStatus(app, 'settled')}
                              className="px-2 py-1 text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded hover:bg-stone-200"
                            >
                              Settle
                            </button>
                          )}
                          {app.status === 'settled' && (
                            <span className="text-[11px] text-stone-400">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Mandi Stores */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStores.map((store) => {
            const usedPct = Math.round(
              ((store.totalCapacityTonnes - store.availableCapacityTonnes) / store.totalCapacityTonnes) * 100
            );

            return (
              <div
                key={store.id}
                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {store.storageType.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                      {store.name}
                    </h3>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {store.district}, {store.state}
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">Available Space:</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                      {store.availableCapacityTonnes}T / {store.totalCapacityTonnes}T ({100 - usedPct}% free)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, 100 - usedPct)}%` }}
                    />
                  </div>
                </div>

                {/* Storage & APMC Tariffs */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Storage/Day</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      ₹{store.dailyStorageRatePerQuintal}/q
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Unloading</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      ₹{store.unloadingFeePerQuintal}/q
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">APMC Cess</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {store.mandiCessPercent}%
                    </span>
                  </div>
                </div>

                {/* Officer & Contact */}
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{store.contactOfficer}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="font-mono">{store.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                    <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{store.operatingHours}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 3: Buyer Procurement Contracts & Deals (Government Master Control) */}
      {activeTab === 'buyer_orders' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs space-y-4">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>Buyer Procurement Deals & Mandi Trade Contracts ({buyerOrders.length})</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Complete regulatory oversight over all commercial purchase commitments and buyer bids.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 font-mono text-blue-800 dark:text-blue-300 font-bold">
                Total Deal Volume: {buyerOrders.reduce((acc, o) => acc + (o.quantityTonnes || 0), 0).toFixed(1)} Tonnes
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                Gross Value: ₹{buyerOrders.reduce((acc, o) => acc + (o.totalDealValue || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-semibold">
                  <th className="py-3 px-4">Deal ID / Time</th>
                  <th className="py-3 px-4">Buyer Company & Trader</th>
                  <th className="py-3 px-4">Farmer / Seller</th>
                  <th className="py-3 px-4">Crop & Variety</th>
                  <th className="py-3 px-4">Volume (T)</th>
                  <th className="py-3 px-4">Bid Price (₹/q)</th>
                  <th className="py-3 px-4">Total Contract Value</th>
                  <th className="py-3 px-4">APMC Mandi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Regulatory Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {buyerOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-stone-400">
                      No procurement orders placed yet.
                    </td>
                  </tr>
                ) : (
                  buyerOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                        <div className="font-bold text-stone-700 dark:text-stone-300">#{order.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-stone-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-900 dark:text-stone-100">
                        <div className="font-bold">{order.buyerCompany}</div>
                        <div className="text-[11px] text-stone-500">{order.buyerName} ({order.buyerContact})</div>
                      </td>
                      <td className="py-3 px-4 text-stone-700 dark:text-stone-300">
                        {order.sellerName}
                      </td>
                      <td className="py-3 px-4 text-stone-900 dark:text-stone-100 font-medium">
                        {order.cropName} <span className="text-[11px] text-stone-500">({order.variety})</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-800 dark:text-stone-200">
                        {order.quantityTonnes} T
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{order.bidPricePerQuintal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                        ₹{order.totalDealValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-stone-600 dark:text-stone-400">
                        {order.allocatedMandiName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'settled'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : order.status === 'dispatched'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                              : order.status === 'verified'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {order.status === 'bid_placed' ? 'Bid Placed' : order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'bid_placed' && (
                            <button
                              onClick={() => handleUpdateBuyerOrderStatus(order, 'verified')}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Verify Deal
                            </button>
                          )}
                          {(order.status === 'verified' || order.status === 'accepted') && (
                            <button
                              onClick={() => handleUpdateBuyerOrderStatus(order, 'dispatched')}
                              className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Issue Pass
                            </button>
                          )}
                          {order.status === 'dispatched' && (
                            <button
                              onClick={() => handleUpdateBuyerOrderStatus(order, 'settled')}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Mark Settled
                            </button>
                          )}
                          {order.status === 'settled' && (
                            <span className="text-[10px] text-stone-400 font-mono">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 4: Admin Data & Stored History (Audit Trail) */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs space-y-4">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Audit Log & Decision History</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Stored permanently in Firestore collection <code className="font-mono text-emerald-600 dark:text-emerald-400">admin_history</code>
              </p>
            </div>
            <div className="text-xs text-stone-400 font-mono">
              Active Officer: <span className="text-stone-700 dark:text-stone-300 font-semibold">{currentAdminUser}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-semibold">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Administrative Summary</th>
                  <th className="py-3 px-4">Change Value</th>
                  <th className="py-3 px-4">Admin Officer</th>
                  <th className="py-3 px-4">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400 font-sans">
                      No admin history records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        }) : 'Just now'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.actionType === 'applicant_approval'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : log.actionType === 'applicant_registration'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              : log.actionType === 'mandi_capacity_override' || log.actionType === 'market_tariff_update'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-stone-900 dark:text-stone-100 max-w-[180px] truncate">
                        {log.entityName}
                      </td>
                      <td className="py-3 px-4 font-sans text-stone-700 dark:text-stone-300 max-w-[280px]">
                        {log.summary}
                      </td>
                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        {log.newValue ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">{log.newValue}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600 dark:text-stone-400 text-[11px]">
                        {log.adminUser.split('@')[0]}
                      </td>
                      <td className="py-3 px-4 font-sans text-stone-400 text-[11px]">
                        {log.channel || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Register Applicant */}
      {isAddApplicantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Register Farmer Harvest Applicant
              </h3>
              <button
                onClick={() => setIsAddApplicantOpen(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApplicant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Farmer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gowda"
                  value={newApplicant.farmerName}
                  onChange={(e) => setNewApplicant({ ...newApplicant, farmerName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={newApplicant.phoneNumber}
                    onChange={(e) => setNewApplicant({ ...newApplicant, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Kisan / e-NAM ID
                  </label>
                  <input
                    type="text"
                    placeholder="KA-KLR-2026-908"
                    value={newApplicant.farmerId}
                    onChange={(e) => setNewApplicant({ ...newApplicant, farmerId: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Village / District
                  </label>
                  <input
                    type="text"
                    placeholder="Chintamani, Kolar"
                    value={newApplicant.villageDistrict}
                    onChange={(e) => setNewApplicant({ ...newApplicant, villageDistrict: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Harvest Quantity (Tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newApplicant.quantityTonnes}
                    onChange={(e) =>
                      setNewApplicant({ ...newApplicant, quantityTonnes: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Crop & Variety
                  </label>
                  <input
                    type="text"
                    value={`${newApplicant.cropName} (${newApplicant.variety})`}
                    onChange={(e) => setNewApplicant({ ...newApplicant, cropName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Target Mandi Gate
                  </label>
                  <input
                    type="text"
                    value={newApplicant.allocatedMandiName}
                    onChange={(e) => setNewApplicant({ ...newApplicant, allocatedMandiName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddApplicantOpen(false)}
                  className="px-3 py-1.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save to Firestore Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Mandi Store */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Register APMC Mandi / Cold Store Facility
              </h3>
              <button
                onClick={() => setIsAddStoreOpen(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Mandi / Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madanapalle APMC Tomato Auction Yard"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Annamayya"
                    value={newStore.district}
                    onChange={(e) => setNewStore({ ...newStore, district: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newStore.state}
                    onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Storage Type
                  </label>
                  <select
                    value={newStore.storageType}
                    onChange={(e) =>
                      setNewStore({ ...newStore, storageType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  >
                    <option value="cold_storage">Cold Storage</option>
                    <option value="aerated_chawl">Aerated Chawl</option>
                    <option value="apmc_shed">APMC Shed</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Total Cap. (T)
                  </label>
                  <input
                    type="number"
                    value={newStore.totalCapacityTonnes}
                    onChange={(e) =>
                      setNewStore({
                        ...newStore,
                        totalCapacityTonnes: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Daily Rate (₹/q)
                  </label>
                  <input
                    type="number"
                    value={newStore.dailyStorageRatePerQuintal}
                    onChange={(e) =>
                      setNewStore({
                        ...newStore,
                        dailyStorageRatePerQuintal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Contact Officer
                  </label>
                  <input
                    type="text"
                    placeholder="Sri A. Narayana"
                    value={newStore.contactOfficer}
                    onChange={(e) => setNewStore({ ...newStore, contactOfficer: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 94480 88219"
                    value={newStore.contactPhone}
                    onChange={(e) => setNewStore({ ...newStore, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddStoreOpen(false)}
                  className="px-3 py-1.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Facility to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Manual Admin Decision */}
      {isAddHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Record Administrative Decision Log</span>
              </h3>
              <button
                onClick={() => setIsAddHistoryOpen(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Action Classification
                </label>
                <select
                  value={manualLog.actionType}
                  onChange={(e) => setManualLog({ ...manualLog, actionType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="system_audit">System Audit & Oversight</option>
                  <option value="mandi_capacity_override">Mandi Capacity / Glut Override</option>
                  <option value="market_tariff_update">Market Tariff Regulatory Adjustment</option>
                  <option value="dispatch_manifest_issued">Emergency Dispatch Authorization</option>
                  <option value="applicant_approval">Bulk Applicant Gate Pass Approval</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Target Entity / Mandi / Harvest Batch
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kolar APMC & Chintamani Farmer Cluster"
                  value={manualLog.entityName}
                  onChange={(e) => setManualLog({ ...manualLog, entityName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Administrative Summary / Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the regulatory basis, weather contingency, or market reason for this recorded decision..."
                  value={manualLog.summary}
                  onChange={(e) => setManualLog({ ...manualLog, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Additional Parameter Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved diesel freight subsidy waiver of ₹1,200/load"
                  value={manualLog.details}
                  onChange={(e) => setManualLog({ ...manualLog, details: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddHistoryOpen(false)}
                  className="px-3 py-1.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save to Admin History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
