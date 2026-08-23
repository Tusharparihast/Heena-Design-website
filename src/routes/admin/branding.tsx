import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, RotateCcw, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultBranding, saveBranding, useBranding, type Branding } from "@/lib/branding";
import { qrFileToDataUrl } from "@/lib/image-upload";

export const Route = createFileRoute("/admin/branding")({
  head: () => ({ meta: [{ title: "Logo & Branding — Nagma Designs Admin" }] }),
  component: AdminBrandingPage,
});

function AdminBrandingPage() {
  const { branding, loaded } = useBranding();
  const [form, setForm] = useState<Branding>(branding);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded && !synced) {
      setForm(branding);
      setSynced(true);
    }
  }, [loaded, synced, branding]);

  async function pick(key: keyof Branding, file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await qrFileToDataUrl(file); // lossless — keeps logo edges crisp
      setForm((f) => ({ ...f, [key]: dataUrl }));
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  async function save() {
    setSaving(true);
    const ok = await saveBranding(form);
    setSaving(false);
    if (!ok) {
      toast.error("Couldn't save — please try again.");
      return;
    }
    toast.success("Branding saved — the site and browser icon are updated.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Logo &amp; Branding</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The logo appears in the header, footer and admin dashboard. The browser icon shows on
            the browser tab and bookmarks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setForm(defaultBranding)}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button onClick={() => void save()} disabled={saving || !synced}>
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <LogoCard
        title="Website logo"
        description="Shown in the navigation bar and footer. PNG with a transparent or cream background works best."
        value={form.logoUrl}
        previewClass="h-24 w-24"
        onPick={(file) => void pick("logoUrl", file)}
        onClear={() => setForm((f) => ({ ...f, logoUrl: defaultBranding.logoUrl }))}
      />

      <LogoCard
        title="Browser icon (favicon)"
        description="Square image shown on the browser tab. Leave empty to reuse the website logo."
        value={form.faviconUrl}
        previewClass="h-12 w-12"
        onPick={(file) => void pick("faviconUrl", file)}
        onClear={() => setForm((f) => ({ ...f, faviconUrl: "" }))}
      />
    </div>
  );
}

function LogoCard({
  title,
  description,
  value,
  previewClass,
  onPick,
  onClear,
}: {
  title: string;
  description: string;
  value: string;
  previewClass: string;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        {value ? (
          <img
            src={value}
            alt=""
            className={`${previewClass} rounded-lg border border-border bg-background object-contain p-1`}
          />
        ) : (
          <div
            className={`${previewClass} grid place-items-center rounded-lg border border-dashed border-border text-muted-foreground`}
          >
            <ImageIcon className="h-5 w-5" aria-hidden />
          </div>
        )}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Upload className="h-3.5 w-3.5" aria-hidden /> Upload image
          </Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="max-w-[240px]"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </CardContent>
    </Card>
  );
}
