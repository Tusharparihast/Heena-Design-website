import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Percent, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  ProductEditorDialog,
  type ProductEditorInitial,
  type ProductFormValues,
} from "@/components/admin/ProductEditorDialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { en, zh } from "@/i18n/dictionaries";
import {
  applyEdit,
  categoryLabel,
  cleanEdit,
  effectiveCategories,
  emptyCatalogOverrides,
  makeCategoryId,
  makeProductId,
  readCatalogOverrides,
  writeCatalogOverrides,
  type CatalogOverrides,
  type CategoryEdit,
  type CustomCategory,
  type CustomProduct,
  type EffectiveCategory,
  type ProductEdit,
} from "@/lib/catalog-overrides";
import {
  DEFAULT_CATEGORY_IDS,
  formatNpr,
  shopImages,
  shopProducts,
  type ShopCategory,
  type StockStatus,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [{ title: "Products — Nagma Designs Admin" }],
  }),
  component: AdminProductsPage,
});

const productNamesEn = new Map(en.shopPage.items.map((item) => [item.id, item.name]));
const productItemsEn = new Map(en.shopPage.items.map((item) => [item.id, item]));
const productItemsZh = new Map(zh.shopPage.items.map((item) => [item.id, item]));

type EditorTarget = { kind: "new" } | { kind: "base"; id: string } | { kind: "custom"; id: string };

interface Row {
  id: string;
  custom: boolean;
  image: string;
  name: string;
  category: ShopCategory;
  priceNpr: number;
  stock: StockStatus;
  featured: boolean;
  discount?: number | undefined;
  defaultDiscount?: number | undefined;
  hidden: boolean;
}

function AdminProductsPage() {
  const [overrides, setOverrides] = useState<CatalogOverrides>(emptyCatalogOverrides);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [purgeId, setPurgeId] = useState<string | null>(null);
  const [purgeCategoryId, setPurgeCategoryId] = useState<string | null>(null);

  const [catNameEn, setCatNameEn] = useState("");
  const [catNameZh, setCatNameZh] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [renameCategory, setRenameCategory] = useState<EffectiveCategory | null>(null);
  const [renameEn, setRenameEn] = useState("");
  const [renameZh, setRenameZh] = useState("");

  // Load saved overrides once on mount (localStorage is client-only).
  useEffect(() => {
    setOverrides(readCatalogOverrides());
    setLoaded(true);
  }, []);

  const commit = (next: CatalogOverrides, msg?: string, desc?: string) => {
    writeCatalogOverrides(next);
    setOverrides(next);
    if (msg) toast.success(msg, desc ? { description: desc } : undefined);
  };

  /* ---------------- Rows ---------------- */

  const rows = useMemo<Row[]>(() => {
    const baseRows: Row[] = shopProducts
      .filter((p) => !overrides.deleted.includes(p.id) && !overrides.purged.includes(p.id))
      .map((p) => {
        const edit = overrides.edits[p.id];
        const eff = applyEdit(p, edit);
        return {
          id: p.id,
          custom: false,
          image: eff.image,
          name: edit?.nameEn ?? productNamesEn.get(p.id) ?? p.id,
          category: eff.category,
          priceNpr: eff.priceNpr,
          stock: eff.stock,
          featured: Boolean(eff.featured),
          discount: eff.discount,
          defaultDiscount: p.discount,
          hidden: overrides.hidden.includes(p.id),
        };
      });
    const customRows: Row[] = overrides.added
      .filter((c) => !overrides.deleted.includes(c.id))
      .map((c) => ({
        id: c.id,
        custom: true,
        image: c.image,
        name: c.nameEn,
        category: c.category,
        priceNpr: c.priceNpr,
        stock: c.stock,
        featured: c.featured,
        discount: c.discount,
        defaultDiscount: undefined,
        hidden: overrides.hidden.includes(c.id),
      }));
    return [...baseRows, ...customRows];
  }, [overrides]);

  /** Category options for the editor dialog: built-ins (renamed, minus deleted) + studio-created. */
  const editorCategories = useMemo(
    () =>
      effectiveCategories(overrides, en.shopPage.filters).map((c) => ({
        value: c.id,
        label: c.nameEn,
      })),
    [overrides],
  );

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.category.includes(q));
  }, [rows, query]);

  /* ---------------- Inline commits ---------------- */

  const patchEdit = (id: string, patch: ProductEdit) => {
    const merged = cleanEdit({ ...(overrides.edits[id] ?? {}), ...patch });
    const edits = { ...overrides.edits };
    if (merged) edits[id] = merged;
    else delete edits[id];
    commit({ ...overrides, edits });
  };

  const patchCustom = (id: string, patch: Partial<CustomProduct>) => {
    commit({
      ...overrides,
      added: overrides.added.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const setStock = (row: Row, stock: StockStatus) =>
    row.custom ? patchCustom(row.id, { stock }) : patchEdit(row.id, { stock });

  const setFeatured = (row: Row, featured: boolean) =>
    row.custom ? patchCustom(row.id, { featured }) : patchEdit(row.id, { featured });

  const setVisible = (row: Row, visible: boolean) => {
    const hidden = visible
      ? overrides.hidden.filter((id) => id !== row.id)
      : [...overrides.hidden, row.id];
    commit({ ...overrides, hidden });
  };

  const commitDiscount = (row: Row) => {
    const raw = (discountDrafts[row.id] ?? "").trim();
    const pct = raw ? Number.parseInt(raw, 10) : undefined;
    const valid = pct !== undefined && pct >= 1 && pct <= 99;

    // Clear the draft so the input falls back to the effective value.
    setDiscountDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });

    if (raw && !valid) {
      toast.error("Discount must be between 1 and 99%.");
      return;
    }
    if (row.custom) {
      const current = overrides.added.find((c) => c.id === row.id);
      if (!current || current.discount === (valid ? pct : undefined)) return;
      patchCustom(row.id, { discount: valid ? pct : undefined });
      return;
    }
    if (!valid) {
      if (row.discount === undefined) return; // nothing to clear
      patchEdit(row.id, { discount: null });
    } else if (row.discount !== pct) {
      patchEdit(row.id, { discount: pct });
    }
  };

  /* ---------------- Editor dialog ---------------- */

  const editorInitial = useMemo<ProductEditorInitial | null>(() => {
    if (!editor) return null;
    if (editor.kind === "new") {
      return {
        id: null,
        isCustom: true,
        image: "",
        nameEn: "",
        nameZh: "",
        bodyEn: "",
        bodyZh: "",
        priceNpr: 0,
        category: "cones",
        stock: "in",
        featured: false,
        featuresEn: [],
        featuresZh: [],
        usageEn: [],
        usageZh: [],
      };
    }
    if (editor.kind === "custom") {
      const c = overrides.added.find((x) => x.id === editor.id);
      if (!c) return null;
      return {
        id: c.id,
        isCustom: true,
        image: c.image,
        nameEn: c.nameEn,
        nameZh: c.nameZh,
        bodyEn: c.bodyEn,
        bodyZh: c.bodyZh,
        priceNpr: c.priceNpr,
        category: c.category,
        stock: c.stock,
        discount: c.discount,
        featured: c.featured,
        featuresEn: c.featuresEn,
        featuresZh: c.featuresZh,
        usageEn: c.usageEn,
        usageZh: c.usageZh,
      };
    }
    const base = shopProducts.find((p) => p.id === editor.id);
    if (!base) return null;
    const edit = overrides.edits[base.id];
    return {
      id: base.id,
      isCustom: false,
      image: edit?.image ?? base.image,
      defaultImage: base.image,
      nameEn: edit?.nameEn ?? productItemsEn.get(base.id)?.name ?? "",
      nameZh: edit?.nameZh ?? productItemsZh.get(base.id)?.name ?? "",
      bodyEn: edit?.bodyEn ?? productItemsEn.get(base.id)?.body ?? "",
      bodyZh: edit?.bodyZh ?? productItemsZh.get(base.id)?.body ?? "",
      priceNpr: edit?.priceNpr ?? base.priceNpr,
      category: edit?.category ?? base.category,
      stock: edit?.stock ?? base.stock,
      discount:
        edit === undefined
          ? base.discount
          : edit.discount === null
            ? undefined
            : (edit.discount ?? base.discount),
      featured: edit?.featured ?? Boolean(base.featured),
      featuresEn: edit?.featuresEn ?? productItemsEn.get(base.id)?.features ?? [],
      featuresZh: edit?.featuresZh ?? productItemsZh.get(base.id)?.features ?? [],
      usageEn: edit?.usageEn ?? productItemsEn.get(base.id)?.usage ?? [],
      usageZh: edit?.usageZh ?? productItemsZh.get(base.id)?.usage ?? [],
    };
  }, [editor, overrides]);

  const handleSave = (values: ProductFormValues) => {
    if (!editor) return;
    if (editor.kind === "new") {
      const taken = new Set([
        ...shopProducts.map((p) => p.id),
        ...overrides.added.map((c) => c.id),
      ]);
      const custom: CustomProduct = {
        id: makeProductId(values.nameEn, taken),
        image: values.image ?? "",
        category: values.category,
        priceNpr: values.priceNpr,
        stock: values.stock,
        featured: values.featured,
        ...(values.discount !== undefined ? { discount: values.discount } : {}),
        nameEn: values.nameEn,
        nameZh: values.nameZh,
        bodyEn: values.bodyEn,
        bodyZh: values.bodyZh,
        featuresEn: values.featuresEn,
        featuresZh: values.featuresZh,
        usageEn: values.usageEn,
        usageZh: values.usageZh,
      };
      commit(
        { ...overrides, added: [...overrides.added, custom] },
        "Product added",
        `${values.nameEn} is now live in the shop.`,
      );
    } else if (editor.kind === "custom") {
      commit(
        {
          ...overrides,
          added: overrides.added.map((c) =>
            c.id === editor.id
              ? {
                  ...c,
                  nameEn: values.nameEn,
                  nameZh: values.nameZh,
                  bodyEn: values.bodyEn,
                  bodyZh: values.bodyZh,
                  priceNpr: values.priceNpr,
                  category: values.category,
                  stock: values.stock,
                  featured: values.featured,
                  discount: values.discount,
                  image: values.image ?? c.image,
                  featuresEn: values.featuresEn,
                  featuresZh: values.featuresZh,
                  usageEn: values.usageEn,
                  usageZh: values.usageZh,
                }
              : c,
          ),
        },
        "Product updated",
        "The shop now shows your changes.",
      );
    } else {
      const edit = cleanEdit({
        nameEn: values.nameEn,
        nameZh: values.nameZh,
        bodyEn: values.bodyEn,
        bodyZh: values.bodyZh,
        priceNpr: values.priceNpr,
        stock: values.stock,
        category: values.category,
        featured: values.featured,
        discount: values.discount ?? null,
        image: values.image,
        featuresEn: values.featuresEn,
        featuresZh: values.featuresZh,
        usageEn: values.usageEn,
        usageZh: values.usageZh,
      });
      const edits = { ...overrides.edits };
      if (edit) edits[editor.id] = edit;
      else delete edits[editor.id];
      commit({ ...overrides, edits }, "Product updated", "The shop now shows your changes.");
    }
    setEditor(null);
  };


  /** Product display name for toasts/dialogs — works for built-in and custom. */
  const productName = (id: string) =>
    overrides.added.find((c) => c.id === id)?.nameEn ?? productNamesEn.get(id) ?? id;

  const confirmDelete = () => {
    if (!deleteId) return;
    const name = productName(deleteId);
    // Built-in and custom products alike move to the trash (restorable).
    commit(
      {
        ...overrides,
        deleted: [...overrides.deleted, deleteId],
        hidden: overrides.hidden.filter((id) => id !== deleteId),
      },
      "Product moved to trash",
      `${name} was removed from the shop. Restore it — or delete it permanently — from the trash below.`,
    );
    setDeleteId(null);
  };

  const restoreProduct = (id: string) => {
    const name = productName(id);
    commit(
      { ...overrides, deleted: overrides.deleted.filter((x) => x !== id) },
      "Product restored",
      `${name} is back in the shop.`,
    );
  };

  const confirmPurgeProduct = () => {
    if (!purgeId) return;
    const name = productName(purgeId);
    const isCustom = overrides.added.some((c) => c.id === purgeId);
    const edits = { ...overrides.edits };
    delete edits[purgeId];
    commit(
      {
        ...overrides,
        // Custom products are dropped entirely; built-ins are remembered as purged
        // so they never reappear.
        added: overrides.added.filter((c) => c.id !== purgeId),
        edits,
        deleted: overrides.deleted.filter((x) => x !== purgeId),
        purged: isCustom ? overrides.purged : [...overrides.purged, purgeId],
      },
      "Product permanently deleted",
      `${name} is gone for good.`,
    );
    setPurgeId(null);
  };

  /* ---------------- Categories ---------------- */

  /** Creates a custom category and returns its id (used by the card below and the editor dialog). */
  const createCategory = (nameEnRaw: string, nameZhRaw: string): string | null => {
    const nameEn = nameEnRaw.trim();
    if (!nameEn) return null;
    const taken = new Set<string>([
      ...DEFAULT_CATEGORY_IDS,
      ...overrides.categories.map((c) => c.id),
    ]);
    const category: CustomCategory = {
      id: makeCategoryId(nameEn, taken),
      nameEn,
      nameZh: nameZhRaw.trim(),
    };
    commit(
      { ...overrides, categories: [...overrides.categories, category] },
      "Category added",
      `${nameEn} is now available when editing products.`,
    );
    return category.id;
  };

  const addCategory = () => {
    if (createCategory(catNameEn, catNameZh)) {
      setCatNameEn("");
      setCatNameZh("");
    }
  };

  const confirmDeleteCategory = () => {
    if (!deleteCategoryId) return;
    const remaining = effectiveCategories(overrides, en.shopPage.filters).filter(
      (c) => c.id !== deleteCategoryId,
    );
    if (remaining.length === 0) {
      toast.error("You can't delete the last category.");
      setDeleteCategoryId(null);
      return;
    }
    // Every live product in this category goes to the trash together with it
    // (products already individually trashed stay as they are) and is
    // remembered so restoring the category brings its products back.
    const movedIds: string[] = [];
    for (const p of shopProducts) {
      if (overrides.deleted.includes(p.id) || overrides.purged.includes(p.id)) continue;
      const effCategory = overrides.edits[p.id]?.category ?? p.category;
      if (effCategory === deleteCategoryId) movedIds.push(p.id);
    }
    for (const c of overrides.added) {
      if (c.category !== deleteCategoryId || overrides.deleted.includes(c.id)) continue;
      movedIds.push(c.id);
    }
    // The category itself (built-in or custom) goes to the trash — its data and
    // any rename stay intact so it can be restored exactly as it was.
    commit(
      {
        ...overrides,
        deleted: [...overrides.deleted, ...movedIds],
        deletedCategories: [...overrides.deletedCategories, deleteCategoryId],
        trashCategoryProducts:
          movedIds.length > 0
            ? { ...overrides.trashCategoryProducts, [deleteCategoryId]: movedIds }
            : overrides.trashCategoryProducts,
      },
      "Category moved to trash",
      movedIds.length > 0
        ? `Its ${movedIds.length} product${movedIds.length === 1 ? "" : "s"} went with it — restoring brings everything back.`
        : "Restore it — or delete it permanently — from the trash below.",
    );
    setDeleteCategoryId(null);
  };

  const restoreCategory = (id: string) => {
    const name = categoryLabel(id, overrides, "en", en.shopPage.filters);
    const movedSet = new Set(overrides.trashCategoryProducts[id] ?? []);
    const trashCategoryProducts = { ...overrides.trashCategoryProducts };
    delete trashCategoryProducts[id];
    commit(
      {
        ...overrides,
        // Products trashed together with the category come back with it.
        deleted: overrides.deleted.filter((pid) => !movedSet.has(pid)),
        deletedCategories: overrides.deletedCategories.filter((c) => c !== id),
        trashCategoryProducts,
      },
      "Category restored",
      movedSet.size > 0 ? `${name} is back, along with its products.` : `${name} is back.`,
    );
  };

  const confirmPurgeCategory = () => {
    if (!purgeCategoryId) return;
    const id = purgeCategoryId;
    const name = categoryLabel(id, overrides, "en", en.shopPage.filters);
    const isBuiltin = (DEFAULT_CATEGORY_IDS as readonly string[]).includes(id);
    const categoryEdits = { ...overrides.categoryEdits };
    delete categoryEdits[id];
    const trashCategoryProducts = { ...overrides.trashCategoryProducts };
    // Products trashed together with the category are permanently deleted too:
    // custom products are dropped entirely; built-ins are remembered as purged
    // so they never reappear. Only products actually in the trash are touched.
    const productIds = (trashCategoryProducts[id] ?? []).filter((pid) =>
      overrides.deleted.includes(pid),
    );
    delete trashCategoryProducts[id];
    const builtinIds = new Set(shopProducts.map((p) => p.id));
    commit(
      {
        ...overrides,
        categories: overrides.categories.filter((c) => c.id !== id),
        categoryEdits,
        added: overrides.added.filter((c) => !productIds.includes(c.id)),
        deleted: overrides.deleted.filter((pid) => !productIds.includes(pid)),
        purged: [...overrides.purged, ...productIds.filter((pid) => builtinIds.has(pid))],
        deletedCategories: overrides.deletedCategories.filter((c) => c !== id),
        purgedCategories: isBuiltin
          ? [...overrides.purgedCategories, id]
          : overrides.purgedCategories,
        trashCategoryProducts,
      },
      "Category permanently deleted",
      productIds.length > 0
        ? `${name} and its ${productIds.length} product${productIds.length === 1 ? "" : "s"} are gone for good.`
        : `${name} is gone for good.`,
    );
    setPurgeCategoryId(null);
  };

  const saveRenameCategory = () => {
    if (!renameCategory) return;
    const nameEn = renameEn.trim();
    if (!nameEn) return;
    const nameZh = renameZh.trim();
    if (renameCategory.builtin) {
      const edit: CategoryEdit = { nameEn, ...(nameZh ? { nameZh } : {}) };
      commit(
        { ...overrides, categoryEdits: { ...overrides.categoryEdits, [renameCategory.id]: edit } },
        "Category renamed",
      );
    } else {
      commit(
        {
          ...overrides,
          categories: overrides.categories.map((c) =>
            c.id === renameCategory.id ? { ...c, nameEn, nameZh } : c,
          ),
        },
        "Category renamed",
      );
    }
    setRenameCategory(null);
  };

  /** How many live products the category pending deletion takes to the trash with it. */
  const deleteCategoryProductCount = deleteCategoryId
    ? rows.filter((r) => r.category === deleteCategoryId).length
    : 0;

  /* ---------------- Trash ---------------- */

  /** Trashed products (built-in and custom) awaiting restore or permanent deletion.
   *  Products trashed together with a category are managed via the category row. */
  const trashProducts = useMemo(() => {
    const withCategory = new Set(Object.values(overrides.trashCategoryProducts).flat());
    return overrides.deleted
      .filter((id) => !withCategory.has(id))
      .map((id) => {
        const custom = overrides.added.find((c) => c.id === id);
        return {
          id,
          name: custom?.nameEn ?? productNamesEn.get(id) ?? id,
          image: custom?.image ?? shopImages[id],
        };
      });
  }, [overrides]);

  /** Trashed categories (built-in and custom) awaiting restore or permanent deletion. */
  const trashCategories = useMemo(
    () =>
      overrides.deletedCategories.map((id) => ({
        id,
        name: categoryLabel(id, overrides, "en", en.shopPage.filters),
        movedCount: (overrides.trashCategoryProducts[id] ?? []).length,
      })),
    [overrides],
  );


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Products</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Edit names, prices, stock, photos and discounts — or add new products. Changes save
            automatically and update the shop instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setEditor({ kind: "new" })} disabled={!loaded}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add product
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="pl-9"
        />
      </div>

      <Card className="shadow-none">
        <CardContent className="overflow-x-auto p-0 pb-2">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Discount %</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.id} className={cn(row.hidden && "opacity-50")}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.image}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-medium">
                          {row.name}
                          {row.custom ? (
                            <Badge variant="outline" className="text-[10px]">
                              Custom
                            </Badge>
                          ) : null}
                          {row.hidden ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Hidden
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabel(row.category, overrides, "en", en.shopPage.filters)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span>{formatNpr(row.priceNpr)}</span>
                    {row.discount ? (
                      <p className="text-xs font-medium text-primary">
                        → {formatNpr(Math.round((row.priceNpr * (100 - row.discount)) / 100))}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.stock}
                      onValueChange={(v) => setStock(row, v as StockStatus)}
                      disabled={!loaded}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Stock status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">In stock</SelectItem>
                        <SelectItem value="low">Only a few left</SelectItem>
                        <SelectItem value="out">Out of stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Discount percentage for ${row.name}`}
                        placeholder="—"
                        value={discountDrafts[row.id] ?? (row.discount ? String(row.discount) : "")}
                        onChange={(e) =>
                          setDiscountDrafts((prev) => ({
                            ...prev,
                            [row.id]: e.target.value.replace(/[^0-9]/g, "").slice(0, 2),
                          }))
                        }
                        onBlur={() => commitDiscount(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                        disabled={!loaded}
                        className="h-8 w-16 text-center"
                      />
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      {row.defaultDiscount !== undefined ? (
                        <span className="text-[11px] whitespace-nowrap text-muted-foreground">
                          default {row.defaultDiscount}%
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.featured}
                      onCheckedChange={(v) => setFeatured(row, v)}
                      disabled={!loaded}
                      aria-label={`Featured badge for ${row.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!row.hidden}
                      onCheckedChange={(v) => setVisible(row, v)}
                      disabled={!loaded}
                      aria-label={`Shop visibility for ${row.name}`}
                    />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${row.name}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditor(row.custom ? { kind: "custom", id: row.id } : { kind: "base", id: row.id })}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No products match “{query}”.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-none">
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Categories</h3>
          <p className="mt-1 max-w-lg text-xs text-muted-foreground">
            Categories group products in the shop filters. Rename or remove any of them, or add
            your own below.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              value={catNameEn}
              onChange={(e) => setCatNameEn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCategory();
              }}
              placeholder="Category name (English)"
              aria-label="New category name in English"
              maxLength={40}
              className="h-9 w-56"
            />
            <Input
              value={catNameZh}
              onChange={(e) => setCatNameZh(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCategory();
              }}
              placeholder="类别名称（中文，可选）"
              aria-label="New category name in Chinese (optional)"
              maxLength={40}
              className="h-9 w-56"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addCategory}
              disabled={!loaded || !catNameEn.trim()}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add category
            </Button>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {effectiveCategories(overrides, en.shopPage.filters).map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs"
              >
                {c.nameEn}
                {c.nameZh ? <span className="text-muted-foreground">· {c.nameZh}</span> : null}
                <button
                  type="button"
                  onClick={() => {
                    setRenameCategory(c);
                    setRenameEn(c.nameEn);
                    setRenameZh(c.nameZh);
                  }}
                  aria-label={`Rename category ${c.nameEn}`}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCategoryId(c.id)}
                  aria-label={`Delete category ${c.nameEn}`}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Trash: deleted products & categories — restore or delete permanently */}
      {trashProducts.length > 0 || trashCategories.length > 0 ? (
        <Card className="shadow-none">
          <CardContent className="p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              Trash
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Deleted products and categories stay here until you restore them or delete them
              permanently.
            </p>

            {trashCategories.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Categories
                </h4>
                <ul className="mt-2 space-y-2">
                  {trashCategories.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{c.name}</span>
                        {c.movedCount > 0 ? (
                          <span className="block text-xs text-muted-foreground">
                            {c.movedCount} product{c.movedCount === 1 ? "" : "s"} deleted with it —
                            restored together
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => restoreCategory(c.id)}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setPurgeCategoryId(c.id)}
                          aria-label={`Delete category ${c.name} permanently`}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete permanently
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {trashProducts.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Products
                </h4>
                <ul className="mt-2 space-y-2">
                  {trashProducts.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            width={32}
                            height={32}
                            loading="lazy"
                            className="h-8 w-8 shrink-0 rounded-md object-cover"
                          />
                        ) : null}
                        <span className="truncate text-sm">{p.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => restoreProduct(p.id)}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setPurgeId(p.id)}
                          aria-label={`Delete product ${p.name} permanently`}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete permanently
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Product changes are saved in this browser for now — they'll move to the database with the
        backend phase so every visitor sees them.
      </p>

      <ProductEditorDialog
        open={editor !== null}
        initial={editorInitial}
        categories={editorCategories}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSave={handleSave}
        onAddCategory={createCategory}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the shop and kept in the trash — you can restore it or
              delete it permanently from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Move to trash</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeId !== null} onOpenChange={(open) => !open && setPurgeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — the product will never appear in the shop again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurgeProduct}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategoryProductCount > 0
                ? `This category and its ${deleteCategoryProductCount} product${deleteCategoryProductCount === 1 ? "" : "s"} will be moved to the trash together — restore the category anytime to bring everything back, or delete it permanently from the trash.`
                : "The category will be kept in the trash — restore it anytime or delete it permanently from there."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>Move to trash</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={purgeCategoryId !== null}
        onOpenChange={(open) => !open && setPurgeCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — the category and every product trashed with it will never
              appear in the shop again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurgeCategory}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={renameCategory !== null}
        onOpenChange={(open) => !open && setRenameCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
            <DialogDescription>
              The new name shows everywhere — shop filters, product pages and the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={renameEn}
              onChange={(e) => setRenameEn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRenameCategory();
              }}
              placeholder="Category name (English)"
              aria-label="Category name in English"
              maxLength={40}
            />
            <Input
              value={renameZh}
              onChange={(e) => setRenameZh(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRenameCategory();
              }}
              placeholder="类别名称（中文，可选）"
              aria-label="Category name in Chinese (optional)"
              maxLength={40}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameCategory(null)}>
              Cancel
            </Button>
            <Button onClick={saveRenameCategory} disabled={!renameEn.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
