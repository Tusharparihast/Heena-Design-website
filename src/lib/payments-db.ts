import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentMethod {
  id: string;
  label: string;
  qrImage: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  active: boolean;
  sortOrder: number;
}

interface PaymentMethodRow {
  id: string;
  label: string;
  qr_image: string;
  account_name: string;
  account_number: string;
  instructions: string;
  active: boolean;
  sort_order: number;
}

function rowToMethod(r: PaymentMethodRow): PaymentMethod {
  return {
    id: r.id,
    label: r.label,
    qrImage: r.qr_image,
    accountName: r.account_name,
    accountNumber: r.account_number,
    instructions: r.instructions,
    active: r.active,
    sortOrder: r.sort_order,
  };
}

let publicCache: PaymentMethod[] | null = null;

/** Active payment methods, for the order confirmation screen. */
export function usePublicPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>(publicCache ?? []);
  const [loading, setLoading] = useState(!publicCache);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      const next = (data ?? []).map((r) => rowToMethod(r as PaymentMethodRow)).filter((m) => m.active);
      publicCache = next;
      setMethods(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { methods, loading };
}

/** All payment methods (active + inactive), for the admin dashboard. */
export function useAdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });
    setMethods((data ?? []).map((r) => rowToMethod(r as PaymentMethodRow)));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { methods, loading, refresh };
}

export interface PaymentMethodInput {
  label: string;
  qrImage: string;
  accountName?: string;
  accountNumber?: string;
  instructions?: string;
  active?: boolean;
  sortOrder?: number;
}

export async function insertPaymentMethod(m: PaymentMethodInput): Promise<boolean> {
  const { error } = await supabase.from("payment_methods").insert({
    label: m.label,
    qr_image: m.qrImage,
    account_name: m.accountName ?? "",
    account_number: m.accountNumber ?? "",
    instructions: m.instructions ?? "",
    active: m.active ?? true,
    sort_order: m.sortOrder ?? 0,
  });
  if (error) console.error("insertPaymentMethod failed:", error);
  return !error;
}

export async function updatePaymentMethod(id: string, patch: Partial<PaymentMethodInput>): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (patch.label !== undefined) payload.label = patch.label;
  if (patch.qrImage !== undefined) payload.qr_image = patch.qrImage;
  if (patch.accountName !== undefined) payload.account_name = patch.accountName;
  if (patch.accountNumber !== undefined) payload.account_number = patch.accountNumber;
  if (patch.instructions !== undefined) payload.instructions = patch.instructions;
  if (patch.active !== undefined) payload.active = patch.active;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { error } = await supabase.from("payment_methods").update(payload).eq("id", id);
  if (error) console.error("updatePaymentMethod failed:", error);
  return !error;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) console.error("deletePaymentMethod failed:", error);
  return !error;
}
