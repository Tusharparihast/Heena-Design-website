import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createAdminAccount,
  getAdminClientIfCallerIsAdmin,
  listAdminMembers,
  revokeAdminMember,
} from "./admin-team.server";

/** Lists every account holding the admin role. Callers must be admins. */
export const listTeamAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const admin = await getAdminClientIfCallerIsAdmin(context.supabase, context.userId);
      return await listAdminMembers(admin, context.userId);
    } catch (error) {
      console.error("[listTeamAdmins] Error:", error);
      // Throwing an error here allows your client-side .catch() to handle it
      // without crashing the entire server route.
      throw new Error("Failed to load team members");
    }
  });

/**
 * Adds an admin by email. If the email has no account yet, one is created
 * with the given password (public sign-up is disabled, so the owner
 * provisions accounts here). Existing accounts just get the role granted.
 */
export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().default(""),
        name: z.string().default(""),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    try {
      const admin = await getAdminClientIfCallerIsAdmin(context.supabase, context.userId);
      return await createAdminAccount(admin, data.email, data.password, data.name);
    } catch (error: any) {
      console.error("[grantAdminRole] Error:", error);
      // Returning this object format ensures your frontend toast.error(res.error) works correctly.
      return { ok: false, error: error.message || "Failed to grant admin role." };
    }
  });

/** Removes the admin role from an account (never yourself or the last admin). */
export const revokeAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    try {
      const admin = await getAdminClientIfCallerIsAdmin(context.supabase, context.userId);
      return await revokeAdminMember(admin, data.userId, context.userId);
    } catch (error: any) {
      console.error("[revokeAdminRole] Error:", error);
      return { ok: false, error: error.message || "Failed to revoke admin role." };
    }
  });
