import { createFileRoute } from "@tanstack/react-router";
import { Phone, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BilingualField } from "@/components/admin/BilingualField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultContactInfo,
  readContactInfo,
  resetContactInfo,
  writeContactInfo,
  type ContactInfo,
} from "@/lib/contact-info";
import { qrFileToDataUrl } from "@/lib/image-upload";

export const Route = createFileRoute("/admin/contact-info")({
  component: AdminContactInfoPage,
});

function AdminContactInfoPage() {
  const [form, setForm] = useState<ContactInfo>(defaultContactInfo);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(readContactInfo());
  }, []);

  const set = (key: keyof ContactInfo, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  function save() {
    if (!form.wechatId.trim() && !form.whatsapp.trim() && !form.phone.trim()) {
      toast.error("Add at least one way for clients to reach you.");
      return;
    }
    writeContactInfo(form);
    setDirty(false);
    toast.success("Contact information saved — the website is updated.");
  }

  function reset() {
    resetContactInfo();
    setForm(defaultContactInfo);
    setDirty(false);
    toast.success("Restored the default contact details.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Contact Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These details power the contact page, the footer and the floating WeChat widget.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button onClick={save} disabled={!dirty}>
            <Save className="mr-1.5 h-4 w-4" /> Save changes
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Phone className="h-4 w-4 text-primary" /> Channels
          </CardTitle>
          <CardDescription>
            Leave a field empty to hide that channel from the contact page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ci-wechat">WeChat ID</Label>
            <Input id="ci-wechat" value={form.wechatId} onChange={(e) => set("wechatId", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-whatsapp">WhatsApp number</Label>
            <Input
              id="ci-whatsapp"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+977…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-phone">Phone</Label>
            <Input id="ci-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-email">Email</Label>
            <Input id="ci-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-instagram">Instagram link</Label>
            <Input
              id="ci-instagram"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="https://instagram.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-facebook">Facebook link</Label>
            <Input
              id="ci-facebook"
              value={form.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              placeholder="https://facebook.com/…"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">WeChat QR code</CardTitle>
          <CardDescription>
            Upload the QR from WeChat (Me → My QR code). Clients see it when they tap any WeChat
            button. Without an upload we show a code generated from the WeChat ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="grid h-32 w-32 place-items-center rounded-xl border border-border bg-white p-2">
            {form.wechatQr ? (
              <img src={form.wechatQr} alt="WeChat QR code" className="h-full w-full object-contain" />
            ) : (
              <span className="px-2 text-center text-[11px] text-muted-foreground">No QR uploaded</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Label
              htmlFor="ci-qr"
              className="inline-flex cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Upload className="mr-1.5 h-4 w-4" /> Upload QR image
            </Label>
            <input
              id="ci-qr"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  set("wechatQr", await qrFileToDataUrl(file));
                  toast.success("QR image ready — remember to save.");
                } catch {
                  toast.error("Could not read that image.");
                }
              }}
            />
            {form.wechatQr ? (
              <Button variant="outline" onClick={() => set("wechatQr", "")}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Remove
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">Studio location & hours</CardTitle>
          <CardDescription>Shown on the contact page in both languages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BilingualField
            label="Location"
            valueEn={form.cityEn}
            valueZh={form.cityZh}
            onChange={(loc, v) => set(loc === "en" ? "cityEn" : "cityZh", v)}
          />
          <BilingualField
            label="Studio hours"
            valueEn={form.hoursEn}
            valueZh={form.hoursZh}
            onChange={(loc, v) => set(loc === "en" ? "hoursEn" : "hoursZh", v)}
          />
          <div className="space-y-1.5">
            <Label htmlFor="ci-map">Google Maps link</Label>
            <Input id="ci-map" value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">Section copy</CardTitle>
          <CardDescription>The heading and intro text above the contact cards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BilingualField
            label="Label"
            valueEn={form.labelEn}
            valueZh={form.labelZh}
            onChange={(loc, v) => set(loc === "en" ? "labelEn" : "labelZh", v)}
          />
          <BilingualField
            label="Title"
            valueEn={form.titleEn}
            valueZh={form.titleZh}
            onChange={(loc, v) => set(loc === "en" ? "titleEn" : "titleZh", v)}
          />
          <BilingualField
            label="Intro"
            multiline
            valueEn={form.bodyEn}
            valueZh={form.bodyZh}
            onChange={(loc, v) => set(loc === "en" ? "bodyEn" : "bodyZh", v)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
