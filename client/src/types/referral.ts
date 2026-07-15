///workspaces/HoneyMoon-Firbase/client/src/types/referral.ts

import { Timestamp } from "firebase/firestore";

export type ReferralStatus =
  | "pending_signup"
  | "email_verified"
  | "subscription_selected"
  | "payment_pending"
  | "payment_completed"
  | "reward_unlocked";

export interface ReferralActivity {

  type: ReferralStatus;

  createdAt: Timestamp;

  performedBy: string;

  metadata?: Record<string, unknown>;
}

export interface Referral {

  id: string;

  referrerId: string;

  referredUserId: string;

  status: ReferralStatus;

  activity: ReferralActivity[];

  /**
   * Prevent duplicate commissions.
   */
  commissionCreated: boolean;

  /**
   * Future proof.
   */
  commissionPercentage: number;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}