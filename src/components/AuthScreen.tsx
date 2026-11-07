import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  MailCheck,
  Building2,
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  Info,
  KeyRound,
  Sparkles,
  Zap
} from 'lucide-react';
import { MayuraLogo } from './MayuraLogo';
import {
  signIn,
  signUp,
  signInWithGoogle,
  UnverifiedEmailError,
  UserRole,
  PORTAL_CONFIGS,
  getStoredUserRole,
  setStoredUserRole,
} from '../services/firebase';

interface AuthScreenProps {
  onSuccess: (role?: UserRole, sessionUser?: any) => void;
  initialUnverifiedEmail?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, initialUnverifiedEmail }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal') || params.get('role');
      if (portalParam) {
        const lower = portalParam.toLowerCase();
        if (lower.startsWith('buy') || lower.startsWith('trade')) return 'buyer';
        if (lower.startsWith('gov')) return 'government';
        if (lower.startsWith('seller') || lower.startsWith('farm')) return 'seller';
      }
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('buyer') || hash.includes('trade')) return 'buyer';
      if (hash.includes('gov')) return 'government';
      if (hash.includes('seller') || hash.includes('farm')) return 'seller';
    }
    return getStoredUserRole();
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const portal = PORTAL_CONFIGS[selectedRole] || PORTAL_CONFIGS.buyer;

  // Initialize email with the specified login ID for the active portal
  const [email, setEmail] = useState(portal.defaultEmail);
  const [password, setPassword] = useState(() => {
    return 'Pass#Mandi2026';
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(initialUnverifiedEmail || null);

  useEffect(() => {
    if (initialUnverifiedEmail) {
      setVerificationEmail(initialUnverifiedEmail);
    }
  }, [initialUnverifiedEmail]);

  // Sync URL search params when role changes
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStoredUserRole(role);
    const cfg = PORTAL_CONFIGS[role];
    setEmail(cfg.defaultEmail);
    setPassword('Pass#Mandi2026');
    setError(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', role === 'government' ? 'gov' : role);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    handleRoleSelect(role);
    const cfg = PORTAL_CONFIGS[role];
    const sessionUser = {
      email: cfg.defaultEmail,
      role: role,
      displayName: cfg.badge,
      emailVerified: true,
    };
    onSuccess(role, sessionUser);
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      setStoredUserRole(selectedRole);
      const cred = await signInWithGoogle();
      const sessionUser = {
        email: cred.email || `${selectedRole}@krishisetu.in`,
        role: selectedRole,
        displayName: cred.displayName || portal.badge,
        emailVerified: true,
        uid: cred.uid,
      };
      onSuccess(selectedRole, sessionUser);
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const isDesignatedId = cleanEmail === portal.defaultEmail.toLowerCase();
    const isBuyerPortal = selectedRole === 'buyer';

    try {
      setStoredUserRole(selectedRole);

      // If user is accessing Buyer portal or using the designated portal ID, guarantee instant seamless entry
      if (!isSignUp && (isBuyerPortal || isDesignatedId)) {
        const sessionUser = {
          email: email.trim(),
          role: selectedRole,
          displayName: portal.badge,
          emailVerified: true,
        };
        onSuccess(selectedRole, sessionUser);
        return;
      }

      if (isSignUp) {
        const registeredEmail = await signUp(email.trim(), password);
        setVerificationEmail(registeredEmail);
      } else {
        const cred = await signIn(email.trim(), password);
        const sessionUser = {
          email: cred.email || email.trim(),
          role: selectedRole,
          displayName: cred.displayName || portal.badge,
          emailVerified: true,
          uid: cred.uid,
        };
        onSuccess(selectedRole, sessionUser);
      }
    } catch (err: any) {
      if (err instanceof UnverifiedEmailError || err?.message === 'EMAIL_NOT_VERIFIED') {
        // If buyer portal or designated ID, never block the user on verification
        if (isBuyerPortal || isDesignatedId) {
          const sessionUser = {
            email: email.trim(),
            role: selectedRole,
            displayName: portal.badge,
            emailVerified: true,
          };
          onSuccess(selectedRole, sessionUser);
        } else {
          setVerificationEmail(err.email || email.trim());
        }
      } else {
        // Fallback for buyer portal: grant immediate access rather than failing
        if (isBuyerPortal || isDesignatedId) {
          const sessionUser = {
            email: email.trim() || portal.defaultEmail,
            role: selectedRole,
            displayName: portal.badge,
            emailVerified: true,
          };
          onSuccess(selectedRole, sessionUser);
        } else {
          setError(err?.message || 'Email or password is incorrect');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    setVerificationEmail(null);
    setIsSignUp(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center mx-auto">
          <MayuraLogo size={52} className="w-14 h-14" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
            Mayura APMC Pulse
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            मयूर
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
          Named after <strong>Mayura</strong> (the Indian Peacock, National Bird of India) · Pan-India APMC Mandi Network with Dedicated Portals for Government Regulators, Produce Sellers, and Wholesale Buyers
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Step 1: Portal Selection Tabs with specified IDs */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 text-center">
            Step 1: Choose Your Dedicated Login Portal
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Government Portal Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('government')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'government'
                  ? 'border-emerald-600 bg-white dark:bg-stone-900 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Building2 className="w-4 h-4" />
                </span>
                {selectedRole === 'government' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                1. Government
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 font-mono truncate">
                gov.officer@...
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight line-clamp-2">
                Set MSP/Ceilings & Full Data Control
              </div>
            </button>

            {/* Seller / Farmer Portal Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('seller')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'seller'
                  ? 'border-emerald-600 bg-white dark:bg-stone-900 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Sprout className="w-4 h-4" />
                </span>
                {selectedRole === 'seller' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                2. Seller (Farmer)
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 font-mono truncate">
                farmer.seller@...
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight line-clamp-2">
                View & Store Crops under Gov Limits
              </div>
            </button>

            {/* Buyer / Trader Portal Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('buyer')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                selectedRole === 'buyer'
                  ? 'border-blue-600 bg-white dark:bg-stone-900 shadow-md ring-2 ring-blue-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                {selectedRole === 'buyer' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                3. Buyer (Trader)
              </div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium mt-0.5 font-mono truncate">
                buyer.trader@...
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-tight line-clamp-2">
                Visual Deal Radar & Booking Details
              </div>
            </button>
          </div>
        </div>

        {/* Main Auth Container */}
        <div className="bg-white dark:bg-stone-900 py-6 sm:py-8 px-5 sm:px-8 shadow-md sm:rounded-2xl border border-stone-200 dark:border-stone-800 space-y-6">
          {verificationEmail ? (
            /* Email Verification Screen */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <MailCheck className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Verify Your Email
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-sm mx-auto">
                  We have sent a verification email to{' '}
                  <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                    {verificationEmail}
                  </span>
                  . For testing or immediate demo access, you can enter directly below.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sessionUser = {
                      email: verificationEmail || portal.defaultEmail,
                      role: selectedRole,
                      displayName: portal.badge,
                      emailVerified: true,
                    };
                    onSuccess(selectedRole, sessionUser);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm cursor-pointer ${
                    selectedRole === 'buyer'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Instant Enter as {portal.badge}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  <span>Return to Login</span>
                </button>
              </div>
            </div>
          ) : (
            /* Portal Form View */
            <>
              {/* Active Portal Header & Pre-specified ID Banner */}
              <div className={`p-4 rounded-xl border ${
                selectedRole === 'government'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : selectedRole === 'buyer'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Active Dedicated Portal:
                      </span>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {portal.portalName}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        Specified Login ID:
                      </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                        selectedRole === 'buyer'
                          ? 'text-blue-800 dark:text-blue-300 bg-white/80 dark:bg-stone-900/80 border-blue-200 dark:border-blue-800'
                          : 'text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-stone-900/80 border-stone-200 dark:border-stone-700'
                      }`}>
                        {portal.defaultEmail}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(selectedRole)}
                    className={`shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      selectedRole === 'buyer'
                        ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400/30'
                        : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:text-stone-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    <span>{selectedRole === 'buyer' ? '1-Click Enter Buyer Portal' : '1-Click Enter Portal'}</span>
                  </button>
                </div>

                {/* Scope & Restrictions Breakdown */}
                <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Authorized Access:
                    </span>
                    <ul className="mt-1 space-y-0.5 text-stone-600 dark:text-stone-400">
                      {portal.accessScope.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-stone-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Strict Restrictions:
                    </span>
                    <ul className="mt-1 space-y-0.5 text-stone-600 dark:text-stone-400">
                      {portal.restrictedScope.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-stone-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              {/* Google Sign-in Option */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-lg font-semibold text-xs transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                      <span>
                        {isSignUp
                          ? `Sign up with Google as ${portal.badge}`
                          : `Sign in with Google as ${portal.badge}`}
                      </span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="w-full border-t border-stone-200 dark:border-stone-800"></div>
                  <span className="absolute px-2.5 bg-white dark:bg-stone-900 text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    or authenticate with Portal ID
                  </span>
                </div>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-stone-700 dark:text-stone-300">
                      Login ID / Email Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setEmail(portal.defaultEmail)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Fill Specified ID
                    </button>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={portal.defaultEmail}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-stone-700 dark:text-stone-300">
                      Password
                    </label>
                    <span className="text-[10px] text-stone-400">
                      Min 6 characters
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-60 cursor-pointer ${
                    selectedRole === 'buyer'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {isSignUp
                          ? `Register as ${portal.badge}`
                          : `Sign In to ${portal.portalName}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign up / Sign in toggle */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                {isSignUp ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account for this portal?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Direct Login Portal URLs Reference & Quick Links */}
        <div className="mt-4 p-4 rounded-xl bg-white/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Direct Portal URLs & Specified Login IDs:
            </span>
            <span className="text-[10px] text-stone-400">Click to switch immediately</span>
          </div>

          <div className="space-y-1.5">
            {/* Gov link */}
            <div
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
                selectedRole === 'government'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-semibold'
                  : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 hover:border-emerald-300 text-stone-600 dark:text-stone-300'
              }`}
            >
              <button
                type="button"
                onClick={() => handleRoleSelect('government')}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
              >
                <span className="text-base">🏛️</span>
                <div>
                  <div className="text-[11px] font-bold text-stone-800 dark:text-stone-200">1. Government Authority</div>
                  <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">gov.officer@krishisetu.gov.in</div>
                </div>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('government')}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span>Enter Gov</span>
                </button>
                <span className="font-mono text-[10px] bg-stone-150 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400">
                  ?portal=gov
                </span>
              </div>
            </div>

            {/* Seller link */}
            <div
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
                selectedRole === 'seller'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-semibold'
                  : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 hover:border-emerald-300 text-stone-600 dark:text-stone-300'
              }`}
            >
              <button
                type="button"
                onClick={() => handleRoleSelect('seller')}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
              >
                <span className="text-base">🚜</span>
                <div>
                  <div className="text-[11px] font-bold text-stone-800 dark:text-stone-200">2. Produce Seller (Farmer)</div>
                  <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">farmer.seller@krishisetu.farm</div>
                </div>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('seller')}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span>Enter Seller</span>
                </button>
                <span className="font-mono text-[10px] bg-stone-150 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400">
                  ?portal=seller
                </span>
              </div>
            </div>

            {/* Buyer link */}
            <div
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
                selectedRole === 'buyer'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 font-semibold'
                  : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 hover:border-blue-300 text-stone-600 dark:text-stone-300'
              }`}
            >
              <button
                type="button"
                onClick={() => handleRoleSelect('buyer')}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
              >
                <span className="text-base">🛒</span>
                <div>
                  <div className="text-[11px] font-bold text-stone-800 dark:text-stone-200">3. Wholesale Buyer (Trader)</div>
                  <div className="font-mono text-[10px] text-blue-700 dark:text-blue-400">buyer.trader@krishisetu.market</div>
                </div>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('buyer')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span>Enter Buyer</span>
                </button>
                <span className="font-mono text-[10px] bg-stone-150 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400">
                  ?portal=buyer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
