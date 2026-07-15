import { ReactNode } from "react";
import {
  LayoutDashboard, Compass, MessageCircle, Briefcase, Wallet,
  Gift, Bell, UserCircle2, Settings as SettingsIcon,
} from "lucide-react";
import AppShell, { type NavSection } from "@/components/layout/AppShell";

type Props = {
  children: ReactNode;
  pageTitle?: string;
};

const sections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Discover", href: "/discover", icon: Compass },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Opportunities", href: "/opportunities", icon: Briefcase },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Earnings & Wallet", href: "/earnings", icon: Wallet },
      { label: "Referrals", href: "/referrals", icon: Gift },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/profile", icon: UserCircle2 },
      { label: "Settings", href: "/settings", icon: SettingsIcon },
    ],
  },
];

export default function DashboardLayout({ children, pageTitle }: Props) {
  return (
    <AppShell sections={sections} brandLabel="Member area" pageTitle={pageTitle}>
      {children}
    </AppShell>
  );
}
