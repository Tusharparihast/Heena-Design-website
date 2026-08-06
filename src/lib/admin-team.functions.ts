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
    const admin = await getAdminClientIfCallerIsAdmin(
      context.supabase,
      context.userId,
    );
    return listAdminMembers(admin, context.userId);
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
      .object({ email: z.string().email(), password: z.string().default("") })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const admin = await getAdminClientIfCallerIsAdmin(
      context.supabase,
      context.userId,
    );
    return createAdminAccount(admin, data.email, data.password);
  });

/** Removes the admin role from an account (never yourself or the last admin). */
export const revokeAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const admin = await getAdminClientIfCallerIsAdmin(
      context.supabase,
      context.userId,
    );
    return revokeAdminMember(admin, data.userId, context.userId);
  });
