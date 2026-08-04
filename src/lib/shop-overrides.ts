import { useEffect, useState } from "react";

import type { ShopProduct } from "./shop";

/**
 * Studio-managed discount overrides.
 *
 * Product defaults (including default discounts) live in src/lib/shop.ts.
 * The admin Products dashboard (/admin/products) writes overrides so sale
 * percentages can be set or removed per item without touching code, and the
 * storefront merges them at render time.
 *
 * Until the backend phase lands, overrides persist in localStorage (this
 * browser only). The storage shape is chosen so the same merge logic can be
 * reused when discounts move to the database.
 *
 * Value semantics per product id:
 *   missing key  -> use the default discount from shop.ts
 *   number 1-99  -> discounted by that percentage
 *   null         -> discount explicitly removed (even if shop.ts has one)
 */

const STORAGE_KEY = "nd-shop-discount-overrides";
const CHANGE_EVENT = "nd:shop-discount-overrides";

export type DiscountOverrides = Record<string, number | null>;

export function readDiscountOverrides(): DiscountOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: DiscountOverrides = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === null) {
        out[id] = null;
      } else if (typeof value === "number" && Number.isFinite(value)) {
        const pct = Math.round(value);
        if (pct >= 1 && pct <= 99) out[id] = pct;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeDiscountOverrides(overrides: DiscountOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function clearDiscountOverrides() {
  writeDiscountOverrides({});
}

/** Effective discount percentage for a product given the current overrides. */
export function resolveDiscount(
  product: ShopProduct,
  overrides: DiscountOverrides,
): number | undefined {
  if (product.id in overrides) {
    const value = overrides[product.id];
    return value == null ? undefined : value;
  }
  return product.discount;
}

/** A copy of the product with the effective discount applied. */
export function withResolvedDiscount(
  product: ShopProduct,
  overrides: DiscountOverrides,
): ShopProduct {
  const discount = resolveDiscount(product, overrides);
  if (discount === undefined) {
    const { discount: _removed, ...rest } = product;
    return rest;
  }
  return { ...product, discount };
}

/**
 * Client-side overrides state for storefront components. Starts empty so
 * SSR/hydration matches the static defaults, then syncs from localStorage
 * and live admin edits (custom event + cross-tab storage event).
 */
export function useDiscountOverrides(): DiscountOverrides {
  const [overrides, setOverrides] = useState<DiscountOverrides>({});

  useEffect(() => {
    const sync = () => setOverrides(readDiscountOverrides());
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
