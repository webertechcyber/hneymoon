///workspaces/HoneyMoon-Firbase/client/src/types/payment.ts

import { Timestamp } from "firebase/firestore";

export type PaymentStatus =
  | "created"
  | "processing"
  | "verified"
  | "completed"
  | "failed"
  | "cancelled"
  | "pending"
  | "paid";

export type PaymentProvider =
  | "nestlink"
  | "intasend";

export type PaymentMethod =
  | "mpesa"
  | "card"
  | "bank"
  | "wallet";

export type PaymentType =
  | "subscription"
  | "subscription_upgrade"
  | "withdrawal_fee"
  | "premium_feature";

export interface Payment {

  id: string;

  userId: string;

  paymentType: PaymentType;

  subscriptionPlan: 0 | 1 | 2 | 5;

  amount: number;

  currency: string;

  provider: PaymentProvider;

  method: PaymentMethod;

  reference: string;

  externalReference?: string;

  providerReference?: string;

  checkoutUrl?: string;

  status: PaymentStatus;

  metadata?: Record<string, unknown>;

  createdAt: Date;

  updatedAt: Date;

  completedAt?: Date;

  paidAt?: Date;

}