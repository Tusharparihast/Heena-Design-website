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
  clearCatalogOverrides,
  emptyCatalogOverrides,
  isCatalogPristine,
  makeCategoryId,
  makeProductId,
  readCatalogOverrides,
  writeCatalogOverrides,
  type CatalogOverrides,
  type CustomCategory,
  type CustomProduct,
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
  /** Whether the base product has any overrides (shows the reset action). */
  hasEdit: boolean;
}

function AdminProductsPage() {
  const [overrides, setOverrides] = useState<CatalogOverrides>(emptyCatalogOverrides);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [catNameEn, setCatNameEn] = useState("");
  const [catNameZh, setCatNameZh] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

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
      .filter((p) => !overrides.deleted.includes(p.id))
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
          hasEdit: Boolean(edit),
        };
      });
    const customRows: Row[] = overrides.added.map((c) => ({
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
      hasEdit: false,
    }));
    return [...baseRows, ...customRows];
  }, [overrides]);

  /** Category options for the editor dialog: built-ins + studio-created. */
  const editorCategories = useMemo(
    () => [
      ...DEFAULT_CATEGORY_IDS.map((id) => ({ value: id as string, label: en.shopPage.filters[id] })),
      ...overrides.categories.map((c) => ({ value: c.id, label: c.nameEn })),
    ],
    [overrides.categories],
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
        hasEdit: false,
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
        hasEdit: false,
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
      hasEdit: Boolean(edit),
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
      });
      const edits = { ...overrides.edits };
      if (edit) edits[editor.id] = edit;
      else delete edits[editor.id];
      commit({ ...overrides, edits }, "Product updated", "The shop now shows your changes.");
    }
    setEditor(null);
  };

  const handleResetEdit = () => {
    if (!editor || editor.kind !== "base") return;
    const edits = { ...overrides.edits };
    delete edits[editor.id];
    commit(
      { ...overrides, edits },
      "Overrides cleared",
      "This product is back to its default details.",
    );
    setEditor(null);
  };

  const resetRow = (id: string) => {
    const edits = { ...overrides.edits };
    delete edits[id];
    commit(
      { ...overrides, edits },
      "Overrides cleared",
      "This product is back to its default details.",
    );
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const custom = overrides.added.find((c) => c.id === deleteId);
    if (custom) {
      // Custom products are removed permanently.
      commit(
        {
          ...overrides,
          added: overrides.added.filter((c) => c.id !== deleteId),
          hidden: overrides.hidden.filter((id) => id !== deleteId),
        },
        "Product deleted",
        `${custom.nameEn} no longer appears in the shop.`,
      );
    } else {
      // Built-in products move to the restorable "Deleted products" list.
      const name = productNamesEn.get(deleteId) ?? deleteId;
      commit(
        {
          ...overrides,
          deleted: [...overrides.deleted, deleteId],
          hidden: overrides.hidden.filter((id) => id !== deleteId),
        },
        "Product deleted",
        `${name} was removed from the shop. You can restore it below.`,
      );
    }
    setDeleteId(null);
  };

  const restoreProduct = (id: string) => {
    const name = productNamesEn.get(id) ?? id;
    commit(
      { ...overrides, deleted: overrides.deleted.filter((x) => x !== id) },
      "Product restored",
      `${name} is back in the shop.`,
    );
  };

  /* ---------------- Categories ---------------- */

  const addCategory = () => {
    const nameEn = catNameEn.trim();
    if (!nameEn) return;
    const taken = new Set<string>([
      ...DEFAULT_CATEGORY_IDS,
      ...overrides.categories.map((c) => c.id),
    ]);
    const category: CustomCategory = {
      id: makeCategoryId(nameEn, taken),
      nameEn,
      nameZh: catNameZh.trim(),
    };
    commit(
      { ...overrides, categories: [...overrides.categories, category] },
      "Category added",
      `${nameEn} is now available when editing products.`,
    );
    setCatNameEn("");
    setCatNameZh("");
  };

  const confirmDeleteCategory = () => {
    if (!deleteCategoryId) return;
    const cat = overrides.categories.find((c) => c.id === deleteCategoryId);
    const FALLBACK = "cones";
    // Products in the deleted category move to the first built-in category.
    const edits = Object.fromEntries(
      Object.entries(overrides.edits).map(([id, e]) => [
        id,
        e.category === deleteCategoryId ? { ...e, category: FALLBACK } : e,
      ]),
    );
    const added = overrides.added.map((c) =>
      c.category === deleteCategoryId ? { ...c, category: FALLBACK } : c,
    );
    commit(
      {
        ...overrides,
        edits,
        added,
        categories: overrides.categories.filter((c) => c.id !== deleteCategoryId),
      },
      "Category deleted",
      cat ? `Its products were moved to “${en.shopPage.filters[FALLBACK]}”.` : undefined,
    );
    setDeleteCategoryId(null);
  };

  const resetAll = () => {
    clearCatalogOverrides();
    setOverrides(emptyCatalogOverrides);
    setDiscountDrafts({});
    setResetOpen(false);
    toast.success("All customizations reset", {
      description: "The shop is back to the default catalog.",
    });
  };

  const pristine = isCatalogPristine(overrides);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetOpen(true)}
            disabled={!loaded || pristine}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset all
          </Button>
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
                        {!row.custom && row.hasEdit ? (
                          <DropdownMenuItem onClick={() => resetRow(row.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset to defaults
                          </DropdownMenuItem>
                        ) : null}
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
            Categories group products in the shop filters. Add your own below — the built-in ones
            can&apos;t be removed.
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
            {DEFAULT_CATEGORY_IDS.map((id) => (
              <li
                key={id}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs"
              >
                {en.shopPage.filters[id]}
                <Badge variant="outline" className="text-[10px]">
                  Built-in
                </Badge>
              </li>
            ))}
            {overrides.categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs"
              >
                {c.nameEn}
                {c.nameZh ? <span className="text-muted-foreground">· {c.nameZh}</span> : null}
                <button
                  type="button"
                  onClick={() => setDeleteCategoryId(c.id)}
                  aria-label={`Delete category ${c.nameEn}`}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Deleted built-in products (restorable) */}
      {overrides.deleted.length > 0 ? (
        <Card className="shadow-none">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Deleted products</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Removed from the shop — restore them anytime.
            </p>
            <ul className="mt-3 space-y-2">
              {overrides.deleted.map((id) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {shopImages[id] ? (
                      <img
                        src={shopImages[id]}
                        alt=""
                        width={32}
                        height={32}
                        loading="lazy"
                        className="h-8 w-8 shrink-0 rounded-md object-cover"
                      />
                    ) : null}
                    <span className="truncate text-sm">{productNamesEn.get(id) ?? id}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => restoreProduct(id)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
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
        onResetEdit={handleResetEdit}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId && overrides.added.some((c) => c.id === deleteId)
                ? "It will be removed from the shop immediately. This cannot be undone."
                : "It will be removed from the shop immediately. You can restore it later from the Deleted products list."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete product</AlertDialogAction>
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
              Products in this category will be moved to “{en.shopPage.filters.cones}”. The category
              filter will disappear from the shop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>Delete category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all customizations?</AlertDialogTitle>
            <AlertDialogDescription>
              Every edited field, hidden product and added product will be cleared. The shop
              returns to the default catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetAll}>Reset everything</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
