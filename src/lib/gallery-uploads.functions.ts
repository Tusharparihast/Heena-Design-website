import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Gallery photos live in a private bucket. The dashboard uploads a file and
 * asks for a long-lived signed link, which is what the public gallery renders.
 * Paths are random UUIDs, so links are unguessable.
 */
const PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/;
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

export const signGalleryUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ path: z.string().regex(PATH) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("gallery")
      .createSignedUrl(data.path, TEN_YEARS_SECONDS);
    if (error || !signed?.signedUrl) {
      console.error("[signGalleryUpload] failed:", error);
      return { url: "" };
    }
    return { url: signed.signedUrl };
  });
