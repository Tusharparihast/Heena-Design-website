import type { Locale } from "@/i18n/dictionaries";
import type { Dict } from "@/i18n/en";
import { migrateLocalContent, saveSiteContent, useSiteContent } from "./site-content";

const STORAGE_KEY = "nagma.homepage";
/** Database document key for the studio-managed homepage content. */
export const HOMEPAGE_KEY = "homepage";


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

export type HomepageAboutOverrides = Partial<Dict["about"]> & {
  imageUrl?: string | undefined;
  /** When set, the about section shows this video instead of the image. */
  videoUrl?: string | undefined;
  posterUrl?: string | undefined;
};

export type HomepageVideoOverrides = Partial<Dict["video"]> & {
  videoUrl?: string | undefined;
  posterUrl?: string | undefined;
};

export type HomepageWhyItemOverride = { title?: string | undefined; body?: string | undefined };

export type HomepageWhyOverrides = {
  label?: string | undefined;
  title?: string | undefined;
  items?: HomepageWhyItemOverride[];
};

export type HomepageDesignBlockOverrides = Partial<Dict["traditional"]> & {
  /** Replacement image list (URLs or data URLs). Undefined keeps the bundled defaults. */
  images?: string[] | undefined;
};

export type HomepageSectionOverrides = {
  hero?: HomepageHeroOverrides;
  about?: HomepageAboutOverrides;
  video?: HomepageVideoOverrides;
  why?: HomepageWhyOverrides;
  traditional?: HomepageDesignBlockOverrides;
  modern?: HomepageDesignBlockOverrides;
};

export type HomepageOverrides = Record<Locale, HomepageSectionOverrides>;

export function emptyHomepageOverrides(): HomepageOverrides {
  return { en: {}, zh: {} };
}

/** Normalise a stored document into the overrides shape. */
export function sanitizeHomepageOverrides(raw: unknown): HomepageOverrides {
  if (!raw || typeof raw !== "object") return emptyHomepageOverrides();
  const o = raw as Partial<HomepageOverrides>;
  return { en: o.en ?? {}, zh: o.zh ?? {} };
}

function isEmptyHomepageDoc(value: unknown): boolean {
  const doc = sanitizeHomepageOverrides(value);
  return Object.keys(doc.en).length === 0 && Object.keys(doc.zh).length === 0;
}

/** Live homepage content document from the database (shared across visitors). */
export function useHomepageOverrides(): HomepageOverrides {
  const { doc } = useSiteContent(HOMEPAGE_KEY);
  return sanitizeHomepageOverrides(doc);
}

/** One-time lift of this browser's legacy homepage edits into the database. */
export function migrateLegacyHomepageOverrides() {
  migrateLocalContent(HOMEPAGE_KEY, STORAGE_KEY, isEmptyHomepageDoc);
}

/** Persist homepage content for every visitor (admins only). */
export async function saveHomepageOverrides(overrides: HomepageOverrides): Promise<boolean> {
  return saveSiteContent(HOMEPAGE_KEY, sanitizeHomepageOverrides(overrides));
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

function mergeWhySection(
  base: Dict["why"],
  override: HomepageWhyOverrides,
): Dict["why"] {
  const result = { ...base };
  if (override.label !== undefined) result.label = override.label;
  if (override.title !== undefined) result.title = override.title;
  if (override.items) {
    result.items = override.items.map((item, i) => ({
      title: item.title ?? base.items[i]?.title ?? "",
      body: item.body ?? base.items[i]?.body ?? "",
    }));
  }
  return result;
}

function mergeDesignBlock(
  base: Dict["traditional"],
  override: HomepageDesignBlockOverrides,
): Dict["traditional"] {
  const result = { ...base };
  if (override.label !== undefined) result.label = override.label;
  if (override.title !== undefined) result.title = override.title;
  if (override.body !== undefined) result.body = override.body;
  if (override.tags !== undefined) result.tags = override.tags;
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
    const { imageUrl: _, videoUrl: _v, posterUrl: _p, ...aboutText } = overrides.about;
    next.about = mergeSection(dict.about, aboutText);
  }
  if (overrides.video) {
    const { videoUrl: _, posterUrl: __, ...videoText } = overrides.video;
    next.video = mergeSection(dict.video, videoText);
  }
  if (overrides.why) {
    next.why = mergeWhySection(dict.why, overrides.why);
  }
  if (overrides.traditional) {
    next.traditional = mergeDesignBlock(dict.traditional, overrides.traditional);
  }
  if (overrides.modern) {
    next.modern = mergeDesignBlock(dict.modern, overrides.modern);
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
