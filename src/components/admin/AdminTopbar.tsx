import { Link, useNavigate } from "@tanstack/react-router";
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
  ChevronDown,
  ChevronUp,
  Package,
  Image,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

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
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";

import { searchAdminData, type AdminSearchResult } from "@/lib/admin-search";
import { relativeTime, useAdminNotifications } from "@/lib/admin-notifications";
import { useAdminCatalog } from "@/lib/shop-catalog-db";
import { useEffectiveGalleryItems } from "@/lib/gallery-overrides";
import { useDbBookings } from "@/lib/bookings-db";
import { useDbOrders } from "@/lib/orders-db";
import { useFaqOverrides, adminFaqItems } from "@/lib/faq-overrides";
import { useTestimonialOverrides, adminTestimonials } from "@/lib/testimonial-overrides";
import { en } from "@/i18n/en";
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
  const { products } = useAdminCatalog();
  const galleryItems = useEffectiveGalleryItems("gallery");
  const studentWorkItems = useEffectiveGalleryItems("student");
  const { bookings } = useDbBookings();
  const { orders } = useDbOrders();
  const faqOverrides = useFaqOverrides();
  const testimonialOverrides = useTestimonialOverrides();

  const faqItems = adminFaqItems(faqOverrides);
  const testimonialItems = adminTestimonials(testimonialOverrides);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(-1);

  const searchData: AdminSearchResult[] = [
    ...products.map((product) => ({
      id: product.id,
      title: product.nameEn,
      description: product.bodyEn,
      section: "Products",
      to: "/admin/products",
    })),

    ...galleryItems.map((item) => ({
      id: item.id,
      title: item.en,
      description: item.categories.join(", "),
      section: "Gallery",
      to: "/admin/gallery",
    })),

    ...studentWorkItems.map((item) => ({
      id: item.id,
      title: item.en,
      description: item.categories.join(", "),
      section: "Student Work",
      to: "/admin/gallery",
    })),

    ...bookings.map((booking) => ({
      id: booking.id,
      title: booking.name,
      description: `${booking.service} · ${booking.date}`,
      section: "Appointments",
      to: "/admin/appointments",
    })),

    ...orders.map((order) => ({
      id: order.id,
      title: order.customerName,
      description: `${order.phone} · ${order.items.map((item) => item.name).join(", ")}`,
      section: "Orders",
      to: "/admin/orders",
    })),

    ...testimonialItems.map(({ item }) => ({
      id: item.id,
      title: item.nameEn,
      description: item.reviewEn,
      section: "Testimonials",
      to: "/admin/testimonials",
    })),

    ...faqItems.map((item) => ({
      id: item.id,
      title: item.questionEn,
      description: item.answerEn,
      section: "FAQ",
      to: "/admin/faq",
    })),

    ...en.courses.items.map((course) => ({
      id: course.name,
      title: course.name,
      description: `${course.level} · ${course.duration} · ${course.body}`,
      section: "Courses",
      to: "/admin/courses",
    })),
  ];

  const searchResults = searchAdminData(searchQuery, searchData);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchQuery.trim() || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    }

    if (e.key === "Enter" && searchIndex >= 0) {
      e.preventDefault();

      const result = searchResults[searchIndex];

      if (result) {
        void navigate({ to: result.to });
        setSearchQuery("");
        setSearchIndex(-1);
      }
    }

    if (e.key === "Escape") {
      setSearchQuery("");
      setSearchIndex(-1);
    }
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    void navigate({ to: "/admin/login" });
  }

  const getSearchIcon = (section: string) => {
    switch (section) {
      case "Products":
        return <Package className="h-4 w-4" />;
      case "Gallery":
      case "Student Work":
        return <Image className="h-4 w-4" />;
      case "Appointments":
        return <CalendarDays className="h-4 w-4" />;
      case "Orders":
        return <ShoppingBag className="h-4 w-4" />;
      case "Testimonials":
        return <MessageSquare className="h-4 w-4" />;
      case "FAQ":
        return <HelpCircle className="h-4 w-4" />;
      case "Courses":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

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
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchIndex(-1);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search content…"
            className="w-52 rounded-full bg-secondary/60 pl-9 pr-9 lg:w-64"
          />

          {searchQuery.trim() && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">No results found.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto py-1">
                  {searchResults.map((result, index) => (
                    <Link
                      key={`${result.section}-${result.id}`}
                      to={result.to}
                      onClick={() => {
                        setSearchQuery("");
                        setSearchIndex(-1);
                      }}
                      className={`block px-4 py-3 transition-colors hover:bg-secondary ${
                        index === searchIndex ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted-foreground">{getSearchIcon(result.section)}</div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium">{result.title}</p>

                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{result.section}</span>

                            {result.description && (
                              <span className="truncate text-xs text-muted-foreground">· {result.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
