import { useEffect, useMemo } from "react";

import { dictionaries, type Locale } from "@/i18n/dictionaries";
import { migrateLocalContent, readSiteContent, saveSiteContent, useSiteContent } from "@/lib/site-content";

/**
 * Studio-managed appointments: booking log + booking-page settings.
 *
 * The public /appointment page sends booking details through WhatsApp,
 * WeChat or email. The admin Appointments dashboard (/admin/appointments)
 * lets the studio owner:
 *   - log bookings received on any channel, track their status
 *     (pending → confirmed → completed / cancelled) and manage a trash;
 *   - control availability: weekly open days, blocked dates, max group size;
 *   - edit the public booking page text and the service / time-slot
 *     option lists bilingually.
 *
 * The booking log itself lives in the Supabase `bookings` table via
 * src/lib/bookings-db.ts. This module owns the Booking types, the
 * availability logic, and the booking-page settings (which are stored in
 * the shared `site_content` table so every visitor sees the same options).
 */

const SETTINGS_KEY = "nd-appointment-settings";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type BookingSource = "whatsapp" | "wechat" | "phone" | "walk-in" | "email" | "other";

export const bookingStatuses: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];
export const bookingSources: BookingSource[] = ["whatsapp", "wechat", "phone", "walk-in", "email", "other"];

/** One booking logged by the studio. */
export interface Booking {
  id: string;
  name: string;
  /** WeChat ID, phone number, WhatsApp — however the client reached out. */
  contact: string;
  service: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Time-slot label (from the option list or free text). */
  time: string;
  people: number;
  notes: string;
  source: BookingSource;
  status: BookingStatus;
  /** Channels the client prefers to be contacted through. */
  preferredContacts?: string[];
  /** Contact detail per selected channel, e.g. { wechat: "id", phone: "98…" }. */
  contactDetails?: Record<string, string>;

  /** ISO timestamp of when the booking was logged. */
  createdAt: string;
}

export interface BookingStore {
  active: Booking[];
  trashed: Booking[];
}

/** A selectable option edited in both languages at once. */
export interface BilingualOption {
  id: string;
  en: string;
  zh: string;
}

export interface AppointmentSettings {
  /** Service options for the public form. undefined = dictionary defaults. */
  services?: BilingualOption[] | undefined;
  /** Time-slot options for the public form. undefined = dictionary defaults. */
  timeSlots?: BilingualOption[] | undefined;
  /** Weekdays the studio accepts bookings (0 = Sunday … 6 = Saturday). */
  openDays: number[];
  /** Specific dates (YYYY-MM-DD) the studio is closed / fully booked. */
  blockedDates: string[];
  /** Maximum group size per booking. */
  maxPeople: number;
  /** Public page text overrides (undefined keeps the dictionary defaults). */
  titleEn?: string | undefined;
  titleZh?: string | undefined;
  bodyEn?: string | undefined;
  bodyZh?: string | undefined;
  noteEn?: string | undefined;
  noteZh?: string | undefined;
}


export const defaultAppointmentSettings: AppointmentSettings = {
  openDays: [0, 1, 2, 3, 4, 5, 6],
  blockedDates: [],
  maxPeople: 10,
};

/* ------------------------------------------------------------------ */
/* Dictionary defaults                                                 */
/* ------------------------------------------------------------------ */

/** Service options from the dictionaries, paired EN/中文 by position. */
export function defaultServiceOptions(): BilingualOption[] {
  const en = dictionaries.en.appointment.page.form.serviceOptions;
  const zh = dictionaries.zh.appointment.page.form.serviceOptions;
  return en.map((label, i) => ({ id: `svc-${i}`, en: label, zh: zh[i] ?? label }));
}

/** Time-slot options from the dictionaries, paired EN/中文 by position. */
export function defaultTimeSlots(): BilingualOption[] {
  const en = dictionaries.en.appointment.page.form.timeOptions;
  const zh = dictionaries.zh.appointment.page.form.timeOptions;
  return en.map((label, i) => ({ id: `slot-${i}`, en: label, zh: zh[i] ?? label }));
}

/** The options the public form shows (admin list wins when customized). */
export function effectiveServices(s: AppointmentSettings): BilingualOption[] {
  return s.services && s.services.length > 0 ? s.services : defaultServiceOptions();
}

export function effectiveTimeSlots(s: AppointmentSettings): BilingualOption[] {
  return s.timeSlots && s.timeSlots.length > 0 ? s.timeSlots : defaultTimeSlots();
}

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

export type DateAvailability = "open" | "closed-day" | "blocked" | "past";

/** Whether a YYYY-MM-DD date can be booked under the current settings. */
export function dateAvailability(settings: AppointmentSettings, dateStr: string): DateAvailability {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "open";
  if (dateStr < todayStr()) return "past";
  if (settings.blockedDates.includes(dateStr)) return "blocked";
  // Parse as local noon so timezone shifts never move the weekday.
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  if (!settings.openDays.includes(day)) return "closed-day";
  return "open";
}

/** Today's date in local time, YYYY-MM-DD. */
export function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

function cleanText(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}


function cleanOption(raw: unknown): BilingualOption | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const id = cleanText(o["id"], 60);
  const en = cleanText(o["en"], 120);
  const zh = cleanText(o["zh"], 120);
  // Keep an option as long as one locale has text — the other falls back.
  if (!id || (!en && !zh)) return undefined;
  return { id, en: en ?? zh ?? "", zh: zh ?? "" };
}

function cleanOptionList(value: unknown): BilingualOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const list = value.map(cleanOption).filter((o): o is BilingualOption => {
    if (!o || seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
  return list.length > 0 ? list : undefined;
}


function sanitizeSettings(raw: unknown): AppointmentSettings {
  if (!raw || typeof raw !== "object") return defaultAppointmentSettings;
  const obj = raw as Record<string, unknown>;

  const rawDays = obj["openDays"];
  const openDays = Array.isArray(rawDays)
    ? [...new Set(rawDays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : defaultAppointmentSettings.openDays;

  const rawBlocked = obj["blockedDates"];
  const blockedDates = Array.isArray(rawBlocked)
    ? [...new Set(rawBlocked.map(cleanDate).filter((d): d is string => !!d))].sort()
    : [];

  const rawMax = obj["maxPeople"];
  const maxPeople =
    typeof rawMax === "number" && Number.isFinite(rawMax)
      ? Math.min(50, Math.max(1, Math.round(rawMax)))
      : defaultAppointmentSettings.maxPeople;

  return {
    services: cleanOptionList(obj["services"]),
    timeSlots: cleanOptionList(obj["timeSlots"]),
    openDays,
    blockedDates,
    maxPeople,
    titleEn: cleanText(obj["titleEn"], 120),
    titleZh: cleanText(obj["titleZh"], 120),
    bodyEn: cleanText(obj["bodyEn"], 400),
    bodyZh: cleanText(obj["bodyZh"], 400),
    noteEn: cleanText(obj["noteEn"], 200),
    noteZh: cleanText(obj["noteZh"], 200),
  };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/**

/**
 * Appointment settings live in the shared `site_content` table so every
 * visitor sees the studio's availability, not just the admin's browser.
 */
export const APPOINTMENT_SETTINGS_KEY = "appointment-settings";

export function readAppointmentSettings(): AppointmentSettings {
  return sanitizeSettings(readSiteContent(APPOINTMENT_SETTINGS_KEY));
}

export function writeAppointmentSettings(settings: AppointmentSettings) {
  void saveSiteContent(APPOINTMENT_SETTINGS_KEY, sanitizeSettings(settings));
}

/* ------------------------------------------------------------------ */
/* Id helpers                                                          */
/* ------------------------------------------------------------------ */

/** Unique id for a new booking. */
export function makeBookingId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Unique id for a new option in a list. */
export function makeOptionId(prefix: string, taken: ReadonlySet<string>): string {
  let n = taken.size + 1;
  let candidate = `${prefix}-${n}`;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${prefix}-${n}`;
  }
  return candidate;
}

/* ------------------------------------------------------------------ */
/* React hooks                                                         */
/* ------------------------------------------------------------------ */


/** Live appointment settings from the database, synced with admin edits. */
export function useAppointmentSettings(): AppointmentSettings {
  const { doc } = useSiteContent(APPOINTMENT_SETTINGS_KEY);
  useEffect(() => {
    migrateLocalContent(APPOINTMENT_SETTINGS_KEY, SETTINGS_KEY, (v) => !v || typeof v !== "object");
  }, []);
  return useMemo(() => sanitizeSettings(doc), [doc]);
}

/** Public booking-page content resolved to one locale. */
export interface ResolvedAppointmentPage {
  title: string;
  body: string;
  note: string;
  services: string[];
  timeSlots: string[];
  maxPeople: number;
}

export function useEffectiveAppointmentPage(locale: Locale): ResolvedAppointmentPage {
  const settings = useAppointmentSettings();
  return useMemo(() => {
    const pick = (zh: string | undefined, en: string | undefined, fallback: string) =>
      locale === "zh" ? (zh ?? en ?? fallback) : (en ?? fallback);
    const dict = dictionaries[locale].appointment.page;
    const opt = (o: BilingualOption) => (locale === "zh" && o.zh ? o.zh : o.en);
    return {
      title: pick(settings.titleZh, settings.titleEn, dict.title),
      body: pick(settings.bodyZh, settings.bodyEn, dict.body),
      note: pick(settings.noteZh, settings.noteEn, dict.summary.note),
      services: effectiveServices(settings).map(opt),
      timeSlots: effectiveTimeSlots(settings).map(opt),
      maxPeople: settings.maxPeople,
    };
  }, [settings, locale]);
}
