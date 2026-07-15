// HONEYMOON — Verify Email Page

import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, Mail, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const handleRefreshStatus = async () => {
    try {
      setLoadingRefresh(true);
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        toast.success("Email verified! Redirecting...");
        navigate("/subscription");
      } else {
        toast.info("Email not yet verified. Please check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to refresh. Please try again.");
    } finally {
      setLoadingRefresh(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoadingResend(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email sent!");
      } else {
        toast.error("No user found. Please log in again.");
        navigate("/login");
      }
    } catch (error) {
      toast.error("Unable to send email right now. Try again in a minute.");
    } finally {
      setLoadingResend(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-background to-pink-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Heart size={28} className="text-primary" fill="currentColor" />
          <span className="font-['Playfair_Display'] text-2xl font-bold text-primary">HONEYMOON</span>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Mail size={36} className="text-primary" />
            </div>

            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground">
              Check your email
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We've sent a verification link to{" "}
              <span className="font-semibold text-foreground">{user?.email}</span>.
              Click the link to verify your account.
            </p>

            <div className="mt-8 space-y-3">
              <Button
                onClick={handleRefreshStatus}
                disabled={loadingRefresh}
                className="w-full gap-2"
              >
                <RefreshCw size={16} className={loadingRefresh ? "animate-spin" : ""} />
                {loadingRefresh ? "Checking..." : "I've Verified My Email"}
              </Button>

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={loadingResend}
                className="w-full gap-2"
              >
                <Send size={16} />
                {loadingResend ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Wrong email?{" "}
                <button
                  onClick={handleLogout}
                  className="text-primary hover:underline font-medium"
                >
                  Sign out and try again
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
