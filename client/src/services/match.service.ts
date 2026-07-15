// ============================================================
// HONEYMOON — Match & Discover Service
// ============================================================

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AI_PROFILES } from "@/data/aiProfiles";
import type { DiscoverProfile, Match } from "@/types";

export async function recordLike(
  fromUserId: string,
  toUserId: string
): Promise<{ isMatch: boolean; matchId?: string; conversationId?: string }> {
  // Check if the other person already liked us
  const reverseQ = query(
    collection(db, "likes"),
    where("fromUserId", "==", toUserId),
    where("toUserId", "==", fromUserId)
  );
  const reverseSnap = await getDocs(reverseQ);
  const isMatch = !reverseSnap.empty;

  // Record this like
  await addDoc(collection(db, "likes"), {
    fromUserId,
    toUserId,
    createdAt: serverTimestamp(),
  });

  if (isMatch) {
    // Create match record
    const matchRef = await addDoc(collection(db, "matches"), {
      users: [fromUserId, toUserId],
      createdAt: serverTimestamp(),
    });

    // Create conversation
    const convRef = await addDoc(collection(db, "conversations"), {
      users: [fromUserId, toUserId],
      matchId: matchRef.id,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { isMatch: true, matchId: matchRef.id, conversationId: convRef.id };
  }

  return { isMatch: false };
}

export async function recordPass(fromUserId: string, toUserId: string): Promise<void> {
  await addDoc(collection(db, "passes"), {
    fromUserId,
    toUserId,
    createdAt: serverTimestamp(),
  });
}

export async function getSeenProfiles(userId: string): Promise<Set<string>> {
  const [likesSnap, passesSnap] = await Promise.all([
    getDocs(query(collection(db, "likes"), where("fromUserId", "==", userId))),
    getDocs(query(collection(db, "passes"), where("fromUserId", "==", userId))),
  ]);

  const seen = new Set<string>();
  likesSnap.docs.forEach((d) => seen.add(d.data().toUserId));
  passesSnap.docs.forEach((d) => seen.add(d.data().toUserId));
  return seen;
}

export async function getDiscoverQueue(
  userId: string,
  interestedIn: string = "everyone"
): Promise<DiscoverProfile[]> {
  const seen = await getSeenProfiles(userId);

  // Get real users
  const usersRef = collection(db, "users");
  let q;
  if (interestedIn === "everyone") {
    q = query(usersRef, where("subscriptionStatus", "==", "active"), limit(50));
  } else {
    q = query(
      usersRef,
      where("subscriptionStatus", "==", "active"),
      where("gender", "==", interestedIn),
      limit(50)
    );
  }

  const snap = await getDocs(q);
  const realProfiles: DiscoverProfile[] = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName || "Unknown",
        firstName: data.firstName,
        age: data.age,
        city: data.city,
        country: data.country,
        bio: data.bio,
        photoURL: data.photoURL,
        photos: data.photos,
        online: data.online,
        verified: false,
        interests: data.interests,
        occupation: data.occupation,
        isAI: false,
      } as DiscoverProfile;
    })
    .filter((p) => p.id !== userId && !seen.has(p.id));

  // Mix in AI profiles
  const aiProfiles: DiscoverProfile[] = AI_PROFILES
    .filter((ai) => {
      if (interestedIn === "everyone") return true;
      return ai.gender === interestedIn;
    })
    .filter((ai) => !seen.has(ai.id))
    .map((ai) => ({
      id: ai.id,
      displayName: `${ai.firstName} ${ai.lastName}`,
      firstName: ai.firstName,
      age: ai.age,
      city: ai.city,
      country: ai.country,
      bio: ai.bio,
      photoURL: ai.photos[0],
      photos: ai.photos,
      online: ai.online,
      verified: ai.verified,
      interests: ai.interests,
      occupation: ai.occupation,
      isAI: true,
    }));

  // Interleave: 1 AI for every 3 real users
  const mixed: DiscoverProfile[] = [];
  let aiIdx = 0;
  realProfiles.forEach((p, i) => {
    mixed.push(p);
    if ((i + 1) % 3 === 0 && aiIdx < aiProfiles.length) {
      mixed.push(aiProfiles[aiIdx++]);
    }
  });
  // Add remaining AI profiles
  while (aiIdx < aiProfiles.length) {
    mixed.push(aiProfiles[aiIdx++]);
  }

  return mixed;
}

export async function getUserMatches(userId: string): Promise<Match[]> {
  const q = query(
    collection(db, "matches"),
    where("users", "array-contains", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
}
