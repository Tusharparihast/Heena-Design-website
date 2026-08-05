import { createFileRoute } from "@tanstack/react-router";
import {
  EyeOff,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AdminGalleryRow,
  type CustomGalleryItem,
  type EffectiveGalleryCategory,
  type GalleryOverrides,
  adminGalleryItems,
  cleanGalleryEdit,
  effectiveGalleryCategories,
  effectiveGalleryItems,
  findCustomItem,
  makeGalleryCategoryId,
  makeGalleryItemId,
  trashedGalleryItems,
  useGalleryOverrides,
  writeGalleryOverrides,
} from "@/lib/gallery-overrides";
import type { GalleryCollection } from "@/lib/gallery";
import { fileToDataUrl } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [{ title: "Gallery — Nagma Designs Admin" }],
  }),
  component: AdminGalleryPage,
});

type EditorState =
  | { mode: "add"; collection: GalleryCollection }
  | { mode: "edit"; row: AdminGalleryRow };

function AdminGalleryPage() {
  const overrides = useGalleryOverrides();
  const [tab, setTab] = useState<GalleryCollection>("gallery");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [purgeId, setPurgeId] = useState<string | null>(null);
  const [catNameEn, setCatNameEn] = useState("");
  const [catNameZh, setCatNameZh] = useState("");
  const [renameTarget, setRenameTarget] = useState<EffectiveGalleryCategory | null>(null);
  const [renameEn, setRenameEn] = useState("");
  const [renameZh, setRenameZh] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [purgeCategoryId, setPurgeCategoryId] = useState<string | null>(null);

  const update = (fn: (prev: GalleryOverrides) => GalleryOverrides) => {
    writeGalleryOverrides(fn(overrides));
  };

  const categories = effectiveGalleryCategories(overrides);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.nameEn ?? id;

  const visibleCount =
    effectiveGalleryItems(overrides, "gallery").length +
    effectiveGalleryItems(overrides, "student").length;
  const trashRows = trashedGalleryItems(overrides);
  const trashedCategories = [
    ...categories,
    // Trashed built-ins/customs are no longer in `categories`, so rebuild their labels.
  ];
  const trashedCategoryRows: EffectiveGalleryCategory[] = overrides.deletedCategories.map((id) => {
    const custom = overrides.categories.find((c) => c.id === id);
    const edit = overrides.categoryEdits[id];
    return {
      id,
      nameEn: custom?.nameEn ?? edit?.nameEn ?? id,
      nameZh: custom?.nameZh ?? edit?.nameZh ?? "",
      builtin: !custom,
    };
  });
  void trashedCategories;

  /* ---------------- photo actions ---------------- */

  const setHidden = (id: string, hide: boolean) => {
    update((prev) => ({
      ...prev,
      hidden: hide ? [...prev.hidden, id] : prev.hidden.filter((x) => x !== id),
    }));
    toast.success(hide ? "Photo hidden" : "Photo visible again", {
      description: hide
        ? "It no longer appears on the public galleries."
        : "It is back on the public galleries.",
    });
  };

  const trashPhoto = (id: string) => {
    update((prev) => ({
      ...prev,
      hidden: prev.hidden.filter((x) => x !== id),
      deleted: [...prev.deleted, id],
    }));
    toast.success("Moved to trash", {
      description: "Restore it from the Trash card below, or delete it permanently there.",
    });
  };

  const restorePhoto = (id: string) => {
    update((prev) => ({ ...prev, deleted: prev.deleted.filter((x) => x !== id) }));
    toast.success("Photo restored");
  };

  const purgePhoto = (id: string) => {
    update((prev) => {
      const isCustom = prev.added.some((c) => c.id === id);
      const edits = { ...prev.edits };
      delete edits[id];
      return {
        ...prev,
        edits,
        added: isCustom ? prev.added.filter((c) => c.id !== id) : prev.added,
        hidden: prev.hidden.filter((x) => x !== id),
        deleted: prev.deleted.filter((x) => x !== id),
        purged: isCustom ? prev.purged : [...prev.purged, id],
      };
    });
    setPurgeId(null);
    toast.success("Photo permanently deleted");
  };

  /* ---------------- category actions ---------------- */

  const addCategory = () => {
    const nameEn = catNameEn.trim();
    if (!nameEn) return;
    const taken = new Set([
      ...categories.map((c) => c.id),
      ...overrides.deletedCategories,
      ...overrides.purgedCategories,
    ]);
    const id = makeGalleryCategoryId(nameEn, taken);
    update((prev) => ({
      ...prev,
      categories: [...prev.categories, { id, nameEn, nameZh: catNameZh.trim() }],
    }));
    setCatNameEn("");
    setCatNameZh("");
    toast.success(`Added category “${nameEn}”`);
  };

  const saveRename = () => {
    if (!renameTarget) return;
    const nameEn = renameEn.trim();
    const nameZh = renameZh.trim();
    if (!nameEn) return;
    update((prev) => {
      if (renameTarget.builtin) {
        return {
          ...prev,
          categoryEdits: {
            ...prev.categoryEdits,
            [renameTarget.id]: {
              ...(nameEn ? { nameEn } : {}),
              ...(nameZh ? { nameZh } : {}),
            },
          },
        };
      }
      return {
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === renameTarget.id ? { ...c, nameEn, nameZh } : c,
        ),
      };
    });
    toast.success(`Renamed category to “${nameEn}”`);
    setRenameTarget(null);
  };

  const trashCategory = (id: string) => {
    update((prev) => ({ ...prev, deletedCategories: [...prev.deletedCategories, id] }));
    setDeleteCategoryId(null);
    toast.success("Category moved to trash", {
      description:
        "Photos stay published and keep their other categories. Restore the category from the Trash card to bring it back.",
    });
  };

  const restoreCategory = (id: string) => {
    update((prev) => ({
      ...prev,
      deletedCategories: prev.deletedCategories.filter((x) => x !== id),
    }));
    toast.success("Category restored", {
      description: "Photos that had this category show it again.",
    });
  };

  const purgeCategory = (id: string) => {
    update((prev) => {
      const isCustom = prev.categories.some((c) => c.id === id);
      const categoryEdits = { ...prev.categoryEdits };
      delete categoryEdits[id];
      return {
        ...prev,
        categoryEdits,
        categories: isCustom ? prev.categories.filter((c) => c.id !== id) : prev.categories,
        deletedCategories: prev.deletedCategories.filter((x) => x !== id),
        purgedCategories: isCustom ? prev.purgedCategories : [...prev.purgedCategories, id],
      };
    });
    setPurgeCategoryId(null);
    toast.success("Category permanently deleted", {
      description: "Photos keep their other categories.",
    });
  };

  /* ---------------- filtered rows ---------------- */

  const rows = adminGalleryItems(overrides, tab).filter(({ item }) => {
    if (categoryFilter !== "all" && !item.categories.includes(categoryFilter)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.en.toLowerCase().includes(q) ||
      item.zh.toLowerCase().includes(q) ||
      item.categories.some((id) => categoryName(id).toLowerCase().includes(q))
    );
  });

  const photoGrid = (collection: GalleryCollection) => {
    const collectionRows = collection === tab ? rows : adminGalleryItems(overrides, collection);
    return (
      <div className="space-y-4">
        {collectionRows.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Images className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No photos match</p>
              <p className="text-xs text-muted-foreground">
                Try a different search or filter, or add a new photo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {collectionRows.map((row) => (
              <li key={row.item.id}>
                <Card className={cn("overflow-hidden shadow-none", row.hidden && "opacity-60")}>
                  <div className="relative aspect-4/5 w-full bg-accent/30">
                    <img
                      src={row.item.src}
                      alt={row.item.en}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    {row.hidden && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </span>
                    )}
                    {row.custom && (
                      <span className="absolute top-2 right-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Custom
                      </span>
                    )}
                  </div>
                  <CardContent className="space-y-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.item.en}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.item.zh || "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {row.item.categories.slice(0, 2).map((id) => (
                        <Badge key={id} variant="secondary" className="text-[10px]">
                          {categoryName(id)}
                        </Badge>
                      ))}
                      {row.item.categories.length > 2 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{row.item.categories.length - 2}
                        </Badge>
                      )}
                      {row.item.categories.length === 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          Uncategorized
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Switch
                          checked={!row.hidden}
                          onCheckedChange={(checked) => setHidden(row.item.id, !checked)}
                          aria-label={`Toggle visibility of ${row.item.en}`}
                        />
                        Visible
                      </label>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditor({ mode: "edit", row })}
                          aria-label={`Edit ${row.item.en}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => trashPhoto(row.item.id)}
                          aria-label={`Move ${row.item.en} to trash`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Manage the public Designs and Student work galleries: upload photos, retitle,
            re-categorize, hide or trash them. Changes apply to the storefront instantly.
          </p>
        </div>
        <Button onClick={() => setEditor({ mode: "add", collection: tab })}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Add photo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Photos live" value={String(visibleCount)} delta="On public galleries" icon={Images} />
        <StatCard label="Hidden" value={String(overrides.hidden.length)} delta="Temporarily off" icon={EyeOff} />
        <StatCard label="In trash" value={String(trashRows.length)} delta="Restorable" icon={Trash2} />
        <StatCard label="Categories" value={String(categories.length)} delta="Active filters" icon={Tags} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as GalleryCollection)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="gallery">Designs</TabsTrigger>
            <TabsTrigger value="student">Student work</TabsTrigger>
          </TabsList>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:max-w-xl">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search photos by title or category"
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <TabsContent value="gallery" className="mt-5">
          {photoGrid("gallery")}
        </TabsContent>
        <TabsContent value="student" className="mt-5">
          {photoGrid("student")}
        </TabsContent>
      </Tabs>

      {/* ---------------- Categories ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Filters shown on the public gallery. Rename built-ins, add your own, or move unused
            ones to the trash — photos keep their other categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-1 rounded-full border border-border bg-card py-1 pr-1 pl-3 text-xs"
              >
                <span className="font-medium">{c.nameEn}</span>
                {c.nameZh && <span className="text-muted-foreground">· {c.nameZh}</span>}
                {!c.builtin && <Badge variant="secondary" className="ml-1 text-[9px]">Custom</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label={`Rename ${c.nameEn}`}
                  onClick={() => {
                    setRenameTarget(c);
                    setRenameEn(c.nameEn);
                    setRenameZh(c.nameZh);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  aria-label={`Delete ${c.nameEn}`}
                  onClick={() => setDeleteCategoryId(c.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
            <Input
              value={catNameEn}
              onChange={(e) => setCatNameEn(e.target.value)}
              placeholder="New category name (English)"
              className="sm:max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Input
              value={catNameZh}
              onChange={(e) => setCatNameZh(e.target.value)}
              placeholder="中文名称 (optional)"
              className="sm:max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button variant="outline" onClick={addCategory} disabled={!catNameEn.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Trash ---------------- */}
      {(trashRows.length > 0 || trashedCategoryRows.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Trash</CardTitle>
            <CardDescription>
              Restore items to the galleries, or delete them permanently. Permanent deletion
              cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {trashRows.length > 0 && (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {trashRows.map((row) => (
                  <li key={row.item.id}>
                    <Card className="overflow-hidden shadow-none">
                      <div className="aspect-4/5 w-full bg-accent/30">
                        <img
                          src={row.item.src}
                          alt={row.item.en}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover opacity-70"
                        />
                      </div>
                      <CardContent className="space-y-2 p-3">
                        <p className="truncate text-sm font-medium">{row.item.en}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 flex-1 text-xs"
                            onClick={() => restorePhoto(row.item.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setPurgeId(row.item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            {trashedCategoryRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Categories
                </p>
                <ul className="flex flex-wrap gap-2">
                  {trashedCategoryRows.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-1 rounded-full border border-dashed border-border py-1 pr-1 pl-3 text-xs"
                    >
                      <span className="font-medium">{c.nameEn}</span>
                      {c.nameZh && <span className="text-muted-foreground">· {c.nameZh}</span>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        aria-label={`Restore ${c.nameEn}`}
                        onClick={() => restoreCategory(c.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        aria-label={`Permanently delete ${c.nameEn}`}
                        onClick={() => setPurgeCategoryId(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------- Photo editor dialog ---------------- */}
      <PhotoEditorDialog
        editor={editor}
        overrides={overrides}
        categories={categories}
        onClose={() => setEditor(null)}
        onSaveAdd={(item) => {
          update((prev) => ({ ...prev, added: [...prev.added, item] }));
          setEditor(null);
          toast.success(`Added “${item.titleEn}”`, {
            description: "It is live on the public gallery.",
          });
        }}
        onSaveEdit={(row, patch) => {
          update((prev) => {
            const custom = findCustomItem(prev, row.item.id);
            if (custom) {
              return {
                ...prev,
                added: prev.added.map((c) =>
                  c.id === custom.id
                    ? {
                        ...c,
                        titleEn: patch.titleEn,
                        titleZh: patch.titleZh,
                        categories: patch.categories,
                        ...(patch.image ? { image: patch.image } : {}),
                      }
                    : c,
                ),
              };
            }
            const edits = { ...prev.edits };
            const cleaned = cleanGalleryEdit({
              titleEn: patch.titleEn,
              titleZh: patch.titleZh,
              categories: patch.categories,
              image: patch.image,
            });
            if (cleaned) edits[row.item.id] = cleaned;
            return { ...prev, edits };
          });
          setEditor(null);
          toast.success(`Saved “${patch.titleEn}”`);
        }}
      />

      {/* ---------------- Rename category dialog ---------------- */}
      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
            <DialogDescription>
              {renameTarget?.builtin
                ? "This renames the built-in filter everywhere it appears."
                : "Rename your custom category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rename-en">English name</Label>
              <Input id="rename-en" value={renameEn} onChange={(e) => setRenameEn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rename-zh">中文名称</Label>
              <Input id="rename-zh" value={renameZh} onChange={(e) => setRenameZh(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveRename} disabled={!renameEn.trim()}>
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Confirm: trash category ---------------- */}
      <AlertDialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move category to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Photos in “{deleteCategoryId ? categoryName(deleteCategoryId) : ""}” stay published
              and keep their other categories. You can restore the category later from the Trash
              card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteCategoryId && trashCategory(deleteCategoryId)}>
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------- Confirm: purge photo ---------------- */}
      <AlertDialog open={purgeId !== null} onOpenChange={(open) => !open && setPurgeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the photo forever. It cannot be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => purgeId && purgePhoto(purgeId)}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------- Confirm: purge category ---------------- */}
      <AlertDialog
        open={purgeCategoryId !== null}
        onOpenChange={(open) => !open && setPurgeCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Photos keep their other categories. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => purgeCategoryId && purgeCategory(purgeCategoryId)}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photo editor dialog                                                 */
/* ------------------------------------------------------------------ */

function PhotoEditorDialog({
  editor,
  overrides,
  categories,
  onClose,
  onSaveAdd,
  onSaveEdit,
}: {
  editor: EditorState | null;
  overrides: GalleryOverrides;
  categories: EffectiveGalleryCategory[];
  onClose: () => void;
  onSaveAdd: (item: CustomGalleryItem) => void;
  onSaveEdit: (
    row: AdminGalleryRow,
    patch: { titleEn: string; titleZh: string; categories: string[]; image?: string | undefined },
  ) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [titleEn, setTitleEn] = useState("");
  const [titleZh, setTitleZh] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [collection, setCollection] = useState<GalleryCollection>("gallery");
  const [busy, setBusy] = useState(false);
  const [initialisedFor, setInitialisedFor] = useState<EditorState | null>(null);

  // Seed the form whenever a different editor target opens (state-during-render pattern).
  if (editor !== initialisedFor) {
    setInitialisedFor(editor);
    if (editor?.mode === "edit") {
      const custom = findCustomItem(overrides, editor.row.item.id);
      setImage(undefined);
      setTitleEn(editor.row.item.en);
      setTitleZh(editor.row.item.zh);
      setSelected(custom ? [...custom.categories] : [...editor.row.item.categories]);
      setCollection(custom?.collection ?? "gallery");
    } else if (editor?.mode === "add") {
      setImage(undefined);
      setTitleEn("");
      setTitleZh("");
      setSelected([]);
      setCollection(editor.collection);
    }
  }

  if (!editor) return null;

  const currentSrc =
    image ?? (editor.mode === "edit" ? editor.row.item.src : undefined);
  const canSave =
    titleEn.trim().length > 0 && (editor.mode === "edit" || image !== undefined) && !busy;

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setImage(dataUrl);
    } catch {
      toast.error("Could not read that image", {
        description: "Please try a different photo (JPG or PNG).",
      });
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = () => {
    if (!canSave) return;
    if (editor.mode === "add") {
      const taken = new Set([
        ...adminGalleryItems(overrides, "gallery").map((r) => r.item.id),
        ...adminGalleryItems(overrides, "student").map((r) => r.item.id),
        ...overrides.deleted,
        ...overrides.purged,
      ]);
      onSaveAdd({
        id: makeGalleryItemId(titleEn.trim(), taken),
        collection,
        image: image!,
        width: 720,
        height: 900,
        categories: selected,
        titleEn: titleEn.trim(),
        titleZh: titleZh.trim(),
      });
    } else {
      onSaveEdit(editor.row, {
        titleEn: titleEn.trim(),
        titleZh: titleZh.trim(),
        categories: selected,
        image,
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editor.mode === "add" ? "Add photo" : "Edit photo"}</DialogTitle>
          <DialogDescription>
            {editor.mode === "add"
              ? "Upload a photo to one of the public galleries."
              : "Replace the photo, retitle it, or change its categories."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-accent/30">
                {currentSrc ? (
                  <img src={currentSrc} alt="Selected" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Images className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {currentSrc ? "Replace photo" : "Choose photo"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Compressed automatically; portrait photos look best.
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {editor.mode === "add" && (
            <div className="space-y-1.5">
              <Label>Gallery</Label>
              <div className="flex gap-2">
                {(["gallery", "student"] as const).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={collection === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCollection(c)}
                  >
                    {c === "gallery" ? "Designs" : "Student work"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="photo-title-en">Title (English)</Label>
              <Input
                id="photo-title-en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Bridal full-hand panel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo-title-zh">标题 (中文)</Label>
              <Input
                id="photo-title-zh"
                value={titleZh}
                onChange={(e) => setTitleZh(e.target.value)}
                placeholder="新娘满手图案"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  aria-pressed={selected.includes(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected.includes(c.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {c.nameEn}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pick one or more — visitors filter the gallery by these.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {editor.mode === "add" ? "Add photo" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
