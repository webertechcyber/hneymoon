// HONEYMOON — Register Page

import { useSEO } from "@/hooks/useSEO";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, Eye, EyeOff, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseErrorMessage, COUNTRIES, GOALS } from "@/lib/constants";

const schema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  country: z.string().min(1, "Please select your country"),
  goal: z.string().min(1, "Please select your goal"),
  terms: z.boolean().refine((v) => v === true, "You must accept the terms"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  useSEO({ title: "Create Account", description: "Join HONEYMOON for free. Connect with 50,000+ members across 120+ countries for love, friendship, and opportunities.", url: "/register" });
  const { register: registerUser } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("");
  const [goal, setGoal] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Extract referral code from URL params (e.g. /register?ref=ABC123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      toast.info(`Referral code applied: ${ref}`, { icon: "🎉" });
    }
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await registerUser({ ...data, referredBy: referralCode || undefined });
      toast.success("Account created! Please verify your email.");
      navigate("/verify-email");
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Heart size={28} fill="currentColor" />
          <span className="font-['Playfair_Display'] text-2xl font-bold">HONEYMOON</span>
        </div>
        <div>
          <h2 className="font-['Playfair_Display'] text-4xl font-bold leading-tight">
            Your journey to meaningful connections starts here.
          </h2>
          <p className="mt-4 text-primary-foreground/80 leading-relaxed">
            One profile. Find love, make friends, learn languages, and discover global opportunities.
          </p>
          <div className="mt-8 space-y-3">
            {["Free to create an account", "Localized pricing for your country", "Refer friends to unlock discounts", "Access from anywhere in the world"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span className="text-sm text-primary-foreground/80">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-primary-foreground/60">Join 50,000+ members from 120+ countries</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-background p-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <Heart size={24} className="text-primary" fill="currentColor" />
            <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
          </div>

          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Create account</h1>
          <p className="mt-2 text-muted-foreground">Join the world's relationship & opportunity platform.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Your full name" {...register("displayName")} />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className="pr-10"
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Repeat your password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setValue("country", v, { shouldValidate: true }); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Goal of Joining</Label>
              <Select value={goal} onValueChange={(v) => { setGoal(v); setValue("goal", v, { shouldValidate: true }); }}>
                <SelectTrigger>
                  <SelectValue placeholder="What brings you here?" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-0.5 h-4 w-4 rounded border-border"
                onChange={(e) => setValue("terms", e.target.checked, { shouldValidate: true })}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.terms && <p className="text-sm text-destructive">{errors.terms.message}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
