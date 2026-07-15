// ============================================================
// HONEYMOON — Landing Page
// The world's relationship and opportunity platform
// ============================================================

import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { Heart, Globe, Users, Briefcase, Star, ArrowRight, MessageCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Heart,
    title: "Find Love",
    description: "Meet compatible partners from around the world with smart matching.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Users,
    title: "Make Friends",
    description: "Build genuine friendships across cultures and continents.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Globe,
    title: "Language Exchange",
    description: "Learn and teach languages with native speakers worldwide.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Briefcase,
    title: "Opportunities",
    description: "Find remote work, freelance gigs, AI tasks, and collaborators.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

const STATS = [
  { value: "50K+", label: "Members Worldwide" },
  { value: "120+", label: "Countries" },
  { value: "1M+", label: "Connections Made" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function LandingPage() {
  useSEO({
    title: "Find Love & Connections Worldwide",
    description: "Join HONEYMOON — the world's relationship and opportunity platform. Connect for love, friendship, travel, language exchange, and freelancing. 50K+ members, 120+ countries.",
    keywords: "dating app, find love, meet people, relationship platform, honeymoon, online dating, friendship, travel companion",
    url: "/",
  });
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={24} className="text-primary" fill="currentColor" />
            <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition hover:text-foreground">How It Works</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-16">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <img src="/manus-storage/honeymoon-hero_2bb8f10c.jpg" alt="HONEYMOON" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
        </div>

        <div className="container py-24">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-white/20 text-white backdrop-blur-sm border-white/30 text-sm px-4 py-1.5 gap-2">
              <Star size={12} className="text-amber-400" fill="currentColor" />
              The world's relationship & opportunity platform
            </Badge>

            <h1 className="font-['Playfair_Display'] text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              One Profile.
              <br />
              <span className="text-rose-300">Endless Connections.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg text-white/80 leading-relaxed">
              Find love, make friends, learn languages, discover travel partners,
              and unlock global opportunities — all from a single profile.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2 px-8 py-6 text-base bg-primary hover:bg-primary/90">
                  Start for Free
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2 px-8 py-6 text-base border-white/50 text-white hover:bg-white/20">
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-white/60">
              Join 50,000+ members from 120+ countries · Free to join
            </p>
          </div>
        </div>

        {/* Floating profile cards */}
        <div className="relative mx-auto mt-16 max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: "Sophia, 24", location: "London 🇬🇧", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
              { name: "Daniel, 29", location: "Toronto 🇨🇦", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
              { name: "Amara, 25", location: "Accra 🇬🇭", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop" },
              { name: "Michael, 31", location: "Berlin 🇩🇪", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop" },
            ].map((p) => (
              <div
                key={p.name}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.location}</p>
                </div>
                <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-['Playfair_Display'] text-4xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">Platform Features</Badge>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-foreground">
              More than a dating app
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              HONEYMOON is your gateway to meaningful human connections across every dimension of life.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                    <Icon size={24} className={f.color} />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">Simple Process</Badge>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-foreground">
              How HONEYMOON works
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description: "Sign up, verify your email, and build your profile with photos, interests, and goals.",
                icon: Users,
              },
              {
                step: "02",
                title: "Activate Membership",
                description: "Choose to pay directly or refer friends to unlock your full access at a discount.",
                icon: Shield,
              },
              {
                step: "03",
                title: "Connect & Grow",
                description: "Swipe, match, message, and explore opportunities with people worldwide.",
                icon: MessageCircle,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative rounded-2xl bg-card border border-border/50 p-8 shadow-sm">
                  <span className="font-['Playfair_Display'] text-6xl font-bold text-primary/10 absolute top-4 right-6">
                    {s.step}
                  </span>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">Membership</Badge>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-foreground">
              Flexible pricing for everyone
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Pay full price for instant access, or refer friends to unlock massive discounts.
              Pricing is localized to your country.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4 max-w-4xl mx-auto">
            {[
              { title: "Pay Now", badge: null, discount: "Full Price", desc: "Instant access, no referrals needed." },
              { title: "Refer 1", badge: "Save 17%", discount: "17% off", desc: "Invite 1 paying friend." },
              { title: "Refer 2", badge: "Save 44%", discount: "44% off", desc: "Invite 2 paying friends." },
              { title: "Refer 5", badge: "Best Value", discount: "61% off", desc: "Invite 5 paying friends." },
            ].map((p, i) => (
              <div
                key={p.title}
                className={`rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 ${
                  i === 3
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border/50 bg-card shadow-sm"
                }`}
              >
                {p.badge && (
                  <span className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    i === 3 ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {p.badge}
                  </span>
                )}
                <h3 className={`text-lg font-bold ${i === 3 ? "text-white" : "text-foreground"}`}>{p.title}</h3>
                <p className={`mt-1 text-2xl font-bold ${i === 3 ? "text-white" : "text-primary"}`}>{p.discount}</p>
                <p className={`mt-2 text-xs ${i === 3 ? "text-white/80" : "text-muted-foreground"}`}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-['Playfair_Display'] text-4xl font-bold">
            Ready to connect with the world?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of members finding love, friendship, and opportunity on HONEYMOON.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 gap-2 px-8 py-6 text-base font-semibold"
            >
              Create Your Free Account
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-10">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-primary" fill="currentColor" />
            <span className="font-semibold text-foreground">HONEYMOON</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 HONEYMOON. The world's relationship & opportunity platform.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition">Privacy</a>
            <a href="#" className="hover:text-foreground transition">Terms</a>
            <a href="#" className="hover:text-foreground transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
