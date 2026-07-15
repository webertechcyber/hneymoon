// ============================================================
// HONEYMOON — Messaging Service
// ============================================================

import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  where,
  getDocs,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Conversation, ChatMessage } from "@/types";

export async function getOrCreateConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  const q = query(
    collection(db, "conversations"),
    where("users", "array-contains", userId1)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
    const users = d.data().users as string[];
    return users.includes(userId2);
  });

  if (existing) return existing.id;

  const ref = await addDoc(collection(db, "conversations"), {
    users: [userId1, userId2],
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(
    collection(db, "conversations"),
    where("users", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const conversations: Conversation[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Conversation));
    callback(conversations);
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const messages: ChatMessage[] = snap.docs.map((d) => ({
      id: d.id,
      conversationId,
      ...d.data(),
    } as ChatMessage));
    callback(messages);
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  const batch = writeBatch(db);

  const msgRef = doc(collection(db, "conversations", conversationId, "messages"));
  batch.set(msgRef, {
    conversationId,
    senderId,
    text,
    read: false,
    createdAt: serverTimestamp(),
  });

  batch.update(doc(db, "conversations", conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

// ============================================================
// AI companion auto-replies
// Scripted, not a real model — simple canned lines sent after a
// human-feeling delay. No backend function is deployed for this
// project, so the delay is checked client-side: whenever any
// participant has the conversation open, Messages.tsx polls
// checkAndSendDueAIReply() every few seconds and it fires once
// the scheduled time has passed.
// ============================================================

const AI_SCRIPTED_REPLIES = [
  "Hello!",
  "Hello, how are you?",
  "Hi there! Thanks for reaching out 😊",
  "Hey! How's your day going?",
  "Hi! Nice to hear from you.",
  "Hello! What are you up to today?",
  "Hey, good to meet you here!",
  "Hi! I'd love to know more about you.",
];

function isAiParticipant(uid: string): boolean {
  return uid.startsWith("ai_");
}

function randomDelayMs(): number {
  return 6000 + Math.floor(Math.random() * 29000);
}

export async function sendUserMessage(
  conversationId: string,
  senderId: string,
  text: string,
): Promise<void> {
  await sendMessage(conversationId, senderId, text);

  const convoSnap = await getDoc(doc(db, "conversations", conversationId));
  if (!convoSnap.exists()) return;
  const users = (convoSnap.data().users as string[]) || [];
  const aiParticipant = users.find((u) => isAiParticipant(u) && u !== senderId);
  if (!aiParticipant) return;

  const reply = AI_SCRIPTED_REPLIES[Math.floor(Math.random() * AI_SCRIPTED_REPLIES.length)];
  await updateDoc(doc(db, "conversations", conversationId), {
    aiParticipantId: aiParticipant,
    pendingAiReplyAt: Date.now() + randomDelayMs(),
    pendingAiReplyText: reply,
  });
}

export async function checkAndSendDueAIReply(conversationId: string): Promise<void> {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as any;
  const dueAt: number | undefined = data.pendingAiReplyAt;
  const replyText: string | undefined = data.pendingAiReplyText;
  const aiParticipantId: string | undefined = data.aiParticipantId;

  if (!dueAt || !replyText || !aiParticipantId) return;
  if (Date.now() < dueAt) return;

  const batch = writeBatch(db);
  const msgRef = doc(collection(db, "conversations", conversationId, "messages"));
  batch.set(msgRef, {
    conversationId,
    senderId: aiParticipantId,
    text: replyText,
    read: false,
    createdAt: serverTimestamp(),
  });
  batch.update(ref, {
    lastMessage: replyText,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    pendingAiReplyAt: null,
    pendingAiReplyText: null,
  });
  await batch.commit();
}

export async function markMessagesRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (d.data().senderId !== userId) {
      batch.update(d.ref, { read: true });
    }
  });
  await batch.commit();
}
