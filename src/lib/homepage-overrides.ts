import type { Locale } from "@/i18n/dictionaries";
import type { Dict } from "@/i18n/en";

const STORAGE_KEY = "nagma.homepage";

export type HomepageHeroMedia = {
  /** External URL or local path to the hero video (e.g. /assets/hero.mp4). */
  videoUrl?: string | undefined;
  /** Poster shown before the hero video plays. Can be a base64 data URL or path. */
  posterUrl?: string | undefined;
  /** Static image used when imageMode is true. Can be a base64 data URL or path. */
  imageUrl?: string | undefined;
  /** Show a static image instead of the video. */
  imageMode?: boolean;
};

export type HomepageHeroOverrides = Partial<Dict["hero"]> & { media?: HomepageHeroMedia };

export type HomepageAboutOverrides = Partial<Dict["about"]> & { imageUrl?: string | undefined };

export type HomepageVideoOverrides = Partial<Dict["video"]> & {
  videoUrl?: string | undefined;
  posterUrl?: string | undefined;
};

export type HomepageSectionOverrides = {
  hero?: HomepageHeroOverrides;
  about?: HomepageAboutOverrides;
  video?: HomepageVideoOverrides;
};

export type HomepageOverrides = Record<Locale, HomepageSectionOverrides>;

export function emptyHomepageOverrides(): HomepageOverrides {
  return { en: {}, zh: {} };
}

/** Read overrides from localStorage. Safe for SSR. */
export function readHomepageOverrides(): HomepageOverrides {
  if (typeof window === "undefined") return emptyHomepageOverrides();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyHomepageOverrides();
    const parsed = JSON.parse(raw) as HomepageOverrides;
    return {
      en: parsed.en ?? {},
      zh: parsed.zh ?? {},
    };
  } catch {
    return emptyHomepageOverrides();
  }
}

/** Write overrides to localStorage. Safe for SSR. */
export function writeHomepageOverrides(overrides: HomepageOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

/** Merge a base dictionary section with an override, keeping only defined override values. */
function mergeSection<T extends Record<string, string>>(
  base: T,
  override: Partial<T>,
): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key];
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** Apply homepage text overrides to a base dictionary. */
export function mergeHomepageDictionary(
  dict: Dict,
  overrides: HomepageSectionOverrides | undefined,
): Dict {
  if (!overrides) return dict;
  const next: Dict = { ...dict };
  if (overrides.hero) {
    const { media: _, ...heroText } = overrides.hero;
    next.hero = mergeSection(dict.hero, heroText);
  }
  if (overrides.about) {
    const { imageUrl: _, ...aboutText } = overrides.about;
    next.about = mergeSection(dict.about, aboutText);
  }
  if (overrides.video) {
    const { videoUrl: _, posterUrl: __, ...videoText } = overrides.video;
    next.video = mergeSection(dict.video, videoText);
  }
  return next;
}

/** Merge a single locale patch into the existing overrides object. */
export function mergeHomepageOverrides(
  current: HomepageOverrides,
  locale: Locale,
  patch: HomepageSectionOverrides,
): HomepageOverrides {
  return {
    ...current,
    [locale]: {
      ...current[locale],
      ...patch,
    },
  };
}
