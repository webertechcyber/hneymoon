import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";

export async function getUser(userId: string) {
  const ref = doc(db, "users", userId);

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as UserProfile;
}

export async function createUser(
  user: Partial<UserProfile> & { userd?: string; userId?: string }
) {
  const userId = user.uid;

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const ref = doc(db, "users", userId);
  const { uid, ...profileData } = user;

  await setDoc(ref, {
    ...profileData,
    userId,

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),
  });
}