import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getAdminClientIfCallerIsAdmin,
  grantAdminByEmail,
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

/** Grants the admin role to an existing account, looked up by email. */
export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ context, data }) => {
    const admin = await getAdminClientIfCallerIsAdmin(
      context.supabase,
      context.userId,
    );
    return grantAdminByEmail(admin, data.email);
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
