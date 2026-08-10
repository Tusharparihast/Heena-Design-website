import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ExternalLink, LogOut, Menu, Moon, PanelLeft, Search, Settings, Sun, User } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getInitials, useCurrentAdmin } from "@/lib/use-current-admin";

interface AdminTopbarProps {
  title: string;
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
}

export function AdminTopbar({ title, onOpenMobile, onToggleCollapse }: AdminTopbarProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const navigate = useNavigate();
  const { name, email } = useCurrentAdmin();
  const { notifications, unreadCount, loading: notifLoading, markAllRead } = useAdminNotifications();

  async function handleLogout() {
    await supabase.auth.signOut();
    void navigate({ to: "/admin/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:gap-3 sm:px-6">
      {/* Mobile hamburger */}
      <Button variant="ghost" size="icon" onClick={onOpenMobile} aria-label="Open menu" className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
        className="hidden lg:inline-flex"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      <h1 className="truncate font-display text-lg font-semibold sm:text-xl">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search content…"
            className="w-52 rounded-full bg-secondary/60 pl-9 lg:w-64"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu
          onOpenChange={(open) => {
            if (open && unreadCount > 0) markAllRead();
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-henna px-1 text-[10px] font-bold leading-none text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[70vh] w-80 overflow-y-auto">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && <span className="text-xs font-normal text-muted-foreground">{unreadCount} new</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled className="justify-center py-4 text-xs text-muted-foreground">
                {notifLoading ? "Loading…" : "No notifications yet"}
              </DropdownMenuItem>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem key={n.id} asChild className="cursor-pointer py-2.5">
                  <Link to={n.to} className="flex flex-col items-start gap-0.5">
                    <span className="flex w-full items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-henna" />}
                      <span className="text-sm font-medium leading-snug">{n.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {n.detail} · {relativeTime(n.at)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>


        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
          {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Admin profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Admin profile menu"
              className="ml-1 rounded-full outline-none ring-ring transition-shadow focus-visible:ring-2"
            >
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary font-display text-xs font-bold text-primary-foreground">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs font-normal text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/admin/$section" params={{ section: "settings" }}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/">
                <ExternalLink className="mr-2 h-4 w-4" /> View website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => void handleLogout()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
