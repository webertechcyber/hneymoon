// HONEYMOON — Notifications Page
// Fetched once on load and via the Refresh button (no live listener).
// Paginated list, click to mark as read.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, Heart, MessageCircle, Gift, CreditCard, Info, RefreshCw, CheckCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataPagination from "@/components/DataPagination";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  collection, getDocs, query, where, orderBy, updateDoc, doc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppNotification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, any> = {
  match: Heart,
  message: MessageCircle,
  like: Heart,
  referral_joined: Gift,
  referral_paid: Gift,
  subscription_activated: CreditCard,
  system: Info,
};

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "notifications"), where("uid", "==", user.uid), orderBy("createdAt", "desc"))
      );
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = items.filter((n) => !n.read).length;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  );

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch {
      // best-effort
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read);
    if (!unread.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update all notifications");
    }
  };

  return (
    <DashboardLayout pageTitle="Notifications">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!unreadCount} className="gap-2">
            <CheckCheck size={14} />Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <Bell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">You're all caught up — no notifications yet.</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((n) => {
              const Icon = ICONS[n.type] || Info;
              return (
                <Card
                  key={n.id}
                  className={`cursor-pointer transition-shadow hover:shadow-sm ${!n.read ? "border-primary/40 bg-primary/5" : ""}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        {!n.read && <Badge className="bg-primary text-[10px] text-primary-foreground">New</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={items.length} pageSize={PAGE_SIZE} />
        </>
      )}
    </DashboardLayout>
  );
}
