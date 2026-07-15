// HONEYMOON — Dashboard Home
// Overview of the member's activity: profile completeness, messages,
// notifications, referral progress and quick links. Data is fetched
// once on load / on demand via the Refresh button (no live listeners).

import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  Compass, MessageCircle, Briefcase, Wallet, Gift, Bell,
  RefreshCw, ArrowRight, UserCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

function computeCompleteness(profile: any): number {
  const fields = ["displayName", "bio", "photoURL", "country", "city", "occupation", "age", "interests"];
  const filled = fields.filter((f) => {
    const v = profile?.[f];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [paidReferrals, setPaidReferrals] = useState(0);

  const loadOverview = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const convosSnap = await getDocs(
        query(collection(db, "conversations"), where("users", "array-contains", user.uid))
      );
      const unreadMsgTotal = convosSnap.docs.reduce((sum, d) => {
        const unread = d.data().unreadCount || {};
        return sum + (unread[user.uid] || 0);
      }, 0);
      setUnreadMessages(unreadMsgTotal);

      const notifSnap = await getDocs(
        query(collection(db, "notifications"), where("uid", "==", user.uid), where("read", "==", false))
      );
      setUnreadNotifications(notifSnap.size);

      const referralsSnap = await getDocs(
        query(collection(db, "referrals"), where("referrerId", "==", user.uid), where("status", "==", "payment_completed"))
      );
      setPaidReferrals(referralsSnap.size);
    } catch {
      // best-effort overview; silently ignore individual query failures
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const completeness = computeCompleteness(profile);

  const quickLinks = [
    { label: "Discover people", href: "/discover", icon: Compass, color: "bg-pink-100 text-pink-700" },
    { label: "Messages", href: "/messages", icon: MessageCircle, color: "bg-blue-100 text-blue-700", badge: unreadMessages },
    { label: "Opportunities", href: "/opportunities", icon: Briefcase, color: "bg-amber-100 text-amber-700" },
    { label: "Earnings & wallet", href: "/earnings", icon: Wallet, color: "bg-green-100 text-green-700" },
    { label: "Referrals", href: "/referrals", icon: Gift, color: "bg-violet-100 text-violet-700" },
    { label: "Notifications", href: "/notifications", icon: Bell, color: "bg-slate-100 text-slate-700", badge: unreadNotifications },
  ];

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back{profile?.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Here's what's happening with your account today.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOverview} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Profile completeness</p>
              <UserCircle2 size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{completeness}%</p>
            <Progress value={completeness} className="mt-3" />
            {completeness < 100 && (
              <Link href="/profile" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Finish your profile <ArrowRight size={12} />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Unread messages</p>
              <MessageCircle size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{loading ? "—" : unreadMessages}</p>
            <Link href="/messages" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Open inbox <ArrowRight size={12} />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Notifications</p>
              <Bell size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{loading ? "—" : unreadNotifications}</p>
            <Link href="/notifications" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Paid referrals</p>
              <Gift size={18} className="text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{loading ? "—" : paidReferrals}</p>
            <Link href="/referrals" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Grow your network <ArrowRight size={12} />
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick links</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className={`relative flex h-11 w-11 items-center justify-center rounded-full ${link.color}`}>
                  <link.icon size={20} />
                  {!!link.badge && (
                    <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center bg-primary px-1 text-[10px] text-primary-foreground">
                      {link.badge > 99 ? "99+" : link.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground sm:text-sm">{link.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
