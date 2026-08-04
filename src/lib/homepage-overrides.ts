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

export type HomepageHeroOverrides = {
  eyebrow?: string | undefined;
  title1?: string | undefined;
  title2?: string | undefined;
  title3?: string | undefined;
  body?: string | undefined;
  cta?: string | undefined;
  secondary?: string | undefined;
  media?: HomepageHeroMedia;
};

export type HomepageAboutOverrides = {
  label?: string | undefined;
  title?: string | undefined;
  body1?: string | undefined;
  body2?: string | undefined;
  stat1?: string | undefined;
  stat2?: string | undefined;
  stat3?: string | undefined;
  /** About image override. Can be a base64 data URL or path. */
  imageUrl?: string | undefined;
};


export type HomepageVideoOverrides = {
  label?: string | undefined;
  title?: string | undefined;
  body?: string | undefined;
  play?: string | undefined;
  note?: string | undefined;
  expand?: string | undefined;
  close?: string | undefined;
  /** External URL or local path to the demo video. */
  videoUrl?: string | undefined;
  /** Poster for the demo video. Can be a base64 data URL or path. */
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

/** Keep only entries whose value is not undefined. Empty strings are kept intentionally. */
function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
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
    next.hero = { ...dict.hero, ...pickDefined(heroText) };
  }
  if (overrides.about) {
    const { imageUrl: _, ...aboutText } = overrides.about;
    next.about = { ...dict.about, ...pickDefined(aboutText) };
  }
  if (overrides.video) {
    const { videoUrl: _, posterUrl: __, ...videoText } = overrides.video;
    next.video = { ...dict.video, ...pickDefined(videoText) };
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
