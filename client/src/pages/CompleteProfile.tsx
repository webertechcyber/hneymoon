// HONEYMOON — Complete Profile Page
// Shown right after email verification, before a subscription is required.
// Standalone (no dashboard shell) — matches the onboarding feel of Checkout/Subscription.

import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, User, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profile.service";
import { COUNTRIES } from "@/lib/constants";

const schema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.string().min(1, "Please select your gender"),
  interestedIn: z.string().min(1, "Please select who you're interested in"),
  age: z.string().min(1, "Please enter your age"),
  country: z.string().min(1, "Please select your country"),
  city: z.string().optional(),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
});
type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile.displayName || "",
      gender: profile.gender || "",
      interestedIn: profile.interestedIn || "",
      age: profile.age ? String(profile.age) : "",
      country: profile.country || "",
      city: profile.city || "",
      bio: profile.bio || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateProfile(profile.uid, {
        displayName: data.displayName,
        gender: data.gender as any,
        interestedIn: data.interestedIn as any,
        age: Number(data.age),
        country: data.country,
        city: data.city,
        bio: data.bio,
        profileComplete: true,
      });
      await refreshProfile();
      toast.success("Profile completed!");
      navigate("/subscription");
    } catch {
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-8">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Heart size={26} className="text-primary" fill="currentColor" />
          <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground sm:text-3xl">
              Complete your profile
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us a bit about yourself so we can personalize your experience.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full name</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="displayName" className="pl-10" placeholder="Your name" {...register("displayName")} />
                </div>
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={watch("gender")} onValueChange={(v) => setValue("gender", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Interested in</Label>
                  <Select value={watch("interestedIn")} onValueChange={(v) => setValue("interestedIn", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Men</SelectItem>
                      <SelectItem value="female">Women</SelectItem>
                      <SelectItem value="everyone">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.interestedIn && <p className="text-sm text-destructive">{errors.interestedIn.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={18} max={100} placeholder="25" {...register("age")} />
                  {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={watch("country")} onValueChange={(v) => setValue("country", v, { shouldValidate: true })}>
                    <SelectTrigger><Globe size={14} className="mr-1 text-muted-foreground" /><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City (optional)</Label>
                <Input id="city" placeholder="Nairobi" {...register("city")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">A little about you (optional)</Label>
                <Textarea id="bio" rows={3} placeholder="Share a bit about yourself..." {...register("bio")} />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Saving..." : <>Continue<ArrowRight size={16} /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
