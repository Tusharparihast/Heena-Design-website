import {
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  Home,
  Images,
  LayoutDashboard,
  MessageSquareQuote,
  Phone,
  QrCode,
  Settings,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Exact path match (used for the dashboard root so it doesn't stay active on sub-pages). */
  exact?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Homepage", to: "/admin/homepage", icon: Home },
  { label: "Gallery", to: "/admin/gallery", icon: Images },
  { label: "Courses", to: "/admin/courses", icon: GraduationCap },
  { label: "Appointments", to: "/admin/appointments", icon: CalendarCheck },
  { label: "Testimonials", to: "/admin/testimonials", icon: MessageSquareQuote },
  { label: "FAQ", to: "/admin/faq", icon: CircleHelp },
  { label: "Products", to: "/admin/products", icon: ShoppingBag },
  { label: "Orders", to: "/admin/orders", icon: ClipboardList },
  { label: "Payment QR Codes", to: "/admin/payments", icon: QrCode },
  { label: "Contact Information", to: "/admin/contact-info", icon: Phone },
  { label: "Media Library", to: "/admin/media", icon: FolderOpen },
  { label: "SEO", to: "/admin/seo", icon: TrendingUp },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];
