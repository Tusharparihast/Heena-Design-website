import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle, ShieldX } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type GateState = "loading" | "anon" | "denied" | "ok";

/**
 * Protects every /admin page: only signed-in admins get through.
 * This is the UX gate — row-level security on the database is the real lock.
 */
export function AdminAuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<GateState>("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function evaluate(userId: string | null, userEmail: string) {
      if (!userId) {
        if (!cancelled) setState("anon");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      setEmail(userEmail);
      setState(data && !error ? "ok" : "denied");
    }

    void supabase.auth.getSession().then(({ data }) =>
      evaluate(data.session?.user.id ?? null, data.session?.user.email ?? ""),
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState("loading");
      void evaluate(session?.user.id ?? null, session?.user.email ?? "");
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
      <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
