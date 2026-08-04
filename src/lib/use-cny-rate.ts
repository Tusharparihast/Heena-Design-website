/**
 * Client hook for the live NPR→CNY rate ("NPR per 1 CNY").
 * Fetched once per day and cached in localStorage; falls back to the static
 * NPR_PER_CNY constant while loading or on failure, so prices always render
 * instantly and work offline.
 */
import { useEffect, useState } from "react";
import { getNprToCnyRate } from "@/lib/exchange.functions";
import { NPR_PER_CNY } from "@/lib/shop";

const CACHE_KEY = "nagma-cny-rate-v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export function useCnyRate(): number {
  const [rate, setRate] = useState(NPR_PER_CNY);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { rate?: number; ts?: number };
        if (
          typeof parsed.rate === "number" &&
          parsed.rate > 0 &&
          typeof parsed.ts === "number" &&
          Date.now() - parsed.ts < DAY_MS
        ) {
          setRate(parsed.rate);
          return;
        }
      }
    } catch {
      // Malformed cache — refetch below.
    }

    getNprToCnyRate()
      .then((fresh) => {
        if (typeof fresh !== "number" || fresh <= 0) return;
        setRate(fresh);
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify({ rate: fresh, ts: Date.now() }));
        } catch {
          // Storage unavailable — non-fatal.
        }
      })
      .catch(() => {
        // Keep the fallback rate.
      });
  }, []);

  return rate;
}
