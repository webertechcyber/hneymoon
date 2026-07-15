// HONEYMOON — Subscription Page
// The gate: user must activate subscription to access dashboard

import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, Crown, Check, ArrowRight, Users, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getCountryCurrency, getReferralAmount, REFERRAL_OPTIONS } from "@/lib/constants";
import { subscriptionService } from "@/services/subscription.service";
import { paymentService } from "@/services/payment.service";

const PLAN_ICONS = [Zap, Users, Users, Gift];
const PLAN_COLORS = ["border-border", "border-blue-200", "border-violet-200", "border-primary"];
const PLAN_BG = ["bg-card", "bg-blue-50/50", "bg-violet-50/50", "bg-primary"];
const PLAN_TEXT = ["text-foreground", "text-foreground", "text-foreground", "text-primary-foreground"];

export default function SubscriptionPage() {
  const { profile, logout, refreshProfile, isAdmin } = useAuth();
  const [, navigate] = useLocation();

  // Admin users are whitelisted — redirect to admin dashboard
  if (isAdmin) {
    navigate("/admin");
    return null;
  }
  const [loading, setLoading] = useState<number | null>(null);

  const { currency, amount, symbol } = getCountryCurrency(profile.country);
  const isKenya = profile.country?.toLowerCase() === "kenya";

  const plans = REFERRAL_OPTIONS.map((opt, i) => ({
    ...opt,
    title: opt.referrals === 0 ? "Pay Now" : `Refer ${opt.referrals} Friend${opt.referrals > 1 ? "s" : ""}`,
    price: getReferralAmount(amount, opt.referrals as 0 | 1 | 2 | 5),
    currency,
    symbol,
    badge: opt.referrals === 5 ? "Best Value" : opt.referrals === 0 ? null : `Save ${opt.discountPct}%`,
  }));

  const handleSelectPlan = async (
  referrals: 0 | 1 | 2 | 5,
) => {

  if (!profile) return;

  try {

    setLoading(referrals);

    //
    // Save subscription
    /*
    console.log("PROFILE", profile);
    console.log("UID", profile.uid);
    */

    await subscriptionService.selectPlan(
      profile.uid,
      referrals,
    );

    //
    // Refresh profile
    //

    await refreshProfile();

    //
    // Direct membership
    //

    if (referrals === 0) {

      const payment = await paymentService.createPayment(profile.uid);

      
      navigate("/checkout", {
  state: {
    payment: payment.paymentId,
  },
});

return;

      toast.error(
        "Unable to start payment."
      );

      return;

    }

    //
    // Referral plans
    //

    toast.success(
      `Invite ${referrals} paying friend${
        referrals > 1 ? "s" : ""
      } to unlock your membership.`
    );

    navigate("/referrals");

  } catch (error) {

    console.error(error);

    toast.error(
      "Unable to activate your membership."
    );

  } finally {

    setLoading(null);

  }

};

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-pink-50">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={24} className="text-primary" fill="currentColor" />
            <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Hi, {profile.displayName || "there"}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Crown size={32} className="text-primary" />
          </div>
          <h1 className="font-['Playfair_Display'] text-4xl font-bold text-foreground">
            Activate Your Membership
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Choose how you'd like to unlock full access. Pay directly or refer friends to save up to 61%.
            Your membership is priced for <strong>{profile.country || "your country"}</strong>.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Badge variant="secondary">
              {symbol} {amount} {currency} base price
            </Badge>
            {isKenya && (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                M-Pesa accepted
              </Badge>
            )}
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const Icon = PLAN_ICONS[i];
            const isPopular = i === 3;
            return (
              <Card
                key={plan.referrals}
                className={`relative overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${PLAN_COLORS[i]} ${isPopular ? "shadow-lg shadow-primary/20" : ""}`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 right-0 rounded-bl-xl px-3 py-1 text-xs font-bold ${isPopular ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                    {plan.badge}
                  </div>
                )}
                <CardContent className={`p-6 ${isPopular ? PLAN_BG[i] : ""}`}>
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${isPopular ? "bg-white/20" : "bg-primary/10"}`}>
                    <Icon size={20} className={isPopular ? "text-white" : "text-primary"} />
                  </div>

                  <h3 className={`text-lg font-bold ${PLAN_TEXT[i]}`}>{plan.title}</h3>
                  <div className={`mt-2 flex items-baseline gap-1 ${PLAN_TEXT[i]}`}>
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-sm opacity-80">{currency}</span>
                  </div>
                  <p className={`mt-2 text-sm ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    {plan.referrals === 0 ? (
                      <div className={`flex items-center gap-2 text-xs ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
                        <Check size={12} />
                        Instant access after payment
                      </div>
                    ) : (
                      <>
                        <div className={`flex items-center gap-2 text-xs ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
                          <Check size={12} />
                          Pay reduced price
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
                          <Check size={12} />
                          Unlock when {plan.referrals} friend{plan.referrals > 1 ? "s" : ""} pay
                        </div>
                      </>
                    )}
                    <div className={`flex items-center gap-2 text-xs ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
                      <Check size={12} />
                      Full platform access
                    </div>
                  </div>

                  <Button
                    className={`mt-6 w-full gap-2 ${isPopular ? "bg-white text-primary hover:bg-white/90" : ""}`}
                    variant={isPopular ? "secondary" : "default"}
                    disabled={loading !== null}
                    onClick={() =>
                    handleSelectPlan(plan.referrals as 0 | 1 | 2 | 5,)
                    }
                    >
                    {loading === plan.referrals ? "Processing..." : (
                      <>
                        {plan.referrals === 0 ? "Pay Now" : "Choose Plan"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Unlimited Swipes",
              "Real-time Messaging",
              "AI Profile Matches",
              "Discover Opportunities",
              "Language Exchange",
              "Travel Partners",
              "Profile Visibility Boost",
              "Priority Support",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <Check size={14} className="text-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
