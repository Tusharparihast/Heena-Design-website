import { useEffect, useState } from "react";

import {
  formatNpr,
  shopProducts,
  type ShopCategory,
  type ShopProduct,
  type StockStatus,
} from "./shop";

/**
 * Studio-managed product catalog overrides.
 *
 * Built-in product defaults live in src/lib/shop.ts and the i18n dictionaries.
 * The admin Products dashboard (/admin/products) writes overrides so the studio
 * can edit names, descriptions, prices, stock, photos, discounts, categories,
 * featured flags and visibility — and add or delete products — without touching
 * code. The storefront merges overrides at render time.
 *
 * Until the backend phase lands, overrides persist in localStorage (this
 * browser only). The storage shape mirrors the future database schema so the
 * same merge logic can be reused when the catalog moves to Lovable Cloud.
 */

const STORAGE_KEY = "nd-shop-catalog-overrides";
const LEGACY_DISCOUNT_KEY = "nd-shop-discount-overrides";
const CHANGE_EVENT = "nd:shop-catalog-overrides";

const CATEGORIES: ShopCategory[] = ["cones", "kits", "care", "practice"];
const STOCK_STATUSES: StockStatus[] = ["in", "low", "out"];

/** Editable fields for a built-in product. Missing keys keep the defaults. */
export interface ProductEdit {
  nameEn?: string;
  nameZh?: string;
  bodyEn?: string;
  bodyZh?: string;
  priceNpr?: number;
  stock?: StockStatus;
  /** number 1-99 = discounted; null = discount explicitly removed. */
  discount?: number | null;
  category?: ShopCategory;
  featured?: boolean;
  /** Uploaded photo as a (compressed) data URL. */
  image?: string;
}

/** A fully custom product added from the admin dashboard. */
export interface CustomProduct {
  id: string;
  image: string;
  category: ShopCategory;
  priceNpr: number;
  stock: StockStatus;
  featured: boolean;
  discount?: number;
  nameEn: string;
  nameZh: string;
  bodyEn: string;
  bodyZh: string;
}

export interface CatalogOverrides {
  /** Per-field edits for built-in products, keyed by product id. */
  edits: Record<string, ProductEdit>;
  /** Custom products created in the dashboard. */
  added: CustomProduct[];
  /** Ids of built-in products hidden from the shop. */
  hidden: string[];
}

export const emptyCatalogOverrides: CatalogOverrides = { edits: {}, added: [], hidden: [] };

/** Text the storefront renders for a product (mirrors the i18n item shape). */
export interface ProductCopy {
  id: string;
  name: string;
  body: string;
  details: string;
  price: string;
  features: string[];
  usage: string[];
}

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cleanPrice(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const n = Math.round(value);
  return n >= 1 && n <= 10_000_000 ? n : undefined;
}

function cleanPercent(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const n = Math.round(value);
  return n >= 1 && n <= 99 ? n : undefined;
}

function cleanImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.startsWith("data:image/") ? value : undefined;
}

/** Remove invalid/empty fields; returns undefined when nothing is left. */
export function cleanEdit(edit: ProductEdit): ProductEdit | undefined {
  const out: ProductEdit = {};
  const nameEn = cleanText(edit.nameEn);
  const nameZh = cleanText(edit.nameZh);
  const bodyEn = cleanText(edit.bodyEn);
  const bodyZh = cleanText(edit.bodyZh);
  const priceNpr = cleanPrice(edit.priceNpr);
  const image = cleanImage(edit.image);
  if (nameEn) out.nameEn = nameEn;
  if (nameZh) out.nameZh = nameZh;
  if (bodyEn) out.bodyEn = bodyEn;
  if (bodyZh) out.bodyZh = bodyZh;
  if (priceNpr !== undefined) out.priceNpr = priceNpr;
  if (edit.stock && STOCK_STATUSES.includes(edit.stock)) out.stock = edit.stock;
  if (edit.category && CATEGORIES.includes(edit.category)) out.category = edit.category;
  if (typeof edit.featured === "boolean") out.featured = edit.featured;
  if (image) out.image = image;
  if (edit.discount === null) out.discount = null;
  else {
    const pct = cleanPercent(edit.discount);
    if (pct !== undefined) out.discount = pct;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function cleanCustomProduct(raw: unknown): CustomProduct | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const id = cleanText(c["id"]);
  const nameEn = cleanText(c["nameEn"]);
  const priceNpr = cleanPrice(c["priceNpr"]);
  const image = cleanImage(c["image"]);
  if (!id || !nameEn || priceNpr === undefined || !image) return undefined;
  const category = CATEGORIES.includes(c["category"] as ShopCategory)
    ? (c["category"] as ShopCategory)
    : "cones";
  const stock = STOCK_STATUSES.includes(c["stock"] as StockStatus)
    ? (c["stock"] as StockStatus)
    : "in";
  const discount = cleanPercent(c["discount"]);
  return {
    id,
    image,
    category,
    priceNpr,
    stock,
    featured: c["featured"] === true,
    ...(discount !== undefined ? { discount } : {}),
    nameEn,
    nameZh: cleanText(c["nameZh"]) ?? "",
    bodyEn: cleanText(c["bodyEn"]) ?? "",
    bodyZh: cleanText(c["bodyZh"]) ?? "",
  };
}

function sanitize(raw: unknown): CatalogOverrides {
  if (!raw || typeof raw !== "object") return emptyCatalogOverrides;
  const obj = raw as Record<string, unknown>;
  const edits: Record<string, ProductEdit> = {};
  const rawEdits = obj["edits"];
  if (rawEdits && typeof rawEdits === "object") {
    for (const [id, edit] of Object.entries(rawEdits as Record<string, unknown>)) {
      const cleaned = cleanEdit((edit ?? {}) as ProductEdit);
      if (cleaned) edits[id] = cleaned;
    }
  }
  const rawAdded = obj["added"];
  const added = Array.isArray(rawAdded)
    ? rawAdded.map(cleanCustomProduct).filter((c): c is CustomProduct => Boolean(c))
    : [];
  const rawHidden = obj["hidden"];
  const hidden = Array.isArray(rawHidden)
    ? rawHidden.filter((id): id is string => typeof id === "string" && id in shopImagesIds)
    : [];
  return { edits, added, hidden };
}

const shopImagesIds: Record<string, true> = Object.fromEntries(shopProducts.map((p) => [p.id, true]));

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/** One-time migration of the old discount-only overrides. */
function migrateLegacyDiscounts(): CatalogOverrides | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_DISCOUNT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const edits: Record<string, ProductEdit> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === null) edits[id] = { discount: null };
      else {
        const pct = cleanPercent(value);
        if (pct !== undefined) edits[id] = { discount: pct };
      }
    }
    const migrated: CatalogOverrides = { edits, added: [], hidden: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    window.localStorage.removeItem(LEGACY_DISCOUNT_KEY);
    return migrated;
  } catch {
    return null;
  }
}

export function readCatalogOverrides(): CatalogOverrides {
  if (typeof window === "undefined") return emptyCatalogOverrides;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyDiscounts() ?? emptyCatalogOverrides;
    return sanitize(JSON.parse(raw));
  } catch {
    return emptyCatalogOverrides;
  }
}

export function writeCatalogOverrides(overrides: CatalogOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(overrides)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function clearCatalogOverrides() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_DISCOUNT_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isCatalogPristine(overrides: CatalogOverrides): boolean {
  return (
    Object.keys(overrides.edits).length === 0 &&
    overrides.added.length === 0 &&
    overrides.hidden.length === 0
  );
}

/* ------------------------------------------------------------------ */
/* Merging                                                             */
/* ------------------------------------------------------------------ */

/** A built-in product with its edit applied. */
export function applyEdit(product: ShopProduct, edit: ProductEdit | undefined): ShopProduct {
  if (!edit) return product;
  const out: ShopProduct = { ...product };
  if (edit.priceNpr !== undefined) out.priceNpr = edit.priceNpr;
  if (edit.stock) out.stock = edit.stock;
  if (edit.category) out.category = edit.category;
  if (edit.featured !== undefined) out.featured = edit.featured;
  if (edit.image) {
    out.image = edit.image;
    out.gallery = [edit.image];
  }
  if (edit.discount === null) {
    delete out.discount;
  } else if (typeof edit.discount === "number") {
    out.discount = edit.discount;
  }
  return out;
}

function toShopProduct(c: CustomProduct): ShopProduct {
  return {
    id: c.id,
    image: c.image,
    gallery: [c.image],
    category: c.category,
    priceNpr: c.priceNpr,
    stock: c.stock,
    ...(c.featured ? { featured: true } : {}),
    ...(c.discount !== undefined ? { discount: c.discount } : {}),
  };
}

/** The full effective catalog: built-ins (minus hidden, with edits) + custom. */
export function effectiveProducts(overrides: CatalogOverrides): ShopProduct[] {
  const base = shopProducts
    .filter((p) => !overrides.hidden.includes(p.id))
    .map((p) => applyEdit(p, overrides.edits[p.id]));
  return [...base, ...overrides.added.map(toShopProduct)];
}

/** Related products from an already-effective catalog (same category first). */
export function relatedFrom(products: ShopProduct[], id: string, limit = 3): ShopProduct[] {
  const current = products.find((p) => p.id === id);
  if (!current) return [];
  const sameCategory = products.filter((p) => p.id !== id && p.category === current.category);
  const others = products.filter((p) => p.id !== id && p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}

/**
 * The text the storefront should render for a product: i18n dictionary copy
 * with any admin text overrides applied, or the custom product's own text.
 */
export function resolveCopy(
  product: ShopProduct,
  localeItem: ProductCopy | undefined,
  overrides: CatalogOverrides,
  locale: "en" | "zh",
): ProductCopy | null {
  const custom = overrides.added.find((c) => c.id === product.id);
  if (custom) {
    const name = (locale === "zh" ? custom.nameZh : "") || custom.nameEn;
    const body = (locale === "zh" ? custom.bodyZh : "") || custom.bodyEn;
    return {
      id: custom.id,
      name,
      body,
      details: body,
      price: formatNpr(custom.priceNpr),
      features: [],
      usage: [],
    };
  }
  if (!localeItem) return null;
  const edit = overrides.edits[product.id];
  if (!edit) return localeItem;
  const nameOverride = locale === "zh" ? edit.nameZh : edit.nameEn;
  const bodyOverride = locale === "zh" ? edit.bodyZh : edit.bodyEn;
  return {
    ...localeItem,
    name: nameOverride ?? localeItem.name,
    body: bodyOverride ?? localeItem.body,
    price: edit.priceNpr !== undefined ? formatNpr(edit.priceNpr) : localeItem.price,
  };
}

/** URL-safe unique id for a new custom product, derived from its name. */
export function makeProductId(name: string, taken: ReadonlySet<string>): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "product";
  let candidate = `custom-${slug}`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `custom-${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

/**
 * Client-side overrides state for storefront components. Starts empty so
 * SSR/hydration matches the static defaults, then syncs from localStorage
 * and live admin edits (custom event + cross-tab storage event).
 */
export function useCatalogOverrides(): CatalogOverrides {
  const [overrides, setOverrides] = useState<CatalogOverrides>(emptyCatalogOverrides);

  useEffect(() => {
    const sync = () => setOverrides(readCatalogOverrides());
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
