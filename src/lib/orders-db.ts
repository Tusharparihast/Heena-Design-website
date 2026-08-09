// ============= Database-backed shop order requests =============

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const orderStatuses = ["new", "confirmed", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unitPriceNpr: number;
}

export interface AdminOrder {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  wechat: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  contactMethod: string;
  items: OrderItem[];
  totalNpr: number;
  locale: string;
  status: OrderStatus;
  trashed: boolean;
}

interface OrderRow {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  wechat: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  contact_method: string;
  items: unknown;
  total_npr: number;
  locale: string;
  status: string;
  trashed_at: string | null;
}

function asOrderStatus(value: string): OrderStatus {
  return (orderStatuses as readonly string[]).includes(value) ? (value as OrderStatus) : "new";
}

function rowToOrder(row: OrderRow): AdminOrder {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  return {
    id: row.id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    phone: row.phone,
    wechat: row.wechat,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    notes: row.notes,
    contactMethod: row.contact_method,
    items: rawItems.map((raw) => {
      const i = raw as Record<string, unknown>;
      return {
        id: String(i['id'] ?? ""),
        name: String(i['name'] ?? ""),
        qty: Number(i['qty'] ?? 0),
        unitPriceNpr: Number(i['unit_price_npr'] ?? 0),
      };
    }),
    totalNpr: row.total_npr,
    locale: row.locale,
    status: asOrderStatus(row.status),
    trashed: row.trashed_at != null,
  };
}

/** All order requests (active + trashed) for the admin dashboard. */
export function useDbOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("order_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrders((data ?? []).map((row) => rowToOrder(row as OrderRow)));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { orders, loading, refresh };
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const { error } = await supabase.from("order_requests").update({ status }).eq("id", id);
  return !error;
}

export async function setOrderTrashed(id: string, trashed: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("order_requests")
    .update({ trashed_at: trashed ? new Date().toISOString() : null })
    .eq("id", id);
  return !error;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { error } = await supabase.from("order_requests").delete().eq("id", id);
  return !error;
}
