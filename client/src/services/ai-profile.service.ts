// ============================================================
// HONEYMOON — AI Profile Service
// Firestore-backed (collection: aiProfiles). Replaces the old
// local-state-only AdminAI page, where deletes/edits never
// actually persisted. Also provides reshaping helpers so AI
// companions can render inside Discover and Messages using the
// same UserProfile-shaped components real users use.
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  limit as fsLimit,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AIProfile, UserProfile } from "@/types";
import { generateAIProfiles } from "@/data/aiProfileGenerator";
import { AI_PROFILES as SEED_AI_PROFILES } from "@/data/aiProfiles";

const aiProfilesCollection = collection(db, "aiProfiles");

const BATCH_CHUNK = 400;

export async function seedInitialAIProfilesIfEmpty(): Promise<number> {
  const existing = await getDocs(query(aiProfilesCollection, fsLimit(1)));
  if (!existing.empty) return 0;

  const batch = writeBatch(db);
  SEED_AI_PROFILES.forEach((p) => {
    const ref = doc(aiProfilesCollection, p.id);
    const { id, ...rest } = p;
    batch.set(ref, {
      ...rest,
      isAi: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return SEED_AI_PROFILES.length;
}

export async function bulkGenerateAIProfiles(count = 200): Promise<number> {
  const generated = generateAIProfiles(count);
  let written = 0;

  for (let i = 0; i < generated.length; i += BATCH_CHUNK) {
    const chunk = generated.slice(i, i + BATCH_CHUNK);
    const batch = writeBatch(db);
    chunk.forEach((p) => {
      const ref = doc(aiProfilesCollection);
      batch.set(ref, {
        ...p,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    written += chunk.length;
  }

  return written;
}

export async function getAllAIProfiles(): Promise<AIProfile[]> {
  const snap = await getDocs(aiProfilesCollection);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AIProfile));
}

export async function getAIProfile(id: string): Promise<AIProfile | null> {
  const snap = await getDoc(doc(aiProfilesCollection, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AIProfile;
}

export async function getRandomAIProfiles(count: number): Promise<AIProfile[]> {
  const all = await getAllAIProfiles();
  return [...all].sort(() => Math.random() - 0.5).slice(0, count);
}

export async function updateAIProfile(id: string, data: Partial<AIProfile>): Promise<void> {
  await updateDoc(doc(aiProfilesCollection, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleAIProfileVerified(id: string, verified: boolean): Promise<void> {
  await updateAIProfile(id, { verified });
}

export async function deleteAIProfile(id: string): Promise<void> {
  await deleteDoc(doc(aiProfilesCollection, id));
}

export async function deleteAllAIProfiles(): Promise<number> {
  const all = await getDocs(aiProfilesCollection);
  let deleted = 0;
  const docs = all.docs;
  for (let i = 0; i < docs.length; i += BATCH_CHUNK) {
    const chunk = docs.slice(i, i + BATCH_CHUNK);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

export function aiProfileUid(id: string): string {
  return id.startsWith("ai_") ? id : `ai_${id}`;
}

export function isAiUid(uid: string): boolean {
  return uid.startsWith("ai_");
}

export function stripAiPrefix(uid: string): string {
  return uid.startsWith("ai_") ? uid.slice(3) : uid;
}

export function toUserProfile(ai: AIProfile): UserProfile {
  return {
    uid: aiProfileUid(ai.id),
    email: "",
    displayName: `${ai.firstName} ${ai.lastName}`,
    firstName: ai.firstName,
    lastName: ai.lastName,
    photoURL: ai.photos?.[0],
    photos: ai.photos,
    gender: ai.gender,
    interestedIn: ai.interestedIn,
    age: ai.age,
    country: ai.country,
    city: ai.city,
    occupation: ai.occupation,
    bio: ai.bio,
    languages: ai.languages,
    interests: ai.interests,
    online: ai.online,
    subscriptionStatus: "active",
    profileComplete: true,
    isAi: true,
  };
}

export async function getAIProfileAsParticipant(uid: string): Promise<UserProfile | null> {
  const id = stripAiPrefix(uid);
  const profile = await getAIProfile(id);
  if (!profile) return null;
  return toUserProfile(profile);
}

export async function getAIProfilesAsUserProfiles(count: number): Promise<UserProfile[]> {
  const profiles = await getRandomAIProfiles(count);
  return profiles.map(toUserProfile);
}
