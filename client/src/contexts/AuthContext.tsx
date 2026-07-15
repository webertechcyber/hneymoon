// ============================================================
// HONEYMOON — Auth Context
// Full subscription-aware authentication state
// ============================================================

"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getProfile } from "@/services/profile.service";
import { registerUser, loginUser, logoutUser, resetUserPassword } from "@/services/auth.service";
import type { UserProfile, SubscriptionStatus } from "@/types";
import { emptyProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  isAdmin: boolean;
  isSubscribed: boolean;
  subscriptionStatus: SubscriptionStatus;
  refreshProfile: () => Promise<void>;
  register: typeof registerUser;
  login: (email: string, password: string) => Promise<User>;
  logout: typeof logoutUser;
  resetPassword: typeof resetUserPassword;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("pending");
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const data = await getProfile(currentUser.uid);
      setProfile(data);
      setIsAdmin(data.admin === true);
      const status = (data.subscriptionStatus ?? "pending") as SubscriptionStatus;
      setSubscriptionStatus(status);
      setIsSubscribed(status === "active");
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await refreshProfile();
      } else {
        setProfile(emptyProfile);
        setIsAdmin(false);
        setIsSubscribed(false);
        setSubscriptionStatus("pending");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [refreshProfile]);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin,
    isSubscribed,
    subscriptionStatus,
    refreshProfile,
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    resetPassword: resetUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
