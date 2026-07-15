// HONEYMOON — Messages Page
// Conversation list + realtime chat thread. Uses the existing realtime
// message.service (onSnapshot) — messaging is expected to be live, unlike
// admin lists which are refresh-only by design.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Send, Search, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToConversations,
  subscribeToMessages,
  sendUserMessage,
  markMessagesRead,
  checkAndSendDueAIReply,
} from "@/services/message.service";
import { getProfile } from "@/services/profile.service";
import { getAIProfileAsParticipant, isAiUid } from "@/services/ai-profile.service";
import type { Conversation, ChatMessage, UserProfile } from "@/types";

export default function MessagesPage() {
  const { user } = useAuth();
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const activeId = params.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserProfile>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !conversations.length) return;
    const missing = conversations
      .flatMap((c) => c.users)
      .filter((uid) => uid !== user.uid && !participants[uid]);
    if (!missing.length) return;
    const uniqueMissing = Array.from(new Set(missing));
    Promise.all(
      uniqueMissing.map((uid) =>
        isAiUid(uid) ? getAIProfileAsParticipant(uid) : getProfile(uid),
      ),
    ).then((profiles) => {
      setParticipants((prev) => {
        const next = { ...prev };
        profiles.forEach((p) => { if (p) next[p.uid] = p; });
        return next;
      });
    });
  }, [conversations, user, participants]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    const unsub = subscribeToMessages(activeId, setMessages);
    if (user) markMessagesRead(activeId, user.uid).catch(() => {});
    return unsub;
  }, [activeId, user]);

  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(() => {
      checkAndSendDueAIReply(activeId).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const otherUserOf = useCallback((c: Conversation) => {
    const otherId = c.users.find((u) => u !== user?.uid);
    return otherId ? participants[otherId] : undefined;
  }, [participants, user]);

  const handleSend = async () => {
    if (!text.trim() || !activeId || !user) return;
    const value = text.trim();
    setText("");
    try {
      await sendUserMessage(activeId, user.uid, value);
    } catch {
      setText(value);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const other = otherUserOf(c);
    return (other?.displayName || "").toLowerCase().includes(search.toLowerCase());
  });

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeOther = activeConversation ? otherUserOf(activeConversation) : undefined;

  return (
    <DashboardLayout pageTitle="Messages">
      <div className="grid h-[calc(100vh-8.5rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <Card className={`overflow-hidden ${activeId ? "hidden md:block" : ""}`}>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8 h-9" placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-3.5rem)]">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                No conversations yet. Head to Discover to say hello.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const other = otherUserOf(c);
                const unread = c.unreadCount?.[user?.uid || ""] || 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/messages/${c.id}`)}
                    className={`flex w-full items-center gap-3 border-b border-border/60 p-3 text-left hover:bg-muted/50 ${activeId === c.id ? "bg-muted" : ""}`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={other?.photoURL} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(other?.displayName || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground flex items-center gap-1.5">
                          {other?.displayName || "Member"}
                          {other?.isAi && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary shrink-0">
                              <Bot size={9} />AI
                            </span>
                          )}
                        </p>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage || "Say hello 👋"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </ScrollArea>
        </Card>

        <Card className={`flex flex-col overflow-hidden ${!activeId ? "hidden md:flex" : "flex"}`}>
          {!activeId ? (
            <CardContent className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <MessageCircle size={40} className="mb-3 text-muted-foreground/30" />
              Select a conversation to start chatting
            </CardContent>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate("/messages")}>
                  <ArrowLeft size={18} />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activeOther?.photoURL} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(activeOther?.displayName || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {activeOther?.displayName || "Member"}
                    {activeOther?.isAi && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary shrink-0">
                        <Bot size={9} />AI Companion
                      </span>
                    )}
                  </p>
                  {activeOther?.online && !activeOther?.isAi && <p className="text-xs text-green-600">Online</p>}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-2">
                  {messages.map((m) => {
                    const mine = m.senderId === user?.uid;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <Input
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
