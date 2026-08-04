import { createServerFn } from "@tanstack/react-start";
import { fetchNprPerCny } from "./fx.server";

/**
 * Latest NPR→CNY rate expressed as "NPR per 1 CNY" (e.g. 22.6).
 * Refreshed daily upstream, cached 12h server-side, falls back safely.
 */
export const getNprToCnyRate = createServerFn({ method: "GET" }).handler(async () => fetchNprPerCny());
