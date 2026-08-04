import { Link } from "@tanstack/react-router";
import { LogOut, X } from "lucide-react";

import { adminNavItems } from "./admin-nav";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  /** Desktop icon-strip collapse state. */
  collapsed: boolean;
  /** Mobile/tablet off-canvas drawer state. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({ collapsed, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile/tablet overlay */}
      <div
        aria-hidden
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "lg:w-18" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
            ND
          </div>
          <div className={cn("min-w-0", collapsed && "lg:hidden")}>
            <p className="truncate font-display text-base font-semibold leading-tight">
              Nagma Designs
            </p>
            <p className="text-xs text-muted-foreground">Admin Studio</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact ?? false }}
                  onClick={onCloseMobile}
                  title={item.label}
                  activeProps={{
                    className:
                      "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    collapsed && "lg:justify-center lg:px-0",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn("truncate", collapsed && "lg:hidden")}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <Link
            to="/"
            title="Logout"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Logout</span>
          </Link>
          <p
            className={cn(
              "mt-2 px-3 text-[11px] leading-snug text-muted-foreground",
              collapsed && "lg:hidden",
            )}
          >
            UI preview — authentication arrives with the backend phase.
          </p>
        </div>
      </aside>
    </>
  );
}
