import { createContext, useContext } from "react";
import type { Locale } from "./dictionaries";
import type { Dict } from "./en";
import type { HomepageOverrides } from "@/lib/homepage-overrides";

export type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dict;
  homeOverrides: HomepageOverrides;
  setHomepageOverrides: (next: HomepageOverrides) => Promise<boolean>;
};

/**
 * The context lives in its own module (no component exports) so hot-module
 * reloads never swap the context identity out from under the provider — that
 * mismatch is what made consumers throw "must be used inside LanguageProvider".
 */
export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
