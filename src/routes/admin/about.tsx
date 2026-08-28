import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImagePlus, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { BilingualField } from "@/components/admin/BilingualField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultAbout,
  useAboutContent,
  writeAboutContent,
  type AboutCard,
  type AboutContent,
} from "@/lib/about-content";
import { uploadGalleryImage } from "@/lib/image-upload";
import { VideoField } from "@/components/admin/VideoField";

export const Route = createFileRoute("/admin/about")({
  component: AdminAboutPage,
});

/** URL field with an optional upload button (photos go to the studio gallery bucket). */
function ImageField({
  label,
  value,
  onChange,
  uploadable = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadable?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadGalleryImage(file));
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="min-w-[240px] flex-1"
        />
        {uploadable ? (
          <Button variant="outline" size="sm" disabled={busy} asChild>
            <label className="cursor-pointer">
              <Upload className="mr-1.5 h-4 w-4" />
              {busy ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CardListEditor({
  title,
  description,
  items,
  onChange,
}: {
  title: string;
  description: string;
  items: AboutCard[];
  onChange: (items: AboutCard[]) => void;
}) {
  function patch(index: number, next: Partial<AboutCard>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { titleEn: "New item", titleZh: "", bodyEn: "", bodyZh: "" }])}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.titleEn || `Item ${i + 1}`}</span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Remove item"
                onClick={() => onChange(items.filter((_, index) => index !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <BilingualField
              label="Title"
              valueEn={item.titleEn}
              valueZh={item.titleZh}
              onChange={(l, v) => patch(i, l === "en" ? { titleEn: v } : { titleZh: v })}
            />
            <BilingualField
              label="Description"
              valueEn={item.bodyEn}
              valueZh={item.bodyZh}
              multiline
              onChange={(l, v) => patch(i, l === "en" ? { bodyEn: v } : { bodyZh: v })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdminAboutPage() {
  const { about, loaded } = useAboutContent();
  const [draft, setDraft] = useState<AboutContent>(about);

  // Adopt the stored document once it arrives (and when another tab saves).
  useEffect(() => {
    setDraft(about);
  }, [about]);

  function set(patch: Partial<AboutContent>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    writeAboutContent(next);
  }

  function reset() {
    setDraft(defaultAbout);
    writeAboutContent(defaultAbout);
    toast.success("Restored the default About page.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">About page</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every section of the public About page. Changes save automatically in both languages.
            {loaded ? "" : " Loading…"}
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero</CardTitle>
          <CardDescription>Top of the page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.heroTitleEn}
            valueZh={draft.heroTitleZh}
            onChange={(l, v) => set(l === "en" ? { heroTitleEn: v } : { heroTitleZh: v })}
          />
          <BilingualField
            label="Intro"
            valueEn={draft.heroBodyEn}
            valueZh={draft.heroBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { heroBodyEn: v } : { heroBodyZh: v })}
          />
          <ImageField label="Hero image" value={draft.heroImageUrl} onChange={(v) => set({ heroImageUrl: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Our Story</CardTitle>
          <CardDescription>Use a blank line break for each paragraph.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.storyTitleEn}
            valueZh={draft.storyTitleZh}
            onChange={(l, v) => set(l === "en" ? { storyTitleEn: v } : { storyTitleZh: v })}
          />
          <BilingualField
            label="Story"
            valueEn={draft.storyBodyEn}
            valueZh={draft.storyBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { storyBodyEn: v } : { storyBodyZh: v })}
          />
          <ImageField label="Story image" value={draft.storyImageUrl} onChange={(v) => set({ storyImageUrl: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Values heading</CardTitle>
        </CardHeader>
        <CardContent>
          <BilingualField
            label="Heading"
            valueEn={draft.valuesTitleEn}
            valueZh={draft.valuesTitleZh}
            onChange={(l, v) => set(l === "en" ? { valuesTitleEn: v } : { valuesTitleZh: v })}
          />
        </CardContent>
      </Card>

      <CardListEditor
        title="Our Values"
        description="Tradition, Creativity, Practice, Personal Expression."
        items={draft.values}
        onChange={(values) => set({ values })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">The Art Behind Our Designs</CardTitle>
          <CardDescription>Heading, intro and the image grid.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.artTitleEn}
            valueZh={draft.artTitleZh}
            onChange={(l, v) => set(l === "en" ? { artTitleEn: v } : { artTitleZh: v })}
          />
          <BilingualField
            label="Intro"
            valueEn={draft.artBodyEn}
            valueZh={draft.artBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { artBodyEn: v } : { artBodyZh: v })}
          />
          <div className="space-y-4">
            {draft.artImages.map((src, i) => (
              <div key={i} className="flex items-end gap-3">
                <ImageField
                  label={`Image ${i + 1}`}
                  value={src}
                  onChange={(v) => set({ artImages: draft.artImages.map((old, index) => (index === i ? v : old)) })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove image"
                  onClick={() => set({ artImages: draft.artImages.filter((_, index) => index !== i) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set({ artImages: [...draft.artImages, ""] })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add image
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teaching approach heading</CardTitle>
        </CardHeader>
        <CardContent>
          <BilingualField
            label="Heading"
            valueEn={draft.teachingTitleEn}
            valueZh={draft.teachingTitleZh}
            onChange={(l, v) => set(l === "en" ? { teachingTitleEn: v } : { teachingTitleZh: v })}
          />
        </CardContent>
      </Card>

      <CardListEditor
        title="Teaching steps"
        description="Learn → Practice → Create → Develop."
        items={draft.teaching}
        onChange={(teaching) => set({ teaching })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meet the Artist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Section label"
            valueEn={draft.artistTitleEn}
            valueZh={draft.artistTitleZh}
            onChange={(l, v) => set(l === "en" ? { artistTitleEn: v } : { artistTitleZh: v })}
          />
          <BilingualField
            label="Name"
            valueEn={draft.artistNameEn}
            valueZh={draft.artistNameZh}
            onChange={(l, v) => set(l === "en" ? { artistNameEn: v } : { artistNameZh: v })}
          />
          <BilingualField
            label="Role"
            valueEn={draft.artistRoleEn}
            valueZh={draft.artistRoleZh}
            onChange={(l, v) => set(l === "en" ? { artistRoleEn: v } : { artistRoleZh: v })}
          />
          <BilingualField
            label="Bio"
            valueEn={draft.artistBodyEn}
            valueZh={draft.artistBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { artistBodyEn: v } : { artistBodyZh: v })}
          />
          <ImageField label="Portrait" value={draft.artistImageUrl} onChange={(v) => set({ artistImageUrl: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Our Studio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.studioTitleEn}
            valueZh={draft.studioTitleZh}
            onChange={(l, v) => set(l === "en" ? { studioTitleEn: v } : { studioTitleZh: v })}
          />
          <BilingualField
            label="Description"
            valueEn={draft.studioBodyEn}
            valueZh={draft.studioBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { studioBodyEn: v } : { studioBodyZh: v })}
          />
          <BilingualField
            label="Address"
            valueEn={draft.studioAddressEn}
            valueZh={draft.studioAddressZh}
            onChange={(l, v) => set(l === "en" ? { studioAddressEn: v } : { studioAddressZh: v })}
          />
          <BilingualField
            label="Hours"
            valueEn={draft.studioHoursEn}
            valueZh={draft.studioHoursZh}
            onChange={(l, v) => set(l === "en" ? { studioHoursEn: v } : { studioHoursZh: v })}
          />
          <ImageField label="Studio image" value={draft.studioImageUrl} onChange={(v) => set({ studioImageUrl: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Behind-the-scenes video</CardTitle>
          <CardDescription>Choose a video file from your device, or paste a direct .mp4 link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.videoTitleEn}
            valueZh={draft.videoTitleZh}
            onChange={(l, v) => set(l === "en" ? { videoTitleEn: v } : { videoTitleZh: v })}
          />
          <BilingualField
            label="Caption"
            valueEn={draft.videoBodyEn}
            valueZh={draft.videoBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { videoBodyEn: v } : { videoBodyZh: v })}
          />
          <VideoField label="Video" value={draft.videoUrl} onChange={(v) => set({ videoUrl: v })} />
          <ImageField label="Poster image" value={draft.videoPosterUrl} onChange={(v) => set({ videoPosterUrl: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why Learn With Us heading</CardTitle>
        </CardHeader>
        <CardContent>
          <BilingualField
            label="Heading"
            valueEn={draft.whyTitleEn}
            valueZh={draft.whyTitleZh}
            onChange={(l, v) => set(l === "en" ? { whyTitleEn: v } : { whyTitleZh: v })}
          />
        </CardContent>
      </Card>

      <CardListEditor
        title="Why Learn With Us"
        description="Short reasons shown as cards."
        items={draft.why}
        onChange={(why) => set({ why })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">International Students</CardTitle>
          <CardDescription>One point per line.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.intlTitleEn}
            valueZh={draft.intlTitleZh}
            onChange={(l, v) => set(l === "en" ? { intlTitleEn: v } : { intlTitleZh: v })}
          />
          <BilingualField
            label="Intro"
            valueEn={draft.intlBodyEn}
            valueZh={draft.intlBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { intlBodyEn: v } : { intlBodyZh: v })}
          />
          <BilingualField
            label="Points (one per line)"
            valueEn={draft.intlPointsEn.join("\n")}
            valueZh={draft.intlPointsZh.join("\n")}
            multiline
            onChange={(l, v) => {
              const list = v.split("\n").map((line) => line.trim());
              set(l === "en" ? { intlPointsEn: list } : { intlPointsZh: list });
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Final call to action</CardTitle>
          <CardDescription>Buttons link to Courses and Gallery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BilingualField
            label="Heading"
            valueEn={draft.ctaTitleEn}
            valueZh={draft.ctaTitleZh}
            onChange={(l, v) => set(l === "en" ? { ctaTitleEn: v } : { ctaTitleZh: v })}
          />
          <BilingualField
            label="Text"
            valueEn={draft.ctaBodyEn}
            valueZh={draft.ctaBodyZh}
            multiline
            onChange={(l, v) => set(l === "en" ? { ctaBodyEn: v } : { ctaBodyZh: v })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
