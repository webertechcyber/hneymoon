// ============================================================
// HONEYMOON
// Referral Service
// Part 1
// ============================================================

// ============================================================
// HONEYMOON — Referral Service
// Part 1
// Foundation & CRUD
// ============================================================

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { ReferralStatus } from "@/types/referral";
import type { Earning } from "@/types/earning";

import type { UserProfile } from "@/types/user";
import {
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { subscriptionService } from "./subscription.service";

interface ReferralActivity {
  status: ReferralStatus;
  note?: string;
  createdAt: Timestamp;
}

interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode?: string;
  referralLink?: string;
  status: ReferralStatus;
  activities: ReferralActivity[];
  paymentId?: string;
  paymentCompletedAt?: Timestamp;
  rewardUnlockedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ReferralProgress {
  paid: number;
  total: number;
  remaining: number;
  percentage: number;
  pendingSignup: number;
  emailVerified: number;
  subscriptionSelected: number;
  paymentPending: number;
  paymentCompleted: number;
  rewardsUnlocked: number;
  pending: number;
  completed: number;
  goalReached: boolean;
}
export class ReferralService {

  // ============================================================
  // Collections
  // ============================================================

  private referralsCollection = collection(db, "referrals");

  private usersCollection = collection(db, "users");

  // ============================================================
  // Generate Referral Code
  // ============================================================

  generateReferralCode(userId: string): string {

    return (
      userId.substring(0, 6).toUpperCase() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()
    );

  }

  // ============================================================
  // Generate Referral Link
  // ============================================================

  generateReferralLink(code: string, uid?: string): string {

    const base = `https://honeymoon.kuomoka.co.ke/register?ref=${code}`;

    return uid ? `${base}&ref_uid=${uid}` : base;

  }

  // ============================================================
  // Get User
  // ============================================================

  async getUser(userId: string): Promise<UserProfile | null> {

    const snap = await getDoc(
      doc(this.usersCollection, userId)
    );

    if (!snap.exists()) {

      return null;

    }

    return {
      ...(snap.data() as UserProfile),
      uid: snap.id,
    };

  }

  // ============================================================
  // Resolve Referrer By UID (preferred — avoids a Firestore "list"
  // query, which many security rule sets don't allow for the users
  // collection even when a single-doc "get" is fine). Falls back to
  // validateReferralCode() only when no uid is available, e.g. an
  // old referral link that only encodes the code.
  // ============================================================

  async resolveReferrer(
    referrerUid?: string | null,
    referralCode?: string | null,
  ): Promise<UserProfile | null> {

    if (referrerUid) {

      const byUid = await this.getUser(referrerUid);

      // Integrity check: if a code was also supplied, it must match
      // the resolved user's own code.
      if (byUid && (!referralCode || byUid.referralCode === referralCode)) {

        return byUid;

      }

    }

    if (referralCode) {

      return this.validateReferralCode(referralCode);

    }

    return null;

  }

  // ============================================================
  // Validate Referral Code
  // ============================================================

  async validateReferralCode(
    code: string,
  ): Promise<UserProfile | null> {

    const q = query(
      this.usersCollection,
      where("referralCode", "==", code),
    );

    const snap = await getDocs(q);

    if (snap.empty) {

      return null;

    }

    return {
  ...(snap.docs[0].data() as UserProfile),
  uid: snap.docs[0].id,
};

  }

  // ============================================================
  // Create Initial Activity
  // ============================================================

  private createActivity(
    status: ReferralStatus,
    note?: string,
  ): ReferralActivity {

    return {

    status,

      note,

      createdAt: serverTimestamp() as any,

    };

  }

  // ============================================================
  // Create Referral
  // ============================================================

  async createReferral(

    referrerId: string,

    referredUserId: string,

  ): Promise<Referral> {

    //
    // prevent duplicates
    //

    const existing = query(

      this.referralsCollection,

      where("referrerId", "==", referrerId),

      where("referredUserId", "==", referredUserId),

    );

    const existingSnap = await getDocs(existing);

    if (!existingSnap.empty) {

      const existingData = existingSnap.docs[0].data() as Omit<Referral, "id">;

      return {

        ...existingData,
        id: existingSnap.docs[0].id,

      };

    }

    const referrer = await this.getUser(referrerId);

    if (!referrer) {

      throw new Error("Referrer not found.");

    }

    const referralCode =
      referrer.referralCode ??
      this.generateReferralCode(referrer.uid);

    const referral: Omit<Referral, "id"> = {

      referrerId,

      referredUserId,

      referralCode,

      referralLink: this.generateReferralLink(
        referralCode,
      ),

      status: "pending_signup",

      // NOTE: intentionally left empty on creation. Firestore rejects
      // serverTimestamp() when it's nested inside an array field on
      // document creation — this was previously breaking every
      // referral signup silently. Use appendActivity() (which uses
      // arrayUnion + Timestamp.now(), not serverTimestamp()) to add
      // activity entries after creation instead.
      activities: [],

      paymentCompletedAt: undefined,

      rewardUnlockedAt: undefined,

      createdAt: serverTimestamp() as any,
updatedAt: serverTimestamp() as any,

    };

    const docRef = await addDoc(

      this.referralsCollection,

      {

        ...referral,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

      },

    );

    return {

      id: docRef.id,

      ...referral,

    };

  }

  // ============================================================
  // Get Referral
  // ============================================================

  async getReferral(

    referralId: string,

  ): Promise<Referral | null> {

    const snap = await getDoc(

      doc(
        this.referralsCollection,
        referralId,
      ),

    );

    if (!snap.exists()) {

      return null;

    }

    return {
  ...(snap.data() as Referral),
  id: snap.id,
};

  }

  // ============================================================
  // Get Referrals By Referrer
  // ============================================================

  async getReferralsByReferrer(

    referrerId: string,

  ): Promise<Referral[]> {

    const q = query(

      this.referralsCollection,

      where(
        "referrerId",
        "==",
        referrerId,
      ),

    );

    const snap = await getDocs(q);

    return snap.docs.map(docItem => {

      const data = docItem.data() as Omit<Referral, "id">;

      return {

        ...data,
        id: docItem.id,
      };

    });

  }

  // ============================================================
  // Get Referrals By Referred User
  // ============================================================

  async getReferralByReferredUser(

    userId: string,

  ): Promise<Referral | null> {

    const q = query(

      this.referralsCollection,

      where(
        "referredUserId",
        "==",
        userId,
      ),

    );

    const snap = await getDocs(q);

    if (snap.empty) {

      return null;

    }

    const data = snap.docs[0].data() as Omit<Referral, "id">;

    return {

      ...data,
      id: snap.docs[0].id,

    };

  }



// ============================================================
// Part 2
// Referral Lifecycle
// ============================================================



// ============================================================
// Append Activity
// ============================================================

private async appendActivity(

  referralId: string,

  status: ReferralStatus,

  note?: string,

) {

  const referralRef = doc(

    this.referralsCollection,

    referralId,

  );

  await updateDoc(referralRef, {

    status,

    updatedAt: serverTimestamp(),

    activities: arrayUnion({

      status,

      note,

      createdAt: Timestamp.now(),

    }),

  });

}


// ============================================================
// Email Verified
// ============================================================

async markEmailVerified(

  referredUserId: string,

) {

  const referral = await this.getReferralByReferredUser(

    referredUserId,

  );

  if (!referral) return;

  await this.appendActivity(

    referral.id,

    "email_verified",

    "Email verified.",

  );

}


// ============================================================
// Subscription Selected
// ============================================================

async markSubscriptionSelected(

  referredUserId: string,

  referralChoice: 0 | 1 | 2 | 5,

) {

  const referral = await this.getReferralByReferredUser(

    referredUserId,

  );

  if (!referral) return;

  await this.appendActivity(

    referral.id,

    "subscription_selected",

    `Selected ${referralChoice} referral plan.`,

  );

}


// ============================================================
// Payment Started
// ============================================================

async markPaymentPending(

  referredUserId: string,

) {

  const referral = await this.getReferralByReferredUser(

    referredUserId,

  );

  if (!referral) return;

  await this.appendActivity(

    referral.id,

    "payment_pending",

    "Payment initiated.",

  );

}


// ============================================================
// Payment Completed
// ============================================================

async markPaymentCompleted(

  referredUserId: string,

  paymentId: string,

) {

  const referral = await this.getReferralByReferredUser(

    referredUserId,

  );

  if (!referral) return;

  const referralRef = doc(

    this.referralsCollection,

    referral.id,

  );

  await updateDoc(referralRef, {

    status: "payment_completed",

    paymentId,

    paymentCompletedAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

    activities: arrayUnion({

      status: "payment_completed",

      note: "Membership payment completed.",

      createdAt: Timestamp.now(),

    }),

  });

}


// ============================================================
// Reward Unlocked
// ============================================================

async markRewardUnlocked(

  referralId: string,

) {

  const referralRef = doc(

    this.referralsCollection,

    referralId,

  );

  await updateDoc(referralRef, {

    status: "reward_unlocked",

    rewardUnlockedAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

    activities: arrayUnion({

      status: "reward_unlocked",

      note: "Referral reward unlocked.",

      createdAt: Timestamp.now(),

    }),

  });

}


// ============================================================
// Generic Status Update
// ============================================================

async updateReferralStatus(

  referralId: string,

  status: ReferralStatus,

  note?: string,

) {

  await this.appendActivity(

    referralId,

    status,

    note,

  );

}


// ============================================================
// Referral Timeline
// ============================================================

async getReferralTimeline(

  referralId: string,

): Promise<ReferralActivity[]> {

  const referral = await this.getReferral(

    referralId,

  );

  if (!referral) {

    return [];

  }

  return [...referral.activities].sort(

    (a, b) =>

      (a.createdAt instanceof Timestamp
        ? a.createdAt.toDate().getTime()
        : 0) -
      (b.createdAt instanceof Timestamp
        ? b.createdAt.toDate().getTime()
        : 0),

  );

}


// ============================================================
// Current Referral Status
// ============================================================

async getReferralStatus(

  referralId: string,

): Promise<ReferralStatus | null> {

  const referral = await this.getReferral(

    referralId,

  );

  if (!referral) {

    return null;

  }

  return referral.status;

}


// ============================================================
// Has Completed Payment
// ============================================================

async hasCompletedPayment(

  referredUserId: string,

): Promise<boolean> {

  const referral = await this.getReferralByReferredUser(

    referredUserId,

  );

  if (!referral) {

    return false;

  }

  return referral.status === "payment_completed" ||

         referral.status === "reward_unlocked";

}


// ============================================================
// Has Reward Been Unlocked
// ============================================================

async hasUnlockedReward(

  referralId: string,

): Promise<boolean> {

  const referral = await this.getReferral(

    referralId,

  );

  if (!referral) {

    return false;

  }

  return referral.status === "reward_unlocked";

}

// ============================================================
// Part 3
// Referral Progress Engine
// ============================================================

// ============================================================
// Get Referral Progress
// ============================================================

async getReferralProgress(

  userId: string,

): Promise<ReferralProgress> {

  const referrals = await this.getReferralsByReferrer(

    userId,

  );

  const pendingSignup = referrals.filter(

    r => r.status === "pending_signup",

  ).length;

  const emailVerified = referrals.filter(

    r =>
      r.status === "email_verified" ||
      r.status === "subscription_selected" ||
      r.status === "payment_pending" ||
      r.status === "payment_completed" ||
      r.status === "reward_unlocked",

  ).length;

  const subscriptionSelected = referrals.filter(

    r =>
      r.status === "subscription_selected" ||
      r.status === "payment_pending" ||
      r.status === "payment_completed" ||
      r.status === "reward_unlocked",

  ).length;

  const paymentPending = referrals.filter(

    r => r.status === "payment_pending",

  ).length;

  const paymentCompleted = referrals.filter(

    r =>
      r.status === "payment_completed" ||
      r.status === "reward_unlocked",

  ).length;

  const rewardsUnlocked = referrals.filter(

    r => r.status === "reward_unlocked",

  ).length;

  const pending = referrals.filter(

    r =>
      r.status !== "payment_completed" &&
      r.status !== "reward_unlocked",

  ).length;

  const completed = referrals.filter(

    r =>
      r.status === "payment_completed" ||
      r.status === "reward_unlocked",

  ).length;

  return {

    paid: paymentCompleted,
    total: referrals.length,
    remaining: Math.max(referrals.length - paymentCompleted, 0),
    percentage:
      referrals.length === 0
        ? 0
        : Math.min((paymentCompleted / referrals.length) * 100, 100),
    pendingSignup,
    emailVerified,
    subscriptionSelected,
    paymentPending,
    paymentCompleted,
    rewardsUnlocked,
    pending,
    completed,
    goalReached: rewardsUnlocked > 0,

  };

}


// ============================================================
// Paid Referral Count
// ============================================================

async getPaidReferralCount(

  userId: string,

): Promise<number> {

  const progress = await this.getReferralProgress(

    userId,

  );

  return progress.paymentCompleted;

}


// ============================================================
// Pending Referral Count
// ============================================================

async getPendingReferralCount(

  userId: string,

): Promise<number> {

  const progress = await this.getReferralProgress(

    userId,

  );

  return progress.paymentPending;

}


// ============================================================
// Email Verified Count
// ============================================================

async getVerifiedReferralCount(

  userId: string,

): Promise<number> {

  const progress = await this.getReferralProgress(

    userId,

  );

  return progress.emailVerified;

}


// ============================================================
// Completed Referrals
// ============================================================

async getCompletedReferrals(

  userId: string,

): Promise<Referral[]> {

  const referrals = await this.getReferralsByReferrer(

    userId,

  );

  return referrals.filter(

    r =>
      r.status === "payment_completed" ||
      r.status === "reward_unlocked",

  );

}


// ============================================================
// Waiting Payment
// ============================================================

async getWaitingPayments(

  userId: string,

): Promise<Referral[]> {

  const referrals = await this.getReferralsByReferrer(

    userId,

  );

  return referrals.filter(

    r =>

      r.status === "subscription_selected" ||

      r.status === "payment_pending",

  );

}


// ============================================================
// Reward Unlock Progress
// ============================================================

async calculateReferralProgress(

  userId: string,

): Promise<ReferralProgress> {

  return this.getReferralProgress(userId);

}

async getRewardProgress(

  userId: string,

): Promise<{

  current: number;

  goal: number;

  remaining: number;

  percentage: number;

}> {

  const subscription = await subscriptionService.getSubscription(

    userId,

  );

  if (!subscription) {

    return {

      current: 0,

      goal: 0,

      remaining: 0,

      percentage: 0,

    };

  }

  const current = await this.getPaidReferralCount(

    userId,

  );

  const goal = subscription.selectedReferralChoice;

  if (goal === 0) {

    return {

      current: 0,

      goal: 0,

      remaining: 0,

      percentage: 100,

    };

  }

  return {

    current,

    goal,

    remaining: Math.max(

      goal - current,

      0,

    ),

    percentage: Math.min(

      (current / goal) * 100,

      100,

    ),

  };

}


// ============================================================
// Goal Reached
// ============================================================

async hasReachedGoal(

  userId: string,

): Promise<boolean> {

  const progress = await this.getRewardProgress(

    userId,

  );

  return progress.current >= progress.goal;

}


// ============================================================
// Eligible For Unlock
// ============================================================

async isEligibleForUnlock(

  userId: string,

): Promise<boolean> {

  const subscription = await subscriptionService.getSubscription(

    userId,

  );

  if (!subscription) {

    return false;

  }

  if (

    subscription.status === "active"

  ) {

    return false;

  }

  if (

    !subscription.paymentCompleted

  ) {

    return false;

  }

  return await this.hasReachedGoal(

    userId,

  );

}


// ============================================================
// Unlock Subscription If Ready
// ============================================================

async unlockIfEligible(

  userId: string,

): Promise<boolean> {

  const eligible = await this.isEligibleForUnlock(

    userId,

  );

  if (!eligible) {

    return false;

  }

  await subscriptionService.unlockSubscriptionIfEligible(

    userId,

  );

  const referrals = await this.getCompletedReferrals(

    userId,

  );

  for (const referral of referrals) {

    if (

      referral.status !== "reward_unlocked"

    ) {

      await this.markRewardUnlocked(

        referral.id,

      );

    }

  }

  return true;

}

// ============================================================
// Part 4
// Referral Sharing Utilities
// ============================================================

// ============================================================
// App URL
// ============================================================

private getAppUrl(): string {

  return (
    import.meta.env.VITE_APP_URL ??
    "https://honeymoon.kuomoka.co.ke"
  );

}


// ============================================================
// Registration Link
// ============================================================

getRegistrationLink(

  referralCode: string,

): string {

  return `${this.getAppUrl()}/register?ref=${encodeURIComponent(
    referralCode,
  )}`;

}


// ============================================================
// Default Referral Message
// ============================================================

buildReferralMessage(

  referralCode: string,

): string {

  const link = this.getRegistrationLink(

    referralCode,

  );

  return [
    "🌍❤️ Join me on HoneyMoon!",
    "",
    "Meet people, discover opportunities, and grow your network worldwide.",
    "",
    "💡 Want instant access?",
    "Choose the Direct Membership (0 Referral Plan) and your account is activated immediately.",
    "",
    "You can still build your own referral network and earn 25% commission from every successful paid referral.",
    "",
    "Join here:",
    link,
  ].join("\n");

}


// ============================================================
// URL Encoders
// ============================================================

private encode(

  value: string,

): string {

  return encodeURIComponent(value);

}


// ============================================================
// WhatsApp
// ============================================================

getWhatsAppShareLink(

  referralCode: string,

): string {

  return `https://wa.me/?text=${this.encode(

    this.buildReferralMessage(

      referralCode,

    ),

  )}`;

}


// ============================================================
// Telegram
// ============================================================

getTelegramShareLink(

  referralCode: string,

): string {

  return `https://t.me/share/url?url=${this.encode(

    this.getRegistrationLink(referralCode),

  )}&text=${this.encode(

    this.buildReferralMessage(referralCode),

  )}`;

}


// ============================================================
// Facebook
// ============================================================

getFacebookShareLink(

  referralCode: string,

): string {

  return `https://www.facebook.com/sharer/sharer.php?u=${this.encode(

    this.getRegistrationLink(referralCode),

  )}`;

}


// ============================================================
// Messenger
// ============================================================

getMessengerShareLink(

  referralCode: string,

): string {

  return `https://www.facebook.com/dialog/send?link=${this.encode(

    this.getRegistrationLink(referralCode),

  )}`;

}


// ============================================================
// LinkedIn
// ============================================================

getLinkedInShareLink(

  referralCode: string,

): string {

  return `https://www.linkedin.com/sharing/share-offsite/?url=${this.encode(

    this.getRegistrationLink(referralCode),

  )}`;

}


// ============================================================
// Twitter / X
// ============================================================

getTwitterShareLink(

  referralCode: string,

): string {

  return `https://twitter.com/intent/tweet?text=${this.encode(

    this.buildReferralMessage(referralCode),

  )}`;

}


// ============================================================
// Email
// ============================================================

getEmailShareLink(

  referralCode: string,

): string {

  const subject = this.encode(

    "Join me on HoneyMoon",

  );

  const body = this.encode(

    this.buildReferralMessage(

      referralCode,

    ),

  );

  return `mailto:?subject=${subject}&body=${body}`;

}


// ============================================================
// Copy Link
// ============================================================

async copyReferralLink(

  referralCode: string,

): Promise<void> {

  await navigator.clipboard.writeText(

    this.getRegistrationLink(

      referralCode,

    ),

  );

}


// ============================================================
// Copy Full Message
// ============================================================

async copyReferralMessage(

  referralCode: string,

): Promise<void> {

  await navigator.clipboard.writeText(

    this.buildReferralMessage(

      referralCode,

    ),

  );

}


// ============================================================
// Open Share Window
// ============================================================

share(

  platform:
    | "whatsapp"
    | "telegram"
    | "facebook"
    | "messenger"
    | "linkedin"
    | "twitter"
    | "email",

  referralCode: string,

) {

  const links = {

    whatsapp:
      this.getWhatsAppShareLink(referralCode),

    telegram:
      this.getTelegramShareLink(referralCode),

    facebook:
      this.getFacebookShareLink(referralCode),

    messenger:
      this.getMessengerShareLink(referralCode),

    linkedin:
      this.getLinkedInShareLink(referralCode),

    twitter:
      this.getTwitterShareLink(referralCode),

    email:
      this.getEmailShareLink(referralCode),

  };

  window.open(

    links[platform],

    "_blank",

    "noopener,noreferrer",

  );

}


// ============================================================
// Native Share API
// ============================================================

async nativeShare(

  referralCode: string,

): Promise<boolean> {

  if (!navigator.share) {

    return false;

  }

  await navigator.share({

    title: "HoneyMoon",

    text: this.buildReferralMessage(

      referralCode,

    ),

    url: this.getRegistrationLink(

      referralCode,

    ),

  });

  return true;

}

// ============================================================
// Part 5
// Dashboard & Admin Helpers
// ============================================================

// ============================================================
// Referral Dashboard
// ============================================================

async getReferralDashboard(
  userId: string,
) {

  const referrals = await this.getReferralsByReferrer(
    userId,
  );

  const progress =
    await this.calculateReferralProgress(
      userId,
    );

  const earningsQuery = query(
    collection(db, "earnings"),
    where("referrerId", "==", userId),
  );

  const earningsSnap = await getDocs(
    earningsQuery,
  );

  const totalEarnings =
    earningsSnap.docs.reduce(
      (sum, docItem) =>
        sum +
        ((docItem.data() as { amount: number }).amount ?? 0),
      0,
    );

  return {

    referrals,

    progress,

    totalReferrals:
      referrals.length,

    totalEarnings,

    pendingReferrals:
      progress.pending,

    completedReferrals:
      progress.completed,

    unlocked:
      progress.goalReached,

  };

}


// ============================================================
// Pending Rewards
// ============================================================

async getPendingRewards(
  userId: string,
) {

  const q = query(
    collection(db, "earnings"),
    where("referrerId", "==", userId),
    where("status", "==", "pending"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as { amount: number };

    return {
      id: d.id,
      ...data,
    };
  });

}


// ============================================================
// Available Rewards
// ============================================================

async getUnlockedRewards(
  userId: string,
) {

  const q = query(
    collection(db, "earnings"),
    where("referrerId", "==", userId),
    where("status", "==", "available"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as Omit<Earning, "id">;

    return {
      ...data,
      id: d.id,
    };
  });

}


// ============================================================
// Referral History
// ============================================================

async getReferralHistory(
  userId: string,
) {

  const referrals =
    await this.getReferralsByReferrer(
      userId,
    );

  return referrals.sort((a, b) => {

    const aTime =
      a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : 0;

    const bTime =
      b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : 0;

    return bTime - aTime;

  });

}


// ============================================================
// Refresh User Referral Stats
// ============================================================

async refreshUserReferralStats(
  userId: string,
) {

  const progress =
    await this.getReferralProgress(
      userId,
    );

  const userRef = doc(
    db,
    "users",
    userId,
  );

  await updateDoc(userRef, {

    totalReferrals:
      progress.total,

    paidReferralCount:
      progress.completed,

    pendingReferralCount:
      progress.pending,

    emailVerifiedReferralCount:
      progress.emailVerified,

    updatedAt:
      serverTimestamp(),

  });

  return progress;

}


// ============================================================
// Refresh Referral Progress
// ============================================================

async refreshReferralProgress(
  userId: string,
) {

  const progress =
    await this.refreshUserReferralStats(
      userId,
    );

  await subscriptionService.unlockSubscriptionIfEligible(userId);
   
  return progress;

}


// ============================================================
// Top Referrers
// ============================================================

async getTopReferrers(
  limitCount = 20,
) {

  const usersSnap =
    await getDocs(
      collection(db, "users"),
    );

  const users = usersSnap.docs
    .map((d) => {
      const data = d.data() as UserProfile & { paidReferralCount?: number };

      return {
        id: d.id,
        ...data,
        paidReferralCount: data.paidReferrals ?? data.paidReferralCount ?? 0,
      };
    })
    .sort(
      (a, b) =>
        (b.paidReferralCount ?? 0) -
        (a.paidReferralCount ?? 0),
    )
    .slice(0, limitCount);

  return users;

}


// ============================================================
// Admin Referral Statistics
// ============================================================

async getAdminReferralStats() {

  const referrals =
    await getDocs(
      collection(db, "referrals"),
    );

  const earnings =
    await getDocs(
      collection(db, "earnings"),
    );

  const withdrawals =
    await getDocs(
      collection(db, "withdrawals"),
    );

  const referralDocs =
    referrals.docs.map((d) => d.data());

  const earningDocs =
    earnings.docs.map(
      (d) => d.data() as Earning,
    );

  return {

    totalReferrals:
      referralDocs.length,

    completed:
      referralDocs.filter(
        (r: any) =>
          r.status ===
          "payment_completed",
      ).length,

    pending:
      referralDocs.filter(
        (r: any) =>
          r.status !==
          "payment_completed",
      ).length,

    totalCommission:
      earningDocs.reduce(
        (sum, e) =>
          sum + e.amount,
        0,
      ),

    availableCommission:
      earningDocs
        .filter(
          (e) =>
            e.status ===
            "available",
        )
        .reduce(
          (sum, e) =>
            sum + e.amount,
          0,
        ),

    pendingWithdrawals:
      withdrawals.docs.filter(
        (d) =>
          d.data().status ===
          "pending",
      ).length,

  };

}


// ============================================================
// Referral Leaderboard
// ============================================================

async getLeaderboard() {

  const users =
    await this.getTopReferrers(
      100,
    );

  return users.map(
    (user, index) => ({

      rank: index + 1,

      userId: user.uid,

      name:
        `${user.firstName} ${user.lastName}`,

      referrals:
        user.referralCount,
      

      earnings:
        user.totalReferralEarnings ?? 0,

    }),
  );

}
}

export const referralService =
  new ReferralService();
