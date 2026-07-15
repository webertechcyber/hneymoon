///workspaces/HoneyMoon-Firbase/client/src/types/subscription.ts
import { Timestamp } from "firebase/firestore";

export type SubscriptionStatus =
  | "inactive"
  | "pending"
  | "active"
  | "expired";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed";

export type PaymentProvider =
  | "nestlink"
  | "intasend";

export interface Subscription {

  id: string;

  userId: string;

  status: SubscriptionStatus;

  /**
   * Current selected referral plan.
   */
   selectedReferralChoice: 0 | 1 | 2 | 5;

  /**
   * Amount user should pay.
   */
  amountDue: number;

  currency: string;

  paymentStatus: PaymentStatus;

  paymentProvider: PaymentProvider;

  paymentReference?: string;
  paymentCompleted: boolean;
  paymentId?: string;

  activatedAt?: Timestamp;
  unlockedAt?: Date;

  expiresAt?: Timestamp;

  createdAt: Timestamp;

  updatedAt: Timestamp;
  
}