import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  seoTitleSuffix: string;
  seoDefaultDescription: string;
  seoOgImage: string;
  seoRobotsIndex: boolean;
  seoGaMeasurementId: string;
  seoSearchConsoleVerification: string;
  defaultLocale: "en" | "zh";
}

interface SiteSettingsRow {
  seo_title_suffix: string;
  seo_default_description: string;
  seo_og_image: string;
  seo_robots_index: boolean;
  seo_ga_measurement_id: string;
  seo_search_console_verification: string;
  default_locale: string;
}

const fallback: SiteSettings = {
  seoTitleSuffix: "",
  seoDefaultDescription: "",
  seoOgImage: "",
  seoRobotsIndex: true,
  seoGaMeasurementId: "",
  seoSearchConsoleVerification: "",
  defaultLocale: "en",
};

function rowToSettings(r: SiteSettingsRow): SiteSettings {
  return {
    seoTitleSuffix: r.seo_title_suffix,
    seoDefaultDescription: r.seo_default_description,
    seoOgImage: r.seo_og_image,
    seoRobotsIndex: r.seo_robots_index,
    seoGaMeasurementId: r.seo_ga_measurement_id,
    seoSearchConsoleVerification: r.seo_search_console_verification,
    defaultLocale: r.default_locale === "zh" ? "zh" : "en",
  };
}

let cache: SiteSettings | null = null;

/** Read-only site settings, for injecting SEO tags and resolving the default locale. */
export function usePublicSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? fallback);
  const [loaded, setLoaded] = useState(!!cache);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (cancelled || !data) return;
      const next = rowToSettings(data as SiteSettingsRow);
      cache = next;
      setSettings(next);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loaded };
}

/** Full read/write access, for the admin Settings page. */
export function useAdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(fallback);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
    if (data) setSettings(rowToSettings(data as SiteSettingsRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { settings, loading, refresh };
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.seoTitleSuffix !== undefined) payload.seo_title_suffix = patch.seoTitleSuffix;
  if (patch.seoDefaultDescription !== undefined) payload.seo_default_description = patch.seoDefaultDescription;
  if (patch.seoOgImage !== undefined) payload.seo_og_image = patch.seoOgImage;
  if (patch.seoRobotsIndex !== undefined) payload.seo_robots_index = patch.seoRobotsIndex;
  if (patch.seoGaMeasurementId !== undefined) payload.seo_ga_measurement_id = patch.seoGaMeasurementId;
  if (patch.seoSearchConsoleVerification !== undefined)
    payload.seo_search_console_verification = patch.seoSearchConsoleVerification;
  if (patch.defaultLocale !== undefined) payload.default_locale = patch.defaultLocale;
  const { error } = await supabase.from("site_settings").update(payload).eq("id", "main");
  if (error) console.error("updateSiteSettings failed:", error);
  return !error;
}
