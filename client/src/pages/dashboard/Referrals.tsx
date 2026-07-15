// HONEYMOON — Referrals Page

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Heart, Gift, Copy, RefreshCw, Users, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getReferralStats } from "@/services/subscription.service";
import { getCountryCurrency } from "@/lib/constants";

export default function ReferralsPage() {
  const { profile, refreshProfile, logout } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  const { symbol, currency } = getCountryCurrency(profile.country);
  const referralGoal = profile.referralChoice ?? 0;
  const completed = stats.paid;
  const remaining = Math.max(0, referralGoal - completed);
  const progress = referralGoal > 0 ? (completed / referralGoal) * 100 : 0;
  const isComplete = referralGoal > 0 && completed >= referralGoal;

  useEffect(() => {
    if (profile.uid) {
      getReferralStats(profile.uid).then(setStats);
    }
  }, [profile.uid]);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshProfile();
    if (profile.uid) {
      const s = await getReferralStats(profile.uid);
      setStats(s);
    }
    toast.success("Referral progress updated!");
    setLoading(false);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-pink-50">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={24} className="text-primary" fill="currentColor" />
            <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/subscription")}>
              Change Plan
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-12 max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Gift size={32} className="text-primary" />
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">
            Your Referral Progress
          </h1>
          <p className="mt-3 text-muted-foreground">
            Invite {referralGoal} friend{referralGoal > 1 ? "s" : ""} who pay to unlock your membership.
          </p>
        </div>

        {/* Status card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {isComplete ? (
              <div className="flex items-center gap-4 rounded-xl bg-green-50 p-4 border border-green-100">
                <CheckCircle2 size={32} className="text-green-500 shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Goal Reached! 🎉</p>
                  <p className="text-sm text-green-700">Your subscription is now active. Welcome to HONEYMOON!</p>
                </div>
                <Button className="ml-auto" onClick={() => navigate("/profile")}>
                  Go to Dashboard <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{completed} / {referralGoal} paid referrals</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                  <Clock size={16} />
                  <span>{remaining} more paying referral{remaining !== 1 ? "s" : ""} needed to unlock your account</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{referralGoal}</p>
              <p className="text-xs text-muted-foreground mt-1">Goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completed}</p>
              <p className="text-xs text-muted-foreground mt-1">Paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{remaining}</p>
              <p className="text-xs text-muted-foreground mt-1">Remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Membership price */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your membership price</p>
                <p className="text-3xl font-extrabold text-primary mt-1">
                  {symbol} {profile.amountDue} {currency}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {profile.referralChoice === 0 ? "Pay Now" : `Refer ${profile.referralChoice}`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Share links */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Share Your Referral
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Referral Link</p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3">
                  <p className="flex-1 truncate text-sm font-mono text-foreground">
                    {profile.referralLink || `${window.location.origin}/register?ref=${profile.referralCode}`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => handleCopy(profile.referralLink || `${window.location.origin}/register?ref=${profile.referralCode}`, "Link")}
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Referral Code</p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3">
                  <p className="flex-1 text-sm font-mono font-bold text-foreground tracking-widest">
                    {profile.referralCode || "—"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => handleCopy(profile.referralCode || "", "Code")}
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Progress"}
          </Button>

          <Button
            className="w-full gap-2"
            onClick={() => navigate("/checkout")}
          >
            Pay Remaining Balance Instead
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
