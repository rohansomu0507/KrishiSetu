import React from 'react';
import {
  Sprout,
  Sun,
  Moon,
  FileText,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
  BookmarkCheck,
  LogOut,
  Building2,
  ShoppingCart,
  Layers,
  Database,
  Scale,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Radio
} from 'lucide-react';
import { UserRole, PORTAL_CONFIGS } from '../services/firebase';
import { MayuraLogo } from './MayuraLogo';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: any) => void;
  userRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onOpenPresetModal: () => void;
  onExportPlan: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  userRole,
  onOpenPresetModal,
  onExportPlan,
  darkMode,
  setDarkMode,
  onLogout,
  userEmail,
}) => {
  const portal = PORTAL_CONFIGS[userRole] || PORTAL_CONFIGS.seller;

  const getRoleTheme = () => {
    switch (userRole) {
      case 'government':
        return {
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          dotBg: 'bg-emerald-500',
          icon: <Building2 className="w-3.5 h-3.5" />,
          label: '🏛️ Govt Regulatory Authority',
          accessTag: 'Standards & Master Data Control',
        };
      case 'buyer':
        return {
          badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          dotBg: 'bg-blue-500',
          icon: <ShoppingCart className="w-3.5 h-3.5" />,
          label: '🛒 Licensed Buyer / Trader',
          accessTag: 'Visual Deals & Bookings',
        };
      case 'seller':
      default:
        return {
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          dotBg: 'bg-emerald-500',
          icon: <Sprout className="w-3.5 h-3.5" />,
          label: '🚜 Produce Seller / Farmer',
          accessTag: 'Crop Storage (Gov Caps)',
        };
    }
  };

  const theme = getRoleTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Zone 1: Wordmark & Locked Portal Identity Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <MayuraLogo size={36} className="w-9 h-9" />

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap leading-tight">
                  Mayura APMC Pulse
                </span>
                <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  मयूर
                </span>
              </div>

              {/* Locked Verified Persona Badge (No in-session role jumping) */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${theme.badgeBg}`}
                  title={`Locked Session: Authenticated as ${portal.portalName}. Log out to access other portals.`}
                >
                  {theme.icon}
                  <span className="font-semibold">{theme.label}</span>
                  <Lock className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                </div>
                <span className="hidden xl:inline text-[10px] text-stone-400 font-mono">
                  {userEmail || portal.defaultEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Strictly Role-Restricted Navigation Links + Pan-India Live Feed */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {/* Real-time Pan-India Live Graphs (Accessible across portals) */}
            <button
              onClick={() => setActiveView('pan_india_apmc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'pan_india_apmc'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Activity className="w-3.5 h-3.5" />
              <span>Pan-India Live APMC</span>
            </button>
            {/* 1. GOVERNMENT ROLE NAVIGATION */}
            {userRole === 'government' && (
              <>
                <button
                  onClick={() => setActiveView('standards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'standards'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Price Standards & Ceilings</span>
                </button>

                <button
                  onClick={() => setActiveView('database')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'database'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Master Data & APMC Stores</span>
                </button>

                <button
                  onClick={() => setActiveView('market')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'market'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Market Intelligence</span>
                </button>
              </>
            )}

            {/* 2. SELLER (FARMER) ROLE NAVIGATION */}
            {userRole === 'seller' && (
              <>
                <button
                  onClick={() => setActiveView('store_crops')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'store_crops'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Store My Crops (Gov Caps)</span>
                </button>

                <button
                  onClick={() => setActiveView('farmer')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'farmer'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Harvest Planner</span>
                </button>

                <button
                  onClick={() => setActiveView('engine')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'engine'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Net Realization</span>
                </button>

                <button
                  onClick={() => setActiveView('market')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'market'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Mandi Trends</span>
                </button>
              </>
            )}

            {/* 3. BUYER (TRADER) ROLE NAVIGATION */}
            {userRole === 'buyer' && (
              <>
                <button
                  onClick={() => setActiveView('procurement')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'procurement'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Visual Deals Radar & Bookings</span>
                </button>

                <button
                  onClick={() => setActiveView('market')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'market'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Mandi Price & Arrival Forecasts</span>
                </button>
              </>
            )}

            {/* Scenarios helper modal */}
            {userRole !== 'buyer' && (
              <button
                onClick={onOpenPresetModal}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Scenarios</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Theme toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {userRole !== 'buyer' && (
              <button
                onClick={onExportPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dispatch Plan</span>
              </button>
            )}

            {/* Dedicated Switch Portal / Sign Out Action */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Switch to another portal or sign out"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-start gap-1 py-2 border-t border-stone-200 dark:border-stone-800 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveView('pan_india_apmc')}
            className={`px-2 py-1 rounded font-bold whitespace-nowrap flex items-center gap-1 ${
              activeView === 'pan_india_apmc'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 dark:text-stone-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live APMC</span>
          </button>

          {userRole === 'government' && (
            <>
              <button
                onClick={() => setActiveView('standards')}
                className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeView === 'standards' ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}
              >
                Price Standards
              </button>
              <button
                onClick={() => setActiveView('database')}
                className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeView === 'database' ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}
              >
                Master Data
              </button>
              <button
                onClick={() => setActiveView('market')}
                className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeView === 'market' ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}
              >
                Market Intelligence
              </button>
            </>
          )}

          {userRole === 'seller' && (
            <>
              <button
                onClick={() => setActiveView('store_crops')}
                className={`px-2 py-1 rounded font-medium ${activeView === 'store_crops' ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}
              >
                Store Crops
              </button>
              <button
                onClick={() => setActiveView('farmer')}
                className={`px-2 py-1 rounded font-medium ${activeView === 'farmer' ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}
              >
                Planner
              </button>
              <button
                onClick={() => setActiveView('engine')}
                className={`px-2 py-1 rounded font-medium ${activeView === 'engine' ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}
              >
                AI Engine
              </button>
            </>
          )}

          {userRole === 'buyer' && (
            <>
              <button
                onClick={() => setActiveView('procurement')}
                className={`px-2 py-1 rounded font-medium ${activeView === 'procurement' ? 'text-blue-600 font-bold' : 'text-stone-500'}`}
              >
                Visual Deals & Bookings
              </button>
              <button
                onClick={() => setActiveView('market')}
                className={`px-2 py-1 rounded font-medium ${activeView === 'market' ? 'text-blue-600 font-bold' : 'text-stone-500'}`}
              >
                Arrival Forecasts
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
