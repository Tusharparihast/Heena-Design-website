// ============= Live admin notification feed =============
// Builds the topbar bell feed from real database rows (appointment requests,
// shop order requests and catalogue changes), keeps it in sync through
// Postgres realtime, and remembers which items have been read in this browser.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTables } from "./admin-metrics";
import { playNotificationChime, showBrowserNotification } from "./notification-prefs";

export type AdminNotificationKind = "appointment" | "order" | "product";
export type AdminNotificationLink = "/admin/appointments" | "/admin/orders" | "/admin/products";

export interface AdminNotification {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  detail: string;
  at: string;
  to: AdminNotificationLink;
  read: boolean;
}

const READ_KEY = "nd-admin-read-notifications";
const MAX_ITEMS = 20;

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* storage unavailable — read state is best effort */
  }
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface RawItem {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  detail: string;
  at: string;
  to: AdminNotificationLink;
}

async function fetchFeed(): Promise<RawItem[]> {
  const [bookings, orders, products] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, name, service, kind, status, created_at, trashed_at")
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    supabase
      .from("order_requests")
      .select("id, customer_name, total_npr, status, created_at, trashed_at")
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    supabase
      .from("products")
      .select("id, name_en, created_at, updated_at, deleted")
      .order("updated_at", { ascending: false })
      .limit(MAX_ITEMS),
  ]);

  const items: RawItem[] = [];

  for (const row of bookings.data ?? []) {
    if (row.trashed_at) continue;
    const isDesign = row.kind === "custom-design";
    items.push({
      id: `appointment:${row.id}`,
      kind: "appointment",
      title: `${isDesign ? "New custom design request" : "New appointment request"} — ${row.name}`,
      detail: row.service || (isDesign ? "Custom design" : "Appointment"),
      at: row.created_at,
      to: "/admin/appointments",
    });
  }

  for (const row of orders.data ?? []) {
    if (row.trashed_at) continue;
    items.push({
      id: `order:${row.id}`,
      kind: "order",
      title: `New shop order request — ${row.customer_name}`,
      detail: `NPR ${Number(row.total_npr ?? 0).toLocaleString("en-US")} · ${row.status}`,
      at: row.created_at,
      to: "/admin/orders",
    });
  }

  for (const row of products.data ?? []) {
    if (row.deleted) continue;
    const created = new Date(row.created_at).getTime();
    const updated = new Date(row.updated_at).getTime();
    const isNew = Math.abs(updated - created) < 2000;
    items.push({
      id: `product:${row.id}:${row.updated_at}`,
      kind: "product",
      title: `${isNew ? "New product added" : "Product updated"} — ${row.name_en}`,
      detail: isNew ? "Published to the shop" : "Details changed",
      at: row.updated_at,
      to: "/admin/products",
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_ITEMS);
}

export function useAdminNotifications() {
  const [raw, setRaw] = useState<RawItem[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const firstLoadRef = useRef(true);

  const refresh = useCallback(async () => {
    const items = await fetchFeed();
    setRaw((prev) => {
      const isNewItem = items.length > 0 && (prev.length === 0 || items[0]?.id !== prev[0]?.id);
      if (!firstLoadRef.current && isNewItem) {
        playNotificationChime();
        const top = items[0];
        if (top) showBrowserNotification(top.title, top.detail);
      }
      return items;
    });
    firstLoadRef.current = false;
    setLoading(false);
  }, []);

  useEffect(() => {
    setRead(readIds());
    void refresh();
  }, [refresh]);

  useRealtimeTables(["bookings", "order_requests", "products"], refresh);

  const notifications = useMemo<AdminNotification[]>(
    () => raw.map((item) => ({ ...item, read: read.has(item.id) })),
    [raw, read],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setRead((prev) => {
      const next = new Set(prev);
      for (const item of raw) next.add(item.id);
      writeIds(next);
      return next;
    });
  }, [raw]);

  return { notifications, unreadCount, loading, refresh, markAllRead };
}
