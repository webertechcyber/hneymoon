// HONEYMOON — Discover Page
// Browse active, complete profiles matching the member's preference.
// Data is fetched on load and via the Refresh button (no live listeners).

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Heart, MessageCircle, MapPin, RefreshCw, Search, Users, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscoverProfiles } from "@/services/profile.service";
import { getOrCreateConversation } from "@/services/message.service";
import { getAIProfilesAsUserProfiles, isAiUid } from "@/services/ai-profile.service";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export default function DiscoverPage() {
  const { profile, user } = useAuth();
  const [, navigate] = useLocation();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [messaging, setMessaging] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [realProfiles, aiCompanions] = await Promise.all([
        getDiscoverProfiles(user.uid, profile.interestedIn || "everyone", 40),
        getAIProfilesAsUserProfiles(24),
      ]);
      setProfiles([...realProfiles, ...aiCompanions]);
    } catch {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, [user, profile.interestedIn]);

  useEffect(() => { load(); }, [load]);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.displayName || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.country || "").toLowerCase().includes(q)
    );
  });

  const handleLike = async (target: UserProfile) => {
    if (!user) return;
    if (isAiUid(target.uid)) {
      setLikedIds((prev) => new Set(prev).add(target.uid));
      toast.success(`You liked ${target.displayName || "this profile"}`);
      return;
    }
    try {
      await addDoc(collection(db, "likes"), {
        fromUserId: user.uid,
        toUserId: target.uid,
        createdAt: serverTimestamp(),
      });
      setLikedIds((prev) => new Set(prev).add(target.uid));
      toast.success(`You liked ${target.displayName || "this profile"}`);
    } catch {
      toast.error("Couldn't send like. Try again.");
    }
  };

  const handleMessage = async (target: UserProfile) => {
    if (!user) return;
    setMessaging(target.uid);
    try {
      const conversationId = await getOrCreateConversation(user.uid, target.uid);
      navigate(`/messages/${conversationId}`);
    } catch {
      toast.error("Couldn't start conversation.");
    } finally {
      setMessaging(null);
    }
  };

  return (
    <DashboardLayout pageTitle="Discover">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Discover</h1>
          <p className="mt-1 text-sm text-muted-foreground">{profiles.length} people to meet worldwide</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, city, or country..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No profiles match your search right now.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.uid} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative aspect-square w-full bg-muted">
                {p.photoURL ? (
                  <img src={p.photoURL} alt={p.displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                        {(p.displayName || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                {p.online && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" /> Online
                  </span>
                )}
                {p.isAi && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-white">
                    <Bot size={10} /> AI Companion
                  </span>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-foreground">
                    {p.displayName || "—"}{p.age ? `, ${p.age}` : ""}
                  </p>
                </div>
                {(p.city || p.country) && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin size={11} />{[p.city, p.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {p.bio && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.bio}</p>}
                {!!p.interests?.length && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.interests.slice(0, 3).map((i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] font-normal">{i}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant={likedIds.has(p.uid) ? "secondary" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleLike(p)}
                    disabled={likedIds.has(p.uid)}
                  >
                    <Heart size={14} fill={likedIds.has(p.uid) ? "currentColor" : "none"} />
                    {likedIds.has(p.uid) ? "Liked" : "Like"}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleMessage(p)}
                    disabled={messaging === p.uid}
                  >
                    <MessageCircle size={14} />
                    {messaging === p.uid ? "..." : "Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
