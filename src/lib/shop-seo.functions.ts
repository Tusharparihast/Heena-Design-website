import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public product read for SSR metadata on /shop/$productId.
 * Uses the publishable (anon) client so the route loader can run during SSR
 * without a session. RLS restricts to visible, non-deleted rows.
 */
export interface SeoProduct {
  id: string;
  nameEn: string;
  nameZh: string;
  bodyEn: string;
  bodyZh: string;
  image: string;
  gallery: string[];
  priceNpr: number;
  stock: string;
}

export const getSeoProduct = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["VITE_SUPABASE_URL"] ?? "";
    const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";
    if (!url || !key) return null;
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data: row, error } = await supabase
      .from("products")
      .select("id,name_en,name_zh,body_en,body_zh,image,gallery,price_npr,stock,visible,deleted")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return null;
    if (!row.visible || row.deleted) return null;
    const sp: SeoProduct = {
      id: row.id,
      nameEn: row.name_en ?? "",
      nameZh: row.name_zh ?? "",
      bodyEn: row.body_en ?? "",
      bodyZh: row.body_zh ?? "",
      image: row.image ?? "",
      gallery: Array.isArray(row.gallery) ? row.gallery.filter(Boolean) : [],
      priceNpr: Number(row.price_npr) || 0,
      stock: row.stock ?? "in",
    };
    return sp;
  });
