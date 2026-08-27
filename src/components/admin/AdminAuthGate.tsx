import { useEffect, useRef, useState, type ReactNode } from "react";
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

  // Re-checks the role without flipping the UI back to "loading", so a revoked
  // admin loses the dashboard as soon as we notice — even mid-session.
  const revalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    async function hasAdminRole(userId: string) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return null; // network/transient — don't lock anyone out on a blip
      return Boolean(data);
    }

    async function evaluate(userId: string | null, userEmail: string) {
      const id = ++evalIdRef.current;
      if (!userId) {
        checkedUserRef.current = null;
        if (id === evalIdRef.current && !cancelled) setState("anon");
        return;
      }
      const ok = await hasAdminRole(userId);
      if (id !== evalIdRef.current || cancelled) return;
      checkedUserRef.current = userId;
      setEmail(userEmail);
      setState(ok ? "ok" : "denied");
    }

    // Silent re-check: keeps the current screen until we know the answer.
    async function revalidate() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (cancelled) return;
      if (!user) {
        checkedUserRef.current = null;
        setState("anon");
        return;
      }
      const ok = await hasAdminRole(user.id);
      if (cancelled || ok === null) return;
      checkedUserRef.current = user.id;
      setEmail(user.email ?? "");
      setState(ok ? "ok" : "denied");
    }
    revalidateRef.current = () => void revalidate();

    void supabase.auth.getSession().then(({ data }) =>
      evaluate(data.session?.user.id ?? null, data.session?.user.email ?? ""),
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      // Same signed-in admin as before → re-verify the role quietly instead of
      // remounting the dashboard, so a revoked role is still caught.
      if (userId && userId === checkedUserRef.current) {
        void revalidate();
        return;
      }
      setState("loading");
      void evaluate(userId, session?.user.email ?? "");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Catch role revocations that happen while the dashboard is open.
  useEffect(() => {
    const ping = () => revalidateRef.current();
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", ping);
    const timer = window.setInterval(ping, 60_000);

    const channel = supabase
      .channel("admin-role-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, ping)
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", ping);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (state !== "anon") return;
    // Hard redirect: a client-side navigate keeps the previous (dashboard)
    // route mounted while the login chunk loads, flashing private content.
    window.location.replace("/admin/login");
  }, [state]);


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

  // "loading" and "anon" (redirecting to /admin/login) both show a spinner,
  // perfectly centered on the full screen.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <MehndiLoader size={150} />
    </div>
  );
}
