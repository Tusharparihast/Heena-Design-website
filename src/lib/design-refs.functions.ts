import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * The reference bucket is private: only the studio (admins) can browse it.
 * A visitor who just uploaded a file gets back a long-lived signed link for
 * that one random path so it can travel inside their WhatsApp/WeChat message.
 * Paths are random UUIDs, so nobody can guess another customer's upload.
 */
const PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const signReferenceUpload = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ path: z.string().regex(PATH) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("custom-design-refs")
      .createSignedUrl(data.path, ONE_YEAR_SECONDS);
    if (error || !signed?.signedUrl) {
      console.error("[signReferenceUpload] failed:", error);
      return { url: "" };
    }
    return { url: signed.signedUrl };
  });
