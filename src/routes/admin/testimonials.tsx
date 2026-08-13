import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Eye,
  ExternalLink,
  EyeOff,
  ImagePlus,
  MessageSquareQuote,
  Pencil,
  Plus,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { BilingualField } from "@/components/admin/BilingualField";
import { StatCard } from "@/components/admin/StatCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Locale } from "@/i18n/dictionaries";
import { fileToDataUrl } from "@/lib/image-upload";
import {
  avatarPresets,
  beforeAfterPresets,
  resolveTestimonialImage,
} from "@/lib/testimonial-images";
import {
  type AdminTestimonialRow,
  type CustomTestimonial,
  type EffectiveTestimonial,
  type TestimonialEdit,
  adminTestimonials,
  allTestimonialIds,
  applyTestimonialEdit,
  builtinTestimonials,
  cleanTestimonialEdit,
  effectiveTestimonialSection,
  effectiveTestimonials,
  findCustomTestimonial,
  makeTestimonialId,
  trashedTestimonials,
  useTestimonialOverrides,
  writeTestimonialOverrides,
} from "@/lib/testimonial-overrides";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({
    meta: [{ title: "Testimonials — Nagma Designs Admin" }],
  }),
  component: AdminTestimonialsPage,
});

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < value ? "fill-primary text-primary" : "fill-muted text-muted",
          )}
        />
      ))}
    </span>
  );
}

/** Interactive 1–5 star picker used inside the editor dialog. */
function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const rating = i + 1;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
            className="rounded-md p-1 transition hover:bg-accent"
          >
            <Star
              className={cn(
                "h-6 w-6",
                rating <= value ? "fill-primary text-primary" : "fill-muted text-muted",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Preset grid + upload picker for avatars and before/after frames. */
function ImagePicker({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: readonly string[];
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = !presets.includes(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
      toast.success(`${label} updated`);
    } catch {
      toast.error("Could not read that image. Try a different file.");
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={`Use preset ${key}`}
            className={cn(
              "h-14 w-14 overflow-hidden rounded-lg border-2 transition",
              value === key
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50",
            )}
          >
            <img
              src={resolveTestimonialImage(key)}
              alt={key}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
        {isCustom && (
          <span className="relative h-14 w-14 overflow-hidden rounded-lg border-2 border-primary ring-2 ring-primary/30">
            <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-14 w-14 flex-col gap-1"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          <span className="text-[10px]">Upload</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor dialog                                                       */
/* ------------------------------------------------------------------ */

interface EditorState {
  /** Undefined when adding a new testimonial. */
  id: string | undefined;
  custom: boolean;
  draft: EffectiveTestimonial;
}

function emptyDraft(): EffectiveTestimonial {
  return {
    id: "",
    photo: "person-1",
    rating: 5,
    nameEn: "",
    nameZh: "",
    roleEn: "",
    roleZh: "",
    countryEn: "",
    countryZh: "",
    reviewEn: "",
    reviewZh: "",
    before: "bridal-1",
    after: "modern-1",
  };
}

function TestimonialEditorDialog({
  state,
  onClose,
  onSave,
}: {
  state: EditorState | undefined;
  onClose: () => void;
  onSave: (state: EditorState) => void;
}) {
  const [draft, setDraft] = useState<EffectiveTestimonial | undefined>(state?.draft);

  // Re-seed the draft whenever a different testimonial is opened.
  const [openedFor, setOpenedFor] = useState<string | undefined>(state?.id ?? "new");
  if (state && (state.id ?? "new") !== openedFor) {
    setOpenedFor(state.id ?? "new");
    setDraft(state.draft);
  }

  const setField = (patch: Partial<EffectiveTestimonial>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  const setBilingual =
    (base: "name" | "role" | "country" | "review") => (locale: Locale, value: string) =>
      setField(
        locale === "en"
          ? ({ [`${base}En`]: value } as Partial<EffectiveTestimonial>)
          : ({ [`${base}Zh`]: value } as Partial<EffectiveTestimonial>),
      );

  const valid = Boolean(draft && draft.nameEn.trim() && draft.reviewEn.trim());

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {state?.id === undefined ? "Add testimonial" : "Edit testimonial"}
          </DialogTitle>
          <DialogDescription>
            Every text has an English field first and its 中文 translation below it. Photos and
            rating are shared across both languages.
          </DialogDescription>
        </DialogHeader>

        {draft && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Star rating</Label>
              <RatingPicker value={draft.rating} onChange={(rating) => setField({ rating })} />
            </div>

            <BilingualField
              label="Name"
              valueEn={draft.nameEn}
              valueZh={draft.nameZh}
              onChange={setBilingual("name")}
              placeholder="e.g. Sneha K."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <BilingualField
                label="Role"
                valueEn={draft.roleEn}
                valueZh={draft.roleZh}
                onChange={setBilingual("role")}
                placeholder="Student, Bridal client…"
              />
              <BilingualField
                label="Country"
                valueEn={draft.countryEn}
                valueZh={draft.countryZh}
                onChange={setBilingual("country")}
                placeholder="Nepal, India, China…"
              />
            </div>
            <BilingualField
              label="Review"
              multiline
              valueEn={draft.reviewEn}
              valueZh={draft.reviewZh}
              onChange={setBilingual("review")}
              placeholder="What they said about the studio"
            />

            <ImagePicker
              label="Profile photo"
              value={draft.photo}
              presets={avatarPresets}
              onChange={(photo) => setField({ photo })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ImagePicker
                label="Before photo"
                value={draft.before}
                presets={beforeAfterPresets}
                onChange={(before) => setField({ before })}
              />
              <ImagePicker
                label="After photo"
                value={draft.after}
                presets={beforeAfterPresets}
                onChange={(after) => setField({ after })}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              if (state && draft) onSave({ ...state, draft });
            }}
          >
            Save testimonial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminTestimonialsPage() {
  const overrides = useTestimonialOverrides();
  const rows = adminTestimonials(overrides);
  const trash = trashedTestimonials(overrides);
  const section = effectiveTestimonialSection(overrides);
  const liveItems = effectiveTestimonials(overrides);

  const [editor, setEditor] = useState<EditorState | undefined>(undefined);
  const [purgeTarget, setPurgeTarget] = useState<AdminTestimonialRow | undefined>(undefined);
  const [clearTrashOpen, setClearTrashOpen] = useState(false);

  const avgRating =
    liveItems.length > 0
      ? (liveItems.reduce((sum, t) => sum + t.rating, 0) / liveItems.length).toFixed(1)
      : "—";
  const hiddenCount = rows.filter((r) => r.hidden).length;

  const setSectionField = (key: "labelEn" | "labelZh" | "titleEn" | "titleZh", value: string) => {
    writeTestimonialOverrides({ ...overrides, [key]: value.trim() ? value : undefined });
  };

  const toggleHidden = (row: AdminTestimonialRow, hidden: boolean) => {
    const next = hidden
      ? [...overrides.hidden, row.item.id]
      : overrides.hidden.filter((id) => id !== row.item.id);
    writeTestimonialOverrides({ ...overrides, hidden: next });
    toast.success(hidden ? "Hidden from the homepage" : "Visible on the homepage again");
  };

  const moveToTrash = (row: AdminTestimonialRow) => {
    writeTestimonialOverrides({
      ...overrides,
      hidden: overrides.hidden.filter((id) => id !== row.item.id),
      deleted: [...overrides.deleted, row.item.id],
    });
    toast.success("Moved to trash — restore it anytime");
  };

  const restore = (row: AdminTestimonialRow) => {
    writeTestimonialOverrides({
      ...overrides,
      deleted: overrides.deleted.filter((id) => id !== row.item.id),
    });
    toast.success("Testimonial restored");
  };

  const purge = (row: AdminTestimonialRow) => {
    if (row.custom) {
      writeTestimonialOverrides({
        ...overrides,
        added: overrides.added.filter((c) => c.id !== row.item.id),
        hidden: overrides.hidden.filter((id) => id !== row.item.id),
        deleted: overrides.deleted.filter((id) => id !== row.item.id),
      });
    } else {
      writeTestimonialOverrides({
        ...overrides,
        deleted: overrides.deleted.filter((id) => id !== row.item.id),
        purged: [...overrides.purged, row.item.id],
      });
    }
    toast.success("Deleted permanently");
    setPurgeTarget(undefined);
  };

  /** Permanently deletes every trashed testimonial. */
  const clearTrash = () => {
    const customIds = new Set(trash.filter((r) => r.custom).map((r) => r.item.id));
    const builtinIds = trash.filter((r) => !r.custom).map((r) => r.item.id);
    writeTestimonialOverrides({
      ...overrides,
      added: overrides.added.filter((c) => !customIds.has(c.id)),
      hidden: overrides.hidden.filter((id) => !customIds.has(id)),
      deleted: [],
      purged: [...overrides.purged, ...builtinIds],
    });
    setClearTrashOpen(false);
    toast.success("Trash emptied");
  };

  const openEditor = (row?: AdminTestimonialRow) => {
    if (!row) {
      setEditor({ id: undefined, custom: true, draft: emptyDraft() });
      return;
    }
    setEditor({ id: row.item.id, custom: row.custom, draft: { ...row.item } });
  };

  const saveEditor = (state: EditorState) => {
    const { draft } = state;
    if (state.id === undefined) {
      const id = makeTestimonialId(draft.nameEn, allTestimonialIds(overrides));
      const record: CustomTestimonial = { ...draft, id };
      writeTestimonialOverrides({ ...overrides, added: [...overrides.added, record] });
      toast.success("Testimonial added to the homepage");
    } else if (state.custom) {
      writeTestimonialOverrides({
        ...overrides,
        added: overrides.added.map((c) => (c.id === state.id ? { ...draft, id: c.id } : c)),
      });
      toast.success("Testimonial updated");
    } else {
      const base = builtinTestimonials.find((t) => t.id === state.id);
      if (!base) return;
      const edit: TestimonialEdit = {};
      (Object.keys(draft) as (keyof EffectiveTestimonial)[]).forEach((key) => {
        if (key === "id") return;
        if (draft[key] !== base[key]) {
          Object.assign(edit, { [key]: draft[key] });
        }
      });
      const cleaned = cleanTestimonialEdit(edit);
      const edits = { ...overrides.edits };
      if (cleaned) edits[state.id] = { ...edits[state.id], ...cleaned };
      else delete edits[state.id];
      writeTestimonialOverrides({ ...overrides, edits });
      toast.success("Testimonial updated");
    }
    setEditor(undefined);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Testimonials</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Manage the reviews shown in the homepage testimonial carousel — names, roles,
            countries, star ratings, photos and the before/after frames, in both languages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/" hash="testimonials" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View live section
            </Link>
          </Button>
          <Button onClick={() => openEditor()}>
            <Plus className="mr-2 h-4 w-4" />
            Add testimonial
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live on homepage"
          value={String(liveItems.length)}
          delta="In the carousel"
          icon={MessageSquareQuote}
        />
        <StatCard
          label="Average rating"
          value={avgRating}
          delta="Across live reviews"
          icon={Star}
        />
        <StatCard
          label="Hidden"
          value={String(hiddenCount)}
          delta="Kept, not shown"
          icon={EyeOff}
        />
        <StatCard label="In trash" value={String(trash.length)} delta="Restorable" icon={Trash2} />
      </div>

      {/* Section heading */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section heading</CardTitle>
          <CardDescription>
            The small label and the big title above the carousel. Clearing a field brings back the
            original text.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <BilingualField
            label="Label"
            valueEn={section.labelEn}
            valueZh={section.labelZh}
            onChange={(locale, value) =>
              setSectionField(locale === "en" ? "labelEn" : "labelZh", value)
            }
          />
          <BilingualField
            label="Title"
            valueEn={section.titleEn}
            valueZh={section.titleZh}
            onChange={(locale, value) =>
              setSectionField(locale === "en" ? "titleEn" : "titleZh", value)
            }
          />
        </CardContent>
      </Card>

      {/* Testimonial list */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Reviews ({rows.length})</h2>
        {rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <MessageSquareQuote className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No testimonials yet — add the first one.
              </p>
              <Button onClick={() => openEditor()}>
                <Plus className="mr-2 h-4 w-4" />
                Add testimonial
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <Card key={row.item.id} className={cn(row.hidden && "opacity-70")}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <img
                      src={resolveTestimonialImage(row.item.photo)}
                      alt={row.item.nameEn}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{row.item.nameEn}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.item.countryEn || "—"} · {row.item.roleEn || "—"}
                      </p>
                      <Stars value={row.item.rating} className="mt-1" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {row.custom ? (
                        <Badge variant="secondary">Custom</Badge>
                      ) : (
                        <Badge variant="outline">Built-in</Badge>
                      )}
                      {row.hidden && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </div>

                  <blockquote className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    “{row.item.reviewEn}”
                  </blockquote>

                  <div className="flex gap-2">
                    <div className="relative flex-1 overflow-hidden rounded-md border border-border">
                      <img
                        src={resolveTestimonialImage(row.item.before)}
                        alt="Before"
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                        Before
                      </span>
                    </div>
                    <div className="relative flex-1 overflow-hidden rounded-md border border-border">
                      <img
                        src={resolveTestimonialImage(row.item.after)}
                        alt="After"
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                        After
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!row.hidden}
                        onCheckedChange={(checked) => toggleHidden(row, !checked)}
                        aria-label="Show on homepage"
                      />
                      <span className="text-xs text-muted-foreground">
                        {row.hidden ? "Hidden" : "Visible"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditor(row)}
                        aria-label={`Edit ${row.item.nameEn}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveToTrash(row)}
                        aria-label={`Move ${row.item.nameEn} to trash`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Trash */}
      {trash.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5" />
                Trash ({trash.length})
              </CardTitle>
              <CardDescription>
                Trashed testimonials stay here until you restore them or delete them permanently.
              </CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setClearTrashOpen(true)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear Trash ({trash.length})
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {trash.map((row) => (
              <div
                key={row.item.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <img
                  src={resolveTestimonialImage(row.item.photo)}
                  alt={row.item.nameEn}
                  loading="lazy"
                  className="h-10 w-10 rounded-full border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.item.nameEn}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.custom ? "Custom" : "Built-in"} · {row.item.roleEn || "—"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => restore(row)}>
                  <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setPurgeTarget(row)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete permanently
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={clearTrashOpen} onOpenChange={setClearTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty the testimonials trash?</AlertDialogTitle>
            <AlertDialogDescription>
              All {trash.length} trashed testimonial{trash.length === 1 ? "" : "s"} will be removed forever. This
              cannot be undone and only affects testimonials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={clearTrash}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editor dialog */}
      <TestimonialEditorDialog
        state={editor}
        onClose={() => setEditor(undefined)}
        onSave={saveEditor}
      />

      {/* Permanent delete confirmation */}
      <AlertDialog open={Boolean(purgeTarget)} onOpenChange={(open) => !open && setPurgeTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              “{purgeTarget?.item.nameEn}” will be removed forever. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purgeTarget && purge(purgeTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
