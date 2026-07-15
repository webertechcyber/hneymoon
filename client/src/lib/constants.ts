// ============================================================
// HONEYMOON — Platform Constants
// ============================================================

// =====================================================
// APP URL
// =====================================================

export const APP_URL =
  import.meta.env.VITE_APP_URL ??
  "https://honeymoon.kuomoka.co.ke";
// ─── Routes ──────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_EMAIL: "/verify-email",
  SUBSCRIPTION: "/subscription",
  REFERRALS: "/referrals",
  CHECKOUT: "/checkout",
  DASHBOARD: "/profile",
  PROFILE: "/profile",
  COMPLETE_PROFILE: "/complete-profile",
  DISCOVER: "/discover",
  MESSAGES: "/messages",
  SETTINGS: "/settings",
  NOTIFICATIONS: "/notifications",
  OPPORTUNITIES: "/opportunities",
  REMOTE_WORK: "/opportunities/remote-work",
  AI_TASKS: "/opportunities/ai-training",
  FREELANCING: "/opportunities/freelancing",
  PAYMENTS: "/payments",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_AI: "/admin/ai",
  ADMIN_PAYMENTS: "/admin/payments",
  ADMIN_REFERRALS: "/admin/referrals",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

// ─── Countries ───────────────────────────────────────────────

export const COUNTRIES = [
  // East Africa
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Burundi", "Ethiopia",
  "Somalia", "Djibouti", "Eritrea",
  // Central Africa
  "DR Congo", "Republic of the Congo", "Cameroon", "Central African Republic",
  "Chad", "Gabon", "Equatorial Guinea",
  // West Africa
  "Nigeria", "Ghana", "Senegal", "Ivory Coast", "Benin", "Togo",
  "Sierra Leone", "Liberia", "Guinea", "Mali", "Burkina Faso", "Niger", "Gambia",
  // Southern Africa
  "South Africa", "Namibia", "Botswana", "Zimbabwe", "Zambia", "Malawi",
  "Mozambique", "Angola", "Lesotho", "Eswatini", "Madagascar", "Mauritius",
  // North Africa
  "Egypt", "Morocco", "Algeria", "Tunisia", "Libya",
  // Europe
  "United Kingdom", "Ireland", "Germany", "France", "Italy", "Spain",
  "Portugal", "Netherlands", "Belgium", "Switzerland", "Austria",
  "Sweden", "Norway", "Denmark", "Finland", "Poland",
  // North America
  "United States", "Canada", "Mexico",
  // South America
  "Brazil", "Argentina", "Chile", "Colombia",
  // Asia
  "India", "Pakistan", "Bangladesh", "China", "Japan", "South Korea",
  "Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand",
  "United Arab Emirates", "Saudi Arabia", "Qatar",
  // Oceania
  "Australia", "New Zealand",
  "Other",
] as const;

export type Country = typeof COUNTRIES[number];

// ─── Country Currency Map ─────────────────────────────────────

export interface CountryCurrency {
  currency: string;
  amount: number;
  symbol: string;
}

export const DEFAULT_CURRENCY: CountryCurrency = { currency: "USD", amount: 2, symbol: "$" };

export const COUNTRY_CURRENCY: Record<string, CountryCurrency> = {
  Kenya: { currency: "KES", amount: 180, symbol: "KSh" },
  Uganda: { currency: "UGX", amount: 5000, symbol: "USh" },
  Tanzania: { currency: "TZS", amount: 3500, symbol: "TSh" },
  Rwanda: { currency: "RWF", amount: 2500, symbol: "RF" },
  Burundi: { currency: "BIF", amount: 6000, symbol: "BIF" },
  Ethiopia: { currency: "ETB", amount: 250, symbol: "Br" },
  Nigeria: { currency: "NGN", amount: 3000, symbol: "₦" },
  "South Africa": { currency: "ZAR", amount: 40, symbol: "R" },
  Ghana: { currency: "GHS", amount: 30, symbol: "₵" },
  Zambia: { currency: "ZMW", amount: 55, symbol: "ZK" },
  Zimbabwe: { currency: "USD", amount: 2, symbol: "$" },
  Botswana: { currency: "BWP", amount: 28, symbol: "P" },
  Namibia: { currency: "NAD", amount: 40, symbol: "N$" },
  Malawi: { currency: "MWK", amount: 3500, symbol: "MK" },
  Mozambique: { currency: "MZN", amount: 130, symbol: "MT" },
  Egypt: { currency: "EGP", amount: 100, symbol: "E£" },
  Morocco: { currency: "MAD", amount: 20, symbol: "MAD" },
  Algeria: { currency: "DZD", amount: 270, symbol: "DA" },
  Tunisia: { currency: "TND", amount: 6, symbol: "DT" },
  "United Kingdom": { currency: "GBP", amount: 2, symbol: "£" },
  Ireland: { currency: "EUR", amount: 2, symbol: "€" },
  Germany: { currency: "EUR", amount: 2, symbol: "€" },
  France: { currency: "EUR", amount: 2, symbol: "€" },
  Italy: { currency: "EUR", amount: 2, symbol: "€" },
  Spain: { currency: "EUR", amount: 2, symbol: "€" },
  Portugal: { currency: "EUR", amount: 2, symbol: "€" },
  Netherlands: { currency: "EUR", amount: 2, symbol: "€" },
  Belgium: { currency: "EUR", amount: 2, symbol: "€" },
  Switzerland: { currency: "CHF", amount: 2, symbol: "CHF" },
  Austria: { currency: "EUR", amount: 2, symbol: "€" },
  Sweden: { currency: "SEK", amount: 20, symbol: "kr" },
  Norway: { currency: "NOK", amount: 22, symbol: "kr" },
  Denmark: { currency: "DKK", amount: 15, symbol: "kr" },
  Finland: { currency: "EUR", amount: 2, symbol: "€" },
  Poland: { currency: "PLN", amount: 8, symbol: "zł" },
  "United States": { currency: "USD", amount: 2, symbol: "$" },
  Canada: { currency: "CAD", amount: 3, symbol: "C$" },
  Mexico: { currency: "MXN", amount: 40, symbol: "MX$" },
  Brazil: { currency: "BRL", amount: 12, symbol: "R$" },
  Argentina: { currency: "ARS", amount: 2200, symbol: "AR$" },
  Chile: { currency: "CLP", amount: 1900, symbol: "CL$" },
  Colombia: { currency: "COP", amount: 8000, symbol: "CO$" },
  India: { currency: "INR", amount: 170, symbol: "₹" },
  Pakistan: { currency: "PKR", amount: 560, symbol: "₨" },
  Bangladesh: { currency: "BDT", amount: 240, symbol: "৳" },
  China: { currency: "CNY", amount: 15, symbol: "¥" },
  Japan: { currency: "JPY", amount: 300, symbol: "¥" },
  "South Korea": { currency: "KRW", amount: 2800, symbol: "₩" },
  Singapore: { currency: "SGD", amount: 3, symbol: "S$" },
  Malaysia: { currency: "MYR", amount: 9, symbol: "RM" },
  Indonesia: { currency: "IDR", amount: 32000, symbol: "Rp" },
  Philippines: { currency: "PHP", amount: 120, symbol: "₱" },
  Thailand: { currency: "THB", amount: 70, symbol: "฿" },
  "United Arab Emirates": { currency: "AED", amount: 8, symbol: "AED" },
  "Saudi Arabia": { currency: "SAR", amount: 8, symbol: "SAR" },
  Qatar: { currency: "QAR", amount: 8, symbol: "QAR" },
  Australia: { currency: "AUD", amount: 3, symbol: "A$" },
  "New Zealand": { currency: "NZD", amount: 3, symbol: "NZ$" },
};

export function getCountryCurrency(country?: string): CountryCurrency {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country] ?? DEFAULT_CURRENCY;
}

export function isKenya(country?: string): boolean {
  return country?.toLowerCase() === "kenya";
}

// ─── Referral Plans ───────────────────────────────────────────

export const REFERRAL_OPTIONS = [
  { referrals: 0, discountPct: 0, description: "Pay full price, unlock immediately." },
  { referrals: 1, discountPct: 17, description: "Invite 1 paying friend — save 17%." },
  { referrals: 2, discountPct: 44, description: "Invite 2 paying friends — save 44%." },
  { referrals: 5, discountPct: 61, description: "Invite 5 paying friends — save 61%." },
] as const;

export function getReferralAmount(baseAmount: number, referrals: 0 | 1 | 2 | 5): number {
  const map: Record<number, number> = {
    0: baseAmount,
    1: Math.round(baseAmount * 0.83),
    2: Math.round(baseAmount * 0.56),
    5: Math.round(baseAmount * 0.39),
  };
  return map[referrals] ?? baseAmount;
}

// ─── Referral Commission ───────────────────────────────────────
//
// The referrer earns whatever their referred user paid, above the
// platform's cut of the country's base (0-referral) price. For Kenya
// (base 180 KES) this cut works out to exactly 100 KES, matching:
//   - referred user pays 180 (full price) -> referrer earns 80
//   - referred user pays 149 (1-referral plan) -> referrer earns 49
// The ratio is kept generic so it scales to any country's base price.

export const REFERRAL_PLATFORM_FEE_RATIO = 100 / 180;

export function getBaseAmountForCurrency(currency: string): number {
  const entry = Object.values(COUNTRY_CURRENCY).find(
    (c) => c.currency === currency,
  );
  return entry?.amount ?? DEFAULT_CURRENCY.amount;
}

export function getReferralCommission(
  paidAmount: number,
  currency: string,
): number {
  const baseAmount = getBaseAmountForCurrency(currency);
  const platformFee = Math.round(baseAmount * REFERRAL_PLATFORM_FEE_RATIO);
  return Math.max(paidAmount - platformFee, 0);
}

// ─── Goals ───────────────────────────────────────────────────

export const GOALS = [
  { value: "meet_people", label: "Meet New People" },
  { value: "make_friends", label: "Make Friends Abroad" },
  { value: "life_partner", label: "Find a Life Partner" },
  { value: "learn_languages", label: "Learn Languages" },
  { value: "teach_languages", label: "Teach Languages" },
  { value: "remote_work", label: "Remote Work" },
  { value: "ai_tasks", label: "AI Tasks" },
  { value: "travel_partners", label: "Travel Partners" },
  { value: "cultural_exchange", label: "Cultural Exchange" },
  { value: "all", label: "All of the Above" },
] as const;

// ─── Genders ─────────────────────────────────────────────────

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / Non-binary" },
];

export const INTERESTED_IN = [
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
  { value: "everyone", label: "Everyone" },
];

// ─── Languages ───────────────────────────────────────────────

export const LANGUAGES = [
  "English", "Swahili", "French", "German", "Spanish", "Italian",
  "Portuguese", "Dutch", "Norwegian", "Swedish", "Danish", "Finnish",
  "Arabic", "Chinese", "Japanese", "Korean", "Hindi", "Urdu",
];

// ─── Interests ───────────────────────────────────────────────

export const INTEREST_TAGS = [
  "Travel", "Music", "Fitness", "Photography", "Reading", "Movies",
  "Cooking", "Technology", "Nature", "Business", "Gaming", "Art",
  "Fashion", "Sports", "Dancing", "Hiking", "Yoga", "Meditation",
  "Entrepreneurship", "Languages", "Food", "Pets", "Volunteering",
];

// ─── Opportunity Categories ───────────────────────────────────

export const OPPORTUNITY_CATEGORIES = [
  { value: "remote-work", label: "Remote Work", icon: "💼" },
  { value: "ai-training", label: "AI Training Tasks", icon: "🤖" },
  { value: "freelancing", label: "Freelancing", icon: "🚀" },
  { value: "language-exchange", label: "Language Exchange", icon: "🗣️" },
  { value: "travel-partner", label: "Travel Partner", icon: "✈️" },
  { value: "cultural-exchange", label: "Cultural Exchange", icon: "🌍" },
] as const;

// ─── Navigation ───────────────────────────────────────────────

export const DASHBOARD_NAV = [
  { title: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { title: "Discover", href: ROUTES.DISCOVER, icon: "Compass" },
  { title: "Messages", href: ROUTES.MESSAGES, icon: "MessageCircle" },
  { title: "Opportunities", href: ROUTES.OPPORTUNITIES, icon: "Briefcase" },
  { title: "Profile", href: ROUTES.PROFILE, icon: "User" },
  { title: "Membership", href: ROUTES.SUBSCRIPTION, icon: "Crown" },
  { title: "Referrals", href: ROUTES.REFERRALS, icon: "Gift" },
  { title: "Notifications", href: ROUTES.NOTIFICATIONS, icon: "Bell" },
  { title: "Settings", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;

// ─── Firebase Error Messages ──────────────────────────────────

export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered. Please log in.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/user-disabled": "This account has been disabled. Contact support.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}
