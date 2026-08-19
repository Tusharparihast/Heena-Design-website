// ============= Studio branding (logo + browser icon) =============
// Stored as one JSON document in `site_content` under the "branding" key so
// the studio can swap the logo from the admin dashboard without a deploy.

import defaultLogo from "@/assets/nagma-logo.png.asset.json";
import { saveSiteContent, useSiteContent } from "@/lib/site-content";

export const BRANDING_KEY = "branding";

export interface Branding {
  /** Main logo shown in the navbar, footer and admin dashboard. */
  logoUrl: string;
  /** Browser tab icon (favicon). Falls back to the logo when empty. */
  faviconUrl: string;
}

export const defaultBranding: Branding = {
  logoUrl: defaultLogo.url,
  faviconUrl: "/favicon.png",
};

function text(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  // Data URLs for uploaded images can be large — allow a generous budget.
  return trimmed ? trimmed.slice(0, 4_000_000) : fallback;
}

export function sanitizeBranding(raw: unknown): Branding {
  if (!raw || typeof raw !== "object") return defaultBranding;
  const o = raw as Record<string, unknown>;
  return {
    logoUrl: text(o["logoUrl"], defaultBranding.logoUrl),
    faviconUrl: text(o["faviconUrl"], defaultBranding.faviconUrl),
  };
}

/** Live branding document (falls back to the packaged logo). */
export function useBranding(): { branding: Branding; loaded: boolean } {
  const { doc, loaded } = useSiteContent(BRANDING_KEY);
  return { branding: sanitizeBranding(doc), loaded };
}

export async function saveBranding(branding: Branding): Promise<boolean> {
  return saveSiteContent(BRANDING_KEY, branding);
}
