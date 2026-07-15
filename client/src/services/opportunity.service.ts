// ============================================================
// HONEYMOON — Opportunities Service
// Firestore-backed (collection: opportunities). Replaces the old
// static local array. Admin controls availability; the public
// Opportunities page only shows listings marked available.
// ============================================================

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit as fsLimit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type OpportunityType = "remote" | "ai" | "freelance" | "language" | "collab" | "writing";

export interface OpportunityDoc {
  id: string;
  title: string;
  company: string;
  type: OpportunityType;
  location: string;
  pay: string;
  tags: string[];
  applicants: number;
  featured: boolean;
  available: boolean;
  description: string;
  postedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const opportunitiesCollection = collection(db, "opportunities");

const SEED_OPPORTUNITIES: Omit<OpportunityDoc, "id" | "postedAt" | "createdAt" | "updatedAt">[] = [
  { title: "React Developer — Part-time", company: "Nimbus Labs", type: "remote", location: "Remote · Worldwide", pay: "$25/hr", tags: ["React", "TypeScript", "Remote"], applicants: 12, featured: true, available: true, description: "Help build out a customer dashboard in React + TypeScript. 15-20 hrs/week, flexible schedule." },
  { title: "AI Chatbot Training — Conversational Data", company: "LinguaAI", type: "ai", location: "Remote", pay: "$18/hr", tags: ["AI", "Data Labeling"], applicants: 34, featured: true, available: true, description: "Label and rate conversational AI outputs for quality and helpfulness. No experience required, training provided." },
  { title: "Freelance Logo & Brand Designer", company: "Self-employed clients", type: "freelance", location: "Remote", pay: "$150-500/project", tags: ["Design", "Branding"], applicants: 8, featured: false, available: true, description: "Multiple small businesses looking for logo and brand identity packages." },
  { title: "English–Swahili Language Exchange Partner", company: "Community", type: "language", location: "Remote", pay: "Exchange", tags: ["Languages", "Teaching"], applicants: 21, featured: false, available: true, description: "Practice English and Swahili together over video calls, 2x per week." },
  { title: "Podcast Co-host — Culture & Travel", company: "Wanderlust Audio", type: "collab", location: "Remote", pay: "Rev share", tags: ["Podcast", "Travel"], applicants: 6, featured: false, available: true, description: "Looking for an engaging co-host for a weekly culture and travel podcast." },
  { title: "Freelance Blog Writer — Fintech", company: "PayRoute Media", type: "writing", location: "Remote", pay: "$0.10/word", tags: ["Writing", "Fintech"], applicants: 17, featured: false, available: true, description: "Ongoing freelance writing for a fintech blog, 2 articles/week." },
  { title: "Data Annotation Specialist", company: "VisionCraft AI", type: "ai", location: "Remote", pay: "$15/hr", tags: ["AI", "Computer Vision"], applicants: 45, featured: false, available: true, description: "Annotate images for a computer vision training dataset." },
  { title: "Virtual Assistant — E-commerce", company: "ShopSwift", type: "remote", location: "Remote", pay: "$8/hr", tags: ["Admin", "E-commerce"], applicants: 29, featured: false, available: true, description: "Handle customer inquiries and order processing for a growing online shop." },
  { title: "French Tutor — Conversational", company: "Community", type: "language", location: "Remote", pay: "$20/hr", tags: ["Languages", "Tutoring"], applicants: 11, featured: false, available: true, description: "Teach conversational French to adult learners, flexible hours." },
  { title: "UGC Video Creator", company: "TrendBox", type: "freelance", location: "Remote", pay: "$50-200/video", tags: ["Video", "Content"], applicants: 22, featured: true, available: true, description: "Create short-form user-generated-content style videos for brands." },
  { title: "Travel Companion — Photo Documentation", company: "Community", type: "collab", location: "Flexible", pay: "Shared costs", tags: ["Travel", "Photography"], applicants: 14, featured: false, available: true, description: "Looking for a travel partner to document a multi-country trip." },
  { title: "Copywriter — SaaS Landing Pages", company: "Northstar Growth", type: "writing", location: "Remote", pay: "$40/hr", tags: ["Copywriting", "SaaS"], applicants: 19, featured: false, available: true, description: "Write high-converting landing page copy for SaaS clients." },
  { title: "AI Prompt Engineer — Contract", company: "PromptWorks", type: "ai", location: "Remote", pay: "$30/hr", tags: ["AI", "Prompt Engineering"], applicants: 27, featured: true, available: true, description: "Design and test prompts for a range of production AI features." },
  { title: "Remote Customer Support Rep", company: "HelpDeskly", type: "remote", location: "Remote", pay: "$12/hr", tags: ["Support", "Remote"], applicants: 38, featured: false, available: true, description: "Provide chat-based customer support across US and EU time zones." },
  { title: "Arabic-English Translator", company: "Community", type: "language", location: "Remote", pay: "$25/hr", tags: ["Translation", "Languages"], applicants: 9, featured: false, available: true, description: "Translate marketing documents between Arabic and English." },
];

function relTimeFromDate(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function relativeTime(ts?: Timestamp | null): string {
  if (!ts) return "recently";
  const d = typeof (ts as any).toDate === "function" ? (ts as any).toDate() : new Date(ts as any);
  return relTimeFromDate(d);
}

export async function seedOpportunitiesIfEmpty(): Promise<number> {
  const existing = await getDocs(query(opportunitiesCollection, fsLimit(1)));
  if (!existing.empty) return 0;

  const batch = writeBatch(db);
  SEED_OPPORTUNITIES.forEach((o) => {
    const ref = doc(opportunitiesCollection);
    batch.set(ref, {
      ...o,
      postedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return SEED_OPPORTUNITIES.length;
}

export async function addMoreOpportunities(count = 15): Promise<number> {
  const pool = SEED_OPPORTUNITIES;
  const batch = writeBatch(db);
  let added = 0;
  for (let i = 0; i < count; i++) {
    const base = pool[i % pool.length];
    const ref = doc(opportunitiesCollection);
    batch.set(ref, {
      ...base,
      applicants: Math.floor(Math.random() * 40),
      postedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }
  await batch.commit();
  return added;
}

export async function getAllOpportunities(): Promise<OpportunityDoc[]> {
  const snap = await getDocs(query(opportunitiesCollection, orderBy("postedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc));
}

export async function getAvailableOpportunities(): Promise<OpportunityDoc[]> {
  const snap = await getDocs(
    query(opportunitiesCollection, where("available", "==", true), orderBy("postedAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc));
}

export async function setOpportunityAvailability(id: string, available: boolean): Promise<void> {
  await updateDoc(doc(opportunitiesCollection, id), { available, updatedAt: serverTimestamp() });
}

export async function deleteOpportunity(id: string): Promise<void> {
  await deleteDoc(doc(opportunitiesCollection, id));
}
