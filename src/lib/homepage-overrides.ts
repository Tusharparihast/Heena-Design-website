import type { Locale } from "@/i18n/dictionaries";
import type { Dict } from "@/i18n/en";

const STORAGE_KEY = "nagma.homepage";

export type HomepageHeroMedia = {
  /** External URL or local path to the hero video (e.g. /assets/hero.mp4). */
  videoUrl?: string;
  /** Poster shown before the hero video plays. Can be a base64 data URL or path. */
  posterUrl?: string;
  /** Static image used when imageMode is true. Can be a base64 data URL or path. */
  imageUrl?: string;
  /** Show a static image instead of the video. */
  imageMode?: boolean;
};

export type HomepageHeroOverrides = {
  eyebrow?: string;
  title1?: string;
  title2?: string;
  title3?: string;
  body?: string;
  cta?: string;
  secondary?: string;
  media?: HomepageHeroMedia;
};

export type HomepageAboutOverrides = {
  label?: string;
  title?: string;
  body1?: string;
  body2?: string;
  stat1?: string;
  stat2?: string;
  stat3?: string;
  /** About image override. Can be a base64 data URL or path. */
  imageUrl?: string;
};

export type HomepageVideoOverrides = {
  label?: string;
  title?: string;
  body?: string;
  play?: string;
  note?: string;
  expand?: string;
  close?: string;
  /** External URL or local path to the demo video. */
  videoUrl?: string;
  /** Poster for the demo video. Can be a base64 data URL or path. */
  posterUrl?: string;
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

/** Apply homepage text overrides to a base dictionary. */
export function mergeHomepageDictionary(
  dict: Dict,
  overrides: HomepageSectionOverrides | undefined,
): Dict {
  if (!overrides) return dict;
  const next: Dict = { ...dict };
  if (overrides.hero) {
    const { media: _, ...heroText } = overrides.hero;
    next.hero = { ...dict.hero, ...heroText };
  }
  if (overrides.about) {
    const { imageUrl: _, ...aboutText } = overrides.about;
    next.about = { ...dict.about, ...aboutText };
  }
  if (overrides.video) {
    const { videoUrl: _, posterUrl: __, ...videoText } = overrides.video;
    next.video = { ...dict.video, ...videoText };
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
