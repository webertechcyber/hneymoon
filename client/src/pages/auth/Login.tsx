// HONEYMOON — Login Page

import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFirebaseErrorMessage } from "@/lib/constants";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  useSEO({ title: "Sign In", description: "Sign in to your HONEYMOON account and connect with people worldwide.", url: "/login", noIndex: true });
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const user = await login(data.email, data.password);
      if (!user.emailVerified) {
        navigate("/verify-email");
        return;
      }
      // Check subscription status — redirect accordingly
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      // Note: Using static imports is preferred but kept for compatibility
      const snap = await getDoc(doc(db, "users", user.uid));
      const userData = snap.data();
      // Admin users bypass subscription gate
      if (userData?.admin === true || userData?.role === "admin") {
        navigate("/admin");
      } else if (userData?.subscriptionStatus === "active") {
        navigate("/profile");
      } else {
        navigate("/subscription");
      }
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Heart size={28} fill="currentColor" />
          <span className="font-['Playfair_Display'] text-2xl font-bold">HONEYMOON</span>
        </div>
        <div>
          <h2 className="font-['Playfair_Display'] text-4xl font-bold leading-tight">
            Welcome back to the world's relationship platform.
          </h2>
          <p className="mt-4 text-primary-foreground/80 leading-relaxed">
            Your connections, conversations, and opportunities are waiting for you.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Active Members", value: "50K+" },
            { label: "Countries", value: "120+" },
            { label: "Daily Matches", value: "2K+" },
            { label: "Messages/Day", value: "50K+" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-primary-foreground/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <Heart size={24} className="text-primary" fill="currentColor" />
            <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
          </div>

          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Sign in</h1>
          <p className="mt-2 text-muted-foreground">Welcome back! Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
