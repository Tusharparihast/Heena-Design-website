import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reset-password")({
  component: ResetPasswordPage,
});

/**
 * Landing page for the password-recovery email link. Supabase appends the
 * recovery token in the URL hash; the client picks it up and fires
 * PASSWORD_RECOVERY, after which updateUser can set a new password.
 */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If the hash was already processed (e.g. page refreshed), an active
    // recovery session still allows updating the password.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success("Password updated — sign in with your new password.");
    void navigate({ to: "/admin/login" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <div className="text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nagma Designs studio dashboard
            </p>
          </div>

          {ready ? (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rp-pass">New password</Label>
                <Input
                  id="rp-pass"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-confirm">Confirm password</Label>
                <Input
                  id="rp-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat the password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-4 text-center">
              <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Waiting for the recovery link… If you opened this page directly,
                request a fresh link from the{" "}
                <Link to="/admin/login" className="text-primary underline">
                  sign-in page
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        <Link
          to="/admin/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
