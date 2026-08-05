import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export interface AdminMember {
  userId: string;
  email: string;
  /** ISO timestamp of when the account was created. */
  since: string;
  isSelf: boolean;
}

export type TeamResult =
  | { ok: true; email?: string }
  | { ok: false; error: string };

type UserClient = SupabaseClient<Database>;
type AdminClient = SupabaseClient<Database>;

/**
 * Verifies the caller holds the admin role through their own RLS-scoped
 * client, and only then hands back the privileged admin client.
 * Throws "Forbidden" for non-admins.
 */
export async function getAdminClientIfCallerIsAdmin(
  userClient: UserClient,
  userId: string,
): Promise<AdminClient> {
  const { data, error } = await userClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("Forbidden: admin role required");
  }
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  return supabaseAdmin as unknown as AdminClient;
}

export async function listAdminMembers(
  admin: AdminClient,
  selfId: string,
): Promise<AdminMember[]> {
  const { data: roles, error } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (error) throw new Error(error.message);

  const members: AdminMember[] = [];
  for (const row of roles ?? []) {
    const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
    members.push({
      userId: row.user_id,
      email: userData.user?.email ?? "Unknown account",
      since: userData.user?.created_at ?? "",
      isSelf: row.user_id === selfId,
    });
  }
  return members.sort((a, b) =>
    a.isSelf ? -1 : b.isSelf ? 1 : a.email.localeCompare(b.email),
  );
}

export async function grantAdminByEmail(
  admin: AdminClient,
  email: string,
): Promise<TeamResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Enter an email address." };

  const found = await findUserByEmail(admin, normalized);
  if (!found) {
    return {
      ok: false,
      error:
        "No account found for that email. Ask them to sign in once at /admin/login first, then try again.",
    };
  }

  const { error } = await admin
    .from("user_roles")
    .insert({ user_id: found.id, role: "admin" });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `${normalized} is already an admin.` };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, email: found.email ?? normalized };
}

export async function revokeAdminMember(
  admin: AdminClient,
  targetUserId: string,
  selfId: string,
): Promise<TeamResult> {
  if (targetUserId === selfId) {
    return {
      ok: false,
      error: "You can't remove your own admin access — ask another admin.",
    };
  }

  const { count, error: countError } = await admin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (countError) return { ok: false, error: countError.message };
  if ((count ?? 0) <= 1) {
    return {
      ok: false,
      error: "This is the last admin — removing them would lock the studio out.",
    };
  }

  const { error } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", targetUserId)
    .eq("role", "admin");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Admin API has no get-by-email, so page through users until a match. */
async function findUserByEmail(admin: AdminClient, email: string) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}
