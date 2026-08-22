// ============= Database-backed studio content documents =============
// Each admin-managed content area (gallery, courses, ...) is stored as one
// JSON document in the `site_content` table. Visitors read it anonymously;
// only admins can write (enforced by row-level security).
//
// A small module-level cache keeps reads synchronous for the merge helpers
// that were originally written against localStorage, while a realtime
// subscription keeps every open tab in sync with the dashboard.

import { useEffect, useLayoutEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type Doc = unknown;

const cache = new Map<string, Doc>();
const listeners = new Map<string, Set<() => void>>();
const loading = new Map<string, Promise<void>>();
const subscribed = new Set<string>();

/** Browser mirror of each document so a reload paints the saved content immediately. */
const mirrorKey = (key: string) => `nd-sc-${key}`;

function readMirror(key: string): { hit: boolean; value: Doc } {
  if (typeof window === "undefined") return { hit: false, value: undefined };
  try {
    const raw = window.localStorage.getItem(mirrorKey(key));
    if (raw === null) return { hit: false, value: undefined };
    return { hit: true, value: JSON.parse(raw) as Doc };
  } catch {
    return { hit: false, value: undefined };
  }
}

function writeMirror(key: string, value: Doc) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(mirrorKey(key), JSON.stringify(value ?? null));
  } catch {
    /* quota exceeded — the database stays the source of truth */
  }
}

/** Warm the cache from the browser mirror so there is no flash of stale/default content. */
function hydrateFromMirror(key: string) {
  if (cache.has(key)) return;
  const { hit, value } = readMirror(key);
  if (hit) cache.set(key, value);
}

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

/** Cached document (undefined until the first load resolves). */
export function readSiteContent(key: string): Doc {
  hydrateFromMirror(key);
  return cache.get(key);
}

async function fetchDoc(key: string): Promise<void> {
  const { data, error } = await supabase.from("site_content").select("data").eq("key", key).maybeSingle();
  if (error) return;
  const value = data?.data ?? null;
  cache.set(key, value);
  writeMirror(key, value);
  notify(key);
}

function ensureLoaded(key: string): Promise<void> {
  let p = loading.get(key);
  if (!p) {
    p = fetchDoc(key);
    loading.set(key, p);
  }
  return p;
}



function ensureRealtime(key: string) {
  if (subscribed.has(key) || typeof window === "undefined") return;
  subscribed.add(key);
  const channel = supabase
    .channel(`site-content-${key}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_content", filter: `key=eq.${key}` },
      () => {
        loading.delete(key);
        void ensureLoaded(key);
      },
    );
  channel.subscribe();
}

/** Writes the document (admins only) and updates every subscriber optimistically. */
export async function saveSiteContent(key: string, data: unknown): Promise<boolean> {
  cache.set(key, data);
  notify(key);
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, data: data as never }, { onConflict: "key" });
  if (error) {
    console.error(`[site-content] save failed for "${key}":`, error.message);
    return false;
  }
  return true;
}

/**
 * Subscribes to one content document. Returns the raw (unsanitised) value —
 * callers sanitise into their own shape — plus a `loaded` flag.
 */
export function useSiteContent(key: string): { doc: Doc; loaded: boolean } {
  const [state, setState] = useState<{ doc: Doc; loaded: boolean }>(() => ({
    doc: cache.get(key),
    loaded: cache.has(key),
  }));

  useEffect(() => {
    const sync = () => setState({ doc: cache.get(key), loaded: cache.has(key) });
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(sync);
    sync();
    void ensureLoaded(key).then(sync);
    ensureRealtime(key);
    return () => {
      set?.delete(sync);
    };
  }, [key]);

  return state;
}

/**
 * One-time lift of legacy browser-only overrides into the database. Runs when
 * the database document is still empty and this browser has old localStorage
 * data; the write only succeeds for signed-in admins, which is exactly who we
 * want to migrate from.
 */
export function migrateLocalContent(key: string, storageKey: string, isEmpty: (value: unknown) => boolean) {
  if (typeof window === "undefined") return;
  const flag = `nd-migrated-${storageKey}`;
  if (window.localStorage.getItem(flag)) return;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return;
  void ensureLoaded(key).then(async () => {
    const current = cache.get(key);
    if (current != null && !isEmpty(current)) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isEmpty(parsed)) return;
      const ok = await saveSiteContent(key, parsed);
      if (ok) window.localStorage.setItem(flag, "1");
    } catch {
      /* ignore malformed legacy data */
    }
  });
}
