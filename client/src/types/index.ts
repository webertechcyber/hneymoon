// ============================================================
// HONEYMOON — TypeScript Models & Types
// The world's relationship and opportunity platform
// ============================================================

import { Timestamp } from "firebase/firestore";

// ─── User & Profile ──────────────────────────────────────────

export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled" | "suspended";
export type UserRole = "user" | "admin";
export type Gender = "male" | "female" | "other";
export type InterestedIn = "male" | "female" | "everyone";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  photos?: string[];
  gender?: Gender;
  interestedIn?: InterestedIn;
  age?: number;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  occupation?: string;
  bio?: string;
  languages?: string[];
  interests?: string[];
  goals?: string[];
  lookingFor?: string;
  // Subscription
  subscriptionStatus: SubscriptionStatus;
  subscriptionActivatedAt?: Timestamp | null;
  subscriptionExpiresAt?: Timestamp | null;
  // Referral
  referralCode?: string;
  referralLink?: string;
  referralChoice?: number; // 0=pay, 1=refer1, 2=refer2, 5=refer5
  referralCount?: number;
  referredBy?: string;
  amountDue?: number;
  currency?: string;
  // Wallet
  walletBalance?: number;
  totalReferralEarnings?: number;
  lifetimeEarnings?: number;
  paidReferralCount?: number;
  walletBalances?: Record<string, number>;
  lifetimeEarningsByCurrency?: Record<string, number>;
  // Payment
  paymentMethod?: string;
  // Admin
  admin?: boolean;
  role?: UserRole;
  // Meta
  profileComplete?: boolean;
  isAi?: boolean;
  emailVerified?: boolean;
  online?: boolean;
  lastSeen?: Timestamp | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export const emptyProfile: UserProfile = {
  uid: "",
  email: "",
  displayName: "",
  subscriptionStatus: "pending",
};

// ─── Auth ────────────────────────────────────────────────────

export interface RegisterData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  goal: string;
  terms: boolean;
  referredBy?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// ─── Discover / Matching ─────────────────────────────────────

export interface DiscoverProfile {
  id: string;
  displayName: string;
  firstName?: string;
  age?: number;
  city?: string;
  country?: string;
  bio?: string;
  photoURL?: string;
  photos?: string[];
  online?: boolean;
  verified?: boolean;
  interests?: string[];
  occupation?: string;
  isAI?: boolean;
}

export interface Match {
  id: string;
  users: string[];
  createdAt: Timestamp | null;
  conversationId?: string;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Timestamp | null;
}

// ─── Messaging ───────────────────────────────────────────────

export interface Conversation {
  id: string;
  users: string[];
  userProfiles?: Record<string, { displayName: string; photoURL?: string }>;
  lastMessage?: string;
  lastMessageAt?: Timestamp | null;
  unreadCount?: Record<string, number>;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  read: boolean;
  mine?: boolean;
  time?: string;
  createdAt?: Timestamp | null;
}

// ─── Notifications ───────────────────────────────────────────

export type NotificationType =
  | "match"
  | "message"
  | "like"
  | "referral_joined"
  | "referral_paid"
  | "subscription_activated"
  | "system";

export interface AppNotification {
  id: string;
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, string>;
  createdAt: Timestamp | null;
}

// ─── Subscription & Payments ─────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  title: string;
  referralChoice: 0 | 1 | 2 | 5;
  amount: number;
  currency: string;
  description: string;
  badge?: string;
}

export interface Payment {
  id: string;
  uid: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "completed" | "failed";
  reference?: string;
  createdAt: Timestamp | null;
}

// ─── Referrals ───────────────────────────────────────────────

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredEmail: string;
  referredName?: string;
  paid: boolean;
  createdAt: Timestamp | null;
}

// ─── AI Profiles ─────────────────────────────────────────────

export interface AIProfile {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  interestedIn: InterestedIn;
  age: number;
  city: string;
  country: string;
  occupation: string;
  bio: string;
  interests: string[];
  languages?: string[];
  photos: string[];
  online: boolean;
  verified: boolean;
  isAi?: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// ─── Opportunities ───────────────────────────────────────────

export type OpportunityCategory =
  | "remote-work"
  | "ai-training"
  | "freelancing"
  | "language-exchange"
  | "travel-partner"
  | "cultural-exchange";

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  postedBy: string;
  postedByName?: string;
  postedByPhoto?: string;
  country?: string;
  remote?: boolean;
  budget?: string;
  currency?: string;
  skills?: string[];
  languages?: string[];
  applicants?: number;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// ─── Admin ───────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  totalRevenue: number;
  totalReferrals: number;
  totalMatches: number;
  totalMessages: number;
  newUsersToday: number;
}

export interface Report {
  id: string;
  reportedBy: string;
  reportedUser: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: Timestamp | null;
}
