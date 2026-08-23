import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MehndiLoader } from "@/components/site/MehndiLoader";

type GateState = "loading" | "anon" | "denied" | "ok";

/**
 * Protects every /admin page: only signed-in admins get through.
 * This is the UX gate — row-level security on the database is the real lock.
 */
export function AdminAuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<GateState>("loading");
  const [email, setEmail] = useState("");

  // Remember which user we already checked. Returning to the tab makes Supabase
  // emit TOKEN_REFRESHED / SIGNED_IN for the *same* user; re-running the gate
  // there would flip back to "loading" and remount the whole dashboard.
  const checkedUserRef = useRef<string | null>(null);
  const evalIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function evaluate(userId: string | null, userEmail: string) {
      const id = ++evalIdRef.current;
      if (!userId) {
        checkedUserRef.current = null;
        if (id === evalIdRef.current && !cancelled) setState("anon");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (id !== evalIdRef.current || cancelled) return;
      checkedUserRef.current = userId;
      setEmail(userEmail);
      setState(data && !error ? "ok" : "denied");
    }

    void supabase.auth.getSession().then(({ data }) =>
      evaluate(data.session?.user.id ?? null, data.session?.user.email ?? ""),
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      // Same signed-in admin as before → nothing to re-verify, keep the UI as is.
      if (userId && userId === checkedUserRef.current) return;
      setState("loading");
      void evaluate(userId, session?.user.email ?? "");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state === "anon") void navigate({ to: "/admin/login" });
  }, [state, navigate]);

  if (state === "ok") return <>{children}</>;

  if (state === "denied") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldX className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">No admin access</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {email
              ? `${email} is signed in, but it doesn't have the admin role.`
              : "This account doesn't have the admin role."}{" "}
            Sign out and use the studio owner account instead.
          </p>
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => void supabase.auth.signOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  // "loading" and "anon" (redirecting to /admin/login) both show a spinner.
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <MehndiLoader size={150} />
    </div>
  );
}
