import { Timestamp } from "firebase/firestore";

export type EarningStatus =
  | "available"
  | "pending"
  | "withdrawn";

export type EarningType =
  | "referral_commission"
  | "bonus"
  | "reward";

export interface Earning {

  id: string;

  referrerId: string;

  referredUserId: string;

  referralId: string;

  paymentId: string;

  type: EarningType;

  percentage: number;

  amount: number;

  currency: string;

  status: EarningStatus;

  createdAt: Date;

  updatedAt: Date;

}