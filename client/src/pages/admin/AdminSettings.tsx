// HONEYMOON — Admin Settings
// Platform configuration and system management

import { useState } from "react";
import {
  Settings, Globe, Shield, Zap, Save, RefreshCw,
  DollarSign, Users, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [platformName, setPlatformName] = useState("HONEYMOON");
  const [supportEmail, setSupportEmail] = useState("support@honeymoon.app");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(true);
  const [aiProfilesEnabled, setAiProfilesEnabled] = useState(true);
  const [opportunitiesEnabled, setOpportunitiesEnabled] = useState(true);
  const [referralSystemEnabled, setReferralSystemEnabled] = useState(true);
  const [maxReferrals, setMaxReferrals] = useState("5");
  const [basePrice, setBasePrice] = useState("29");

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success("Platform settings saved successfully");
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Platform Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure and manage the HONEYMOON platform</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <><RefreshCw size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save Changes</>}
        </Button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* General */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Globe size={18} className="text-primary" /></div>
              <div><p className="font-semibold text-foreground">General</p><p className="text-xs text-muted-foreground">Platform identity and contact</p></div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Users size={18} className="text-primary" /></div>
              <div><p className="font-semibold text-foreground">Registration & Access</p><p className="text-xs text-muted-foreground">Control who can join and how</p></div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-3">
            {[
              { label: "Open Registrations", desc: "Allow new users to create accounts", value: registrationsOpen, set: setRegistrationsOpen },
              { label: "Email Verification Required", desc: "Users must verify email before subscribing", value: emailVerificationRequired, set: setEmailVerificationRequired },
              { label: "Subscription Required", desc: "Users must activate subscription to access dashboard", value: subscriptionRequired, set: setSubscriptionRequired },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div><p className="font-medium text-sm text-foreground">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
                <Switch checked={item.value} onCheckedChange={item.set} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><DollarSign size={18} className="text-primary" /></div>
              <div><p className="font-semibold text-foreground">Pricing & Referrals</p><p className="text-xs text-muted-foreground">Subscription pricing configuration</p></div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Base Price (USD)</Label>
                <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
                <p className="text-xs text-muted-foreground">Country pricing is calculated from this base</p>
              </div>
              <div className="space-y-2">
                <Label>Max Referrals for Free Access</Label>
                <Input type="number" value={maxReferrals} onChange={(e) => setMaxReferrals(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div><p className="font-medium text-sm text-foreground">Referral System</p><p className="text-xs text-muted-foreground mt-0.5">Allow users to unlock access by referring friends</p></div>
              <Switch checked={referralSystemEnabled} onCheckedChange={setReferralSystemEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Zap size={18} className="text-primary" /></div>
              <div><p className="font-semibold text-foreground">Features</p><p className="text-xs text-muted-foreground">Enable or disable platform features</p></div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-3">
            {[
              { label: "AI Profiles", desc: "Show AI-generated profiles in discover", value: aiProfilesEnabled, set: setAiProfilesEnabled },
              { label: "Opportunities", desc: "Enable the opportunities/jobs section", value: opportunitiesEnabled, set: setOpportunitiesEnabled },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div><p className="font-medium text-sm text-foreground">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
                <Switch checked={item.value} onCheckedChange={item.set} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Shield size={18} className="text-primary" /></div>
              <div><p className="font-semibold text-foreground">Maintenance</p><p className="text-xs text-muted-foreground">System maintenance controls</p></div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-4">
            <div className={`flex items-center justify-between rounded-xl border-2 p-4 transition-colors ${maintenanceMode ? "border-amber-300 bg-amber-50" : "border-border"}`}>
              <div>
                <p className="font-medium text-sm text-foreground flex items-center gap-2">
                  Maintenance Mode
                  {maintenanceMode && <Badge className="bg-amber-100 text-amber-700 text-xs">Active</Badge>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {maintenanceMode ? "Platform is offline. Only admins can access." : "Enable to take the platform offline"}
                </p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Cache cleared")}>
                <RefreshCw size={14} />Clear Cache
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Database backup started")}>
                <Shield size={14} />Backup Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform info */}
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Heart size={18} className="text-primary" fill="currentColor" />
            <p className="font-semibold text-foreground">HONEYMOON Platform</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Version</p><p className="font-medium text-foreground">1.0.0</p></div>
            <div><p className="text-xs text-muted-foreground">Environment</p><Badge className="bg-green-100 text-green-700 text-xs mt-0.5">Production</Badge></div>
            <div><p className="text-xs text-muted-foreground">Database</p><Badge className="bg-blue-100 text-blue-700 text-xs mt-0.5">Firebase</Badge></div>
            <div><p className="text-xs text-muted-foreground">Auth</p><Badge className="bg-orange-100 text-orange-700 text-xs mt-0.5">Firebase Auth</Badge></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
