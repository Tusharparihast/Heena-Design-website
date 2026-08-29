import { Link, createFileRoute } from "@tanstack/react-router";
import { Eye, ImagePlus, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
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
import { type Locale, dictionaries } from "@/i18n/dictionaries";
import { fileToDataUrl } from "@/lib/image-upload";
import { modernImages, traditionalImages } from "@/lib/design-images";
import {
  type HomepageHeroMedia,
  type HomepageOverrides,
  type HomepageSectionOverrides,
} from "@/lib/homepage-overrides";
import { VideoField } from "@/components/admin/VideoField";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/homepage")({
  head: () => ({
    meta: [{ title: "Homepage — Nagma Designs Admin" }],
  }),
  component: AdminHomepagePage,
});

const LOCALES: Locale[] = ["en", "zh"];

/** Split a comma-separated tag string (English or Chinese commas) into a clean list. */
function parseTags(value: string): string[] {
  return value
    .split(/[,、，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function LangBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted px-1.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

/** A text field edited in both languages at once — English first, 中文 below. */
function BilingualField({
  label,
  valueEn,
  valueZh,
  onChange,
  placeholder,
  multiline,
  className,
}: {
  label: string;
  valueEn: string | undefined;
  valueZh: string | undefined;
  onChange: (locale: Locale, value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const baseId = useId();
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`${baseId}-${slug}-en`}>{label}</Label>
      <div className="space-y-2">
        <div className={cn("flex gap-2", multiline ? "items-start" : "items-center")}>
          <LangBadge>EN</LangBadge>
          {multiline ? (
            <Textarea
              id={`${baseId}-${slug}-en`}
              value={valueEn ?? ""}
              onChange={(e) => onChange("en", e.target.value)}
              placeholder={placeholder}
              rows={4}
            />
          ) : (
            <Input
              id={`${baseId}-${slug}-en`}
              value={valueEn ?? ""}
              onChange={(e) => onChange("en", e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
        <div className={cn("flex gap-2", multiline ? "items-start" : "items-center")}>
          <LangBadge>中文</LangBadge>
          {multiline ? (
            <Textarea
              id={`${baseId}-${slug}-zh`}
              value={valueZh ?? ""}
              onChange={(e) => onChange("zh", e.target.value)}
              placeholder={placeholder}
              rows={4}
            />
          ) : (
            <Input
              id={`${baseId}-${slug}-zh`}
              value={valueZh ?? ""}
              onChange={(e) => onChange("zh", e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tags editor that lets the user type commas and spaces freely.
 * The raw text is kept locally while typing and only parsed into a
 * tag list on blur, so keystrokes are never reformatted mid-edit.
 * The parent remounts this component (via `key`) after each commit,
 * which normalizes the displayed list.
 */
function BilingualTagsField({
  label,
  valueEn,
  valueZh,
  onChange,
}: {
  label: string;
  valueEn: string[] | undefined;
  valueZh: string[] | undefined;
  onChange: (locale: Locale, tags: string[]) => void;
}) {
  const baseId = useId();
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  const [textEn, setTextEn] = useState(() => (valueEn ?? []).join(", "));
  const [textZh, setTextZh] = useState(() => (valueZh ?? []).join(", "));

  const commit = (locale: Locale, raw: string) => {
    onChange(locale, parseTags(raw));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${baseId}-${slug}-en`}>{label}</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LangBadge>EN</LangBadge>
          <Input
            id={`${baseId}-${slug}-en`}
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
            onBlur={() => commit("en", textEn)}
            placeholder="Bridal, Arabic, Festival"
          />
        </div>
        <div className="flex items-center gap-2">
          <LangBadge>中文</LangBadge>
          <Input
            id={`${baseId}-${slug}-zh`}
            value={textZh}
            onChange={(e) => setTextZh(e.target.value)}
            onBlur={() => commit("zh", textZh)}
            placeholder="新娘、阿拉伯式、节日"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Separate tags with commas. The list is cleaned up when you leave the field.
      </p>
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

/** Image grid manager for the Traditional / Modern sections: replace, remove and add tiles. */
function ImagesManager({
  images,
  onChange,
  onReset,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  onReset?: (() => void) | undefined;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef<number | "add" | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = pending.current;
    pending.current = null;
    if (!file || target === null) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      if (target === "add") onChange([...images, dataUrl]);
      else onChange(images.map((img, i) => (i === target ? dataUrl : img)));
    } catch {
      toast.error("Could not use that image. Try another one.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={i} className="group relative overflow-hidden rounded-lg border border-border">
            <img
              src={src}
              alt={`Design ${i + 1}`}
              className="aspect-square h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-background/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={`Replace image ${i + 1}`}
                onClick={() => {
                  pending.current = i;
                  fileInput.current?.click();
                }}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={`Remove image ${i + 1}`}
                onClick={() => onChange(images.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <button
          type="button"
          aria-label="Add image"
          onClick={() => {
            pending.current = "add";
            fileInput.current?.click();
          }}
          className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pick} />
      {onReset && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restore default images
        </Button>
      )}
    </div>
  );
}

function AdminHomepagePage() {
  const { homeOverrides, setHomepageOverrides } = useLanguage();
  const [draft, setDraft] = useState<HomepageOverrides>(homeOverrides);
  const savedRef = useRef(JSON.stringify(homeOverrides));

  // Adopt the stored document only when it actually changes (first load or a
  // save from another tab) so in-progress edits are never overwritten.
  useEffect(() => {
    const next = JSON.stringify(homeOverrides);
    if (next === savedRef.current) return;
    savedRef.current = next;
    setDraft(homeOverrides);
  }, [homeOverrides]);

  const heroEn = draft.en?.hero ?? {};
  const heroZh = draft.zh?.hero ?? {};
  const aboutEn = draft.en?.about ?? {};
  const aboutZh = draft.zh?.about ?? {};
  const videoEn = draft.en?.video ?? {};
  const videoZh = draft.zh?.video ?? {};

  const why = useMemo(() => {
    const merge = (locale: Locale) => {
      const base = dictionaries[locale].why;
      const override = draft[locale]?.why;
      return {
        label: override?.label ?? base.label,
        title: override?.title ?? base.title,
        items: base.items.map((item, i) => ({
          title: override?.items?.[i]?.title ?? item.title,
          body: override?.items?.[i]?.body ?? item.body,
        })),
      };
    };
    return { en: merge("en"), zh: merge("zh") };
  }, [draft]);

  const patchSection = (locale: Locale, key: keyof HomepageSectionOverrides, patch: object) => {
    setDraft((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: { ...prev[locale]?.[key], ...patch },
      },
    }));
  };

  /** Media is language-agnostic: apply the same patch to both locales. */
  const patchHeroMedia = (patch: Partial<HomepageHeroMedia>) => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const locale of LOCALES) {
        next[locale] = {
          ...next[locale],
          hero: {
            ...next[locale]?.hero,
            media: { ...next[locale]?.hero?.media, ...patch },
          },
        };
      }
      return next;
    });
  };

  const patchSharedMedia = (key: "about" | "video" | "traditional" | "modern", patch: object) => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const locale of LOCALES) {
        next[locale] = {
          ...next[locale],
          [key]: { ...next[locale]?.[key], ...patch },
        };
      }
      return next;
    });
  };

  const patchWhyItem = (locale: Locale, index: number, key: "title" | "body", value: string) => {
    setDraft((prev) => {
      const currentItems = prev[locale]?.why?.items ?? [];
      const nextItems = [...currentItems];
      nextItems[index] = { ...nextItems[index], [key]: value };
      return {
        ...prev,
        [locale]: {
          ...prev[locale],
          why: { ...prev[locale]?.why, items: nextItems },
        },
      };
    });
  };

  const resetSection = (key: keyof HomepageSectionOverrides) => {
    setDraft((prev) => ({
      ...prev,
      en: { ...prev.en, [key]: undefined },
      zh: { ...prev.zh, [key]: undefined },
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

  /** Shared editor for the Traditional and Modern design sections. */
  const designTab = (blockKey: "traditional" | "modern") => {
    const defaults = blockKey === "traditional" ? traditionalImages : modernImages;
    const textEn = draft.en?.[blockKey] ?? {};
    const textZh = draft.zh?.[blockKey] ?? {};
    const images = draft.en?.[blockKey]?.images ?? defaults;
    const hasCustomImages = draft.en?.[blockKey]?.images !== undefined;
    const base = { en: dictionaries.en[blockKey], zh: dictionaries.zh[blockKey] };
    const sectionName = blockKey === "traditional" ? "Traditional" : "Modern";

    return (
      <TabsContent value={blockKey} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{sectionName} text</CardTitle>
              <CardDescription>
                Heading, body and tags for the {sectionName} section.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => resetSection(blockKey)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <BilingualField
              label="Label"
              valueEn={textEn.label ?? base.en.label}
              valueZh={textZh.label ?? base.zh.label}
              onChange={(loc, v) => patchSection(loc, blockKey, { label: v })}
            />
            <BilingualField
              label="Title"
              valueEn={textEn.title ?? base.en.title}
              valueZh={textZh.title ?? base.zh.title}
              onChange={(loc, v) => patchSection(loc, blockKey, { title: v })}
            />
            <BilingualField
              label="Body"
              valueEn={textEn.body ?? base.en.body}
              valueZh={textZh.body ?? base.zh.body}
              onChange={(loc, v) => patchSection(loc, blockKey, { body: v })}
              multiline
            />
            <BilingualTagsField
              key={`tags-${JSON.stringify([
                textEn.tags ?? base.en.tags,
                textZh.tags ?? base.zh.tags,
              ])}`}
              label="Tags (comma separated)"
              valueEn={textEn.tags ?? base.en.tags}
              valueZh={textZh.tags ?? base.zh.tags}
              onChange={(loc, tags) => patchSection(loc, blockKey, { tags })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{sectionName} images</CardTitle>
            <CardDescription>
              Shared by both languages. Hover an image to replace or remove it; use the dashed tile
              to add more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImagesManager
              images={images}
              onChange={(imgs) => patchSharedMedia(blockKey, { images: imgs })}
              onReset={
                hasCustomImages
                  ? () => patchSharedMedia(blockKey, { images: undefined })
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
          <p className="text-sm text-muted-foreground">
            Edit the landing page Hero, About, Why Learn, Traditional, Modern and Watch sections.
            Every text field shows English first with 中文 below; images and videos are shared
            across both languages. Save to update the public site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <TabsTrigger value="traditional">Traditional</TabsTrigger>
          <TabsTrigger value="modern">Modern</TabsTrigger>
          <TabsTrigger value="video">Watch</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Hero text</CardTitle>
                <CardDescription>Heading and body at the top of the homepage.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => resetSection("hero")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <BilingualField
                label="Title line 1"
                valueEn={heroEn.title1 ?? dictionaries.en.hero.title1}
                valueZh={heroZh.title1 ?? dictionaries.zh.hero.title1}
                onChange={(loc, v) => patchSection(loc, "hero", { title1: v })}
              />
              <BilingualField
                label="Title line 2"
                valueEn={heroEn.title2 ?? dictionaries.en.hero.title2}
                valueZh={heroZh.title2 ?? dictionaries.zh.hero.title2}
                onChange={(loc, v) => patchSection(loc, "hero", { title2: v })}
              />
              <BilingualField
                label="Title line 3"
                valueEn={heroEn.title3 ?? dictionaries.en.hero.title3}
                valueZh={heroZh.title3 ?? dictionaries.zh.hero.title3}
                onChange={(loc, v) => patchSection(loc, "hero", { title3: v })}
              />
              <BilingualField
                label="Body"
                valueEn={heroEn.body ?? dictionaries.en.hero.body}
                valueZh={heroZh.body ?? dictionaries.zh.hero.body}
                onChange={(loc, v) => patchSection(loc, "hero", { body: v })}
                multiline
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero media</CardTitle>
              <CardDescription>
                Choose a video, poster, or a static image. Shared by both languages — leave blank to
                keep the bundled defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="hero-image-mode"
                  checked={heroEn.media?.imageMode ?? false}
                  onCheckedChange={(v) => patchHeroMedia({ imageMode: v })}
                />
                <Label htmlFor="hero-image-mode">Use static image instead of video</Label>
              </div>
              <VideoField
                label="Hero video"
                value={heroEn.media?.videoUrl}
                onChange={(v) => patchHeroMedia({ videoUrl: v || undefined })}
              />

              <ImageField
                label="Poster image"
                value={heroEn.media?.posterUrl}
                onChange={(v) => patchHeroMedia({ posterUrl: v || undefined })}
              />
              {heroEn.media?.imageMode && (
                <ImageField
                  label="Hero static image"
                  value={heroEn.media?.imageUrl}
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
            <CardContent className="space-y-5">
              <BilingualField
                label="Label"
                valueEn={aboutEn.label ?? dictionaries.en.about.label}
                valueZh={aboutZh.label ?? dictionaries.zh.about.label}
                onChange={(loc, v) => patchSection(loc, "about", { label: v })}
              />
              <BilingualField
                label="Title"
                valueEn={aboutEn.title ?? dictionaries.en.about.title}
                valueZh={aboutZh.title ?? dictionaries.zh.about.title}
                onChange={(loc, v) => patchSection(loc, "about", { title: v })}
              />
              <BilingualField
                label="Body paragraph 1"
                valueEn={aboutEn.body1 ?? dictionaries.en.about.body1}
                valueZh={aboutZh.body1 ?? dictionaries.zh.about.body1}
                onChange={(loc, v) => patchSection(loc, "about", { body1: v })}
                multiline
              />
              <BilingualField
                label="Body paragraph 2"
                valueEn={aboutEn.body2 ?? dictionaries.en.about.body2}
                valueZh={aboutZh.body2 ?? dictionaries.zh.about.body2}
                onChange={(loc, v) => patchSection(loc, "about", { body2: v })}
                multiline
              />
              <BilingualField
                label="Stat 1 label"
                valueEn={aboutEn.stat1 ?? dictionaries.en.about.stat1}
                valueZh={aboutZh.stat1 ?? dictionaries.zh.about.stat1}
                onChange={(loc, v) => patchSection(loc, "about", { stat1: v })}
              />
              <BilingualField
                label="Stat 2 label"
                valueEn={aboutEn.stat2 ?? dictionaries.en.about.stat2}
                valueZh={aboutZh.stat2 ?? dictionaries.zh.about.stat2}
                onChange={(loc, v) => patchSection(loc, "about", { stat2: v })}
              />
              <BilingualField
                label="Stat 3 label"
                valueEn={aboutEn.stat3 ?? dictionaries.en.about.stat3}
                valueZh={aboutZh.stat3 ?? dictionaries.zh.about.stat3}
                onChange={(loc, v) => patchSection(loc, "about", { stat3: v })}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Stat 1 number"
                  value={aboutEn.statValue1 ?? dictionaries.en.about.statValue1}
                  onChange={(v) => patchSharedMedia("about", { statValue1: v || undefined })}
                  placeholder="10+"
                />
                <Field
                  label="Stat 2 number"
                  value={aboutEn.statValue2 ?? dictionaries.en.about.statValue2}
                  onChange={(v) => patchSharedMedia("about", { statValue2: v || undefined })}
                  placeholder="800+"
                />
                <Field
                  label="Stat 3 number"
                  value={aboutEn.statValue3 ?? dictionaries.en.about.statValue3}
                  onChange={(v) => patchSharedMedia("about", { statValue3: v || undefined })}
                  placeholder="120+"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About media</CardTitle>
              <CardDescription>
                Shared by both languages — leave blank to keep the bundled default. If a video URL
                is set, the video is shown instead of the image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageField
                label="Image"
                value={aboutEn.imageUrl}
                onChange={(v) => patchSharedMedia("about", { imageUrl: v || undefined })}
              />
              <VideoField
                label="About video"
                value={aboutEn.videoUrl}
                onChange={(v) => patchSharedMedia("about", { videoUrl: v || undefined })}
              />

              {aboutEn.videoUrl && (
                <ImageField
                  label="Video poster"
                  value={aboutEn.posterUrl}
                  onChange={(v) => patchSharedMedia("about", { posterUrl: v || undefined })}
                />
              )}
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
            <CardContent className="space-y-5">
              <BilingualField
                label="Label"
                valueEn={why.en.label}
                valueZh={why.zh.label}
                onChange={(loc, v) => patchSection(loc, "why", { label: v })}
              />
              <BilingualField
                label="Title"
                valueEn={why.en.title}
                valueZh={why.zh.title}
                onChange={(loc, v) => patchSection(loc, "why", { title: v })}
              />
              {why.en.items.map((item, i) => (
                <div key={i} className="space-y-5 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">Card {i + 1}</p>
                  <BilingualField
                    label="Title"
                    valueEn={item.title}
                    valueZh={why.zh.items[i]?.title}
                    onChange={(loc, v) => patchWhyItem(loc, i, "title", v)}
                  />
                  <BilingualField
                    label="Body"
                    valueEn={item.body}
                    valueZh={why.zh.items[i]?.body}
                    onChange={(loc, v) => patchWhyItem(loc, i, "body", v)}
                    multiline
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {designTab("traditional")}
        {designTab("modern")}

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
            <CardContent className="space-y-5">
              <BilingualField
                label="Label"
                valueEn={videoEn.label ?? dictionaries.en.video.label}
                valueZh={videoZh.label ?? dictionaries.zh.video.label}
                onChange={(loc, v) => patchSection(loc, "video", { label: v })}
              />
              <BilingualField
                label="Title"
                valueEn={videoEn.title ?? dictionaries.en.video.title}
                valueZh={videoZh.title ?? dictionaries.zh.video.title}
                onChange={(loc, v) => patchSection(loc, "video", { title: v })}
              />
              <BilingualField
                label="Body"
                valueEn={videoEn.body ?? dictionaries.en.video.body}
                valueZh={videoZh.body ?? dictionaries.zh.video.body}
                onChange={(loc, v) => patchSection(loc, "video", { body: v })}
                multiline
              />
              <BilingualField
                label="Play button"
                valueEn={videoEn.play ?? dictionaries.en.video.play}
                valueZh={videoZh.play ?? dictionaries.zh.video.play}
                onChange={(loc, v) => patchSection(loc, "video", { play: v })}
              />
              <BilingualField
                label="Note"
                valueEn={videoEn.note ?? dictionaries.en.video.note}
                valueZh={videoZh.note ?? dictionaries.zh.video.note}
                onChange={(loc, v) => patchSection(loc, "video", { note: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo media</CardTitle>
              <CardDescription>
                Shared by both languages — leave blank to keep the bundled defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VideoField
                label="Demo video"
                value={videoEn.videoUrl}
                onChange={(v) => patchSharedMedia("video", { videoUrl: v || undefined })}
              />

              <ImageField
                label="Demo poster"
                value={videoEn.posterUrl}
                onChange={(v) => patchSharedMedia("video", { posterUrl: v || undefined })}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
