import { Link } from "@tanstack/react-router";
import {
  Bell,
  ExternalLink,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";

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

interface AdminTopbarProps {
  title: string;
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
}

const notifications = [
  { title: "New appointment request — Bridal full-hand", time: "10 min ago" },
  { title: "Course inquiry: Beginner Basics (WeChat)", time: "1 hour ago" },
  { title: "New testimonial awaiting approval", time: "Yesterday" },
];

export function AdminTopbar({ title, onOpenMobile, onToggleCollapse }: AdminTopbarProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:gap-3 sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="lg:hidden"
      >
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-henna" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.title}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
              >
                <span className="text-sm font-medium leading-snug">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-xs text-muted-foreground">
              Demo data — live alerts come with the backend phase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
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
                  ND
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">Nagma</p>
              <p className="text-xs font-normal text-muted-foreground">Studio admin</p>
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
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/" className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
