import { useEffect, useMemo, useState } from "react";

import { dictionaries, type Locale } from "@/i18n/dictionaries";

import { isTestimonialImageRef } from "./testimonial-images";
import { migrateLocalContent, readSiteContent, saveSiteContent, useSiteContent } from "./site-content";

/**
 * Studio-managed testimonial overrides.
 *
 * Built-in testimonial defaults live in src/i18n/en.ts and src/i18n/zh.ts.
 * The admin Testimonials dashboard (/admin/testimonials) writes overrides so
 * the studio can edit every field bilingually, swap photos and before/after
 * frames, change star ratings, hide, trash, restore and add new testimonials —
 * plus edit the section label/title — all without touching code.
 *
 * Overrides are stored in the database (site_content) so every visitor sees
 * the studio's latest testimonials.
 */

const STORAGE_KEY = "nd-testimonial-overrides";

/** One testimonial with both locales side by side (the admin/storage shape). */
export interface EffectiveTestimonial {
  id: string;
  /** Avatar: built-in key (person-1…), data URL or URL. */
  photo: string;
  /** Star rating, 1–5. */
  rating: number;
  nameEn: string;
  nameZh: string;
  roleEn: string;
  roleZh: string;
  countryEn: string;
  countryZh: string;
  reviewEn: string;
  reviewZh: string;
  /** Before frame: built-in gallery key, data URL or URL. */
  before: string;
  /** After frame: built-in gallery key, data URL or URL. */
  after: string;
}

/** Editable fields for a built-in testimonial. Missing keys keep the defaults. */
export type TestimonialEdit = Partial<Omit<EffectiveTestimonial, "id">>;

/** A testimonial added from the admin dashboard. */
export type CustomTestimonial = EffectiveTestimonial;

export interface TestimonialOverrides {
  /** Per-field edits for built-in testimonials, keyed by id. */
  edits: Record<string, TestimonialEdit>;
  /** Testimonials added in the dashboard. */
  added: CustomTestimonial[];
  /** Ids temporarily hidden from the homepage section. */
  hidden: string[];
  /** Ids in the trash — restorable. */
  deleted: string[];
  /** Ids of built-in testimonials permanently deleted from the trash. */
  purged: string[];
  /** Section heading overrides (undefined keeps the dictionary defaults). */
  labelEn?: string | undefined;
  labelZh?: string | undefined;
  titleEn?: string | undefined;
  titleZh?: string | undefined;
}

export const emptyTestimonialOverrides: TestimonialOverrides = {
  edits: {},
  added: [],
  hidden: [],
  deleted: [],
  purged: [],
};

/**
 * Built-in testimonials, derived from the two dictionaries by position.
 * The EN and ZH lists are kept parallel (same order, same photos), so the
 * index is the stable id.
 */
export const builtinTestimonials: EffectiveTestimonial[] =
  dictionaries.en.testimonials.items.map((item, i) => {
    const zh = dictionaries.zh.testimonials.items[i];
    return {
      id: `t-${i}`,
      photo: item.photo,
      rating: item.rating,
      nameEn: item.name,
      nameZh: zh?.name ?? item.name,
      roleEn: item.role,
      roleZh: zh?.role ?? item.role,
      countryEn: item.country,
      countryZh: zh?.country ?? item.country,
      reviewEn: item.review,
      reviewZh: zh?.review ?? item.review,
      before: item.before,
      after: item.after,
    };
  });

const builtinIds: Record<string, true> = Object.fromEntries(
  builtinTestimonials.map((t) => [t.id, true]),
);

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

function cleanText(value: unknown, max = 400): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanImage(value: unknown): string | undefined {
  return isTestimonialImageRef(value) ? value : undefined;
}

function cleanRating(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  return rounded >= 1 && rounded <= 5 ? rounded : undefined;
}

/** Remove invalid/empty fields; returns undefined when nothing is left. */
export function cleanTestimonialEdit(edit: TestimonialEdit): TestimonialEdit | undefined {
  const out: TestimonialEdit = {};
  const nameEn = cleanText(edit.nameEn, 80);
  const nameZh = cleanText(edit.nameZh, 80);
  const roleEn = cleanText(edit.roleEn, 60);
  const roleZh = cleanText(edit.roleZh, 60);
  const countryEn = cleanText(edit.countryEn, 60);
  const countryZh = cleanText(edit.countryZh, 60);
  const reviewEn = cleanText(edit.reviewEn, 400);
  const reviewZh = cleanText(edit.reviewZh, 400);
  const rating = cleanRating(edit.rating);
  const photo = cleanImage(edit.photo);
  const before = cleanImage(edit.before);
  const after = cleanImage(edit.after);
  if (nameEn) out.nameEn = nameEn;
  if (nameZh) out.nameZh = nameZh;
  if (roleEn) out.roleEn = roleEn;
  if (roleZh) out.roleZh = roleZh;
  if (countryEn) out.countryEn = countryEn;
  if (countryZh) out.countryZh = countryZh;
  if (reviewEn) out.reviewEn = reviewEn;
  if (reviewZh) out.reviewZh = reviewZh;
  if (rating !== undefined) out.rating = rating;
  if (photo) out.photo = photo;
  if (before) out.before = before;
  if (after) out.after = after;
  return Object.keys(out).length > 0 ? out : undefined;
}

function cleanCustomTestimonial(raw: unknown): CustomTestimonial | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const id = cleanText(c["id"], 60);
  const nameEn = cleanText(c["nameEn"], 80);
  const reviewEn = cleanText(c["reviewEn"], 400);
  if (!id || !nameEn || !reviewEn || builtinIds[id]) return undefined;
  return {
    id,
    photo: cleanImage(c["photo"]) ?? "person-1",
    rating: cleanRating(c["rating"]) ?? 5,
    nameEn,
    nameZh: cleanText(c["nameZh"], 80) ?? "",
    roleEn: cleanText(c["roleEn"], 60) ?? "Client",
    roleZh: cleanText(c["roleZh"], 60) ?? "",
    countryEn: cleanText(c["countryEn"], 60) ?? "",
    countryZh: cleanText(c["countryZh"], 60) ?? "",
    reviewEn,
    reviewZh: cleanText(c["reviewZh"], 400) ?? "",
    before: cleanImage(c["before"]) ?? "bridal-1",
    after: cleanImage(c["after"]) ?? "modern-1",
  };
}

function sanitize(raw: unknown): TestimonialOverrides {
  if (!raw || typeof raw !== "object") return emptyTestimonialOverrides;
  const obj = raw as Record<string, unknown>;

  const edits: Record<string, TestimonialEdit> = {};
  const rawEdits = obj["edits"];
  if (rawEdits && typeof rawEdits === "object") {
    for (const [id, edit] of Object.entries(rawEdits as Record<string, unknown>)) {
      if (!builtinIds[id]) continue;
      const cleaned = cleanTestimonialEdit((edit ?? {}) as TestimonialEdit);
      if (cleaned) edits[id] = cleaned;
    }
  }

  const rawAdded = obj["added"];
  const seen = new Set<string>();
  const added = (Array.isArray(rawAdded) ? rawAdded : [])
    .map(cleanCustomTestimonial)
    .filter((c): c is CustomTestimonial => {
      if (!c || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

  const knownIds = new Set<string>([...Object.keys(builtinIds), ...added.map((c) => c.id)]);
  const listOfKnown = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string" && knownIds.has(id))
      : [];
  const rawPurged = obj["purged"];
  const purged = Array.isArray(rawPurged)
    ? rawPurged.filter((id): id is string => typeof id === "string" && builtinIds[id] === true)
    : [];

  return {
    edits,
    added,
    hidden: listOfKnown(obj["hidden"]),
    deleted: listOfKnown(obj["deleted"]),
    purged,
    labelEn: cleanText(obj["labelEn"], 60),
    labelZh: cleanText(obj["labelZh"], 60),
    titleEn: cleanText(obj["titleEn"], 120),
    titleZh: cleanText(obj["titleZh"], 120),
  };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export const TESTIMONIALS_KEY = "testimonials";

/** Latest testimonials document from the shared database cache. */
export function readTestimonialOverrides(): TestimonialOverrides {
  return sanitize(readSiteContent(TESTIMONIALS_KEY));
}

/** Persist testimonials for every visitor (admins only). */
export function writeTestimonialOverrides(overrides: TestimonialOverrides) {
  void saveSiteContent(TESTIMONIALS_KEY, sanitize(overrides));
}

export function isTestimonialPristine(overrides: TestimonialOverrides): boolean {
  return (
    Object.keys(overrides.edits).length === 0 &&
    overrides.added.length === 0 &&
    overrides.hidden.length === 0 &&
    overrides.deleted.length === 0 &&
    overrides.purged.length === 0 &&
    overrides.labelEn === undefined &&
    overrides.labelZh === undefined &&
    overrides.titleEn === undefined &&
    overrides.titleZh === undefined
  );
}

/* ------------------------------------------------------------------ */
/* Merging                                                             */
/* ------------------------------------------------------------------ */

/** A built-in testimonial with its admin edit applied. */
export function applyTestimonialEdit(
  item: EffectiveTestimonial,
  edit: TestimonialEdit | undefined,
): EffectiveTestimonial {
  return edit ? { ...item, ...edit } : item;
}

function isLive(overrides: TestimonialOverrides, id: string): boolean {
  return (
    !overrides.hidden.includes(id) &&
    !overrides.deleted.includes(id) &&
    !overrides.purged.includes(id)
  );
}

/**
 * The public homepage list: built-ins (with edits) plus studio-added
 * testimonials, minus hidden and trashed ones.
 */
export function effectiveTestimonials(overrides: TestimonialOverrides): EffectiveTestimonial[] {
  const base = builtinTestimonials
    .filter((t) => isLive(overrides, t.id))
    .map((t) => applyTestimonialEdit(t, overrides.edits[t.id]));
  const custom = overrides.added.filter((c) => isLive(overrides, c.id));
  return [...base, ...custom];
}

/** One row of the admin list (includes hidden, excludes trashed). */
export interface AdminTestimonialRow {
  item: EffectiveTestimonial;
  hidden: boolean;
  custom: boolean;
}

/** The admin dashboard list: visible + hidden testimonials with edits applied. */
export function adminTestimonials(overrides: TestimonialOverrides): AdminTestimonialRow[] {
  const base = builtinTestimonials
    .filter((t) => !overrides.deleted.includes(t.id) && !overrides.purged.includes(t.id))
    .map((t) => ({
      item: applyTestimonialEdit(t, overrides.edits[t.id]),
      hidden: overrides.hidden.includes(t.id),
      custom: false,
    }));
  const custom = overrides.added
    .filter((c) => !overrides.deleted.includes(c.id))
    .map((c) => ({ item: c, hidden: overrides.hidden.includes(c.id), custom: true }));
  return [...base, ...custom];
}

/** Testimonials currently in the trash. */
export function trashedTestimonials(overrides: TestimonialOverrides): AdminTestimonialRow[] {
  const base = builtinTestimonials
    .filter((t) => overrides.deleted.includes(t.id))
    .map((t) => ({
      item: applyTestimonialEdit(t, overrides.edits[t.id]),
      hidden: false,
      custom: false,
    }));
  const custom = overrides.added
    .filter((c) => overrides.deleted.includes(c.id))
    .map((c) => ({ item: c, hidden: false, custom: true }));
  return [...base, ...custom];
}

/** Find the studio-added record for an id, if it is a custom testimonial. */
export function findCustomTestimonial(
  overrides: TestimonialOverrides,
  id: string,
): CustomTestimonial | undefined {
  return overrides.added.find((c) => c.id === id);
}

/** Section heading with overrides applied, in both locales. */
export interface EffectiveTestimonialSection {
  labelEn: string;
  labelZh: string;
  titleEn: string;
  titleZh: string;
}

export function effectiveTestimonialSection(
  overrides: TestimonialOverrides,
): EffectiveTestimonialSection {
  return {
    labelEn: overrides.labelEn ?? dictionaries.en.testimonials.label,
    labelZh: overrides.labelZh ?? dictionaries.zh.testimonials.label,
    titleEn: overrides.titleEn ?? dictionaries.en.testimonials.title,
    titleZh: overrides.titleZh ?? dictionaries.zh.testimonials.title,
  };
}

/* ------------------------------------------------------------------ */
/* Id helpers                                                          */
/* ------------------------------------------------------------------ */

/** URL-safe unique id for a new testimonial, derived from the person's name. */
export function makeTestimonialId(name: string, taken: ReadonlySet<string>): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "review";
  let candidate = `custom-${slug}`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `custom-${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

/** Every id currently in use (built-in + added). */
export function allTestimonialIds(overrides: TestimonialOverrides): Set<string> {
  return new Set<string>([...Object.keys(builtinIds), ...overrides.added.map((c) => c.id)]);
}

/* ------------------------------------------------------------------ */
/* React hooks                                                         */
/* ------------------------------------------------------------------ */

/**
 * Client-side overrides state. Starts empty so SSR/hydration matches the
 * static defaults, then syncs from localStorage and live admin edits
 * (custom event + cross-tab storage event).
 */
export function useTestimonialOverrides(): TestimonialOverrides {
  const { doc } = useSiteContent(TESTIMONIALS_KEY);
  useEffect(() => {
    migrateLocalContent(TESTIMONIALS_KEY, STORAGE_KEY, (value) => isTestimonialPristine(sanitize(value)));
  }, []);
  return useMemo(() => sanitize(doc), [doc]);
}

/** A testimonial resolved to one locale — the shape the public section renders. */
export interface ResolvedTestimonial {
  id: string;
  photo: string;
  rating: number;
  name: string;
  role: string;
  country: string;
  review: string;
  before: string;
  after: string;
}

function resolveForLocale(item: EffectiveTestimonial, locale: Locale): ResolvedTestimonial {
  const pick = (zh: string, en: string) => (locale === "zh" && zh ? zh : en);
  return {
    id: item.id,
    photo: item.photo,
    rating: item.rating,
    name: pick(item.nameZh, item.nameEn),
    role: pick(item.roleZh, item.roleEn),
    country: pick(item.countryZh, item.countryEn),
    review: pick(item.reviewZh, item.reviewEn),
    before: item.before,
    after: item.after,
  };
}

/** Effective public testimonial list + section heading, resolved to the locale. */
export function useEffectiveTestimonials(locale: Locale): {
  label: string;
  title: string;
  items: ResolvedTestimonial[];
} {
  const overrides = useTestimonialOverrides();
  return useMemo(() => {
    const section = effectiveTestimonialSection(overrides);
    return {
      label: locale === "zh" ? section.labelZh : section.labelEn,
      title: locale === "zh" ? section.titleZh : section.titleEn,
      items: effectiveTestimonials(overrides).map((t) => resolveForLocale(t, locale)),
    };
  }, [overrides, locale]);
}
