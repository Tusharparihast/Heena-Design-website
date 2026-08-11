import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Image as ImageIcon, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AdminTeamPage } from "./team";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fileToDataUrl } from "@/lib/image-upload";
import {
  browserPushPermission,
  isNotificationSoundEnabled,
  playNotificationChime,
  requestBrowserPushPermission,
  setNotificationSoundEnabled,
  showBrowserNotification,
} from "@/lib/notification-prefs";
import { updateSiteSettings, useAdminSiteSettings, type SiteSettings } from "@/lib/site-settings-db";
import { useCurrentAdmin } from "@/lib/use-current-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Nagma Designs Admin" }] }),
  component: AdminSettingsPage,
});

type Tab = "seo" | "users" | "security" | "notifications";

const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
  { id: "seo", label: "SEO Settings", icon: TrendingUp },
  { id: "users", label: "Users & Access", icon: UsersRound },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("seo");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          System and admin configuration — SEO, access, security, notifications and site-wide
          preferences.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors",
              tab === item.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border hover:bg-accent",
            )}
          >
            <item.icon className="h-3.5 w-3.5" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "seo" ? <SeoSettingsSection /> : null}
      {tab === "users" ? <AdminTeamPage /> : null}
      {tab === "security" ? <SecuritySection /> : null}
      {tab === "notifications" ? <NotificationsSection /> : null}
    </div>
  );
}

/* ---------------- SEO Settings ---------------- */

function SeoSettingsSection() {
  const { settings, loading, refresh } = useAdminSiteSettings();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !synced) {
      setForm(settings);
      setSynced(true);
    }
  }, [loading, synced, settings]);

  if (loading || !synced) {
    return (
      <Card className="shadow-none">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, seoOgImage: dataUrl }));
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  async function save() {
    setSaving(true);
    const ok = await updateSiteSettings(form);
    setSaving(false);
    if (!ok) {
      toast.error("Couldn't save — please try again.");
      return;
    }
    await refresh();
    toast.success("SEO settings saved.");
  }

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div>
          <Label>Title suffix</Label>
          <Input
            value={form.seoTitleSuffix}
            onChange={(e) => setForm({ ...form, seoTitleSuffix: e.target.value })}
            placeholder="| Nagma Designs"
            maxLength={80}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">Appended after each page's own title.</p>
        </div>

        <div>
          <Label>Default meta description</Label>
          <Textarea
            value={form.seoDefaultDescription}
            onChange={(e) => setForm({ ...form, seoDefaultDescription: e.target.value })}
            placeholder="Used on pages that don't define their own description."
            maxLength={300}
            rows={3}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Default social share image (OG image)</Label>
          <div className="mt-1.5 flex items-center gap-3">
            {form.seoOgImage ? (
              <img
                src={form.seoOgImage}
                alt=""
                width={72}
                height={48}
                className="h-12 w-[4.5rem] rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex h-12 w-[4.5rem] items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => void handleImage(e.target.files?.[0])}
              className="max-w-[220px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Allow search engines to index this site</p>
            <p className="text-xs text-muted-foreground">Turn off to keep the site out of search results.</p>
          </div>
          <Switch checked={form.seoRobotsIndex} onCheckedChange={(v) => setForm({ ...form, seoRobotsIndex: v })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Google Analytics measurement ID</Label>
            <Input
              value={form.seoGaMeasurementId}
              onChange={(e) => setForm({ ...form, seoGaMeasurementId: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              maxLength={30}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Google Search Console verification code</Label>
            <Input
              value={form.seoSearchConsoleVerification}
              onChange={(e) => setForm({ ...form, seoSearchConsoleVerification: e.target.value })}
              placeholder="verification code only"
              maxLength={100}
              className="mt-1.5"
            />
          </div>
        </div>

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save SEO settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- Security ---------------- */

function SecuritySection() {
  const { email } = useCurrentAdmin();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword() {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message || "Couldn't update your password.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
  }

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div>
          <p className="text-sm font-medium">Signed in as</p>
          <p className="text-sm text-muted-foreground">{email || "—"}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1.5"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5"
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button onClick={() => void changePassword()} disabled={saving}>
          {saving ? "Updating…" : "Update password"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- Notifications ---------------- */

function NotificationsSection() {
  const [soundOn, setSoundOn] = useState(isNotificationSoundEnabled());
  const [permission, setPermission] = useState(browserPushPermission());

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Play a sound on new bookings/orders</p>
            <p className="text-xs text-muted-foreground">Only while this dashboard is open in your browser.</p>
          </div>
          <Switch
            checked={soundOn}
            onCheckedChange={(v) => {
              setSoundOn(v);
              setNotificationSoundEnabled(v);
              if (v) playNotificationChime();
            }}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Browser push permission</p>
            <p className="text-xs text-muted-foreground">
              {permission === "granted"
                ? "Enabled for this browser."
                : permission === "denied"
                  ? "Blocked — enable it in your browser's site settings."
                  : permission === "unsupported"
                    ? "Not supported in this browser."
                    : "Not yet requested."}
            </p>
          </div>
          {permission === "default" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void requestBrowserPushPermission().then((p) => {
                  setPermission(p);
                  if (p === "granted") {
                    showBrowserNotification("Notifications enabled", "You'll be alerted about new bookings and orders.");
                  }
                });
              }}
            >
              Enable
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
