import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  CircleHelp,
  GraduationCap,
  Images,
  MessageSquareQuote,
  ShoppingBag,
} from "lucide-react";

import { StatCard } from "@/components/admin/StatCard";
import { useBookings } from "@/lib/appointments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const stats = [
  { label: "Pending appointments", value: "12", delta: "+3 this week", icon: CalendarCheck },
  { label: "Gallery images", value: "248", delta: "+18 this month", icon: Images },
  { label: "Active courses", value: "4", delta: "2 enrolling", icon: GraduationCap },
  { label: "Shop products", value: "8", delta: "+1 this month", icon: ShoppingBag },
];

const appointments = [
  { name: "Aisha K.", service: "Bridal full-hand", date: "Aug 12", status: "Pending" },
  { name: "Li Wei", service: "Course: Beginner Basics", date: "Aug 10", status: "Confirmed" },
  { name: "Sunita M.", service: "Party design", date: "Aug 9", status: "Pending" },
  { name: "Chen Yuki", service: "Bridal trial", date: "Aug 8", status: "Completed" },
  { name: "Prerana S.", service: "Arabic half-hand", date: "Aug 7", status: "Confirmed" },
] as const;

const activity = [
  { icon: MessageSquareQuote, text: "New testimonial submitted by SK", time: "2 hours ago" },
  { icon: Images, text: "12 images added to the Bridal gallery", time: "Yesterday" },
  { icon: ShoppingBag, text: "Product “Bridal Cone Kit” details updated", time: "Yesterday" },
  { icon: CircleHelp, text: "FAQ answer edited (Chinese version)", time: "2 days ago" },
] as const;

const quickActions = [
  { label: "Add gallery images", to: "/admin/gallery" },
  { label: "Manage appointments", to: "/admin/appointments" },
  { label: "Update products", to: "/admin/products" },
] as const;

function statusVariant(status: string) {
  if (status === "Confirmed") return "default" as const;
  if (status === "Completed") return "secondary" as const;
  if (status === "Cancelled") return "destructive" as const;
  return "outline" as const;
}

function AdminDashboard() {
  // Live booking data from the Appointments manager (falls back to demo rows).
  const { active: bookings } = useBookings();
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const liveStats = useMemo(
    () =>
      stats.map((s, i) =>
        i === 0
          ? {
              ...s,
              value: String(pendingCount),
              delta:
                pendingCount === 0
                  ? "No pending requests"
                  : `${pendingCount} awaiting confirmation`,
            }
          : s,
      ),
    [pendingCount],
  );
  const appointmentRows = useMemo(() => {
    if (bookings.length === 0) return [...appointments];
    return [...bookings]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map((b) => ({
        name: b.name,
        service: b.service || "Appointment",
        date: new Date(`${b.date}T12:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
      }));
  }, [bookings]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Welcome back, Nagma</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening at the studio today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.to} asChild variant="outline" size="sm">
              <Link to={action.to}>
                {action.label}
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {liveStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Tables + activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Recent appointment requests</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/appointments">
                View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="pr-6 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentRows.map((a) => (
                  <TableRow key={`${a.name}-${a.date}`}>
                    <TableCell className="pl-6 font-medium">{a.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {a.service}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{a.date}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{item.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Dashboard preview with demo data — live stats arrive once the backend is connected.
      </p>
    </div>
  );
}
