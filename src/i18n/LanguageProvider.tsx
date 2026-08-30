import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type Locale } from "./dictionaries";
import { supabase } from "@/integrations/supabase/client";
import type { Dict } from "./en";
import {
  mergeHomepageDictionary,
  migrateLegacyHomepageOverrides,
  saveHomepageOverrides,
  useHomepageOverrides,
  type HomepageOverrides,
} from "@/lib/homepage-overrides";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dict;
  homeOverrides: HomepageOverrides;
  setHomepageOverrides: (next: HomepageOverrides) => Promise<boolean>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LOCALE_KEY = "mehndi.locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with "en" so SSR and the first client render match.
  const [locale, setLocaleState] = useState<Locale>("en");
  // Homepage content lives in the database so every visitor sees the studio's edits.
  const homeOverrides = useHomepageOverrides();

useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "zh") {
      setLocaleState(stored);
    } else {
      void supabase
        .from("site_settings")
        .select("default_locale")
        .eq("id", "main")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.default_locale === "zh") setLocaleState("zh");
        });
    }
    migrateLegacyHomepageOverrides();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_KEY, next);
  }, []);

  const setHomepageOverrides = useCallback(
    (next: HomepageOverrides) => saveHomepageOverrides(next),
    [],
  );

  const t = useMemo(
    () => mergeHomepageDictionary(dictionaries[locale], homeOverrides[locale]),
    [locale, homeOverrides],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "en" ? "zh" : "en"),
      t,
      homeOverrides,
      setHomepageOverrides,
    }),
    [locale, setLocale, t, homeOverrides, setHomepageOverrides],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
