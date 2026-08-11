import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Already signed in? Go to the dashboard (the gate there decides access).
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void navigate({ to: "/admin" });
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleForgotPassword() {
    if (!email.trim()) {
      toast.error("Enter your email first, then click “Forgot password”.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent — check your email (and spam folder).");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Invalid email or password. This area is for studio admins only.");
      return;
    }
    void navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <div className="text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-display text-xl font-bold text-primary-foreground">
              N
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">Admin sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Nagma Designs studio dashboard</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adm-email">Email</Label>
              <Input
                id="adm-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="adm-pass">Password</Label>
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="adm-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide Password" : "Show Password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-secondary/60 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              This area is private. Only accounts given the admin role by the studio owner can open the dashboard —
              there is no public registration.
            </p>
          </div>
        </div>

        <button
          to="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to website
        </button>
      </div>
    </div>
  );
}
