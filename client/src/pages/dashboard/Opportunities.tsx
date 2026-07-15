// HONEYMOON — Opportunities Page
// Remote work, AI tasks, freelance gigs, language exchange & collaboration
// Firestore-backed: fetched once on load / via Refresh (no live listeners).
// Only listings the admin has marked available are shown here.

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase, Search, Globe, Code, Pen, Mic, BookOpen, Plus,
  MapPin, Clock, DollarSign, Users, ArrowRight, Star, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAvailableOpportunities,
  seedOpportunitiesIfEmpty,
  relativeTime,
  type OpportunityDoc,
} from "@/services/opportunity.service";

const CATEGORIES = [
  { label: "All", value: "all", icon: Globe },
  { label: "Remote Work", value: "remote", icon: Globe },
  { label: "AI Tasks", value: "ai", icon: Code },
  { label: "Freelance", value: "freelance", icon: Briefcase },
  { label: "Language Exchange", value: "language", icon: BookOpen },
  { label: "Collaboration", value: "collab", icon: Mic },
  { label: "Writing", value: "writing", icon: Pen },
];

const TYPE_ICONS: Record<string, any> = {
  ai: Code, remote: Globe, freelance: Briefcase,
  language: BookOpen, collab: Mic, writing: Pen,
};

const TYPE_COLORS: Record<string, string> = {
  ai: "bg-violet-50 text-violet-600",
  remote: "bg-blue-50 text-blue-600",
  freelance: "bg-amber-50 text-amber-600",
  language: "bg-green-50 text-green-600",
  collab: "bg-pink-50 text-pink-600",
  writing: "bg-orange-50 text-orange-600",
};

export default function OpportunitiesPage() {
  useAuth();
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OpportunityDoc | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", type: "remote", pay: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await seedOpportunitiesIfEmpty();
      const data = await getAvailableOpportunities();
      setOpportunities(data);
    } catch {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = opportunities.filter((o) =>
    (category === "all" || o.type === category) &&
    (
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.company.toLowerCase().includes(search.toLowerCase()) ||
      o.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const featured = filtered.filter((o) => o.featured);
  const regular = filtered.filter((o) => !o.featured);

  const handleApply = (opp: OpportunityDoc) => {
    toast.success(`Application submitted for "${opp.title}"! The poster will contact you soon.`);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Opportunity posted! It will be reviewed and published shortly.");
    setPostOpen(false);
    setPostForm({ title: "", type: "remote", pay: "", description: "" });
  };

  return (
    <DashboardLayout pageTitle="Opportunities">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Opportunities</h1>
          <p className="mt-1 text-muted-foreground">Remote work, AI tasks, freelance gigs & language exchange</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                Post Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Playfair_Display']">Post an Opportunity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePost} className="space-y-4 mt-2">
                <div>
                  <Label className="text-sm mb-1 block">Title</Label>
                  <Input
                    placeholder="e.g. React Developer — Part-time"
                    value={postForm.title}
                    onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Category</Label>
                  <Select value={postForm.type} onValueChange={(v) => setPostForm((p) => ({ ...p, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote Work</SelectItem>
                      <SelectItem value="ai">AI Tasks</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="language">Language Exchange</SelectItem>
                      <SelectItem value="collab">Collaboration</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Pay / Compensation</Label>
                  <Input
                    placeholder="e.g. $20/hr, $500/mo, Exchange"
                    value={postForm.pay}
                    onChange={(e) => setPostForm((p) => ({ ...p, pay: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Description</Label>
                  <Textarea
                    placeholder="Describe the opportunity, requirements, and how to apply..."
                    value={postForm.description}
                    onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Post Opportunity</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-5 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title, company, or skill..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              category === c.value
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary hover:text-primary"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} className="text-amber-500" fill="currentColor" />
                <h2 className="font-semibold text-sm text-foreground">Featured</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {featured.map((opp) => <OpportunityCard key={opp.id} opp={opp} onApply={handleApply} onView={setSelected} />)}
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div>
              {featured.length > 0 && <h2 className="font-semibold text-sm text-foreground mb-3">All Opportunities</h2>}
              <div className="grid gap-4 md:grid-cols-2">
                {regular.map((opp) => <OpportunityCard key={opp.id} opp={opp} onApply={handleApply} onView={setSelected} />)}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Briefcase size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">No opportunities found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
            </div>
          )}
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TYPE_COLORS[selected.type] || "bg-muted text-muted-foreground"}`}>
                  {(() => { const Icon = TYPE_ICONS[selected.type] || Briefcase; return <Icon size={20} />; })()}
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold leading-tight">{selected.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{selected.company}</p>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={14} />{selected.location}</span>
                <span className="flex items-center gap-1"><DollarSign size={14} />{selected.pay}</span>
                <span className="flex items-center gap-1"><Clock size={14} />{relativeTime(selected.postedAt)}</span>
                <span className="flex items-center gap-1"><Users size={14} />{selected.applicants} applicants</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => { handleApply(selected); setSelected(null); }}>
                Apply Now <ArrowRight size={16} />
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </DashboardLayout>
  );
}

function OpportunityCard({
  opp,
  onApply,
  onView,
}: {
  opp: OpportunityDoc;
  onApply: (o: OpportunityDoc) => void;
  onView: (o: OpportunityDoc) => void;
}) {
  const Icon = TYPE_ICONS[opp.type] || Briefcase;
  const colorClass = TYPE_COLORS[opp.type] || "bg-muted text-muted-foreground";

  return (
    <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm leading-tight">{opp.title}</h3>
              {opp.featured && (
                <Badge className="bg-amber-100 text-amber-700 text-xs shrink-0">Featured</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{opp.company} · {opp.location}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {opp.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold text-primary text-sm">{opp.pay}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users size={12} />
                <span>{opp.applicants}</span>
                <span>·</span>
                <span>{relativeTime(opp.postedAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(opp)}>
            View Details
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onApply(opp)}>
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
