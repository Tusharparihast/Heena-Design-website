import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * The reference bucket is private: only the studio (admins) can browse it.
 * Visitors can upload but never read back; admins get 1-hour links only.
 */
const PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/;

/**
 * Visitor uploads go through this server function: it picks the random path
 * and mints a one-time signed upload link with the admin client, so the
 * bucket needs no anonymous INSERT policy at all.
 */
const EXT = /^[a-z0-9]{2,5}$/;

export const createReferenceUpload = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ ext: z.string().regex(EXT) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${crypto.randomUUID()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("custom-design-refs")
      .createSignedUploadUrl(path);
    if (error || !signed?.signedUrl) {
      console.error("[createReferenceUpload] failed:", error);
      return { path: "", url: "" };
    }
    return { path, url: signed.signedUrl };
  });

/**
 * Admin-side viewer links. The dashboard stores only the storage paths of a
 * customer's reference photos, so links are minted fresh (and never truncated
 * inside the booking notes).
 */
export const signReferencePaths = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paths: z.array(z.string().regex(PATH)).max(20) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const urls: string[] = [];
    for (const path of data.paths) {
      const { data: signed } = await supabaseAdmin.storage
        .from("custom-design-refs")
        .createSignedUrl(path, 60 * 60);
      if (signed?.signedUrl) urls.push(signed.signedUrl);
    }
    return { urls };
  });
