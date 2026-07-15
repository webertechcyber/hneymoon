import { ReactNode } from "react";
import {
  LayoutDashboard, Users, CreditCard, Gift, Flag, Bot,
  Wallet, Settings as SettingsIcon, Briefcase,
} from "lucide-react";
import AppShell, { type NavSection } from "@/components/layout/AppShell";

type Props = {
  children: ReactNode;
  pageTitle?: string;
};

const sections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
      { label: "Referrals", href: "/admin/referrals", icon: Gift },
      { label: "Reports", href: "/admin/reports", icon: Flag },
      { label: "AI Profiles", href: "/admin/ai", icon: Bot },
      { label: "Opportunities", href: "/admin/opportunities", icon: Briefcase },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
    ],
  },
];

export default function AdminLayout({ children, pageTitle }: Props) {
  return (
    <AppShell sections={sections} brandLabel="Admin console" pageTitle={pageTitle}>
      {children}
    </AppShell>
  );
}
