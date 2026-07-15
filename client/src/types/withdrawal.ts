import { Timestamp } from "firebase/firestore";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "paid"
  | "rejected";

export interface Withdrawal {

  id: string;

  userId: string;

  amount: number;

  currency: string;

  paymentMethod:
    | "mpesa"
    | "bank";

  destination: string;

  status: WithdrawalStatus;

  adminNote?: string;

  paidReference?: string;

  createdAt: Date;

  updatedAt: Date;

  paidAt?: Date;

}