import { useEffect, useState } from "react";

import { dictionaries } from "@/i18n/dictionaries";

import { site } from "./site";

/**
 * Studio-managed contact details.
 *
 * Defaults live in src/lib/site.ts (and the dictionaries for the section
 * heading). The admin "Contact Information" page (/admin/contact-info)
 * stores overrides so the studio can change phone numbers, IDs, links,
 * hours and the section copy without touching code.
 *
 * Overrides persist in localStorage for now, mirroring the other admin
 * managers in this project.
 */

const STORAGE_KEY = "nd-contact-info";
const CHANGE_EVENT = "nd:contact-info";

export interface ContactInfo {
  /** WeChat ID shown/copied across the site. */
  wechatId: string;
  /** Uploaded WeChat QR image (data URL). Falls back to a generated QR. */
  wechatQr: string;
  /** WhatsApp number in international format. */
  whatsapp: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  mapUrl: string;
  /** Studio location, bilingual. */
  cityEn: string;
  cityZh: string;
  /** Opening hours, bilingual. */
  hoursEn: string;
  hoursZh: string;
  /** Section heading + intro, bilingual. */
  labelEn: string;
  labelZh: string;
  titleEn: string;
  titleZh: string;
  bodyEn: string;
  bodyZh: string;
}

export const defaultContactInfo: ContactInfo = {
  wechatId: site.wechatId,
  wechatQr: "",
  whatsapp: site.whatsapp,
  phone: site.phone,
  email: site.email,
  instagram: site.instagram,
  facebook: site.facebook,
  mapUrl: site.mapUrl,
  cityEn: site.city,
  cityZh: site.city,
  hoursEn: site.hours,
  hoursZh: site.hours,
  labelEn: dictionaries.en.contact.label,
  labelZh: dictionaries.zh.contact.label,
  titleEn: dictionaries.en.contact.title,
  titleZh: dictionaries.zh.contact.title,
  bodyEn: dictionaries.en.contact.body,
  bodyZh: dictionaries.zh.contact.body,
};

function text(value: unknown, fallback: string, max = 300): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : fallback;
}

function sanitize(raw: unknown): ContactInfo {
  if (!raw || typeof raw !== "object") return defaultContactInfo;
  const o = raw as Record<string, unknown>;
  const out = { ...defaultContactInfo };
  for (const key of Object.keys(defaultContactInfo) as (keyof ContactInfo)[]) {
    // QR images are stored as data URLs, so they need a much larger budget.
    out[key] = text(o[key], defaultContactInfo[key], key === "wechatQr" ? 4_000_000 : 300);
  }
  return out;
}

export function readContactInfo(): ContactInfo {
  if (typeof window === "undefined") return defaultContactInfo;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultContactInfo;
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultContactInfo;
  }
}

export function writeContactInfo(info: ContactInfo) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(info)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function resetContactInfo() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Digits-only WhatsApp number for wa.me links. */
export function waLink(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;
}

/**
 * Contact details with studio overrides applied. Starts from the defaults so
 * SSR and hydration match, then syncs from localStorage and live admin edits.
 */
export function useContactInfo(): ContactInfo {
  const [info, setInfo] = useState<ContactInfo>(defaultContactInfo);

  useEffect(() => {
    const sync = () => setInfo(readContactInfo());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return info;
}
