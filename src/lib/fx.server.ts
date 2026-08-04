/**
 * Live NPR → CNY exchange rate (server-only).
 * Source: open.er-api.com — free, no key, updates daily.
 * The rate is cached in the worker for 12 hours; any failure falls back to
 * FALLBACK_NPR_PER_CNY so price hints never break.
 */

export const FALLBACK_NPR_PER_CNY = 19;

const CACHE_MS = 12 * 60 * 60 * 1000;
const API_URL = "https://open.er-api.com/v6/latest/NPR";

let cached: { nprPerCny: number; fetchedAt: number } | undefined;

export async function fetchNprPerCny(): Promise<number> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_MS) return cached.nprPerCny;

  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`FX API responded ${res.status}`);
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const cnyPerNpr = json.rates?.CNY;
    if (json.result !== "success" || typeof cnyPerNpr !== "number" || cnyPerNpr <= 0) {
      throw new Error("FX API payload missing CNY rate");
    }
    const nprPerCny = 1 / cnyPerNpr;
    cached = { nprPerCny, fetchedAt: now };
    return nprPerCny;
  } catch (error) {
    console.error("FX rate fetch failed, using fallback:", error);
    // Prefer a stale live rate over the static fallback.
    return cached?.nprPerCny ?? FALLBACK_NPR_PER_CNY;
  }
}
