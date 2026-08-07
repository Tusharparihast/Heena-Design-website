import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { en, zh } from "@/i18n/dictionaries";
import { DEFAULT_CATEGORY_IDS, formatNpr, shopProducts, type ShopProduct } from "./shop";

export type StockStatus = "in" | "low" | "out";

export interface DbProduct {
  id: string;
  image: string;
  gallery: string[];
  category: string;
  priceNpr: number;
  stock: StockStatus;
  discountPct: number | null;
  featured: boolean;
  visible: boolean;
  deleted: boolean;
  nameEn: string;
  nameZh: string;
  bodyEn: string;
  bodyZh: string;
  featuresEn: string[];
  featuresZh: string[];
  usageEn: string[];
  usageZh: string[];
}

export interface DbCategory {
  id: string;
  nameEn: string;
  nameZh: string;
  builtin: boolean;
  deleted: boolean;
}

interface ProductRow {
  id: string; image: string; gallery: string[]; category: string; price_npr: number;
  stock: string; discount_pct: number | null; featured: boolean; visible: boolean; deleted: boolean;
  name_en: string; name_zh: string; body_en: string; body_zh: string;
  features_en: string[]; features_zh: string[]; usage_en: string[]; usage_zh: string[];
}
interface CategoryRow {
  id: string; name_en: string; name_zh: string; builtin: boolean; deleted: boolean;
}

function rowToProduct(r: ProductRow): DbProduct {
  return {
    id: r.id, image: r.image, gallery: r.gallery ?? [], category: r.category, priceNpr: r.price_npr,
    stock: (["in", "low", "out"] as const).includes(r.stock as StockStatus) ? (r.stock as StockStatus) : "in",
    discountPct: r.discount_pct, featured: r.featured, visible: r.visible, deleted: r.deleted,
    nameEn: r.name_en, nameZh: r.name_zh, bodyEn: r.body_en, bodyZh: r.body_zh,
    featuresEn: r.features_en ?? [], featuresZh: r.features_zh ?? [],
    usageEn: r.usage_en ?? [], usageZh: r.usage_zh ?? [],
  };
}
function rowToCategory(r: CategoryRow): DbCategory {
  return { id: r.id, nameEn: r.name_en, nameZh: r.name_zh, builtin: r.builtin, deleted: r.deleted };
}

/* ---------------- Public storefront (RLS already filters to visible+live rows) ---------------- */

export function usePublicCatalog() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("product_categories").select("*"),
      ]);
      if (cancelled) return;
      setProducts((p ?? []).map((r) => rowToProduct(r as ProductRow)));
      setCategories((c ?? []).map((r) => rowToCategory(r as CategoryRow)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { products, categories, loading };
}

/* ---------------- Admin dashboard (RLS grants admins every row) ---------------- */

export function useAdminCatalog() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: true }),
      supabase.from("product_categories").select("*").order("created_at", { ascending: true }),
    ]);
    setProducts((p ?? []).map((r) => rowToProduct(r as ProductRow)));
    setCategories((c ?? []).map((r) => rowToCategory(r as CategoryRow)));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { products, categories, loading, refresh };
}

/* ---------------- Product mutations ---------------- */

export interface ProductInput {
  id: string; image: string; gallery?: string[]; category: string; priceNpr: number;
  stock: StockStatus; discountPct?: number | null; featured: boolean; visible?: boolean;
  nameEn: string; nameZh: string; bodyEn: string; bodyZh: string;
  featuresEn: string[]; featuresZh: string[]; usageEn: string[]; usageZh: string[];
}

export async function insertProduct(p: ProductInput): Promise<boolean> {
  const { error } = await supabase.from("products").insert({
    id: p.id, image: p.image, gallery: p.gallery ?? [p.image], category: p.category,
    price_npr: Math.round(p.priceNpr), stock: p.stock, discount_pct: p.discountPct ?? null,
    featured: p.featured, visible: p.visible ?? true,
    name_en: p.nameEn, name_zh: p.nameZh, body_en: p.bodyEn, body_zh: p.bodyZh,
    features_en: p.featuresEn, features_zh: p.featuresZh, usage_en: p.usageEn, usage_zh: p.usageZh,
  });
  return !error;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.image !== undefined) { payload.image = patch.image; payload.gallery = [patch.image]; }
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.priceNpr !== undefined) payload.price_npr = Math.round(patch.priceNpr);
  if (patch.stock !== undefined) payload.stock = patch.stock;
  if (patch.discountPct !== undefined) payload.discount_pct = patch.discountPct;
  if (patch.featured !== undefined) payload.featured = patch.featured;
  if (patch.visible !== undefined) payload.visible = patch.visible;
  if (patch.nameEn !== undefined) payload.name_en = patch.nameEn;
  if (patch.nameZh !== undefined) payload.name_zh = patch.nameZh;
  if (patch.bodyEn !== undefined) payload.body_en = patch.bodyEn;
  if (patch.bodyZh !== undefined) payload.body_zh = patch.bodyZh;
  if (patch.featuresEn !== undefined) payload.features_en = patch.featuresEn;
  if (patch.featuresZh !== undefined) payload.features_zh = patch.featuresZh;
  if (patch.usageEn !== undefined) payload.usage_en = patch.usageEn;
  if (patch.usageZh !== undefined) payload.usage_zh = patch.usageZh;
  const { error } = await supabase.from("products").update(payload).eq("id", id);
  return !error;
}

export async function setProductTrashed(id: string, trashed: boolean): Promise<boolean> {
  const { error } = await supabase.from("products").update({ deleted: trashed }).eq("id", id);
  return !error;
}
export async function purgeProduct(id: string): Promise<boolean> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  return !error;
}

/* ---------------- Category mutations ---------------- */

export async function insertCategory(id: string, nameEn: string, nameZh: string): Promise<boolean> {
  const { error } = await supabase.from("product_categories").insert({ id, name_en: nameEn, name_zh: nameZh, builtin: false });
  return !error;
}
export async function renameCategory(id: string, nameEn: string, nameZh: string): Promise<boolean> {
  const { error } = await supabase.from("product_categories").update({ name_en: nameEn, name_zh: nameZh }).eq("id", id);
  return !error;
}
export async function setCategoryTrashed(id: string, trashed: boolean): Promise<boolean> {
  const { error } = await supabase.from("product_categories").update({ deleted: trashed }).eq("id", id);
  return !error;
}
export async function purgeCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from("product_categories").delete().eq("id", id);
  return !error;
}

/* ---------------- Display helpers ---------------- */

export function toShopProduct(p: DbProduct): ShopProduct {
  return {
    id: p.id, image: p.image, gallery: p.gallery.length > 0 ? p.gallery : [p.image],
    category: p.category, priceNpr: p.priceNpr, stock: p.stock,
    ...(p.featured ? { featured: true } : {}),
    ...(p.discountPct != null ? { discount: p.discountPct } : {}),
  };
}

export interface ProductCopy {
  id: string; name: string; body: string; details: string; price: string;
  features: string[]; usage: string[];
}

export function productCopy(p: DbProduct, locale: "en" | "zh"): ProductCopy {
  const name = (locale === "zh" && p.nameZh) || p.nameEn;
  const body = (locale === "zh" && p.bodyZh) || p.bodyEn;
  return {
    id: p.id, name, body, details: body, price: formatNpr(p.priceNpr),
    features: locale === "zh" && p.featuresZh.length > 0 ? p.featuresZh : p.featuresEn,
    usage: locale === "zh" && p.usageZh.length > 0 ? p.usageZh : p.usageEn,
  };
}

export function catLabel(cat: DbCategory, locale: "en" | "zh"): string {
  return (locale === "zh" && cat.nameZh) || cat.nameEn;
}

export function relatedFrom(products: DbProduct[], id: string, limit = 3): DbProduct[] {
  const current = products.find((p) => p.id === id);
  if (!current) return [];
  const same = products.filter((p) => p.id !== id && p.category === current.category);
  const other = products.filter((p) => p.id !== id && p.category !== current.category);
  return [...same, ...other].slice(0, limit);
}

/* ---------------- One-time seed from the old hardcoded catalog ---------------- */

/** Runs once — no-ops once the products table already has rows. */
export async function seedCatalogIfEmpty(): Promise<void> {
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  await supabase.from("product_categories").insert(
    DEFAULT_CATEGORY_IDS.map((id) => ({
      id,
      name_en: en.shopPage.filters[id] ?? id,
      name_zh: zh.shopPage.filters[id] ?? "",
      builtin: true,
    })),
  );

  const itemsEn = new Map(en.shopPage.items.map((i) => [i.id, i]));
  const itemsZh = new Map(zh.shopPage.items.map((i) => [i.id, i]));

  await supabase.from("products").insert(
    shopProducts.map((p) => {
      const cEn = itemsEn.get(p.id);
      const cZh = itemsZh.get(p.id);
      return {
        id: p.id, image: p.image, gallery: p.gallery, category: p.category,
        price_npr: p.priceNpr, stock: p.stock, discount_pct: p.discount ?? null,
        featured: Boolean(p.featured), visible: true, deleted: false,
        name_en: cEn?.name ?? p.id, name_zh: cZh?.name ?? "",
        body_en: cEn?.body ?? "", body_zh: cZh?.body ?? "",
        features_en: cEn?.features ?? [], features_zh: cZh?.features ?? [],
        usage_en: cEn?.usage ?? [], usage_zh: cZh?.usage ?? [],
      };
    }),
  );
}
