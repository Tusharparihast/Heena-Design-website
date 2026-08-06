import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentAdmin {
  name: string;
  email: string;
}

function deriveIdentity(
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined,
): CurrentAdmin {
  const email = user?.email ?? "";
  const metaName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  return { name: metaName || email.split("@").at(0) || "Admin", email };
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

/** Live-updating name/email of the signed-in admin, from Supabase auth metadata. */
export function useCurrentAdmin(): CurrentAdmin {
  const [identity, setIdentity] = useState<CurrentAdmin>({ name: "", email: "" });

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIdentity(deriveIdentity(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIdentity(deriveIdentity(session?.user));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return identity;
}
