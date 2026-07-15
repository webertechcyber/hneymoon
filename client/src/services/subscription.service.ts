//client/src/services/subscription.service.ts
// ============================================================
// HONEYMOON — Subscription Service
// Part 1
// Foundation
// ============================================================

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { Subscription } from "@/types/subscription";
import type { UserProfile } from "@/types/user";

import {
  getCountryCurrency,
  getReferralAmount,
} from "@/lib/constants";

export interface SubscriptionState {

  subscription: Subscription;

  paidReferrals: number;

  referralsNeeded: number;

  referralsRemaining: number;

  goalReached: boolean;

  paymentCompleted: boolean;

  dashboardUnlocked: boolean;

  availablePlans: Array<0 | 1 | 2 | 5>;

}

export class SubscriptionService {

  // ==========================================================
  // Collections
  // ==========================================================

  private subscriptionsCollection =
    collection(db, "subscriptions");

  private usersCollection =
    collection(db, "users");

  private referralsCollection =
    collection(db, "referrals");

  // ==========================================================
  // Helpers
  // ==========================================================

  calculateAmount(

    country: string,

    referralChoice: 0 | 1 | 2 | 5,

  ) {

    const currency = getCountryCurrency(country);

    return getReferralAmount(

      currency.amount,

      referralChoice,

    );

  }

  // ==========================================================
  // Get User
  // ==========================================================

  async getUser(

    userId: string,

  ): Promise<UserProfile | null> {

    const ref = doc(

      this.usersCollection,

      userId,

    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      return null;

    }

    const data = snap.data() as UserProfile;

    return {

      ...data,

      uid: snap.id,

    };

  }

  // ==========================================================
  // Get Subscription
  // ==========================================================

  async getSubscription(

    userId: string,

  ): Promise<Subscription | null> {

    const q = query(

      this.subscriptionsCollection,

      where("userId", "==", userId),

    );

    const snap = await getDocs(q);

    if (snap.empty) {

      return null;

    }

    const data = snap.docs[0].data() as Subscription;

    return {

      ...data,

      id: snap.docs[0].id,

    };

  }

  private getReferralChoice(subscription: Subscription): 0 | 1 | 2 | 5 {
    //console.log("Getting referral choice for subscription:", subscription.id);

    return subscription.selectedReferralChoice;
  }

  // ==========================================================
  // Create Subscription
  // ==========================================================

  async createSubscription(

    userId: string,

    referralChoice: 0 | 1 | 2 | 5,
    

  ): Promise<Subscription> {
    //console.log("Creating subscription for:", userId);

    const user = await this.getUser(userId);

    if (!user) {
     console.log("Looking for user:", userId);

const ref = doc(this.usersCollection, userId);
const snap = await getDoc(ref);

console.log("Exists?", snap.exists());

      throw new Error("User not found.");

    }

    //
    // Prevent duplicates
    //

    const existing = await this.getSubscription(

      userId,

    );

    if (existing) {

      return existing;

    }

    const currencyConfig = getCountryCurrency(user.country);

    const amountDue = this.calculateAmount(

      user.country,

      referralChoice,

    );

    const subscription: Omit<Subscription, "id"> = {

      userId,

      status: "inactive",

     selectedReferralChoice: referralChoice,

      amountDue,

      currency: currencyConfig.currency,

      paymentStatus: "unpaid",

      paymentProvider: "intasend",
      paymentCompleted: false,
    
/*
      paymentId: null,

      activatedAt: undefined,

      expiresAt: undefined,
      */

      createdAt: serverTimestamp() as unknown as Subscription["createdAt"],

      updatedAt: serverTimestamp() as unknown as Subscription["updatedAt"],

    };

    const ref = await addDoc(

      this.subscriptionsCollection,

      {

        ...subscription,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

      },

    );

    return {

      id: ref.id,

      ...subscription,

    };

  }
  // ==========================================================
// Process Referral After Successful Payment
// ==========================================================

async processReferral(
  referredUserId: string,
): Promise<void> {

  await this.refreshReferralProgress(referredUserId);

  await this.unlockSubscriptionIfEligible(
    referredUserId,
  );

}

  // ==========================================================
  // Update Referral Choice
  // ==========================================================

  async updateReferralChoice(

    userId: string,

    referralChoice: 0 | 1 | 2 | 5,

  ) {

    const subscription = await this.getSubscription(

      userId,

    );

    if (!subscription) {

      throw new Error("Subscription not found.");

    }

    const user = await this.getUser(userId);

    if (!user) {

      throw new Error("User not found.");

    }

    const amountDue = this.calculateAmount(

      user.country,

      referralChoice,

    );

    await updateDoc(

      doc(

        this.subscriptionsCollection,

        subscription.id,

      ),

      {
  selectedReferralChoice: referralChoice,
  amountDue,
  updatedAt: serverTimestamp(),
}

    );

  }

  // ==========================================================
  // Delete Pending Subscription
  // (Used when user wants a fresh subscription)
  // ==========================================================

  async resetSubscription(

    userId: string,

  ) {

    const subscription = await this.getSubscription(

      userId,

    );

    if (!subscription) {

      return;

    }

    if (

      subscription.status === "active"

    ) {

      throw new Error(

        "Active subscriptions cannot be reset.",

      );

    }

    await updateDoc(

      doc(

        this.subscriptionsCollection,

        subscription.id,

      ),

      {

        selectedReferralChoice: 0,

        amountDue: this.calculateAmount(

          (await this.getUser(userId))?.country ?? "",

          0,

        ),

        paymentCompleted: false,

        paymentId: null,

        status: "inactive",

        updatedAt: serverTimestamp(),

      },

    );

  }



    // ==========================================================
    // PART 2
  // Referral Progress & Plan Unlock Logic
  // ==========================================================

  // ==========================================================
  // Count Paid Referrals
  // ==========================================================

  async getPaidReferralCount(

    userId: string,

  ): Promise<number> {

    const q = query(

      this.referralsCollection,

      where("referrerId", "==", userId),

      where("status", "==", "payment_completed"),

    );

    const snap = await getDocs(q);

    return snap.size;

  }

  // ==========================================================
  // Refresh Referral Progress
  // (Called after refresh/login/payment)
  // ==========================================================

  async refreshReferralProgress(

    userId: string,

  ): Promise<number> {

    const paidCount =
      await this.getPaidReferralCount(userId);

    await updateDoc(

      doc(this.usersCollection, userId),

      {

        paidReferralCount: paidCount,

        referralCount: paidCount,

        updatedAt: serverTimestamp(),

      },

    );

    return paidCount;

  }

  // ==========================================================
  // Determine Which Plans Are Unlocked
  // ==========================================================

  async getUnlockedPlans(

    userId: string,

  ): Promise<Array<0 | 1 | 2 | 5>> {

    const paid =
      await this.refreshReferralProgress(userId);

    const plans: Array<0 | 1 | 2 | 5> = [0];

    if (paid >= 1) {

      plans.push(1);

    }

    if (paid >= 2) {

      plans.push(2);

    }

    if (paid >= 5) {

      plans.push(5);

    }

    return plans;

  }

  // ==========================================================
  // Can User Purchase This Plan?
  // ==========================================================

  async canPurchaseDiscountPlan(

    userId: string,

    referralChoice: 0 | 1 | 2 | 5,

  ): Promise<boolean> {

    if (referralChoice === 0) {

      return true;

    }

    const unlocked =
      await this.getUnlockedPlans(userId);

    return unlocked.includes(referralChoice);

  }

  // ==========================================================
  // Change Subscription Plan
  // ==========================================================

  async changePlan(

    userId: string,

    referralChoice: 0 | 1 | 2 | 5,

  ) {

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      throw new Error(

        "Subscription not found.",

      );

    }

    //
    // Active members cannot downgrade/upgrade
    //

    if (

      subscription.status === "active"

    ) {

      throw new Error(

        "Subscription already active.",

      );

    }

    const allowed =
      await this.canPurchaseDiscountPlan(

        userId,

        referralChoice,

      );

    if (!allowed) {

      throw new Error(

        "Referral goal not yet reached for this discounted plan.",

      );

    }

    const user =
      await this.getUser(userId);

    if (!user) {

      throw new Error(

        "User not found.",

      );

    }

    const amountDue =
      this.calculateAmount(

        user.country,

        referralChoice,

      );

    await updateDoc(

      doc(

        this.subscriptionsCollection,

        subscription.id,

      ),

      {

        selectedReferralChoice: referralChoice,

        amountDue,

        updatedAt: serverTimestamp(),

      },

    );

  }

  // ==========================================================
  // Build Subscription State
  // Used by Subscription Page
  // ==========================================================

  async getSubscriptionState(

    userId: string,

  ): Promise<SubscriptionState> {

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      throw new Error(

        "Subscription missing.",

      );

    }

    const paid =
      await this.refreshReferralProgress(userId);

    const unlocked =
      await this.getUnlockedPlans(userId);

    const needed = this.getReferralChoice(subscription);

    const remaining =
      Math.max(

        0,

        needed - paid,

      );

    return {

      subscription,

      paidReferrals: paid,

      referralsNeeded: needed,

      referralsRemaining: remaining,

      goalReached:

        paid >= needed,

      paymentCompleted:

        subscription.paymentCompleted,

      dashboardUnlocked:

        subscription.status === "active",

      availablePlans:

        unlocked,

    };

  }
  // ==========================================================
  // PART 3
  // Unlock & Activation Engine
  // ==========================================================

  // ==========================================================
  // Is Referral Goal Reached?
  // ==========================================================

  async hasReachedReferralGoal(

    userId: string,

  ): Promise<boolean> {

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      return false;

    }

    if (this.getReferralChoice(subscription) === 0) {

      return true;

    }

    const paid =
      await this.refreshReferralProgress(userId);

    return paid >= this.getReferralChoice(subscription);

  }

  // ==========================================================
  // Is Dashboard Accessible?
  // ==========================================================

  async canAccessDashboard(

    userId: string,

  ): Promise<boolean> {

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      return false;

    }

    return subscription.status === "active";

  }

  // ==========================================================
  // Unlock Plan After Referral Progress
  // ==========================================================

  async unlockEligiblePlans(

    userId: string,

  ) {

    const paid =
      await this.refreshReferralProgress(userId);

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      return;

    }

    if (

      paid < this.getReferralChoice(subscription)

    ) {

      return;

    }

    await updateDoc(

      doc(

        this.subscriptionsCollection,

        subscription.id,

      ),

      {

        referralGoalReached: true,

        updatedAt: serverTimestamp(),

      },

    );

  }

  // ==========================================================
  // Auto Activate
  // Payment already made
  // Referral goal reached
  // ==========================================================

  async autoActivateIfEligible(

    userId: string,

  ) {

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      return false;

    }

    //
    // Already active
    //

    if (

      subscription.status === "active"

    ) {

      return true;

    }

    //
    // Payment missing
    //

    if (

      !subscription.paymentCompleted

    ) {

      return false;

    }

    //
    // Goal missing
    //

    const reached =
      await this.hasReachedReferralGoal(

        userId,

      );

    if (!reached) {

      return false;

    }

    await updateDoc(

      doc(

        this.subscriptionsCollection,

        subscription.id,

      ),

      {

        status: "active",

        activatedAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

      },

    );

    await updateDoc(

      doc(

        this.usersCollection,

        userId,

      ),

      {

        subscriptionStatus: "active",

        paymentStatus: "paid",

        subscriptionStart: serverTimestamp(),

        updatedAt: serverTimestamp(),

      },

    );

    return true;

  }

  // ==========================================================
  // Refresh Entire Subscription State
  // Called on Login
  // Called on Refresh
  // Called after Referral Payment
  // ==========================================================

  async refreshSubscriptionState(

    userId: string,

  ): Promise<SubscriptionState> {

    await this.refreshReferralProgress(

      userId,

    );

    await this.unlockEligiblePlans(

      userId,

    );

    await this.autoActivateIfEligible(

      userId,

    );

    return this.getSubscriptionState(

      userId,

    );

  }

  // ==========================================================
  // Pending Payment?
  // ==========================================================

  async hasPendingPayment(

    userId: string,

  ): Promise<boolean> {

    const subscription =
      await this.getSubscription(userId);

    if (!subscription) {

      return false;

    }

    return (

      subscription.paymentCompleted &&

      subscription.status !== "active"

    );

  }

  // ==========================================================
  // Should Show Locked Dashboard?
  // ==========================================================

  async shouldLockDashboard(

    userId: string,

  ): Promise<boolean> {

    const allowed =
      await this.canAccessDashboard(

        userId,

      );

    return !allowed;

  }

  // ==========================================================
  // Dashboard Lock Message
  // ==========================================================

  async getDashboardLockReason(

    userId: string,

  ): Promise<string> {

    const subscription =
      await this.getSubscription(

        userId,

      );

    if (!subscription) {

      return "No subscription found.";

    }

    if (

      !subscription.paymentCompleted

    ) {

      return "Complete your membership payment to unlock HoneyMoon.";

    }

    if (

      this.getReferralChoice(subscription) === 0

    ) {

      return "Activating your membership...";

    }

    const paid =
      await this.refreshReferralProgress(

        userId,

      );

    if (

      paid < this.getReferralChoice(subscription)

    ) {

      return `Referral goal not reached. ${paid}/${this.getReferralChoice(subscription)} paying referrals completed.`;

    }

    return "Activating your membership...";

  }
  // ======================================================
  // Unlock Pending Referral Subscription
  // ======================================================

  private async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.getSubscription(userId);
  }

  async unlockSubscriptionIfEligible(
    userId: string,
  ): Promise<boolean> {

    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return false;
    }

    if (subscription.status === "active") {
      return true;
    }

    if (!subscription.paymentCompleted) {
      return false;
    }

    const paidCount = await this.getPaidReferralCount(userId);

    if (paidCount < this.getReferralChoice(subscription)) {
      return false;
    }

    await updateDoc(
      doc(db, "subscriptions", subscription.id),
      {
        status: "active",
        activatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );

    await updateDoc(
      doc(db, "users", userId),
      {
        subscriptionStatus: "active",
        updatedAt: serverTimestamp(),
      },
    );

    return true;
  }

  //
  // Refresh Subscription State
  //

  async refreshSubscription(
    userId: string,
  ) {

    await this.refreshReferralProgress(userId);

    await this.unlockSubscriptionIfEligible(
      userId,
    );

    return this.getUserSubscription(userId);
  }

  //
  // Can Change Referral Plan?
  //

  canChangePlan(
    subscription: Subscription,
  ) {

    if (subscription.status === "active") {
      return false;
    }

    return true;
  }

  //
  // Change Referral Plan
  //

  async changeReferralPlan(
    userId: string,
    referralChoice: 0 | 1 | 2 | 5,
  ) {

    const subscription =
      await this.getUserSubscription(userId);

    if (!subscription) {
      throw new Error("Subscription not found.");
    }

    if (!this.canChangePlan(subscription)) {
      throw new Error(
        "Active subscriptions cannot be changed.",
      );
    }

    const user = await this.getUser(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const currency =
      getCountryCurrency(user.country);

    const amount =
      getReferralAmount(
        currency.amount,
        referralChoice,
      );

    await updateDoc(
      doc(db, "subscriptions", subscription.id),
      {
  selectedReferralChoice: referralChoice,
        amountDue: amount,
        paymentCompleted: false,
        paymentId: null,
        status: "inactive",
        updatedAt: serverTimestamp(),
      },
    );

    await updateDoc(
  doc(db, "users", user.uid),
  {
    referralChoice: referralChoice,
    amountDue: amount,
    updatedAt: serverTimestamp(),
  },
);

    return this.getUserSubscription(userId);
  }

  //
  // Is Current Plan Unlockable?
  //

  async canUnlockCurrentPlan(
    userId: string,
  ) {

    const subscription =
      await this.getUserSubscription(userId);

    if (!subscription) {
      return false;
    }

    const paid =
      await this.getPaidReferralCount(userId);

    return paid >= this.getReferralChoice(subscription);
  }

  //
  // Remaining Referrals
  //

  async remainingReferrals(
    userId: string,
  ) {

    const subscription =
      await this.getUserSubscription(userId);

    if (!subscription) {
      return 0;
    }

    const paid =
      await this.getPaidReferralCount(userId);

    return Math.max(
      this.getReferralChoice(subscription) - paid,
      0,
    );
  }

  //
  // Progress Percentage
  //

  async progressPercentage(
    userId: string,
  ) {

    const subscription =
      await this.getUserSubscription(userId);

    if (!subscription) {
      return 0;
    }

    if (this.getReferralChoice(subscription) === 0) {
      return 100;
    }

    const paid =
      await this.getPaidReferralCount(userId);

    return Math.min(
      100,
      Math.round(
        (paid / this.getReferralChoice(subscription)) * 100,
      ),
    );
  }

  //
  // Dashboard Access
  //

  //
  // Should Redirect To Subscription?
  //

  async requiresSubscription(
    userId: string,
  ) {

    const allowed =
      await this.canAccessDashboard(userId);

    return !allowed;
  }

  //
  // Membership Summary
  //

  async getMembershipSummary(
    userId: string,
  ) {

    const subscription =
      await this.getUserSubscription(userId);

    if (!subscription) {
      return null;
    }

    const paid =
      await this.getPaidReferralCount(userId);

    return {

      subscription,

      paidReferrals: paid,

      remaining: Math.max(
        this.getReferralChoice(subscription) - paid,
        0,
      ),

      percentage:
        this.getReferralChoice(subscription) === 0
          ? 100
          : Math.min(
              100,
              Math.round(
                (paid /
                  this.getReferralChoice(subscription)) *
                  100,
              ),
            ),

      unlocked:
      paid >= this.getReferralChoice(subscription),
    };
  }

  // ==========================================================
// Select Membership Plan
// ==========================================================

async selectPlan(
  userId: string,
  referralChoice: 0 | 1 | 2 | 5,
): Promise<Subscription> {

  let subscription = await this.getSubscription(userId);

  if (!subscription) {
    return this.createSubscription(userId, referralChoice);
  }

  await this.changeReferralPlan(
    userId,
    referralChoice,
  );

  const updated = await this.getSubscription(userId);

  if (!updated) {
    throw new Error("Subscription not found.");
  }

  return updated;
}
private withdrawalsCollection =
  collection(db, "withdrawals");
async getAllWithdrawals() {
  const q = query(
    this.withdrawalsCollection,
    orderBy("requestedAt", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
async approveWithdrawal(
  withdrawalId: string,
) {
  await updateDoc(
    doc(this.withdrawalsCollection, withdrawalId),
    {
      status: "approved",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}
async declineWithdrawal(
  withdrawalId: string,
  reason: string,
) {
  await updateDoc(
    doc(this.withdrawalsCollection, withdrawalId),
    {
      status: "rejected",
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    },
  );
}
async processWithdrawal(
  withdrawalId: string,
) {
  await updateDoc(
    doc(this.withdrawalsCollection, withdrawalId),
    {
      status: "processed",
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}
async getReferralStats(userId: string) {

  const subscription = await this.getSubscription(userId);

  const paid = await this.getPaidReferralCount(userId);

  const total = subscription
    ? subscription.selectedReferralChoice
    : 0;

  return {
    subscription,
    total,
    paid,
    pending: Math.max(total - paid, 0),
  };

}

}

export const subscriptionService =
  new SubscriptionService();

  export const getAllWithdrawals = () =>
  subscriptionService.getAllWithdrawals();

export const approveWithdrawal = (
  id: string,
) => subscriptionService.approveWithdrawal(id);

export const declineWithdrawal = (
  id: string,
  reason: string,
) => subscriptionService.declineWithdrawal(id, reason);

export const processWithdrawal = (
  id: string,
) => subscriptionService.processWithdrawal(id);

export const getReferralStats = (
  userId: string,
) => subscriptionService.getReferralStats(userId);
