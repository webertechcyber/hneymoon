///workspaces/HoneyMoon-Firbase/client/src/types/user.ts

import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;

  email: string;

  displayName: string;

  firstName: string;

  lastName: string;

  country: string;

  phoneNumber?: string;

  city: string;

  bio: string;

  photos: string[];

  interests: string[];

  admin: boolean;

  isAi: boolean;

  verified: boolean;

  active: boolean;

  online: boolean;

  profileCompleted: boolean;
  ambassador: boolean;
  lastReferralRefresh?: Date;
  paidReferrals: number;
  availableReferrals: number;
  paymentReference: "",
  referralChoice: "",



  // ----------------------------------
  // Referral
  // ----------------------------------

  referralCode: string;

  referredBy?: string;

  referralLink: string;

  referralCount: number;

  /**
   * Referral plans already unlocked.
   * Example:
   * [0]
   * [0,1]
   * [0,1,2]
   * [0,1,2,5]
   */
  unlockedReferralPlans: (0 | 1 | 2 | 5)[];

  // ----------------------------------
  // Ambassador Wallet
  // ----------------------------------

  walletBalance: number;

  totalReferralEarnings?: number;

  lifetimeEarnings?: number;

  /**
   * Per-currency wallet balances, e.g. { KES: 420, USD: 12 }.
   * walletBalance/totalReferralEarnings/lifetimeEarnings above are kept
   * in sync with the KES bucket for backward compatibility with existing
   * UI (all current customers are Kenyan and paid in KES). Any other
   * currency is tracked only here until that currency has real volume.
   */
  walletBalances?: Record<string, number>;

  lifetimeEarningsByCurrency?: Record<string, number>;

  pendingBalance: number;

  totalEarned: number;

  totalWithdrawn: number;
  

  // ----------------------------------

  createdAt: Timestamp;

  updatedAt: Timestamp;
  subscriptionStatus?: "inactive" | "active";

}
