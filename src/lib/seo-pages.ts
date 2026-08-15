// ============= Per-page SEO overrides =============
// Stored as one JSON document ("seo-pages") in `site_content`, editable from
// Settings → Page SEO in the admin dashboard and applied at runtime by
// <SeoTagsInjector /> based on the current route.

import { saveSiteContent, useSiteContent } from "@/lib/site-content";

export const SEO_PAGES_KEY = "seo-pages";

export interface PageSeo {
  title: string;
  description: string;
  ogImage: string;
}

export interface SeoPageDef {
  path: string;
  label: string;
  hint: string;
}

/** Public pages the studio can tune individually. */
export const seoPageDefs: SeoPageDef[] = [
  { path: "/", label: "Home", hint: "Landing page" },
  { path: "/about", label: "About", hint: "Studio story" },
  { path: "/gallery", label: "Gallery", hint: "Mehndi design gallery" },
  { path: "/courses", label: "Courses", hint: "Mehndi classes" },
  { path: "/student-work", label: "Student Work", hint: "Student gallery" },
  { path: "/custom-design", label: "Custom Design", hint: "Custom design requests" },
  { path: "/appointment", label: "Appointment", hint: "Booking page" },
  { path: "/shop", label: "Shop", hint: "Products" },
  { path: "/contact", label: "Contact", hint: "Contact details" },
];

export const emptyPageSeo: PageSeo = { title: "", description: "", ogImage: "" };

export type SeoPageMap = Record<string, PageSeo>;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** Defensive read — unknown paths and malformed entries are dropped. */
export function sanitizeSeoPages(doc: unknown): SeoPageMap {
  const out: SeoPageMap = {};
  seoPageDefs.forEach((p) => {
    out[p.path] = { ...emptyPageSeo };
  });
  if (!doc || typeof doc !== "object") return out;
  Object.entries(doc as Record<string, unknown>).forEach(([path, value]) => {
    if (!out[path] || !value || typeof value !== "object") return;
    const v = value as Record<string, unknown>;
    out[path] = {
      title: str(v['title'], 120),
      description: str(v['description'], 320),
      ogImage: str(v['ogImage'], 2000),
    };
  });
  return out;
}

/** Live per-page SEO overrides. */
export function useSeoPages(): { pages: SeoPageMap; loaded: boolean } {
  const { doc, loaded } = useSiteContent(SEO_PAGES_KEY);
  return { pages: sanitizeSeoPages(doc), loaded };
}

export async function saveSeoPages(pages: SeoPageMap): Promise<boolean> {
  return saveSiteContent(SEO_PAGES_KEY, pages);
}

/** Normalises a router pathname to one of the configured page keys. */
export function seoPathKey(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/";
  if (clean.startsWith("/shop")) return "/shop";
  return seoPageDefs.some((p) => p.path === clean) ? clean : clean;
}
