import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Images,
  MessageSquareQuote,
  ShoppingBag,
} from "lucide-react";

import { StatCard } from "@/components/admin/StatCard";
import { useDbBookings } from "@/lib/bookings-db";
import { useAdminMetrics } from "@/lib/admin-metrics";
import { relativeTime, useAdminNotifications } from "@/lib/admin-notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentAdmin } from "@/lib/use-current-admin";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

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

const activityIcons = {
  appointment: CalendarCheck,
  order: ClipboardList,
  product: ShoppingBag,
} as const;

function AdminDashboard() {
  const { name } = useCurrentAdmin();
  const m = useAdminMetrics();
  const { bookings: dbBookings } = useDbBookings();
  const { notifications } = useAdminNotifications();

  const n = (value: number) => (m.loading ? "…" : String(value));

  const stats = useMemo(
    () => [
      {
        label: "Pending appointments",
        value: n(m.pendingAppointments),
        delta: m.loading ? "Loading…" : `${m.totalAppointments} total · ${m.upcomingAppointments} upcoming`,
        icon: CalendarCheck,
      },
      {
        label: "Gallery images",
        value: n(m.galleryImages),
        delta: m.loading ? "Loading…" : `${m.galleryDesigns} designs · ${m.galleryStudent} student work`,
        icon: Images,
      },
      {
        label: "Active courses",
        value: n(m.activeCourses),
        delta: "Published on the courses page",
        icon: GraduationCap,
      },
      {
        label: "Shop products",
        value: n(m.shopProducts),
        delta: m.loading ? "Loading…" : `${m.hiddenProducts} hidden`,
        icon: ShoppingBag,
      },
      {
        label: "New order requests",
        value: n(m.newOrders),
        delta: m.loading ? "Loading…" : `${m.totalOrders} total orders`,
        icon: ClipboardList,
      },
      {
        label: "Testimonials",
        value: n(m.testimonials),
        delta: m.loading ? "Loading…" : `${m.hiddenTestimonials} hidden`,
        icon: MessageSquareQuote,
      },
    ],
    [m],
  );

  const appointmentRows = useMemo(
    () =>
      dbBookings
        .filter((b) => !b.trashed)
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          name: b.name,
          service: b.service || "Appointment",
          date: b.date
            ? new Date(`${b.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—",
          status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
        })),
    [dbBookings],
  );

  const activity = notifications.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Welcome back, {name || "Admin"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening at the studio today.</p>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
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
                {appointmentRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      {m.loading ? "Loading bookings…" : "No booking requests yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  appointmentRows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="pl-6 font-medium">{a.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{a.service}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.date}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              activity.map((item) => {
                const Icon = activityIcons[item.kind];
                return (
                  <Link key={item.id} to={item.to} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(item.at)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        All figures are live from your dashboard sections and update as data changes.
      </p>
    </div>
  );
}
