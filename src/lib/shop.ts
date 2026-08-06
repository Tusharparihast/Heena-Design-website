/**
 * Shop products.
 * Text (name, description, price display, features, usage) lives in
 * src/i18n/en.ts and zh.ts under `shopPage.items`.
 * Here we keep the id -> image/category/stock/numeric-price mapping so images
 * bundle locally and totals can be estimated.
 */
import hennaCone from "@/assets/shop/henna-cone.jpg";
import bridalKit from "@/assets/shop/bridal-kit.jpg";
import aftercareOil from "@/assets/shop/aftercare-oil.jpg";
import practiceBook from "@/assets/shop/practice-book.jpg";
import practiceHand from "@/assets/shop/practice-hand.jpg";
import stencils from "@/assets/shop/stencils.jpg";

/** Built-in category ids. The studio can add its own categories in the admin dashboard. */
export const DEFAULT_CATEGORY_IDS = ["cones", "kits", "care", "practice"] as const;
export type DefaultCategoryId = (typeof DEFAULT_CATEGORY_IDS)[number];
/** A product category id — one of the built-ins above or a custom id created in the admin dashboard. */
export type ShopCategory = string;
export type StockStatus = "in" | "low" | "out";

export type ShopProduct = {
  id: string;
  image: string;
  /** Extra shots for the product page gallery (falls back to `image`). */
  gallery: string[];
  category: ShopCategory;
  /** Numeric price in NPR, used to estimate order totals. Display price lives in i18n. */
  priceNpr: number;
  stock: StockStatus;
  featured?: boolean;
  /** Percentage discount (1–99), managed by the studio. Omit for full price. */
  discount?: number;
  features?: string[];
  usage?: string[];
};

export const MAX_ORDER_QTY = 20;

export const shopProducts: ShopProduct[] = [
  {
    id: "henna-cone",
    image: hennaCone,
    gallery: [hennaCone],
    category: "cones",
    priceNpr: 150,
    stock: "in",
    featured: true,
  },
  {
    id: "cone-pack",
    image: hennaCone,
    gallery: [hennaCone],
    category: "cones",
    priceNpr: 650,
    stock: "in",
    discount: 15,
  },
  {
    id: "bridal-kit",
    image: bridalKit,
    gallery: [bridalKit],
    category: "kits",
    priceNpr: 2500,
    stock: "in",
    featured: true,
  },
  {
    id: "starter-kit",
    image: bridalKit,
    gallery: [bridalKit],
    category: "kits",
    priceNpr: 1800,
    stock: "in",
    discount: 10,
  },
  { id: "aftercare-oil", image: aftercareOil, gallery: [aftercareOil], category: "care", priceNpr: 400, stock: "in" },
  {
    id: "practice-book",
    image: practiceBook,
    gallery: [practiceBook],
    category: "practice",
    priceNpr: 700,
    stock: "in",
  },
  {
    id: "practice-hand",
    image: practiceHand,
    gallery: [practiceHand],
    category: "practice",
    priceNpr: 1200,
    stock: "low",
  },
  { id: "stencils", image: stencils, gallery: [stencils], category: "practice", priceNpr: 550, stock: "in" },
];

export const shopImages: Record<string, string> = Object.fromEntries(shopProducts.map((p) => [p.id, p.image]));

export function formatNpr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-US")}`;
}

/**
 * Fallback NPR → CNY reference rate for Chinese-language price hints.
 * The live daily rate is fetched via useCnyRate() (src/lib/use-cny-rate.ts);
 * this constant is only used until that loads or if the FX API is unreachable.
 * Payment is always settled in NPR; the ¥ figure is a courtesy estimate.
 */
export const NPR_PER_CNY = 19;

/** Approximate CNY equivalent of an NPR amount, e.g. "≈ ¥34". Pass the live rate from useCnyRate(). */
export function formatCny(nprAmount: number, nprPerCny: number = NPR_PER_CNY) {
  const cny = Math.max(1, Math.round(nprAmount / nprPerCny));
  return `≈ ¥${cny.toLocaleString("en-US")}`;
}

/** Effective unit price after the studio discount. */
export function unitPriceNpr(p: ShopProduct) {
  return p.discount ? Math.round((p.priceNpr * (100 - p.discount)) / 100) : p.priceNpr;
}

export function relatedProducts(id: string, limit = 3): ShopProduct[] {
  const current = shopProducts.find((p) => p.id === id);
  if (!current) return [];
  const sameCategory = shopProducts.filter((p) => p.id !== id && p.category === current.category);
  const others = shopProducts.filter((p) => p.id !== id && p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}
