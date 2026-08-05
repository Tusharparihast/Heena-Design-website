import { useEffect, useMemo, useState } from "react";

import {
  galleryCategories,
  galleryItems,
  studentWorkItems,
  type GalleryCollection,
  type GalleryItem,
} from "./gallery";

/**
 * Studio-managed gallery overrides.
 *
 * Built-in photo defaults live in src/lib/gallery.ts. The admin Gallery
 * dashboard (/admin/gallery) writes overrides so the studio can retitle
 * photos, replace images, re-categorize, hide, trash, restore and upload new
 * photos — for both the main Designs gallery and the Student work gallery —
 * plus manage gallery categories, all without touching code.
 *
 * Until the backend phase lands, overrides persist in localStorage (this
 * browser only). The storage shape mirrors the future database schema so the
 * same merge logic can be reused when the gallery moves to Lovable Cloud.
 */

const STORAGE_KEY = "nd-gallery-overrides";
const CHANGE_EVENT = "nd:gallery-overrides";

/** Editable fields for a built-in gallery photo. Missing keys keep the defaults. */
export interface GalleryItemEdit {
  titleEn?: string;
  titleZh?: string;
  /** Full replacement category list (built-in or custom category ids). */
  categories?: string[];
  /** Replacement photo as a (compressed) data URL. */
  image?: string;
}

/** A studio-uploaded photo added from the admin dashboard. */
export interface CustomGalleryItem {
  id: string;
  collection: GalleryCollection;
  image: string;
  width: number;
  height: number;
  categories: string[];
  titleEn: string;
  titleZh: string;
}

/** A studio-created gallery category (in addition to the built-in ones). */
export interface CustomGalleryCategory {
  id: string;
  nameEn: string;
  nameZh: string;
}

export interface GalleryOverrides {
  /** Per-field edits for built-in photos, keyed by item id. */
  edits: Record<string, GalleryItemEdit>;
  /** Photos uploaded in the dashboard. */
  added: CustomGalleryItem[];
  /** Ids of photos (built-in or custom) temporarily hidden from the public galleries. */
  hidden: string[];
  /** Ids of photos shown in BOTH the Designs and Student work galleries. */
  shared: string[];
  /** Ids of photos (built-in or custom) in the trash — restorable. */
  deleted: string[];
  /** Ids of built-in photos permanently deleted from the trash. */
  purged: string[];
  /** Studio-created categories, shown as extra gallery filters. */
  categories: CustomGalleryCategory[];
  /** Renames for built-in categories, keyed by built-in category id. */
  categoryEdits: Record<string, { nameEn?: string; nameZh?: string }>;
  /** Ids of categories (built-in or custom) in the trash — restorable. */
  deletedCategories: string[];
  /** Ids of built-in categories permanently deleted from the trash. */
  purgedCategories: string[];
}

export const emptyGalleryOverrides: GalleryOverrides = {
  edits: {},
  added: [],
  hidden: [],
  shared: [],
  deleted: [],
  purged: [],
  categories: [],
  categoryEdits: {},
  deletedCategories: [],
  purgedCategories: [],
};

const builtinItemIds: Record<string, true> = Object.fromEntries(
  [...galleryItems, ...studentWorkItems].map((item) => [item.id, true]),
);
const BUILTIN_CATEGORY_IDS = galleryCategories.map((c) => c.id) as string[];

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cleanImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.startsWith("data:image/") ? value : undefined;
}

function cleanCategories(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const entry of value) {
    const id = cleanText(entry);
    if (id && id.length <= 40 && !out.includes(id)) out.push(id);
    if (out.length >= 12) break;
  }
  return out;
}

/** Remove invalid/empty fields; returns undefined when nothing is left. */
export function cleanGalleryEdit(edit: GalleryItemEdit): GalleryItemEdit | undefined {
  const out: GalleryItemEdit = {};
  const titleEn = cleanText(edit.titleEn);
  const titleZh = cleanText(edit.titleZh);
  const image = cleanImage(edit.image);
  if (titleEn) out.titleEn = titleEn;
  if (titleZh) out.titleZh = titleZh;
  if (edit.categories !== undefined) out.categories = cleanCategories(edit.categories) ?? [];
  if (image) out.image = image;
  return Object.keys(out).length > 0 ? out : undefined;
}

function cleanCustomItem(raw: unknown): CustomGalleryItem | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const id = cleanText(c["id"]);
  const titleEn = cleanText(c["titleEn"]);
  const image = cleanImage(c["image"]);
  const collection = c["collection"] === "student" ? "student" : "gallery";
  if (!id || !titleEn || !image) return undefined;
  const width = typeof c["width"] === "number" && c["width"] > 0 ? Math.round(c["width"]) : 720;
  const height = typeof c["height"] === "number" && c["height"] > 0 ? Math.round(c["height"]) : 900;
  return {
    id,
    collection,
    image,
    width,
    height,
    categories: cleanCategories(c["categories"]) ?? [],
    titleEn,
    titleZh: cleanText(c["titleZh"]) ?? "",
  };
}

function cleanCustomCategory(raw: unknown): CustomGalleryCategory | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const id = cleanText(c["id"]);
  const nameEn = cleanText(c["nameEn"]);
  if (!id || !nameEn) return undefined;
  if (BUILTIN_CATEGORY_IDS.includes(id)) return undefined;
  return { id, nameEn, nameZh: cleanText(c["nameZh"]) ?? "" };
}

function sanitize(raw: unknown): GalleryOverrides {
  if (!raw || typeof raw !== "object") return emptyGalleryOverrides;
  const obj = raw as Record<string, unknown>;

  const edits: Record<string, GalleryItemEdit> = {};
  const rawEdits = obj["edits"];
  if (rawEdits && typeof rawEdits === "object") {
    for (const [id, edit] of Object.entries(rawEdits as Record<string, unknown>)) {
      if (!builtinItemIds[id]) continue;
      const cleaned = cleanGalleryEdit((edit ?? {}) as GalleryItemEdit);
      if (cleaned) edits[id] = cleaned;
    }
  }

  const rawAdded = obj["added"];
  const added = Array.isArray(rawAdded)
    ? rawAdded.map(cleanCustomItem).filter((c): c is CustomGalleryItem => Boolean(c))
    : [];
  const seenAdded = new Set<string>();
  const dedupedAdded = added.filter((c) => {
    if (seenAdded.has(c.id) || builtinItemIds[c.id]) return false;
    seenAdded.add(c.id);
    return true;
  });

  const seenCategoryIds = new Set<string>();
  const rawCategories = obj["categories"];
  const categories = (Array.isArray(rawCategories) ? rawCategories : [])
    .map(cleanCustomCategory)
    .filter((c): c is CustomGalleryCategory => {
      if (!c || seenCategoryIds.has(c.id)) return false;
      seenCategoryIds.add(c.id);
      return true;
    });

  const knownIds = new Set<string>([...Object.keys(builtinItemIds), ...dedupedAdded.map((c) => c.id)]);
  const rawHidden = obj["hidden"];
  const hidden = Array.isArray(rawHidden)
    ? rawHidden.filter((id): id is string => typeof id === "string" && knownIds.has(id))
    : [];
  const rawShared = obj["shared"];
  const shared = Array.isArray(rawShared)
    ? rawShared.filter((id): id is string => typeof id === "string" && knownIds.has(id))
    : [];
  const rawDeleted = obj["deleted"];
  const deleted = Array.isArray(rawDeleted)
    ? rawDeleted.filter((id): id is string => typeof id === "string" && knownIds.has(id))
    : [];
  const rawPurged = obj["purged"];
  const purged = Array.isArray(rawPurged)
    ? rawPurged.filter((id): id is string => typeof id === "string" && builtinItemIds[id] === true)
    : [];

  const categoryEdits: Record<string, { nameEn?: string; nameZh?: string }> = {};
  const rawCategoryEdits = obj["categoryEdits"];
  if (rawCategoryEdits && typeof rawCategoryEdits === "object") {
    for (const [id, value] of Object.entries(rawCategoryEdits as Record<string, unknown>)) {
      if (!BUILTIN_CATEGORY_IDS.includes(id)) continue;
      const rec = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
      const nameEn = cleanText(rec["nameEn"]);
      const nameZh = cleanText(rec["nameZh"]);
      if (!nameEn && !nameZh) continue;
      categoryEdits[id] = { ...(nameEn ? { nameEn } : {}), ...(nameZh ? { nameZh } : {}) };
    }
  }

  const customCategoryIds = new Set(categories.map((c) => c.id));
  const rawDeletedCategories = obj["deletedCategories"];
  const deletedCategories = Array.isArray(rawDeletedCategories)
    ? rawDeletedCategories.filter(
        (id): id is string =>
          typeof id === "string" && (BUILTIN_CATEGORY_IDS.includes(id) || customCategoryIds.has(id)),
      )
    : [];
  const rawPurgedCategories = obj["purgedCategories"];
  const purgedCategories = Array.isArray(rawPurgedCategories)
    ? rawPurgedCategories.filter(
        (id): id is string => typeof id === "string" && BUILTIN_CATEGORY_IDS.includes(id),
      )
    : [];

  return {
    edits,
    added: dedupedAdded,
    hidden,
    shared,
    deleted,
    purged,
    categories,
    categoryEdits,
    deletedCategories,
    purgedCategories,
  };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export function readGalleryOverrides(): GalleryOverrides {
  if (typeof window === "undefined") return emptyGalleryOverrides;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyGalleryOverrides;
    return sanitize(JSON.parse(raw));
  } catch {
    return emptyGalleryOverrides;
  }
}

export function writeGalleryOverrides(overrides: GalleryOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(overrides)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isGalleryPristine(overrides: GalleryOverrides): boolean {
  return (
    Object.keys(overrides.edits).length === 0 &&
    overrides.added.length === 0 &&
    overrides.hidden.length === 0 &&
    overrides.shared.length === 0 &&
    overrides.deleted.length === 0 &&
    overrides.purged.length === 0 &&
    overrides.categories.length === 0 &&
    Object.keys(overrides.categoryEdits).length === 0 &&
    overrides.deletedCategories.length === 0 &&
    overrides.purgedCategories.length === 0
  );
}

/* ------------------------------------------------------------------ */
/* Merging                                                             */
/* ------------------------------------------------------------------ */

/** A category currently shown as a gallery filter (built-in or studio-created). */
export interface EffectiveGalleryCategory {
  id: string;
  nameEn: string;
  nameZh: string;
  builtin: boolean;
}

/**
 * Every active category: built-ins (minus trashed/purged, with renames applied)
 * followed by studio-created ones (minus trashed).
 */
export function effectiveGalleryCategories(overrides: GalleryOverrides): EffectiveGalleryCategory[] {
  const builtins = galleryCategories
    .filter(
      (c) =>
        !overrides.deletedCategories.includes(c.id) && !overrides.purgedCategories.includes(c.id),
    )
    .map((c) => {
      const edit = overrides.categoryEdits[c.id];
      return {
        id: c.id as string,
        nameEn: edit?.nameEn ?? c.en,
        nameZh: edit?.nameZh ?? c.zh,
        builtin: true,
      };
    });
  return [
    ...builtins,
    ...overrides.categories
      .filter((c) => !overrides.deletedCategories.includes(c.id))
      .map((c) => ({ id: c.id, nameEn: c.nameEn, nameZh: c.nameZh, builtin: false })),
  ];
}

function baseItems(collection: GalleryCollection): GalleryItem[] {
  return collection === "student" ? studentWorkItems : galleryItems;
}

/** A built-in photo with its admin edit applied. */
export function applyGalleryEdit(item: GalleryItem, edit: GalleryItemEdit | undefined): GalleryItem {
  if (!edit) return item;
  const out = { ...item };
  if (edit.titleEn !== undefined) out.en = edit.titleEn;
  if (edit.titleZh !== undefined) out.zh = edit.titleZh;
  if (edit.categories !== undefined) out.categories = [...edit.categories];
  if (edit.image) out.src = edit.image;
  return out;
}

function toGalleryItem(c: CustomGalleryItem): GalleryItem {
  return {
    id: c.id,
    src: c.image,
    width: c.width,
    height: c.height,
    categories: [...c.categories],
    en: c.titleEn,
    zh: c.titleZh,
  };
}

/**
 * Photos for one collection with edits applied and trashed/purged category
 * memberships removed. Hidden and trashed photos are excluded — this is the
 * public storefront view.
 */
export function effectiveGalleryItems(
  overrides: GalleryOverrides,
  collection: GalleryCollection,
): GalleryItem[] {
  const validCategories = new Set(effectiveGalleryCategories(overrides).map((c) => c.id));
  const keep = (item: GalleryItem): GalleryItem => ({
    ...item,
    categories: item.categories.filter((id) => validCategories.has(id)),
  });
  const live = (id: string) =>
    !overrides.hidden.includes(id) && !overrides.deleted.includes(id) && !overrides.purged.includes(id);
  const base = baseItems(collection)
    .filter((item) => live(item.id))
    .map((item) => keep(applyGalleryEdit(item, overrides.edits[item.id])));
  const custom = overrides.added
    .filter((c) => c.collection === collection && live(c.id))
    .map((c) => keep(toGalleryItem(c)));
  // Photos flagged "show in both sections" that live in the other collection.
  const other: GalleryCollection = collection === "student" ? "gallery" : "student";
  const mirroredBase = baseItems(other)
    .filter((item) => overrides.shared.includes(item.id) && live(item.id))
    .map((item) => keep(applyGalleryEdit(item, overrides.edits[item.id])));
  const mirroredCustom = overrides.added
    .filter((c) => c.collection === other && overrides.shared.includes(c.id) && live(c.id))
    .map((c) => keep(toGalleryItem(c)));
  return [...base, ...custom, ...mirroredBase, ...mirroredCustom];
}

/** One row of the admin photo list (includes hidden photos, excludes trashed). */
export interface AdminGalleryRow {
  item: GalleryItem;
  hidden: boolean;
  custom: boolean;
  /** The collection the photo belongs to originally. */
  home: GalleryCollection;
  /** True when the photo is shown in both sections. */
  mirrored: boolean;
}

/** The admin dashboard list for one collection: visible + hidden photos with edits applied. */
export function adminGalleryItems(
  overrides: GalleryOverrides,
  collection: GalleryCollection,
): AdminGalleryRow[] {
  const validCategories = new Set(effectiveGalleryCategories(overrides).map((c) => c.id));
  const keep = (item: GalleryItem): GalleryItem => ({
    ...item,
    categories: item.categories.filter((id) => validCategories.has(id)),
  });
  const base = baseItems(collection)
    .filter((item) => !overrides.deleted.includes(item.id) && !overrides.purged.includes(item.id))
    .map((item) => ({
      item: keep(applyGalleryEdit(item, overrides.edits[item.id])),
      hidden: overrides.hidden.includes(item.id),
      custom: false,
      home: collection,
      mirrored: overrides.shared.includes(item.id),
    }));
  const custom = overrides.added
    .filter((c) => c.collection === collection && !overrides.deleted.includes(c.id))
    .map((c) => ({
      item: keep(toGalleryItem(c)),
      hidden: overrides.hidden.includes(c.id),
      custom: true,
      home: collection,
      mirrored: overrides.shared.includes(c.id),
    }));
  // Mirrored photos from the other collection, so their toggle is editable in both tabs.
  const other: GalleryCollection = collection === "student" ? "gallery" : "student";
  const mirroredBase = baseItems(other)
    .filter(
      (item) =>
        overrides.shared.includes(item.id) &&
        !overrides.deleted.includes(item.id) &&
        !overrides.purged.includes(item.id),
    )
    .map((item) => ({
      item: keep(applyGalleryEdit(item, overrides.edits[item.id])),
      hidden: overrides.hidden.includes(item.id),
      custom: false,
      home: other,
      mirrored: true,
    }));
  const mirroredCustom = overrides.added
    .filter(
      (c) =>
        c.collection === other && overrides.shared.includes(c.id) && !overrides.deleted.includes(c.id),
    )
    .map((c) => ({
      item: keep(toGalleryItem(c)),
      hidden: overrides.hidden.includes(c.id),
      custom: true,
      home: other,
      mirrored: true,
    }));
  return [...base, ...custom, ...mirroredBase, ...mirroredCustom];
}

/** Photos currently in the trash (both collections), newest edits applied. */
export function trashedGalleryItems(overrides: GalleryOverrides): AdminGalleryRow[] {
  const rows: AdminGalleryRow[] = [];
  for (const collection of ["gallery", "student"] as const) {
    for (const item of baseItems(collection)) {
      if (!overrides.deleted.includes(item.id)) continue;
      rows.push({
        item: applyGalleryEdit(item, overrides.edits[item.id]),
        hidden: false,
        custom: false,
        home: collection,
        mirrored: false,
      });
    }
  }
  for (const c of overrides.added) {
    if (!overrides.deleted.includes(c.id)) continue;
    rows.push({ item: toGalleryItem(c), hidden: false, custom: true, home: c.collection, mirrored: false });
  }
  return rows;
}

/** Find the studio-uploaded record for an item id, if it is a custom photo. */
export function findCustomItem(
  overrides: GalleryOverrides,
  id: string,
): CustomGalleryItem | undefined {
  return overrides.added.find((c) => c.id === id);
}

/* ------------------------------------------------------------------ */
/* Id helpers                                                          */
/* ------------------------------------------------------------------ */

/** URL-safe unique id for a new custom photo, derived from its title. */
export function makeGalleryItemId(name: string, taken: ReadonlySet<string>): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "photo";
  let candidate = `custom-${slug}`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `custom-${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

/** URL-safe unique id for a new custom category, derived from its name. */
export function makeGalleryCategoryId(name: string, taken: ReadonlySet<string>): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "category";
  let candidate = `gcat-${slug}`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `gcat-${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

/* ------------------------------------------------------------------ */
/* React hooks                                                         */
/* ------------------------------------------------------------------ */

/**
 * Client-side overrides state. Starts empty so SSR/hydration matches the
 * static defaults, then syncs from localStorage and live admin edits
 * (custom event + cross-tab storage event).
 */
export function useGalleryOverrides(): GalleryOverrides {
  const [overrides, setOverrides] = useState<GalleryOverrides>(emptyGalleryOverrides);

  useEffect(() => {
    const sync = () => setOverrides(readGalleryOverrides());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return overrides;
}

/** Effective public photo list for a collection, reactive to admin edits. */
export function useEffectiveGalleryItems(collection: GalleryCollection): GalleryItem[] {
  const overrides = useGalleryOverrides();
  return useMemo(() => effectiveGalleryItems(overrides, collection), [overrides, collection]);
}

/** Effective category filters, reactive to admin edits. */
export function useEffectiveGalleryCategories(): EffectiveGalleryCategory[] {
  const overrides = useGalleryOverrides();
  return useMemo(() => effectiveGalleryCategories(overrides), [overrides]);
}
