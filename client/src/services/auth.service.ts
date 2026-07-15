// ============================================================
// HONEYMOON — Auth Service
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { nanoid } from "nanoid";
import { getCountryCurrency } from "@/lib/constants";
import type { RegisterData } from "@/types";
import { subscriptionService } from "./subscription.service";
import { referralService } from "./referral.service";

export async function registerUser(data: RegisterData): Promise<User> {
  try {
    const { email, password, displayName, country, goal } = data;

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await updateProfile(user, { displayName });

    const referralCode = nanoid(8).toUpperCase();
    const { currency, amount } = getCountryCurrency(country);

    const urlParams = new URLSearchParams(window.location.search);
    // Prefer the code captured by the Register form (data.referredBy);
    // fall back to re-reading the URL directly in case it wasn't passed.
    const referredBy = (data as any).referredBy || urlParams.get("ref") || "";
    const referrerUid = urlParams.get("ref_uid") || "";

    // This user's own link — includes their uid so links they share
    // resolve the referrer via a direct get() on registration, not a
    // Firestore "list" query (which many rule sets block).
    const referralLink = `${window.location.origin}/register?ref=${referralCode}&ref_uid=${user.uid}`;

    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      email,
      displayName,
      country,
      goal,
      currency,
      amountDue: amount,
      referralCode,
      referralLink,
      referralChoice: 0,
      referralCount: 0,
      referredBy,
      subscriptionStatus: "pending",
      admin: false,
      role: "user",
      profileComplete: false,
      emailVerified: false,
      online: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create the referrals/{id} document linking this new user to whoever
    // referred them, so payment.service can find and credit it later.
    // Best-effort: a failure here must never block account creation.
    if (referredBy || referrerUid) {
      try {
        const referrer = await referralService.resolveReferrer(referrerUid, referredBy);
        if (referrer?.uid) {
          await referralService.createReferral(referrer.uid, user.uid);
        } else {
          console.warn("Referral link present but referrer could not be resolved:", { referredBy, referrerUid });
        }
      } catch (referralErr) {
        console.error("Failed to create referral record:", referralErr);
      }
    }

    await sendEmailVerification(user);
    return user;

  } catch (err: any) {
    console.group("REGISTER ERROR");
    console.error(err);
    console.log("code:", err.code);
    console.log("message:", err.message);
    console.groupEnd();
    throw err;
  }
}

 
export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return credential.user;

  } catch (err: any) {
    console.group("LOGIN ERROR");
    console.error(err);
    console.log("code:", err.code);
    console.log("message:", err.message);
    console.groupEnd();
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  await sendEmailVerification(user);
}
