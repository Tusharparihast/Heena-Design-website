// ============= Database-backed booking + order logs =============
// Client requests from the public site are inserted anonymously; only
// admins can read or manage them (enforced by row-level security).

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { bookingSources, bookingStatuses, type Booking, type BookingSource, type BookingStatus } from "./appointments";

export interface AdminBooking extends Booking {
  trashed: boolean;
  /** Channels the client marked as preferred (wechat / whatsapp / phone / email). */
  preferredContacts: string[];
  /** Storage paths of reference photos sent with a custom-design request. */
  referencePaths: string[];
}

interface BookingRow {
  id: string;
  created_at: string;
  kind: string;
  name: string;
  contact: string;
  service: string;
  booking_date: string;
  booking_time: string;
  people: number;
  notes: string;
  source: string;
  status: string;
  trashed_at: string | null;
  reference_paths: string[] | null;
  preferred_contacts: string[] | null;
}

function asSource(value: string): BookingSource {
  return (bookingSources as string[]).includes(value) ? (value as BookingSource) : "other";
}

function asStatus(value: string): BookingStatus {
  return (bookingStatuses as string[]).includes(value) ? (value as BookingStatus) : "pending";
}

function rowToBooking(row: BookingRow): AdminBooking {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    service: row.service,
    date: row.booking_date,
    time: row.booking_time,
    people: row.people,
    notes: row.notes,
    source: asSource(row.source),
    status: asStatus(row.status),
    createdAt: row.created_at,
    trashed: row.trashed_at != null,
    referencePaths: Array.isArray(row.reference_paths) ? row.reference_paths : [],
    preferredContacts: Array.isArray(row.preferred_contacts) ? row.preferred_contacts : [],
  };
}

/** All bookings (active + trashed) for the admin dashboard. */
export function useDbBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setBookings((data ?? []).map((row) => rowToBooking(row as BookingRow)));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { bookings, loading, error, refresh };
}

function bookingPayload(b: Booking) {
  return {
    name: b.name.slice(0, 120),
    contact: b.contact.slice(0, 160),
    service: b.service.slice(0, 160),
    booking_date: b.date,
    booking_time: b.time.slice(0, 80),
    people: Math.min(50, Math.max(1, Math.round(b.people || 1))),
    notes: b.notes.slice(0, 1000),
    source: b.source,
    status: b.status,
    preferred_contacts: (b.preferredContacts ?? []).slice(0, 6),
  };
}

export async function insertDbBooking(b: Booking): Promise<boolean> {
  const { error } = await supabase.from("bookings").insert({ ...bookingPayload(b), kind: "appointment" });
  return !error;
}

export async function updateDbBooking(b: Booking): Promise<boolean> {
  const { error } = await supabase.from("bookings").update(bookingPayload(b)).eq("id", b.id);
  return !error;
}

export async function setDbBookingTrashed(id: string, trashed: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("bookings")
    .update({ trashed_at: trashed ? new Date().toISOString() : null })
    .eq("id", id);
  return !error;
}

export async function setDbBookingStatus(id: string, status: BookingStatus): Promise<boolean> {
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  return !error;
}

export async function deleteDbBooking(id: string): Promise<boolean> {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  return !error;
}

/** Permanently deletes every trashed booking. Returns false if any row failed. */
export async function purgeTrashedBookings(): Promise<boolean> {
  const { error } = await supabase.from("bookings").delete().not("trashed_at", "is", null);
  return !error;
}

// ---------- Public auto-logging (anonymous inserts) ----------

export type BookingChannel = "whatsapp" | "wechat" | "email" | "other";

/**
 * Logs a booking / custom-design request submitted from the public site.
 * Returns false when the request could not be saved.
 */
export async function logWebsiteBooking(input: {
  kind: "appointment" | "custom-design";
  name: string;
  contact?: string;
  service?: string;
  date?: string;
  time?: string;
  people?: number;
  notes?: string;
  locale?: string;
  channel: BookingChannel;
  /** Storage paths (not links) of uploaded reference photos. */
  referencePaths?: string[];
  /** Channels the client prefers to be contacted through. */
  preferredContacts?: string[];
}): Promise<boolean> {
  if (!input.name.trim()) return false;
  try {
    const { error } = await supabase.from("bookings").insert({
      kind: input.kind,
      name: input.name.trim().slice(0, 120),
      contact: (input.contact ?? "").trim().slice(0, 160),
      service: (input.service ?? "").slice(0, 160),
      booking_date: input.date ?? "",
      booking_time: (input.time ?? "").slice(0, 80),
      people: Math.min(50, Math.max(1, Math.round(input.people ?? 1))),
      notes: (input.notes ?? "").slice(0, 1000),
      source: input.channel,
      status: "pending",
      locale: input.locale ?? "en",
      reference_paths: (input.referencePaths ?? []).slice(0, 20),
      preferred_contacts: (input.preferredContacts ?? []).slice(0, 6),
    });
    return !error;
  } catch {
    // Ignore — the client still reaches the studio via the chat handoff.
    return false;
  }
}

export interface OrderLogItem {
  id: string;
  name: string;
  qty: number;
  unitPriceNpr: number;
}

/** Logs a shop order request. Returns false when the insert failed. */
/** Logs a shop order request. Returns false when the insert failed. */
export async function logOrderRequest(input: {
  name: string;
  phone: string;
  wechat: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  contactMethod: string;
  deliveryMethod: "pickup" | "delivery";
  items: OrderLogItem[];
  totalNpr: number;
  locale: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("order_requests").insert({
      customer_name: input.name.trim().slice(0, 120),
      phone: input.phone.trim().slice(0, 40),
      wechat: input.wechat.trim().slice(0, 80),
      whatsapp: input.whatsapp.trim().slice(0, 40),
      email: input.email.trim().slice(0, 120),
      address: input.address.trim().slice(0, 300),
      notes: input.notes.trim().slice(0, 1000),
      contact_method: input.contactMethod,
      delivery_method: input.deliveryMethod,
      items: input.items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        unit_price_npr: i.unitPriceNpr,
      })),
      total_npr: Math.max(0, Math.round(input.totalNpr)),
      locale: input.locale,
      status: "new",
    });
    return !error;
  } catch {
    return false;
  }
}
