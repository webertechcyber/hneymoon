// ============================================================
// HONEYMOON — App Shell
// Shared responsive sidebar + topbar used by the dashboard and
// admin layouts. Desktop: collapsible sidebar. Mobile: sidebar
// becomes a slide-over sheet triggered from the topbar.
// ============================================================

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Heart,
  Bell,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

type AppShellProps = {
  children: ReactNode;
  sections: NavSection[];
  brandLabel?: string;
  pageTitle?: string;
};

function isActivePath(current: string, href: string) {
  if (href === "/") return current === "/";
  return current === href || current.startsWith(href + "/");
}

export default function AppShell({ children, sections, brandLabel, pageTitle }: AppShellProps) {
  const [location] = useLocation();
  const { profile, user, logout } = useAuth();

  const initials =
    (profile?.displayName || user?.email || "?")
      .trim()
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
            <Heart size={22} className="shrink-0 text-primary" fill="currentColor" />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-['Playfair_Display'] text-base font-bold leading-none text-sidebar-foreground truncate">
                HONEYMOON
              </p>
              {brandLabel && (
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{brandLabel}</p>
              )}
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {sections.map((section, i) => (
            <SidebarGroup key={section.label ?? i}>
              {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActivePath(location, item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {!!item.badge && (
                        <Badge className="absolute right-2 top-1.5 h-5 min-w-5 justify-center bg-primary px-1 text-[10px] text-primary-foreground group-data-[collapsible=icon]:hidden">
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                <Avatar className="h-7 w-7 rounded-lg">
                  <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-medium">{profile?.displayName || "My Account"}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronDown className="ml-auto size-4 shrink-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Signed in as {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings"><SettingsIcon className="mr-2 size-4" />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/"><ExternalLink className="mr-2 size-4" />Visit site</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 size-4" />Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0 flex-1">
            {pageTitle && (
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{pageTitle}</h1>
            )}
          </div>
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
