// HONEYMOON — Profile Page

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Save, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profile.service";
import { COUNTRIES, LANGUAGES } from "@/lib/constants";

const schema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  age: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
  languages: z.array(z.string()).optional(),
});
type FormData = z.infer<typeof schema>;

const INTERESTS = [
  "Travel", "Music", "Fitness", "Cooking", "Reading", "Photography",
  "Art", "Technology", "Business", "Nature", "Movies", "Gaming",
  "Fashion", "Sports", "Yoga", "Dancing", "Writing", "Volunteering",
];

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(profile.languages || []);
  const [country, setCountry] = useState(profile.country || "");
  const [customCountry, setCustomCountry] = useState("");
  const [showCustomCountry, setShowCustomCountry] = useState(profile.country === "Other");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData, any>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile.displayName || "",
      bio: profile.bio || "",
      age: profile.age ? String(profile.age) : "",
      country: profile.country || "",
      city: profile.city || "",
      occupation: profile.occupation || "",
      languages: profile.languages || [],
    },
  });

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 10
        ? [...prev, interest]
        : prev
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any): Promise<void> => {
    try {
      setLoading(true);
      const finalCountry = showCustomCountry ? customCountry : country;
      await updateProfile(profile.uid, {
        ...data,
        country: finalCountry,
        interests: selectedInterests,
        languages: selectedLanguages,
      });
      await refreshProfile();
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const initials = profile.displayName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "HM";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your public profile</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo Card */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="relative mx-auto mb-4 w-fit">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition">
                <Camera size={14} />
              </button>
            </div>
            <p className="font-semibold text-foreground">{profile.displayName}</p>
            <p className="text-sm text-muted-foreground">{profile.city || "No city set"}</p>
            <div className="mt-3 flex justify-center gap-2">
              <Badge variant="secondary">{profile.country}</Badge>
              {profile.subscriptionStatus === "active" && (
                <Badge className="bg-primary/10 text-primary">Active User</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Basic Information
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input {...register("displayName")} />
                    {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" {...register("age")} />
                    {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    {!showCustomCountry ? (
                      <Select value={country} onValueChange={(val) => {
                        setCountry(val);
                        if (val === "Other") {
                          setShowCustomCountry(true);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter your country"
                          value={customCountry}
                          onChange={(e) => setCustomCountry(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCustomCountry(false);
                            setCountry("");
                          }}
                        >
                          Back
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="Your city" {...register("city")} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Input placeholder="What do you do?" {...register("occupation")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell people about yourself..."
                    rows={4}
                    {...register("bio")}
                  />
                  {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Globe size={18} className="text-primary" />
                  Languages
                </h3>
                <p className="text-xs text-muted-foreground">Select languages you speak</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSelectedLanguages((prev) =>
                          prev.includes(lang)
                            ? prev.filter((l) => l !== lang)
                            : [...prev, lang]
                        );
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedLanguages.includes(lang)
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-foreground">Interests</h3>
                <p className="text-xs text-muted-foreground">Select up to 10 interests</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedInterests.includes(interest)
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="gap-2" disabled={loading}>
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
