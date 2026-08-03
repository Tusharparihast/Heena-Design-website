/**
 * Language registry. The actual copy lives in:
 *   - src/i18n/en.ts  (English)
 *   - src/i18n/zh.ts  (简体中文)
 */
import { en, type Dict } from "./en";
import { zh } from "./zh";

export { en, zh };
export type { Dict };

export type Locale = "en" | "zh";
export const dictionaries: Record<Locale, Dict> = { en, zh };
