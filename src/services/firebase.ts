import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// User-provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBbuyHlPVDpyZuqcVPCHata6TuyED93HMs",
  authDomain: "krishisetu-mandi-ai.firebaseapp.com",
  projectId: "krishisetu-mandi-ai",
  storageBucket: "krishisetu-mandi-ai.firebasestorage.app",
  messagingSenderId: "183200054623",
  appId: "1:183200054623:web:16934e32ab6245d3110aea",
  measurementId: "G-B874DL26PZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication only (as required)
export const auth = getAuth(app);

// Initialize Analytics if supported in browser environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore unsupported analytics environments
  });
}

// Custom error for unverified email
export class UnverifiedEmailError extends Error {
  email: string;
  constructor(email: string) {
    super('EMAIL_NOT_VERIFIED');
    this.name = 'UnverifiedEmailError';
    this.email = email;
  }
}

// Authentication Helpers with strict email verification & error requirements
export async function signIn(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    
    // Check if email is verified (skip verification blockage for official portal demo accounts)
    const isOfficialPortalAccount =
      email.includes('@krishisetu.') ||
      email.toLowerCase().includes('buyer') ||
      email.toLowerCase().includes('seller') ||
      email.toLowerCase().includes('gov');

    if (!cred.user.emailVerified && !isOfficialPortalAccount) {
      // Send verification email to the user
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Ignore rate limiting on duplicate resend
      }
      // Block access: do NOT sign them in automatically
      await signOut(auth);
      throw new UnverifiedEmailError(cred.user.email || email);
    }
    
    return cred.user;
  } catch (err: any) {
    if (err instanceof UnverifiedEmailError || err?.message === 'EMAIL_NOT_VERIFIED') {
      throw err;
    }
    const code = err?.code;
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-login-credentials' ||
      code === 'auth/invalid-email'
    ) {
      throw new Error('Email or password is incorrect');
    }
    throw new Error(err?.message || 'Email or password is incorrect');
  }
}

export async function signUp(email: string, pass: string): Promise<string> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Send verification email
    await sendEmailVerification(cred.user);
    // When a user registers with email/password, do NOT sign them in automatically
    await signOut(auth);
    return cred.user.email || email;
  } catch (err: any) {
    const code = err?.code;
    if (code === 'auth/email-already-in-use') {
      throw new Error('User already exists. Please sign in');
    }
    if (code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address');
    }
    throw new Error(err?.message || 'Failed to create account');
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Google Authentication provider and helper
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err: any) {
    const code = err?.code;
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed');
    }
    if (code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign-in was cancelled');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Popup blocked by browser. Please allow popups for this site');
    }
    if (code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email using a different login method');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network error during Google sign-in. Please check your connection');
    }
    throw new Error(err?.message || 'Google sign-in failed. Please try again');
  }
}

// 3 Login Types and Role Management
import { UserRole, CropType } from '../types';
export type { UserRole, CropType };

export const ROLE_CONFIGS: Record<UserRole, { label: string; title: string; badge: string; description: string }> = {
  government: {
    label: 'Government Authority',
    title: 'APMC Market Regulator & Department of Agriculture',
    badge: 'Govt APMC Regulator',
    description: 'Set minimum support prices (MSP), maximum price ceilings, quality grade limits, and complete data control over APMC master database.',
  },
  seller: {
    label: 'Produce Seller / Farmer',
    title: 'Farmer & Producer Organization (FPO)',
    badge: 'Farmer / Producer',
    description: 'Store harvest lots within Government price boundaries (MSP floor & ceiling caps) and view crop products.',
  },
  buyer: {
    label: 'Licensed Buyer / Trader',
    title: 'Wholesaler, Commission Agent & Food Processor',
    badge: 'Licensed Trader / Buyer',
    description: 'Explore visual deal radar charts, review available produce lots, access booking details and forecasts needed for booking.',
  },
};

export interface PortalConfig {
  role: UserRole;
  portalName: string;
  defaultEmail: string;
  badge: string;
  accessTitle: string;
  accessScope: string[];
  restrictedScope: string[];
  description: string;
}

export const PORTAL_CONFIGS: Record<UserRole, PortalConfig> = {
  government: {
    role: 'government',
    portalName: 'Government Regulatory Authority Portal',
    defaultEmail: 'gov.officer@krishisetu.gov.in',
    badge: '🏛️ Govt Regulatory Authority',
    accessTitle: 'Set Standards & Complete Control to Data',
    accessScope: [
      'Set and update statutory Minimum Support Price (MSP) floors',
      'Set and enforce Maximum Wholesale Price Ceilings',
      'Complete administrative control over all master data (Farmers, Mandis, Deals, Audit Logs)',
      'Review and audit all buyer-seller procurement contracts',
    ],
    restrictedScope: [
      'Commercial trading restricted to market oversight & regulation',
    ],
    description: 'Official portal for APMC regulators to enforce price standards, manage intake quotas, and oversee full market database records.',
  },
  seller: {
    role: 'seller',
    portalName: 'Produce Seller / Farmer Portal',
    defaultEmail: 'farmer.seller@krishisetu.farm',
    badge: '🚜 Produce Seller / Farmer',
    accessTitle: 'Crops Catalog & Storage under Gov Limits',
    accessScope: [
      'View personal stored crop products and inventory status',
      'Add crop products strictly adhering to Government price limits (MSP floor to Ceiling cap)',
      'Real-time financial net realization calculator after mandi freight',
      'Harvest dispatch planning & local mandi trends',
    ],
    restrictedScope: [
      'Strictly prohibited from placing buyer procurement orders or booking deals',
      'Strictly blocked from modifying government price standards or ceilings',
      'No access to administrative master database records',
    ],
    description: 'Dedicated portal for farmers to manage their crop products and store new lots under strict Government price regulations.',
  },
  buyer: {
    role: 'buyer',
    portalName: 'Licensed Buyer / Trader Portal',
    defaultEmail: 'buyer.trader@krishisetu.market',
    badge: '🛒 Licensed Buyer / Trader',
    accessTitle: 'Booking Details & Visual Deal Radar',
    accessScope: [
      'Access booking details and manage placed procurement orders',
      'Visual Deal Finder: charts, radar, and scatter plots to discover high-value deals',
      'Live produce board to place instant procurement bookings',
      '7-14 day mandi arrival and price predictions needed for booking decisions',
    ],
    restrictedScope: [
      'Strictly blocked from adding or storing seller crop products',
      'Strictly blocked from editing government regulatory standards or ceilings',
      'No access to farmer applicant registration records or master admin databases',
    ],
    description: 'Dedicated portal for wholesale buyers to spot good deals with visual charts, book crop lots, and track booking details.',
  },
};

const USER_ROLE_KEY = 'krishisetu_active_user_role';
const SESSION_STORAGE_KEY = 'krishisetu_active_session_user';

export interface ActiveSessionUser {
  email: string;
  role: UserRole;
  displayName: string;
  emailVerified: boolean;
  uid?: string;
}

export function getStoredUserRole(): UserRole {
  if (typeof window !== 'undefined') {
    const session = getActiveUserSession();
    if (session && session.role) {
      return session.role;
    }
    const saved = localStorage.getItem(USER_ROLE_KEY) as UserRole | null;
    if (saved && (saved === 'government' || saved === 'seller' || saved === 'buyer')) {
      return saved;
    }
  }
  return 'buyer'; // default to buyer portal when requested
}

export function setStoredUserRole(role: UserRole): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ROLE_KEY, role);
    const existing = getActiveUserSession();
    if (existing) {
      existing.role = role;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(existing));
    }
  }
}

export function getActiveUserSession(): ActiveSessionUser | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setActiveUserSession(session: ActiveSessionUser | null): void {
  if (typeof window !== 'undefined') {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(USER_ROLE_KEY, session.role);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}

export function clearActiveUserSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// Government Regulatory Standards Interface
export interface GovStandardRecord {
  id: string;
  cropId: CropType;
  cropName: string;
  minPriceFloor: number; // ₹/quintal (Government Minimum Support Price / Mandi Floor)
  maxPriceCeiling: number; // ₹/quintal (Government Maximum Price Cap to prevent excessive inflation)
  dailyMandiIntakeQuotaTonnes: number; // APMC daily intake capacity before glut warning
  fairAverageQualityMoistureMax: number; // % maximum allowable moisture
  storageSubsidyPercent: number; // % government cold store rebate
  issuedByAuthority: string; // "Agri-Market Regulation Board / APMC"
  circularNumber: string; // e.g. "GOI/APMC-REG/2026-88"
  effectiveDate: string;
  lastUpdated: string;
  updatedBy: string;
  enforcementNotes: string;
}

// Buyer Procurement Order / Purchase Intent
export interface BuyerOrderRecord {
  id: string;
  sellerRecordId: string;
  cropName: string;
  variety: string;
  sellerName: string;
  buyerName: string;
  buyerCompany: string;
  buyerContact: string;
  quantityTonnes: number;
  bidPricePerQuintal: number;
  allocatedMandiName: string;
  totalDealValue: number;
  status: 'bid_placed' | 'accepted' | 'verified' | 'dispatched' | 'settled';
  createdAt: string;
}

// Data Types for in-memory records (since Firestore is disabled as required)
export interface ApplicantRecord {
  id: string;
  farmerName: string;
  phoneNumber: string;
  farmerId?: string;
  villageDistrict: string;
  state: string;
  cropName: string;
  cropId?: CropType;
  variety: string;
  quantityTonnes: number;
  harvestDate: string;
  allocatedMandiId?: string;
  allocatedMandiName: string;
  allocatedDispatchDate: string;
  askingPricePerQuintal?: number; // Price set by seller
  estimatedNetRealization: number;
  govComplianceStatus?: 'compliant' | 'warning_above_ceiling' | 'warning_below_msp';
  govComplianceNote?: string;
  status: 'registered' | 'approved' | 'in_transit' | 'settled';
  createdAt: string;
}

export interface MandiStoreRecord {
  id: string;
  mandiId: string;
  name: string;
  district: string;
  state: string;
  storageType: 'cold_storage' | 'aerated_chawl' | 'apmc_shed' | 'warehouse';
  totalCapacityTonnes: number;
  availableCapacityTonnes: number;
  dailyStorageRatePerQuintal: number;
  unloadingFeePerQuintal: number;
  mandiCessPercent: number;
  contactOfficer: string;
  contactPhone: string;
  operatingHours: string;
  updatedAt: string;
}

export interface AdminHistoryRecord {
  id: string;
  actionType:
    | 'gov_standards_updated'
    | 'applicant_approval'
    | 'applicant_status_change'
    | 'applicant_registration'
    | 'buyer_order_placed'
    | 'mandi_store_updated'
    | 'mandi_capacity_override'
    | 'dispatch_manifest_issued'
    | 'market_tariff_update'
    | 'system_audit';
  entityId?: string;
  entityName: string;
  adminUser: string;
  summary: string;
  previousValue?: string;
  newValue?: string;
  channel?: string;
  timestamp: string;
}

export const CURRENT_ADMIN_EMAIL = 'rohansomu0507@gmail.com';

// Local In-Memory Fallbacks for UI Views (No Firestore used as requested)
let inMemoryApplicants: ApplicantRecord[] = [
  {
    id: 'app_sample_1',
    farmerName: 'Ramesh Gowda',
    phoneNumber: '+91 98450 12345',
    farmerId: 'KA-KLR-2026-908',
    villageDistrict: 'Chintamani, Kolar',
    state: 'Karnataka',
    cropName: 'Tomatoes',
    cropId: 'tomatoes',
    variety: 'Hybrid Shivam',
    quantityTonnes: 5.0,
    harvestDate: new Date().toISOString().split('T')[0],
    allocatedMandiId: 'bangalore-yeshwanthpur',
    allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
    allocatedDispatchDate: new Date().toISOString().split('T')[0],
    askingPricePerQuintal: 2050,
    estimatedNetRealization: 98000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app_sample_2',
    farmerName: 'Suresh M. Reddy',
    phoneNumber: '+91 98455 88219',
    farmerId: 'KA-SBL-2026-112',
    villageDistrict: 'Srinivaspur, Kolar',
    state: 'Karnataka',
    cropName: 'Tomatoes',
    cropId: 'tomatoes',
    variety: 'Saaho F1',
    quantityTonnes: 12.0,
    harvestDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'kolar-apmc',
    allocatedMandiName: 'Kolar APMC Yard & Produce Intake Sheds',
    allocatedDispatchDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 1980,
    estimatedNetRealization: 228000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'app_sample_3',
    farmerName: 'Venkat Ramanathan',
    phoneNumber: '+91 94441 55091',
    farmerId: 'TN-VLR-2026-304',
    villageDistrict: 'Gudiyatham, Vellore',
    state: 'Tamil Nadu',
    cropName: 'Tomatoes',
    cropId: 'tomatoes',
    variety: 'Abhinav 1057',
    quantityTonnes: 8.5,
    harvestDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'chennai-koyambedu',
    allocatedMandiName: 'Chennai Koyambedu Wholesale Vegetable Terminal & Cold Complex',
    allocatedDispatchDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 2320,
    estimatedNetRealization: 189000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'app_sample_4',
    farmerName: 'Anand Patil',
    phoneNumber: '+91 98221 44321',
    farmerId: 'MH-NSK-2026-781',
    villageDistrict: 'Pimpalgaon, Nashik',
    state: 'Maharashtra',
    cropName: 'Onions',
    cropId: 'onions',
    variety: 'Nashik Red',
    quantityTonnes: 16.0,
    harvestDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'bangalore-yeshwanthpur',
    allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
    allocatedDispatchDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 1720,
    estimatedNetRealization: 265000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'app_sample_5',
    farmerName: 'Kishore Chandran',
    phoneNumber: '+91 97890 33411',
    farmerId: 'AP-CTR-2026-552',
    villageDistrict: 'Madanapalle, Chittoor',
    state: 'Andhra Pradesh',
    cropName: 'Tomatoes',
    cropId: 'tomatoes',
    variety: 'Desi Local',
    quantityTonnes: 6.0,
    harvestDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'kolar-apmc',
    allocatedMandiName: 'Kolar APMC Yard & Produce Intake Sheds',
    allocatedDispatchDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 1850,
    estimatedNetRealization: 106000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'app_sample_6',
    farmerName: 'Gurpreet Singh',
    phoneNumber: '+91 98150 77123',
    farmerId: 'PB-JAL-2026-092',
    villageDistrict: 'Shahkot, Jalandhar',
    state: 'Punjab',
    cropName: 'Potatoes',
    cropId: 'potatoes',
    variety: 'Jyoti Special',
    quantityTonnes: 22.0,
    harvestDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'bangalore-yeshwanthpur',
    allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
    allocatedDispatchDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 1280,
    estimatedNetRealization: 270000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'app_sample_7',
    farmerName: 'Lakshmi Devi',
    phoneNumber: '+91 99088 12940',
    farmerId: 'AP-GNT-2026-440',
    villageDistrict: 'Tenali, Guntur',
    state: 'Andhra Pradesh',
    cropName: 'Green Chillies',
    cropId: 'chillies',
    variety: 'G4 Super Hot',
    quantityTonnes: 4.0,
    harvestDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'chennai-koyambedu',
    allocatedMandiName: 'Chennai Koyambedu Wholesale Vegetable Terminal & Cold Complex',
    allocatedDispatchDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 4350,
    estimatedNetRealization: 168000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'app_sample_8',
    farmerName: 'Balaji Agro Cooperative',
    phoneNumber: '+91 94432 99812',
    farmerId: 'TN-DMP-2026-118',
    villageDistrict: 'Palacode, Dharmapuri',
    state: 'Tamil Nadu',
    cropName: 'Cauliflower',
    cropId: 'cauliflower',
    variety: 'Snowball 16',
    quantityTonnes: 7.5,
    harvestDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    allocatedMandiId: 'bangalore-yeshwanthpur',
    allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
    allocatedDispatchDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    askingPricePerQuintal: 1650,
    estimatedNetRealization: 118000,
    govComplianceStatus: 'compliant',
    status: 'approved',
    createdAt: new Date(Date.now() - 25200000).toISOString(),
  },
];

let inMemoryStores: MandiStoreRecord[] = [
  {
    id: 'store_kolar_apmc',
    mandiId: 'kolar-apmc',
    name: 'Kolar APMC Yard & Produce Intake Sheds',
    district: 'Kolar',
    state: 'Karnataka',
    storageType: 'apmc_shed',
    totalCapacityTonnes: 250,
    availableCapacityTonnes: 110,
    dailyStorageRatePerQuintal: 4,
    unloadingFeePerQuintal: 28,
    mandiCessPercent: 1.5,
    contactOfficer: 'Sri R. Manjunath (APMC Secretary)',
    contactPhone: '+91 98452 11029',
    operatingHours: '04:00 AM - 01:30 PM (Daily Auction)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'store_bangalore_yeshwanthpur',
    name: 'Bangalore Yeshwanthpur Agro Cold Logistics Hub',
    mandiId: 'bangalore-yeshwanthpur',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    storageType: 'cold_storage',
    totalCapacityTonnes: 1200,
    availableCapacityTonnes: 480,
    dailyStorageRatePerQuintal: 18,
    unloadingFeePerQuintal: 35,
    mandiCessPercent: 1.5,
    contactOfficer: 'Dr. V. Shivakumar (Logistics Director)',
    contactPhone: '+91 80 2349 8812',
    operatingHours: '24 Hours Intake (Auction 05:00 AM)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'store_chennai_koyambedu',
    name: 'Chennai Koyambedu Wholesale Vegetable Terminal & Cold Complex',
    mandiId: 'chennai-koyambedu',
    district: 'Chennai',
    state: 'Tamil Nadu',
    storageType: 'cold_storage',
    totalCapacityTonnes: 2800,
    availableCapacityTonnes: 950,
    dailyStorageRatePerQuintal: 20,
    unloadingFeePerQuintal: 42,
    mandiCessPercent: 1.0,
    contactOfficer: 'M. Senthil Kumar (Market Management Officer)',
    contactPhone: '+91 44 2479 3301',
    operatingHours: '03:00 AM - 12:00 PM',
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryHistory: AdminHistoryRecord[] = [
  {
    id: 'audit_init_01',
    actionType: 'system_audit',
    entityName: 'KrishiSetu Mandi AI Platform',
    adminUser: CURRENT_ADMIN_EMAIL,
    summary: 'Initialized APMC harvest allocation engine and authentication gateway.',
    newValue: 'Enabled Kolar, Nashik, and Agra market intelligence clusters.',
    channel: 'System Setup',
    timestamp: new Date().toISOString(),
  },
];

const applicantListeners: Array<(apps: ApplicantRecord[]) => void> = [];
const storeListeners: Array<(stores: MandiStoreRecord[]) => void> = [];
const historyListeners: Array<(hist: AdminHistoryRecord[]) => void> = [];

export async function logAdminAction(
  data: Omit<AdminHistoryRecord, 'id' | 'timestamp'>
): Promise<string> {
  const id = `audit_${Date.now()}`;
  const record: AdminHistoryRecord = { ...data, id, timestamp: new Date().toISOString() };
  inMemoryHistory = [record, ...inMemoryHistory];
  historyListeners.forEach((fn) => fn([...inMemoryHistory]));
  return id;
}

export async function saveApplicant(
  data: Omit<ApplicantRecord, 'id' | 'createdAt'>,
  adminUser = CURRENT_ADMIN_EMAIL
): Promise<string> {
  const id = `app_${Date.now()}`;
  const record: ApplicantRecord = { ...data, id, createdAt: new Date().toISOString() };
  inMemoryApplicants = [record, ...inMemoryApplicants];
  applicantListeners.forEach((fn) => fn([...inMemoryApplicants]));

  await logAdminAction({
    actionType: 'applicant_registration',
    entityId: id,
    entityName: `${record.farmerName} (${record.cropName} ${record.quantityTonnes}T)`,
    adminUser,
    summary: `Registered harvest application for ${record.farmerName}.`,
    channel: 'Farmer Harvest Portal',
  });
  return id;
}

export function getApplicants(): ApplicantRecord[] {
  return [...inMemoryApplicants];
}

export function subscribeApplicants(
  onData: (applicants: ApplicantRecord[]) => void,
  _onError?: (err: any) => void
) {
  onData([...inMemoryApplicants]);
  applicantListeners.push(onData);
  return () => {
    const idx = applicantListeners.indexOf(onData);
    if (idx > -1) applicantListeners.splice(idx, 1);
  };
}

export async function saveMandiStore(data: MandiStoreRecord): Promise<void> {
  const id = data.id || `mandi_${Date.now()}`;
  const record = { ...data, id, updatedAt: new Date().toISOString() };
  inMemoryStores = inMemoryStores.filter((s) => s.id !== id);
  inMemoryStores.push(record);
  storeListeners.forEach((fn) => fn([...inMemoryStores]));
}

export function subscribeMandiStores(
  onData: (stores: MandiStoreRecord[]) => void,
  _onError?: (err: any) => void
) {
  onData([...inMemoryStores]);
  storeListeners.push(onData);
  return () => {
    const idx = storeListeners.indexOf(onData);
    if (idx > -1) storeListeners.splice(idx, 1);
  };
}

export async function updateApplicantStatus(
  applicantId: string,
  newStatus: 'registered' | 'approved' | 'in_transit' | 'settled',
  applicantName: string,
  previousStatus: string,
  adminUser = CURRENT_ADMIN_EMAIL
): Promise<void> {
  inMemoryApplicants = inMemoryApplicants.map((a) =>
    a.id === applicantId ? { ...a, status: newStatus } : a
  );
  applicantListeners.forEach((fn) => fn([...inMemoryApplicants]));

  await logAdminAction({
    actionType: newStatus === 'approved' ? 'applicant_approval' : 'applicant_status_change',
    entityId: applicantId,
    entityName: applicantName,
    adminUser,
    summary: `Updated status of ${applicantName} from [${previousStatus}] to [${newStatus}].`,
    previousValue: previousStatus,
    newValue: newStatus,
    channel: 'Admin Mandi Control Console',
  });
}

export function subscribeAdminHistory(
  onData: (history: AdminHistoryRecord[]) => void,
  _onError?: (err: any) => void
) {
  onData([...inMemoryHistory]);
  historyListeners.push(onData);
  return () => {
    const idx = historyListeners.indexOf(onData);
    if (idx > -1) historyListeners.splice(idx, 1);
  };
}

// ----------------------------------------------------
// 1. GOVERNMENT REGULATORY STANDARDS & CEILING CONTROLS
// ----------------------------------------------------
let inMemoryGovStandards: GovStandardRecord[] = [
  {
    id: 'gov_std_tomatoes',
    cropId: 'tomatoes',
    cropName: 'Tomatoes (Tomato Solanum)',
    minPriceFloor: 1400, // ₹/quintal Minimum Support Price / Mandi Floor
    maxPriceCeiling: 3800, // ₹/quintal Maximum price ceiling
    dailyMandiIntakeQuotaTonnes: 85,
    fairAverageQualityMoistureMax: 8.5,
    storageSubsidyPercent: 25,
    issuedByAuthority: 'Directorate of Agricultural Marketing, Govt of India',
    circularNumber: 'AGRI/MSP-CEIL/2026/TM-09',
    effectiveDate: '2026-03-01',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'apmc-regulator@gov.in',
    enforcementNotes: 'Mandatory APMC auction floor ₹1,400/q to protect growers against predatory dumping during harvest flush; ceiling ₹3,800/q to protect consumers.',
  },
  {
    id: 'gov_std_onions',
    cropId: 'onions',
    cropName: 'Onions (Allium Cepa)',
    minPriceFloor: 1250,
    maxPriceCeiling: 3200,
    dailyMandiIntakeQuotaTonnes: 120,
    fairAverageQualityMoistureMax: 10.0,
    storageSubsidyPercent: 20,
    issuedByAuthority: 'National Agricultural Cooperative Marketing Federation (NAFED)',
    circularNumber: 'NAFED/PRICE-STAB/2026/ON-41',
    effectiveDate: '2026-02-15',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'apmc-regulator@gov.in',
    enforcementNotes: 'Essential commodities buffer stock framework. Stock limits enforced if mandi arrivals cross 150 tonnes/day.',
  },
  {
    id: 'gov_std_potatoes',
    cropId: 'potatoes',
    cropName: 'Potatoes (Solanum Tuberosum)',
    minPriceFloor: 1050,
    maxPriceCeiling: 2600,
    dailyMandiIntakeQuotaTonnes: 160,
    fairAverageQualityMoistureMax: 13.0,
    storageSubsidyPercent: 30,
    issuedByAuthority: 'State Horticultural Development Board',
    circularNumber: 'SHDB/COLD-CHAIN/2026/POT-18',
    effectiveDate: '2026-01-20',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'apmc-regulator@gov.in',
    enforcementNotes: 'Subsidized cold storage rebate of 30% available across registered warehouses.',
  },
  {
    id: 'gov_std_chillies',
    cropId: 'chillies',
    cropName: 'Green Chillies (Capsicum Annuum)',
    minPriceFloor: 5800,
    maxPriceCeiling: 15000,
    dailyMandiIntakeQuotaTonnes: 45,
    fairAverageQualityMoistureMax: 6.5,
    storageSubsidyPercent: 15,
    issuedByAuthority: 'Spices Board of India / APMC Guntur & Byadgi',
    circularNumber: 'SPICES-BD/PRICE-DIR/2026/CH-72',
    effectiveDate: '2026-02-01',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'apmc-regulator@gov.in',
    enforcementNotes: 'High volatility spice classification. Minimum auction floor strictly enforced.',
  },
  {
    id: 'gov_std_cauliflower',
    cropId: 'cauliflower',
    cropName: 'Cauliflower (Brassica Oleracea)',
    minPriceFloor: 950,
    maxPriceCeiling: 2900,
    dailyMandiIntakeQuotaTonnes: 60,
    fairAverageQualityMoistureMax: 9.0,
    storageSubsidyPercent: 20,
    issuedByAuthority: 'Agricultural Produce Market Committee Directorate',
    circularNumber: 'APMC/PERISHABLE-FAQ/2026/CF-11',
    effectiveDate: '2026-03-10',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'apmc-regulator@gov.in',
    enforcementNotes: 'Short shelf life (<4 days ambient). Priority intake gate at APMC yards.',
  },
];

const govStandardListeners: Array<(standards: GovStandardRecord[]) => void> = [];

export function getGovStandards(): GovStandardRecord[] {
  return [...inMemoryGovStandards];
}

export function getGovStandardForCrop(cropId: CropType): GovStandardRecord | undefined {
  return inMemoryGovStandards.find((s) => s.cropId === cropId);
}

export async function saveGovStandard(
  data: GovStandardRecord,
  adminUser = CURRENT_ADMIN_EMAIL
): Promise<void> {
  const existing = inMemoryGovStandards.find((s) => s.id === data.id || s.cropId === data.cropId);
  const updated: GovStandardRecord = {
    ...data,
    lastUpdated: new Date().toISOString(),
    updatedBy: adminUser,
  };

  inMemoryGovStandards = inMemoryGovStandards.map((s) =>
    s.id === data.id || s.cropId === data.cropId ? updated : s
  );

  govStandardListeners.forEach((fn) => fn([...inMemoryGovStandards]));

  await logAdminAction({
    actionType: 'gov_standards_updated',
    entityId: updated.id,
    entityName: `Gov Standard: ${updated.cropName}`,
    adminUser,
    summary: `Government updated price limits for ${updated.cropName}: Min MSP ₹${updated.minPriceFloor}/q, Max Ceiling ₹${updated.maxPriceCeiling}/q.`,
    previousValue: existing ? `Min ₹${existing.minPriceFloor} / Max ₹${existing.maxPriceCeiling}` : undefined,
    newValue: `Min ₹${updated.minPriceFloor} / Max ₹${updated.maxPriceCeiling}`,
    channel: 'Government Regulatory Control',
  });
}

export function subscribeGovStandards(
  onData: (standards: GovStandardRecord[]) => void,
  _onError?: (err: any) => void
) {
  onData([...inMemoryGovStandards]);
  govStandardListeners.push(onData);
  return () => {
    const idx = govStandardListeners.indexOf(onData);
    if (idx > -1) govStandardListeners.splice(idx, 1);
  };
}

// Seller produce validation against Government standards
export function validateSellerCropPrice(
  cropId: CropType,
  askingPricePerQuintal: number
): {
  compliant: boolean;
  status: 'compliant' | 'warning_above_ceiling' | 'warning_below_msp';
  message: string;
  standard: GovStandardRecord;
} {
  const standard = getGovStandardForCrop(cropId) || inMemoryGovStandards[0];
  
  if (askingPricePerQuintal < standard.minPriceFloor) {
    return {
      compliant: false,
      status: 'warning_below_msp',
      message: `Asking price ₹${askingPricePerQuintal.toLocaleString()}/q is below Government Minimum Support Price (₹${standard.minPriceFloor.toLocaleString()}/q). Farmers are guaranteed MSP floor protection.`,
      standard,
    };
  }

  if (askingPricePerQuintal > standard.maxPriceCeiling) {
    return {
      compliant: false,
      status: 'warning_above_ceiling',
      message: `Asking price ₹${askingPricePerQuintal.toLocaleString()}/q exceeds Government Maximum Price Ceiling (₹${standard.maxPriceCeiling.toLocaleString()}/q). Price caps protect against market inflation.`,
      standard,
    };
  }

  return {
    compliant: true,
    status: 'compliant',
    message: `Compliant with Government standards (Between Min MSP ₹${standard.minPriceFloor.toLocaleString()} and Max ₹${standard.maxPriceCeiling.toLocaleString()}/q).`,
    standard,
  };
}

// ----------------------------------------------------
// 2. BUYER PROCUREMENT ORDERS & INTENTS
// ----------------------------------------------------
let inMemoryBuyerOrders: BuyerOrderRecord[] = [
  {
    id: 'order_101',
    sellerRecordId: 'app_sample_1',
    cropName: 'Tomatoes',
    variety: 'Hybrid Shivam',
    sellerName: 'Ramesh Gowda',
    buyerName: 'Vikram Sethi',
    buyerCompany: 'Sethi Agro Wholesale & Exports',
    buyerContact: '+91 98440 55112',
    quantityTonnes: 3.5,
    bidPricePerQuintal: 2250,
    allocatedMandiName: 'Bangalore Yeshwanthpur APMC',
    totalDealValue: 78750,
    status: 'bid_placed',
    createdAt: new Date().toISOString(),
  },
];

const buyerOrderListeners: Array<(orders: BuyerOrderRecord[]) => void> = [];

export async function saveBuyerOrder(
  data: Omit<BuyerOrderRecord, 'id' | 'createdAt'>
): Promise<string> {
  const id = `order_${Date.now()}`;
  const record: BuyerOrderRecord = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  inMemoryBuyerOrders = [record, ...inMemoryBuyerOrders];
  buyerOrderListeners.forEach((fn) => fn([...inMemoryBuyerOrders]));

  await logAdminAction({
    actionType: 'buyer_order_placed',
    entityId: id,
    entityName: `Buyer Order: ${record.cropName} (${record.quantityTonnes}T)`,
    adminUser: record.buyerName,
    summary: `Buyer ${record.buyerCompany} placed procurement bid of ₹${record.bidPricePerQuintal}/q for ${record.quantityTonnes}T from ${record.sellerName}.`,
    newValue: `Status: ${record.status} | Value: ₹${record.totalDealValue.toLocaleString()}`,
    channel: 'Buyer Procurement Terminal',
  });

  return id;
}

export function subscribeBuyerOrders(
  onData: (orders: BuyerOrderRecord[]) => void,
  _onError?: (err: any) => void
) {
  onData([...inMemoryBuyerOrders]);
  buyerOrderListeners.push(onData);
  return () => {
    const idx = buyerOrderListeners.indexOf(onData);
    if (idx > -1) buyerOrderListeners.splice(idx, 1);
  };
}

export async function seedInitialMandiStoresIfEmpty(): Promise<void> {
  // No-op for in-memory
}

export async function seedInitialAdminHistoryIfEmpty(): Promise<void> {
  // No-op for in-memory
}

