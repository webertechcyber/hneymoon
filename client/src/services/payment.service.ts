// ============================================================
// HONEYMOON — Payment Service
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
  where,
  updateDoc,
  serverTimestamp,
  setDoc,
  orderBy,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { Payment } from "@/types/payment";
import type { Subscription } from "@/types/subscription";
import type { UserProfile } from "@/types/user";
import type { Earning } from "@/types/earning";
import type { Withdrawal } from "@/types/withdrawal";

import {
  getCountryCurrency,
  getReferralAmount,
  getReferralCommission,
} from "@/lib/constants";

export function sanitizeFirestorePayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export class PaymentService {

  // ------------------------------------------------------------
  // Collections
  // ------------------------------------------------------------

  private paymentsCollection = collection(db, "payments");

  private subscriptionsCollection = collection(db, "subscriptions");

  private usersCollection = collection(db, "users");

  // ------------------------------------------------------------
  // Provider Selection
  // ------------------------------------------------------------

  getPaymentProvider(country?: string) {

    if (!country) {
      return "intasend";
    }

    return country.trim().toLowerCase() === "kenya"
      ? "nestlink"
      : "intasend";

  }

  // ------------------------------------------------------------
  // Currency Helper
  // ------------------------------------------------------------

  getPaymentCurrency(country?: string) {

    return getCountryCurrency(country);

  }

  // ------------------------------------------------------------
  // Subscription Amount Helper
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Generate Local Reference
  // ------------------------------------------------------------

  generateReference(userId?: string) {

  if (!userId) {
    throw new Error("Cannot generate payment reference. Missing user id.");
  }

  return [
    "HM",
    userId.substring(0, 6),
    Date.now(),
  ].join("-");
}

  // ------------------------------------------------------------
  // Get Subscription
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Get User
  // ------------------------------------------------------------

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
  uid: data.uid ?? snap.id,
};

  }

  // ------------------------------------------------------------
  // Create Payment Record
  // ------------------------------------------------------------

  async createPayment(
  userId: string,
): Promise<{
  paymentId: string;
  provider: string;
  checkoutUrl?: string;
  checkoutRequestId?: string;
  transactionId?: string;
}> {

    const user = await this.getUser(userId);

    //console.log("1. createPayment started");

    if (!user) {

      throw new Error("User not found.");

    }

    const subscription = await this.getSubscription(userId);
    //console.log("2. User:", user);

    if (!subscription) {

      throw new Error("Subscription not found.");

    }

    const currency = getCountryCurrency(
      user.country,
    );

    const referralChoice =
      (subscription as Subscription & { referralChoice?: 0 | 1 | 2 | 5 }).referralChoice ??
      subscription.selectedReferralChoice ??
      0;

    const amount = getReferralAmount(
      currency.amount,
      referralChoice,
    );

    const provider = this.getPaymentProvider(
      user.country,
    );
    //console.log("Provider =", provider);
    await updateDoc(
    doc(db, "subscriptions", subscription.id),
    {
        paymentProvider: provider,
        updatedAt: serverTimestamp(),
    }
);

    const payment: Omit<Payment, "id"> = {

      userId,

      paymentType: "subscription",

      subscriptionPlan: referralChoice,

      provider,

      method:
        provider === "nestlink"
          ? "mpesa"
          : "card",

      status: "pending",

      amount,

      currency: currency.currency,

      reference: this.generateReference(
    user.uid,
),

      externalReference: "",

      metadata: {},

      paidAt: undefined,

      createdAt: new Date(),

      updatedAt: new Date(),

    };

    // add update the ref in payment collection
  const ref = await addDoc(
  this.paymentsCollection,
  sanitizeFirestorePayload({
    ...payment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }),
);
//console.log("3. Subscription:", subscription);

const createdPayment: Payment = {
  id: ref.id,
  ...payment,
};

return {
  paymentId: createdPayment.id,
  provider,
};

  }

  // ------------------------------------------------------------
  // Get Payment
  // ------------------------------------------------------------

  async getPayment(
    paymentId: string,
  ): Promise<Payment | null> {

    const ref = doc(
      this.paymentsCollection,
      paymentId,
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      return null;

    }

    const data = snap.data() as Payment;

    return {

      ...data,

      id: snap.id,

    };

  }

  // ------------------------------------------------------------
  // Get Payments
  // ------------------------------------------------------------

  async getPayments(
    userId: string,
  ): Promise<Payment[]> {

    const q = query(
      this.paymentsCollection,
      where("userId", "==", userId),
    );

    const snap = await getDocs(q);

    return snap.docs.map((docItem) => {

      const data = docItem.data() as Payment;

      return {

        ...data,

        id: docItem.id,

      };

    });

  }

  // ------------------------------------------------------------
  // Cancel Payment
  // ------------------------------------------------------------

  async cancelPayment(
    paymentId: string,
  ) {

    const ref = doc(
      this.paymentsCollection,
      paymentId,
    );

    await updateDoc(ref, {

      status: "cancelled",

      updatedAt: serverTimestamp(),

    });
    //console.log("Entered startNestLinkPayment");

  }

// Continue class with provider-specific and wallet methods
// (export moved to file end)

  // ======================================================
// NESTLINK (Kenya M-Pesa)
// ======================================================

public async startNestLinkPayment(
  
    payment: Payment,
    phone: string
){
    const payload = {
  phone: this.normalizeKenyanPhone(phone),
  amount: payment.amount,
  local_id: payment.id,
  transaction_desc: "HoneyMoon Membership",
};

//console.log("NestLink payload:", payload);
  const response = await fetch(

    `${import.meta.env.VITE_NESTLINK_BASE_URL}/runPrompt`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Secret": import.meta.env.VITE_NESTLINK_API_KEY,
      },
      body: JSON.stringify({
        phone: this.normalizeKenyanPhone(phone),
        amount: payment.amount,
        local_id: payment.id,
        transaction_desc: "HoneyMoon Membership",
      }),
    }
  );
  if (!response.ok) {
  const errorBody = await response.text();

 // console.error("NestLink Error:", response.status);
 // console.error(errorBody);

  throw new Error(errorBody);
}

const result = await response.json();

//console.log("NestLink response:", result);
//console.log("NestLink response:", result);
  if (!result.status) {
    throw new Error(result.msg);
  }

  await updateDoc(doc(db, "payments", payment.id), {
    providerReference: result.data.CheckoutRequestID,
    checkoutUrl: result.data.ConfirmationLink,
    updatedAt: serverTimestamp(),
  });

  return {
    paymentId: payment.id,
    provider: "nestlink",
    checkoutUrl: result.data.ConfirmationLink,
    checkoutRequestId: result.data.CheckoutRequestID,
  };
}
//Track nestlink payment status
async verifyNestLinkPayment(paymentId: string) {

  const payment = await this.getPayment(paymentId);

  if (!payment) {
    throw new Error("Payment not found.");
  }

  const response = await fetch(
    `${import.meta.env.VITE_NESTLINK_BASE_URL}/trackTransaction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Secret": import.meta.env.VITE_NESTLINK_API_KEY,
      },
      body: JSON.stringify({
        local_id: payment.id,
      }),
    }
  );

  const result = await response.json();

//console.log("NestLink HTTP status:", response.status);
//console.log("NestLink response:", result);

if (!response.ok) {
  throw new Error(
    result.msg ?? "NestLink verification failed."
  );
}

  const data = result.data;

if (!data) {

    return {

        pending: true,

        paid: false,

        resultCode: null,

        message: "Waiting for payment.",

    };

}

return {

    pending: false,

    paid: data.paid,

    resultCode:
        data.ResultCode ??
        data.result?.ResultCode ??
        null,

    message:
    data.ResultCode === 0
        ? "Payment successful."

    : data.ResultCode === 1032
        ? "Payment cancelled."

    : data.ResultCode === 2001
        ? "Incorrect M-Pesa PIN."

    : data.ResultCode === 1037
        ? "M-Pesa timed out."

    : data.ResultCode === 1
        ? "Insufficient M-Pesa balance."

    : "Payment failed.",

    amount:
        data.result?.amount,

    phone:
        data.result?.PhoneNumber,

    reference:
        data.result?.MpesaReceiptNumber,

};
}


//part 2 to send 
//intasend payment
private async startIntaSendPayment(
  payment: Payment,
  subscription: Subscription,
  user: UserProfile
) {

  const response = await fetch(
    "https://api.intasend.com/api/v1/payment-initiate/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_key: import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY,

        amount: payment.amount,

        currency: payment.currency,

        email: user.email,

        first_name: user.firstName,

        last_name: user.lastName,

        phone_number: user.phoneNumber ?? "",

        host: window.location.origin,

        redirect_url:
`${window.location.origin}/profile`,

        api_ref: payment.id,

        comment: "HoneyMoon Membership",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to initiate IntaSend payment.");
  }

  const result = await response.json();

  await updateDoc(doc(db, "payments", payment.id), {

    providerReference: result.transaction_id,

    checkoutUrl: result.redirect_url,

    updatedAt: serverTimestamp(),

  });

  return {

    paymentId: payment.id,

    provider: "intasend",

    checkoutUrl: result.redirect_url,

    transactionId: result.transaction_id,

  };
}

//VERIFY INTASEND PAYMENT
async verifyIntaSendPayment(paymentId: string) {

  const payment = await this.getPayment(paymentId);

  if (!payment) {
    throw new Error("Payment not found.");
  }

  const response = await fetch(

    `https://api.intasend.com/api/v1/payment-status/${payment.providerReference}/`,

    {
      headers: {
        Authorization:
          `Bearer ${import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to verify payment.");
  }

  const result = await response.json();

  return {

    status: result.status,

    amount: result.amount,

    currency: result.currency,

    reference: result.reference,

  };
}

//mpesa phone number normalization
private normalizeKenyanPhone(phone: string) {

  let number = phone.replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = "254" + number.substring(1);
  }

  if (number.startsWith("7")) {
    number = "254" + number;
  }

  return number;
}

//verify payment status
// ======================================================
// Verify Payment
// ======================================================

async verifyPayment(paymentId: string) {

  const payment = await this.getPayment(paymentId);

  if (!payment) {
    throw new Error("Payment not found.");
  }
//console.log("Selected provider:", payment.provider);
  if (payment.provider === "nestlink") {

    return this.verifyNestLinkPayment(paymentId);

  }
//console.log("Calling IntaSend...");
  return this.verifyIntaSendPayment(paymentId);

}
//activate subscription after payment verification
// ======================================================
// Activate Subscription
// ======================================================

private async activateSubscription(

  subscriptionId: string,

  paymentId: string,

) {

  const subscriptionRef = doc(

    db,

    "subscriptions",

    subscriptionId,

  );

  const subscriptionSnap = await getDoc(

    subscriptionRef,

  );

  if (!subscriptionSnap.exists()) {

    throw new Error("Subscription not found.");

  }

  const subscription = subscriptionSnap.data() as Subscription;

  await updateDoc(subscriptionRef, {

    status: "active",

    paymentId,

    activatedAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

  });

  const userRef = doc(

    db,

    "users",

    subscription.userId,

  );

  await updateDoc(userRef, {

    subscriptionStatus: "active",

    paymentStatus: "paid",

    subscriptionStart: serverTimestamp(),

    updatedAt: serverTimestamp(),

  });

}

//part 3  send 
//complete payment and activate subscription
// ======================================================
// Complete Payment
// ======================================================
// ======================================================
// Complete Payment
// ======================================================

async completePayment(

  paymentId: string,

) {

  const payment = await this.getPayment(

    paymentId,

  );

  if (!payment) {

    throw new Error("Payment not found.");

  }

  const verification = await this.verifyPayment(
  paymentId,
);
const nestVerification =
    verification as {
        paid: boolean;
        resultCode: number | null;
        message: string;
        phone?: string;
        amount?: number;
        reference?: string;
    };

// ----------------------------
// NestLink
// ----------------------------
if (payment.provider === "nestlink") {

  if (!nestVerification.paid) {

    await updateDoc(
      doc(db, "payments", paymentId),
      {
        status: "failed",
        providerResultCode: nestVerification.resultCode,
        providerMessage: nestVerification.message,
        updatedAt: serverTimestamp(),
      }
    );

    return false;
  }

}
else {

  const intaSendVerification =
    verification as {
        status: string;
    };

if (intaSendVerification.status !== "COMPLETE") {

    return false;

}

}

  await updateDoc(

  doc(db, "payments", paymentId),

  {

    status: "paid",

    paidAt: serverTimestamp(),

    providerReference:
      nestVerification.reference ?? null,

    providerMessage:
      nestVerification.message ?? null,

    providerResultCode:
      nestVerification.resultCode ?? null,

    phoneNumber:
      nestVerification.phone ?? null,

    amountPaid:
      nestVerification.amount ?? payment.amount,

    updatedAt: serverTimestamp(),

  }

);

  const subscription = await this.getSubscription(

    payment.userId,

  );

  if (!subscription) {

    throw new Error("Subscription missing.");

  }

  const user = await this.getUser(

    payment.userId,

  );

  if (!user) {

    throw new Error("User missing.");

  }

  //
  // 0 referral plan
  //

  const referralChoice =
    (subscription as Subscription & { referralChoice?: 0 | 1 | 2 | 5 }).referralChoice ??
    subscription.selectedReferralChoice ??
    0;

  if (referralChoice === 0) {

    await this.activateSubscription(

      subscription.id,

      payment.id,

    );

  }

  else {

    //
    // referral plans stay pending
    //

    await updateDoc(

      doc(db, "subscriptions", subscription.id),

      {

        paymentId: payment.id,

        status: "pending",

        paymentCompleted: true,

        updatedAt: serverTimestamp(),

      }

    );

  }

  //
  // referral logic
  //

  if (user.referredBy) {

    await this.processReferralPayment(

      user,

      payment,
      subscription,


    );

  }

  return true;

}

//process referral payment
private async processReferralPayment(

    user: UserProfile,

    payment: Payment,

    subscription: Subscription,

) {

    const referralQuery = query(

        collection(db, "referrals"),

        where("referredUserId", "==", user.uid),

    );

    const referralSnap = await getDocs(referralQuery);

    if (referralSnap.empty) return;

    const referralDoc = referralSnap.docs[0];

    const referral = referralDoc.data();

    await updateDoc(referralDoc.ref, {

        status: "payment_completed",

        paymentCompletedAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

    });

    await this.refreshReferralProgress(

        referral.referrerId,

    );


    //part 4 send 
    // Ambassador Commission
    //

    await this.createReferralCommission(

        referral,

        payment,

        subscription,

    );

}

//create referral commission
private async createReferralCommission(

    referral: any,

    payment: Payment,

    subscription: Subscription,

) {

    //
    // Commission = amount the referred user paid, minus the
    // platform's cut of the base (0-referral) price for that
    // currency. E.g. for KES: pay 180 -> referrer earns 80,
    // pay 149 -> referrer earns 49. See getReferralCommission().
    //

    const commission = getReferralCommission(
        payment.amount,
        payment.currency,
    );

    const earningRef = doc(

        collection(db, "earnings"),

    );

    const earning: Earning = {

        id: earningRef.id,

        referrerId: referral.referrerId,

        referredUserId: referral.referredUserId,

        referralId: referral.id,

        paymentId: payment.id,

        type: "referral_commission",

        percentage: payment.amount > 0
            ? Number(((commission / payment.amount) * 100).toFixed(2))
            : 0,

        amount: commission,

        currency: payment.currency,

        status: "available",

        createdAt: new Date(),

        updatedAt: new Date(),

    };

    await setDoc(

        earningRef,

        earning,

    );

    await this.updateWallet(

        referral.referrerId,

        commission,

        payment.currency,

    );

}


//refresh referral progress
private async refreshReferralProgress(

  referrerId: string,

) {

  const referralsQuery = query(

    collection(db, "referrals"),

    where("referrerId", "==", referrerId),

    where("status", "==", "payment_completed"),

  );

  const paid = (

    await getDocs(

      referralsQuery,

    )

  ).size;

  await updateDoc(

    doc(db, "users", referrerId),

    {

      paidReferralCount: paid,

      updatedAt: serverTimestamp(),

    }

  );

  await this.checkReferralUnlock(

    referrerId,

    paid,

  );

}
//check referral unlock
private async checkReferralUnlock(

  userId: string,

  paidCount: number,

) {

  const subscription = await this.getSubscription(

    userId,

  );

  if (!subscription) {

    return;

  }

  //
  // already active
  //

  if (subscription.status === "active") {

    return;

  }

  //
  // goal not reached
  //

  const referralChoice =
    (subscription as Subscription & { referralChoice?: 0 | 1 | 2 | 5 }).referralChoice ??
    subscription.selectedReferralChoice ??
    0;

  if (

    paidCount < referralChoice

  ) {

    return;

  }

  //
  // payment not yet done
  //

  if (!subscription.paymentCompleted) {

    return;

  }

  //
  // everything satisfied
  //

  await this.activateSubscription(

    subscription.id,

    subscription.paymentId!,

  );

}

//update wallet balance (currency-aware)
private async updateWallet(

    userId: string,

    amount: number,

    currency: string = "KES",

) {

    const userRef = doc(

        db,

        "users",

        userId,

    );

    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    const user = snap.data() as UserProfile;

    const walletBalances = { ...(user.walletBalances ?? {}) };
    const lifetimeByCurrency = { ...(user.lifetimeEarningsByCurrency ?? {}) };

    walletBalances[currency] = (walletBalances[currency] ?? 0) + amount;
    lifetimeByCurrency[currency] = (lifetimeByCurrency[currency] ?? 0) + amount;

    const updates: Record<string, unknown> = {

        walletBalances,

        lifetimeEarningsByCurrency: lifetimeByCurrency,

        updatedAt: serverTimestamp(),

    };

    // Keep the legacy flat fields in sync with KES specifically — all
    // current customers are Kenyan and the existing Earnings UI reads
    // these flat fields directly. Other currencies live only in the
    // per-currency maps above until they have real volume.
    if (currency === "KES") {

        updates.walletBalance = (user.walletBalance ?? 0) + amount;
        updates.totalReferralEarnings = (user.totalReferralEarnings ?? 0) + amount;
        updates.lifetimeEarnings = (user.lifetimeEarnings ?? 0) + amount;

    }

    await updateDoc(userRef, updates);

}
//wallet helpers
async getWallet(userId: string) {

    const snap = await getDoc(

        doc(db, "users", userId),

    );

    if (!snap.exists()) return null;

    const user = snap.data() as UserProfile;

    return {

        balance: user.walletBalance ?? 0,

        lifetime: user.lifetimeEarnings ?? 0,

        referral: user.totalReferralEarnings ?? 0,

        byCurrency: user.walletBalances ?? {},

        lifetimeByCurrency: user.lifetimeEarningsByCurrency ?? {},

    };

}
//earnings 
async getUserEarnings(

    userId: string,

) {

    const q = query(

        collection(db, "earnings"),

        where("referrerId", "==", userId),

        orderBy("createdAt", "desc"),

    );

    return (

        await getDocs(q)

    ).docs.map(doc => ({

        id: doc.id,

        ...doc.data(),

    }));

}
//withdrawals
async requestWithdrawal(

    userId: string,

    amount: number,

    currency?: string,

) {

    const userSnap = await getDoc(

        doc(db, "users", userId),

    );

    if (!userSnap.exists()) {

        throw new Error(

            "User not found.",

        );

    }

    const user = userSnap.data() as UserProfile;

    // Default to the user's own currency (all current customers are
    // Kenyan / KES); fall back to KES if not set.
    const withdrawCurrency = currency ?? (user as any).currency ?? "KES";

    const currentBalance =
        withdrawCurrency === "KES"
            ? (user.walletBalance ?? 0)
            : (user.walletBalances?.[withdrawCurrency] ?? 0);

    if (currentBalance < amount) {

        throw new Error(

            "Insufficient balance.",

        );

    }

    const withdrawalRef = doc(

        collection(db, "withdrawals"),

    );

    const withdrawal: Withdrawal = {

        id: withdrawalRef.id,

        userId,

        amount,

        currency: withdrawCurrency,

        paymentMethod: "mpesa",

        destination: "wallet",

        status: "pending",

        createdAt: new Date(),

        updatedAt: new Date(),

    };

    // requestedAt (not just createdAt) — the admin withdrawals panel
    // queries orderBy("requestedAt"), so this field must be present or
    // the request silently never shows up for admins to approve.
    await setDoc(

        withdrawalRef,

        {
            ...withdrawal,
            requestedAt: serverTimestamp(),
        },

    );

    const walletBalances = { ...(user.walletBalances ?? {}) };
    walletBalances[withdrawCurrency] = currentBalance - amount;

    const updates: Record<string, unknown> = {

        walletBalances,

        updatedAt: serverTimestamp(),

    };

    if (withdrawCurrency === "KES") {

        updates.walletBalance = currentBalance - amount;

    }

    await updateDoc(

        doc(db, "users", userId),

        updates,

    );

}
//nice utility function to get referral earnings
async getReferralEarnings(

    userId: string,

) {

    const q = query(

        collection(db, "earnings"),

        where(

            "referrerId",

            "==",

            userId,

        ),

        where(

            "type",

            "==",

            "referral_commission",

        ),

    );

    return (

        await getDocs(q)

    ).docs.map(d => d.data());

}

}
export const paymentService = new PaymentService();
export default paymentService;
