// ============= Stored media links =============
// Admin-managed images and videos are saved in the `site_content` documents as
// plain URLs. Two kinds of value can end up stale:
//
//  1. Build-output paths such as `/assets/hero-hand-C5IzKRkE.jpg` or
//     `/src/assets/hero-hand.jpg`. Those filenames are re-hashed on every
//     deploy, so a saved copy stops resolving and the section renders a broken
//     image or a dead poster.
//  2. Empty / whitespace values.
//
// Everything else (Supabase Storage signed links, absolute https links and
// data URLs) is used as-is. Bundled defaults must come from the imported asset
// at render time, never from a value stored in the database.

const BUILD_ASSET = /^\/(?:src\/)?assets\//i;

/** True when a stored link points at a build artefact that may no longer exist. */
export function isStaleMediaUrl(value: unknown): boolean {
  return typeof value === "string" && BUILD_ASSET.test(value.trim());
}

/** Returns a usable media link, falling back to the bundled default. */
export function resolveMediaUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed || isStaleMediaUrl(trimmed)) return fallback;
  return trimmed;
}

/** Same as `resolveMediaUrl` but keeps "not set" as undefined. */
export function optionalMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || isStaleMediaUrl(trimmed)) return undefined;
  return trimmed;
}
