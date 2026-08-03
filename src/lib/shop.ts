/**
 * Shop products.
 * Text (name, description, price) lives in src/i18n/en.ts and zh.ts under `shopPage.items`.
 * Here we only keep the id -> image + category mapping so images bundle locally.
 */
import hennaCone from "@/assets/shop/henna-cone.jpg";
import bridalKit from "@/assets/shop/bridal-kit.jpg";
import aftercareOil from "@/assets/shop/aftercare-oil.jpg";
import practiceBook from "@/assets/shop/practice-book.jpg";
import practiceHand from "@/assets/shop/practice-hand.jpg";
import stencils from "@/assets/shop/stencils.jpg";

export type ShopCategory = "cones" | "kits" | "care" | "practice";

export type ShopProduct = {
  id: string;
  image: string;
  category: ShopCategory;
  featured?: boolean;
};

export const shopProducts: ShopProduct[] = [
  { id: "henna-cone", image: hennaCone, category: "cones", featured: true },
  { id: "cone-pack", image: hennaCone, category: "cones" },
  { id: "bridal-kit", image: bridalKit, category: "kits", featured: true },
  { id: "starter-kit", image: bridalKit, category: "kits" },
  { id: "aftercare-oil", image: aftercareOil, category: "care" },
  { id: "practice-book", image: practiceBook, category: "practice" },
  { id: "practice-hand", image: practiceHand, category: "practice" },
  { id: "stencils", image: stencils, category: "practice" },
];

export const shopImages: Record<string, string> = Object.fromEntries(
  shopProducts.map((p) => [p.id, p.image])
);
