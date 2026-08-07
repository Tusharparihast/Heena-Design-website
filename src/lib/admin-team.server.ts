import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export interface AdminMember {
  userId: string;
  email: string;
  name: string;
  /** ISO timestamp of when the account was created. */
  since: string;
  isSelf: boolean;
}

export type TeamResult = { ok: true; email?: string } | { ok: false; error: string };

type UserClient = SupabaseClient<Database>;
type AdminClient = SupabaseClient<Database>;

/**
 * Verifies the caller holds the admin role through their own RLS-scoped
 * client, and only then hands back the privileged admin client.
 * Throws "Forbidden" for non-admins.
 */
export async function getAdminClientIfCallerIsAdmin(userClient: UserClient, userId: string): Promise<AdminClient> {
  const { data, error } = await userClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("Forbidden: admin role required");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as AdminClient;
}

export async function listAdminMembers(admin: AdminClient, selfId: string): Promise<AdminMember[]> {
  const { data: roles, error } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  if (error) throw new Error(error.message);

  const members: AdminMember[] = [];
  for (const row of roles ?? []) {
    const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
    const email = userData.user?.email ?? "Unknown account";

    const metaName = (userData.user?.user_metadata?.["full_name"] as string | undefined)?.trim();

    members.push({
      userId: row.user_id,
      email,
      name: metaName || email.split("@").at(0) || "Admin",
      since: userData.user?.created_at ?? "",
      isSelf: row.user_id === selfId,
    });
  }
  return members.sort((a, b) => (a.isSelf ? -1 : b.isSelf ? 1 : a.email.localeCompare(b.email)));
}

export async function grantAdminByEmail(admin: AdminClient, email: string): Promise<TeamResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Enter an email address." };

  const found = await findUserByEmail(admin, normalized);
  if (!found) {
    return {
      ok: false,
      error: "No account found for that email.",
    };
  }

  return grantRole(admin, found.id, found.email ?? normalized);
}

/**
 * Creates a brand-new admin account (email + password, pre-confirmed) and
 * grants the role in one step — used now that public sign-up is disabled.
 * If the email already has an account, the password is ignored and only the
 * role is granted.
 */
export async function createAdminAccount(
  admin: AdminClient,
  email: string,
  password: string,
  name: string,
): Promise<TeamResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Enter an email address." };
  const trimmedName = name.trim();

  const existing = await findUserByEmail(admin, normalized);
  if (existing) {
    if (trimmedName) {
      await admin.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...existing.user_metadata, full_name: trimmedName },
      });
    }
    return grantRole(admin, existing.id, existing.email ?? normalized);
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: "This email has no account yet — set a password of at least 6 characters to create one.",
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
    user_metadata: trimmedName ? { full_name: trimmedName } : {},
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Couldn't create the account." };
  }
  return grantRole(admin, data.user.id, normalized);
}

async function grantRole(admin: AdminClient, userId: string, email: string): Promise<TeamResult> {
  const { error } = await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `${email} is already an admin.` };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, email };
}

export async function revokeAdminMember(admin: AdminClient, targetUserId: string, selfId: string): Promise<TeamResult> {
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

  const { error } = await admin.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "admin");
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
