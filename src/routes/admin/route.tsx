import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { adminNavItems } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Nagma Designs" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const current =
    pathname === "/admin" || pathname === "/admin/"
      ? adminNavItems[0]
      : adminNavItems.find((item) => !item.exact && pathname.startsWith(item.to));
  const title = current?.label ?? "Admin";

  // The login page renders bare, without the dashboard chrome.
  if (pathname === "/admin/login") return <Outlet />;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out",
          collapsed ? "lg:ml-18" : "lg:ml-64",
        )}
      >
        <AdminTopbar
          title={title}
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AdminAuthGate>
            <Outlet />
          </AdminAuthGate>
        </main>
      </div>
    </div>
  );
}
