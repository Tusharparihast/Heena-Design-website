import { Link, createFileRoute } from "@tanstack/react-router";
import { Eye, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import { type Locale } from "@/i18n/dictionaries";
import { dictionaries } from "@/i18n/dictionaries";
import { fileToDataUrl } from "@/lib/image-upload";
import {
  type HomepageHeroMedia,
  type HomepageHeroOverrides,
  type HomepageAboutOverrides,
  type HomepageOverrides,
  type HomepageSectionOverrides,
  type HomepageVideoOverrides,
  type HomepageWhyOverrides,
} from "@/lib/homepage-overrides";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/homepage")({
  head: () => ({
    meta: [{ title: "Homepage — Nagma Designs Admin" }],
  }),
  component: AdminHomepagePage,
});

function LocaleToggle({ value, onChange }: { value: Locale; onChange: (v: Locale) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={cn(
          "px-3 py-1 text-sm font-medium transition-colors",
          value === "en"
            ? "rounded-md bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("zh")}
        className={cn(
          "px-3 py-1 text-sm font-medium transition-colors",
          value === "zh"
            ? "rounded-md bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        中文
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  className,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const baseId = useId();
  const id = `${baseId}-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <Input
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const baseId = useId();
  const id = `${baseId}-image`;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    } catch {
      toast.error("Could not use that image. Try another one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "https://... or /path/to/image.jpg"}
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInput}
          onChange={pick}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInput.current?.click()}
          disabled={loading}
          aria-label={`Upload ${label}`}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            aria-label={`Clear ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt={`${label} preview`}
          className="h-32 max-w-full rounded-lg border border-border object-cover"
        />
      )}
    </div>
  );
}

function AdminHomepagePage() {
  const { homeOverrides, setHomepageOverrides, locale } = useLanguage();
  const [editingLocale, setEditingLocale] = useState<Locale>(locale);
  const [draft, setDraft] = useState<HomepageOverrides>(homeOverrides);

  useEffect(() => {
    setDraft(homeOverrides);
  }, [homeOverrides]);

  const hero = (draft[editingLocale]?.hero ?? {}) as HomepageHeroOverrides;
  const about = (draft[editingLocale]?.about ?? {}) as HomepageAboutOverrides;
  const video = (draft[editingLocale]?.video ?? {}) as HomepageVideoOverrides;

  const baseWhy = dictionaries[editingLocale].why;
  const whyDraft = (draft[editingLocale]?.why ?? {}) as HomepageWhyOverrides;
  const why = useMemo(
    () => ({
      label: whyDraft.label ?? baseWhy.label,
      title: whyDraft.title ?? baseWhy.title,
      items: baseWhy.items.map((item, i) => ({
        title: whyDraft.items?.[i]?.title ?? item.title,
        body: whyDraft.items?.[i]?.body ?? item.body,
      })),
    }),
    [baseWhy, whyDraft],
  );

  const patchSection = (key: keyof HomepageSectionOverrides, patch: object) => {
    setDraft((prev) => ({
      ...prev,
      [editingLocale]: {
        ...prev[editingLocale],
        [key]: { ...prev[editingLocale]?.[key], ...patch },
      },
    }));
  };

  const patchHeroMedia = (patch: Partial<HomepageHeroMedia>) => {
    setDraft((prev) => ({
      ...prev,
      [editingLocale]: {
        ...prev[editingLocale],
        hero: {
          ...prev[editingLocale]?.hero,
          media: { ...prev[editingLocale]?.hero?.media, ...patch },
        },
      },
    }));
  };

  const patchWhyItem = (index: number, key: "title" | "body", value: string) => {
    setDraft((prev) => {
      const currentItems = prev[editingLocale]?.why?.items ?? [];
      const nextItems = [...currentItems];
      nextItems[index] = { ...nextItems[index], [key]: value };
      return {
        ...prev,
        [editingLocale]: {
          ...prev[editingLocale],
          why: { ...prev[editingLocale]?.why, items: nextItems },
        },
      };
    });
  };

  const resetSection = (key: keyof HomepageSectionOverrides) => {
    setDraft((prev) => ({
      ...prev,
      [editingLocale]: { ...prev[editingLocale], [key]: undefined },
    }));
    toast.info(`Reset ${key} draft`, {
      description: "Click Save changes to apply the reset on the public site.",
    });
  };

  const save = () => {
    setHomepageOverrides(draft);
    toast.success("Homepage saved", {
      description: "Visit the public site to see the updates.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
          <p className="text-sm text-muted-foreground">
            Edit the landing page Hero, About, Why Learn and Watch sections. Switch between English
            and Chinese, then save to update the public site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocaleToggle value={editingLocale} onChange={setEditingLocale} />
          <Button variant="outline" asChild>
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              View site
            </Link>
          </Button>
          <Button onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero">
        <TabsList>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="why">Why Learn</TabsTrigger>
          <TabsTrigger value="video">Watch</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Hero text</CardTitle>
                <CardDescription>Heading, body and buttons at the top of the homepage.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => resetSection("hero")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Eyebrow"
                value={hero.eyebrow}
                onChange={(v) => patchSection("hero", { eyebrow: v })}
              />
              <Field
                label="Title line 1"
                value={hero.title1}
                onChange={(v) => patchSection("hero", { title1: v })}
              />
              <Field
                label="Title line 2"
                value={hero.title2}
                onChange={(v) => patchSection("hero", { title2: v })}
              />
              <Field
                label="Title line 3"
                value={hero.title3}
                onChange={(v) => patchSection("hero", { title3: v })}
              />
              <Field
                label="Body"
                value={hero.body}
                onChange={(v) => patchSection("hero", { body: v })}
                multiline
                className="sm:col-span-2"
              />
              <Field
                label="CTA button"
                value={hero.cta}
                onChange={(v) => patchSection("hero", { cta: v })}
              />
              <Field
                label="Secondary button"
                value={hero.secondary}
                onChange={(v) => patchSection("hero", { secondary: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero media</CardTitle>
              <CardDescription>
                Choose a video, poster, or a static image. Leave blank to keep the bundled
                defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="hero-image-mode"
                  checked={hero.media?.imageMode ?? false}
                  onCheckedChange={(v) => patchHeroMedia({ imageMode: v })}
                />
                <Label htmlFor="hero-image-mode">Use static image instead of video</Label>
              </div>
              <Field
                label="Hero video URL"
                value={hero.media?.videoUrl}
                onChange={(v) => patchHeroMedia({ videoUrl: v || undefined })}
                placeholder="/assets/hero-mehndi.mp4 or https://..."
              />
              <ImageField
                label="Poster image"
                value={hero.media?.posterUrl}
                onChange={(v) => patchHeroMedia({ posterUrl: v || undefined })}
              />
              {hero.media?.imageMode && (
                <ImageField
                  label="Hero static image"
                  value={hero.media?.imageUrl}
                  onChange={(v) => patchHeroMedia({ imageUrl: v || undefined })}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>About text</CardTitle>
                <CardDescription>The about section on the homepage.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => resetSection("about")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Label"
                value={about.label}
                onChange={(v) => patchSection("about", { label: v })}
              />
              <Field
                label="Title"
                value={about.title}
                onChange={(v) => patchSection("about", { title: v })}
              />
              <Field
                label="Body paragraph 1"
                value={about.body1}
                onChange={(v) => patchSection("about", { body1: v })}
                multiline
                className="sm:col-span-2"
              />
              <Field
                label="Body paragraph 2"
                value={about.body2}
                onChange={(v) => patchSection("about", { body2: v })}
                multiline
                className="sm:col-span-2"
              />
              <Field
                label="Stat 1 label"
                value={about.stat1}
                onChange={(v) => patchSection("about", { stat1: v })}
              />
              <Field
                label="Stat 2 label"
                value={about.stat2}
                onChange={(v) => patchSection("about", { stat2: v })}
              />
              <Field
                label="Stat 3 label"
                value={about.stat3}
                onChange={(v) => patchSection("about", { stat3: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About image</CardTitle>
              <CardDescription>Leave blank to keep the bundled default.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageField
                label="Image"
                value={about.imageUrl}
                onChange={(v) => patchSection("about", { imageUrl: v || undefined })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="why" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Why Learn text</CardTitle>
                <CardDescription>The four feature cards on the homepage.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => resetSection("why")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Label"
                value={why.label}
                onChange={(v) => patchSection("why", { label: v })}
              />
              <Field
                label="Title"
                value={why.title}
                onChange={(v) => patchSection("why", { title: v })}
              />
            </CardContent>
            <CardContent className="space-y-6">
              {why.items.map((item, i) => (
                <div key={i} className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={`Card ${i + 1} title`}
                    value={item.title}
                    onChange={(v) => patchWhyItem(i, "title", v)}
                  />
                  <Field
                    label={`Card ${i + 1} body`}
                    value={item.body}
                    onChange={(v) => patchWhyItem(i, "body", v)}
                    multiline
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Watch / demo section</CardTitle>
                <CardDescription>Text labels for the homepage video area.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => resetSection("video")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Label"
                value={video.label}
                onChange={(v) => patchSection("video", { label: v })}
              />
              <Field
                label="Title"
                value={video.title}
                onChange={(v) => patchSection("video", { title: v })}
              />
              <Field
                label="Body"
                value={video.body}
                onChange={(v) => patchSection("video", { body: v })}
                multiline
                className="sm:col-span-2"
              />
              <Field
                label="Play button"
                value={video.play}
                onChange={(v) => patchSection("video", { play: v })}
              />
              <Field
                label="Note"
                value={video.note}
                onChange={(v) => patchSection("video", { note: v })}
              />
              <Field
                label="Expand label"
                value={video.expand}
                onChange={(v) => patchSection("video", { expand: v })}
              />
              <Field
                label="Close label"
                value={video.close}
                onChange={(v) => patchSection("video", { close: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo media</CardTitle>
              <CardDescription>Leave blank to keep the bundled defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Demo video URL"
                value={video.videoUrl}
                onChange={(v) => patchSection("video", { videoUrl: v || undefined })}
                placeholder="/assets/hero-mehndi.mp4 or https://..."
              />
              <ImageField
                label="Demo poster"
                value={video.posterUrl}
                onChange={(v) => patchSection("video", { posterUrl: v || undefined })}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
