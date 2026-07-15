// HONEYMOON — Settings Page
import { useState } from "react";
import { Shield, Bell, Eye, Globe, Trash2, LogOut, Lock, Camera, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SettingsPage() {
  const { profile, logout } = useAuth();
  const [, navigate] = useLocation();
  const [notifs, setNotifs] = useState({ matches: true, messages: true, referrals: true, email: true });
  const [privacy, setPrivacy] = useState({ showOnline: true, showDistance: true, incognito: false });
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwData, setPwData] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Signed out successfully");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwData.newPw !== pwData.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    if (pwData.newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Not authenticated");
      const credential = EmailAuthProvider.credential(user.email, pwData.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwData.newPw);
      toast.success("Password updated successfully!");
      setShowPwForm(false);
      setPwData({ current: "", newPw: "", confirm: "" });
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else {
        toast.error(err.message || "Failed to update password");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const savePrivacySettings = async (key: string, value: boolean) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    if (profile.uid) {
      try {
        await updateDoc(doc(db, "users", profile.uid), { privacySettings: updated });
        toast.success("Privacy settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    }
  };

  const initials = profile.displayName?.slice(0, 2).toUpperCase() || "HM";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Summary */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                onClick={() => toast.info("Photo upload — go to Profile to update your photos")}
              >
                <Camera size={12} />
              </button>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{profile.displayName || "Your Name"}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                {profile.profileComplete && (
                  <Badge variant="secondary" className="text-xs">Profile Complete</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/profile")}>
              <User size={14} />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              Account
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Address</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {profile.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Subscription</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.subscriptionStatus} membership</p>
              </div>
              <Badge className={`text-xs ${profile.subscriptionStatus === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {profile.subscriptionStatus === "active" ? "Active" : profile.subscriptionStatus}
              </Badge>
            </div>
            <Separator />
            <div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowPwForm(!showPwForm)}
              >
                <Lock size={14} />
                {showPwForm ? "Cancel" : "Change Password"}
              </Button>
              {showPwForm && (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Current Password</Label>
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={pwData.current}
                      onChange={(e) => setPwData((p) => ({ ...p, current: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">New Password</Label>
                    <Input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={pwData.newPw}
                      onChange={(e) => setPwData((p) => ({ ...p, newPw: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</Label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={pwData.confirm}
                      onChange={(e) => setPwData((p) => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={pwLoading}>
                    {pwLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Notifications
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "matches", label: "New Matches", desc: "When someone likes you back" },
              { key: "messages", label: "New Messages", desc: "When you receive a message" },
              { key: "referrals", label: "Referral Updates", desc: "When your referral pays" },
              { key: "email", label: "Email Notifications", desc: "Receive updates by email" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch
                  checked={notifs[n.key as keyof typeof notifs]}
                  onCheckedChange={(v) => {
                    setNotifs((p) => ({ ...p, [n.key]: v }));
                    toast.success(`${n.label} ${v ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye size={18} className="text-primary" />
              Privacy
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "showOnline", label: "Show Online Status", desc: "Let others see when you're online" },
              { key: "showDistance", label: "Show Distance", desc: "Show your approximate location" },
              { key: "incognito", label: "Incognito Mode", desc: "Browse profiles without being seen" },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Switch
                  checked={privacy[p.key as keyof typeof privacy]}
                  onCheckedChange={(v) => savePrivacySettings(p.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              Language & Region
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Country</p>
                <p className="text-xs text-muted-foreground">{profile.country || "Not set"}</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => navigate("/profile")}>
                Change <ChevronRight size={14} />
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">App Language</p>
                <p className="text-xs text-muted-foreground">English</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => toast.info("More languages coming soon!")}>
                Change <ChevronRight size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-destructive flex items-center gap-2">
              <Trash2 size={18} />
              Danger Zone
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              These actions are irreversible. Please proceed with caution.
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => toast.error("To delete your account, please contact support@honeymoon.app")}
            >
              <Trash2 size={16} />
              Delete Account
            </Button>
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
