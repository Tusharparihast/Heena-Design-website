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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  insertCategory,
  insertProduct,
  purgeCategory,
  purgeProduct,
  renameCategory as renameCategoryFn,
  seedCatalogIfEmpty,
  setCategoryTrashed,
  setProductTrashed,
  updateProduct,
  useAdminCatalog,
  type DbCategory,
  type StockStatus,
} from "@/lib/shop-catalog-db";
import { DEFAULT_CATEGORY_IDS, formatNpr } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [{ title: "Products — Nagma Designs Admin" }],
  }),
  component: AdminProductsPage,
});

type EditorTarget = { kind: "new" } | { kind: "edit"; id: string };

interface Row {
  id: string;
  image: string;
  name: string;
  category: string;
  priceNpr: number;
  stock: StockStatus;
  featured: boolean;
  discount?: number | undefined;
  hidden: boolean;
}

/** Generates a URL-safe, unique id from a name (used for new products/categories). */
function slugify(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item";
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function AdminProductsPage() {
  const { products, categories, loading, refresh } = useAdminCatalog();
  const loaded = !loading;

  // Seeds the DB from the old hardcoded catalog the very first time — no-ops afterwards.
  useEffect(() => {
    void seedCatalogIfEmpty().then(() => {
      void refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery] = useState("");
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [purgeId, setPurgeId] = useState<string | null>(null);
  const [purgeCategoryId, setPurgeCategoryId] = useState<string | null>(null);

  const [catNameEn, setCatNameEn] = useState("");
  const [catNameZh, setCatNameZh] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [renameCategory, setRenameCategory] = useState<DbCategory | null>(null);
  const [renameEn, setRenameEn] = useState("");
  const [renameZh, setRenameZh] = useState("");

  /* ---------------- Rows ---------------- */

  const rows = useMemo<Row[]>(
    () =>
      products
        .filter((p) => !p.deleted)
        .map((p) => ({
          id: p.id,
          image: p.image,
          name: p.nameEn,
          category: p.category,
          priceNpr: p.priceNpr,
          stock: p.stock,
          featured: p.featured,
          discount: p.discountPct ?? undefined,
          hidden: !p.visible,
        })),
    [products],
  );

  const liveCategories = useMemo(() => categories.filter((c) => !c.deleted), [categories]);

  /** Category options for the editor dialog. */
  const editorCategories = useMemo(
    () => liveCategories.map((c) => ({ value: c.id, label: c.nameEn })),
    [liveCategories],
  );

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.nameEn ?? id;

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.category.includes(q));
  }, [rows, query]);

  /* ---------------- Inline commits ---------------- */

  const setStock = async (row: Row, stock: StockStatus) => {
    await updateProduct(row.id, { stock });
    await refresh();
  };

  const setFeatured = async (row: Row, featured: boolean) => {
    await updateProduct(row.id, { featured });
    await refresh();
  };

  const setVisible = async (row: Row, visible: boolean) => {
    await updateProduct(row.id, { visible });
    await refresh();
  };

  const commitDiscount = async (row: Row) => {
    const raw = (discountDrafts[row.id] ?? "").trim();
    const pct = raw ? Number.parseInt(raw, 10) : undefined;
    const valid = pct !== undefined && pct >= 1 && pct <= 99;

    setDiscountDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });

    if (raw && !valid) {
      toast.error("Discount must be between 1 and 99%.");
      return;
    }
    const nextDiscount = valid ? (pct as number) : null;
    if ((row.discount ?? null) === nextDiscount) return;
    await updateProduct(row.id, { discountPct: nextDiscount });
    await refresh();
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
        category: liveCategories[0]?.id ?? "cones",
        stock: "in",
        featured: false,
        featuresEn: [],
        featuresZh: [],
        usageEn: [],
        usageZh: [],
      };
    }
    const p = products.find((x) => x.id === editor.id);
    if (!p) return null;
    return {
      id: p.id,
      isCustom: true,
      image: p.image,
      nameEn: p.nameEn,
      nameZh: p.nameZh,
      bodyEn: p.bodyEn,
      bodyZh: p.bodyZh,
      priceNpr: p.priceNpr,
      category: p.category,
      stock: p.stock,
      discount: p.discountPct ?? undefined,
      featured: p.featured,
      featuresEn: p.featuresEn,
      featuresZh: p.featuresZh,
      usageEn: p.usageEn,
      usageZh: p.usageZh,
    };
  }, [editor, products, liveCategories]);

  const handleSave = async (values: ProductFormValues) => {
    if (!editor) return;
    if (editor.kind === "new") {
      const taken = new Set(products.map((p) => p.id));
      const id = slugify(values.nameEn, taken);
      const ok = await insertProduct({
        id,
        image: values.image ?? "",
        category: values.category,
        priceNpr: values.priceNpr,
        stock: values.stock,
        featured: values.featured,
        discountPct: values.discount ?? null,
        nameEn: values.nameEn,
        nameZh: values.nameZh,
        bodyEn: values.bodyEn,
        bodyZh: values.bodyZh,
        featuresEn: values.featuresEn,
        featuresZh: values.featuresZh,
        usageEn: values.usageEn,
        usageZh: values.usageZh,
      });
      if (!ok) {
        toast.error("Couldn't add the product.");
        return;
      }
      await refresh();
      toast.success("Product added", { description: `${values.nameEn} is now live in the shop.` });
    } else {
      const ok = await updateProduct(editor.id, {
        nameEn: values.nameEn,
        nameZh: values.nameZh,
        bodyEn: values.bodyEn,
        bodyZh: values.bodyZh,
        priceNpr: values.priceNpr,
        category: values.category,
        stock: values.stock,
        featured: values.featured,
        discountPct: values.discount ?? null,
        ...(values.image ? { image: values.image } : {}),
        featuresEn: values.featuresEn,
        featuresZh: values.featuresZh,
        usageEn: values.usageEn,
        usageZh: values.usageZh,
      });
      if (!ok) {
        toast.error("Couldn't update the product.");
        return;
      }
      await refresh();
      toast.success("Product updated", { description: "The shop now shows your changes." });
    }
    setEditor(null);
  };

  const productName = (id: string) => products.find((p) => p.id === id)?.nameEn ?? id;

  const confirmDelete = async () => {
    if (!deleteId) return;
    const name = productName(deleteId);
    await setProductTrashed(deleteId, true);
    await refresh();
    toast.success("Product moved to trash", {
      description: `${name} was removed from the shop. Restore it — or delete it permanently — from the trash below.`,
    });
    setDeleteId(null);
  };

  const restoreProduct = async (id: string) => {
    const name = productName(id);
    await setProductTrashed(id, false);
    await refresh();
    toast.success("Product restored", { description: `${name} is back in the shop.` });
  };

  const confirmPurgeProduct = async () => {
    if (!purgeId) return;
    const name = productName(purgeId);
    await purgeProduct(purgeId);
    await refresh();
    toast.success("Product permanently deleted", { description: `${name} is gone for good.` });
    setPurgeId(null);
  };

  /* ---------------- Categories ---------------- */

  const createCategory = async (nameEnRaw: string, nameZhRaw: string): Promise<string | null> => {
    const nameEn = nameEnRaw.trim();
    if (!nameEn) return null;
    const taken = new Set<string>([...DEFAULT_CATEGORY_IDS, ...categories.map((c) => c.id)]);
    const id = slugify(nameEn, taken);
    const ok = await insertCategory(id, nameEn, nameZhRaw.trim());
    if (!ok) {
      toast.error("Couldn't add the category.");
      return null;
    }
    await refresh();
    toast.success("Category added", {
      description: `${nameEn} is now available when editing products.`,
    });
    return id;
  };

  const addCategory = async () => {
    if (await createCategory(catNameEn, catNameZh)) {
      setCatNameEn("");
      setCatNameZh("");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    const remaining = liveCategories.filter((c) => c.id !== deleteCategoryId);
    if (remaining.length === 0) {
      toast.error("You can't delete the last category.");
      setDeleteCategoryId(null);
      return;
    }
    const liveProductIds = products.filter((p) => !p.deleted && p.category === deleteCategoryId).map((p) => p.id);
    await Promise.all(liveProductIds.map((id) => setProductTrashed(id, true)));
    await setCategoryTrashed(deleteCategoryId, true);
    await refresh();
    toast.success("Category moved to trash", {
      description:
        liveProductIds.length > 0
          ? `Its ${liveProductIds.length} product${liveProductIds.length === 1 ? "" : "s"} went with it — restore them individually from the trash below.`
          : "Restore it — or delete it permanently — from the trash below.",
    });
    setDeleteCategoryId(null);
  };

  const restoreCategory = async (id: string) => {
    const name = categoryName(id);
    await setCategoryTrashed(id, false);
    await refresh();
    toast.success("Category restored", { description: `${name} is back.` });
  };

  const confirmPurgeCategory = async () => {
    if (!purgeCategoryId) return;
    const id = purgeCategoryId;
    const name = categoryName(id);
    const trashedProductIds = products.filter((p) => p.deleted && p.category === id).map((p) => p.id);
    await Promise.all(trashedProductIds.map((pid) => purgeProduct(pid)));
    await purgeCategory(id);
    await refresh();
    toast.success("Category permanently deleted", {
      description:
        trashedProductIds.length > 0
          ? `${name} and its ${trashedProductIds.length} product${trashedProductIds.length === 1 ? "" : "s"} are gone for good.`
          : `${name} is gone for good.`,
    });
    setPurgeCategoryId(null);
  };

  const saveRenameCategory = async () => {
    if (!renameCategory) return;
    const nameEn = renameEn.trim();
    if (!nameEn) return;
    const ok = await renameCategoryFn(renameCategory.id, nameEn, renameZh.trim());
    if (!ok) {
      toast.error("Couldn't rename the category.");
      return;
    }
    await refresh();
    toast.success("Category renamed");
    setRenameCategory(null);
  };

  /** How many live products the category pending deletion takes to the trash with it. */
  const deleteCategoryProductCount = deleteCategoryId ? rows.filter((r) => r.category === deleteCategoryId).length : 0;

  /* ---------------- Trash ---------------- */

  const trashProducts = useMemo(
    () => products.filter((p) => p.deleted).map((p) => ({ id: p.id, name: p.nameEn, image: p.image })),
    [products],
  );

  const trashCategories = useMemo(
    () => categories.filter((c) => c.deleted).map((c) => ({ id: c.id, name: c.nameEn })),
    [categories],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Products</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Edit names, prices, stock, photos and discounts — or add new products. Changes save to the database and
            update the shop for every visitor.
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
                          {row.hidden ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Hidden
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">{categoryName(row.category)}</p>
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
                    <Select value={row.stock} onValueChange={(v) => setStock(row, v as StockStatus)} disabled={!loaded}>
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
                        <DropdownMenuItem onClick={() => setEditor({ kind: "edit", id: row.id })}>
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
                    No products match "{query}".
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
            Categories group products in the shop filters. Rename or remove any of them, or add your own below.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              value={catNameEn}
              onChange={(e) => setCatNameEn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addCategory();
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
                if (e.key === "Enter") void addCategory();
              }}
              placeholder="类别名称（中文，可选）"
              aria-label="New category name in Chinese (optional)"
              maxLength={40}
              className="h-9 w-56"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => void addCategory()}
              disabled={!loaded || !catNameEn.trim()}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add category
            </Button>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {liveCategories.map((c) => (
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
              Deleted products and categories stay here until you restore them or delete them permanently.
            </p>

            {trashCategories.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Categories</h4>
                <ul className="mt-2 space-y-2">
                  {trashCategories.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-sm">{c.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => void restoreCategory(c.id)}>
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
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Products</h4>
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
                        <Button variant="outline" size="sm" onClick={() => void restoreProduct(p.id)}>
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

      <ProductEditorDialog
        open={editor !== null}
        initial={editorInitial}
        categories={editorCategories}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSave={(values) => void handleSave(values)}
        onAddCategory={createCategory}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the shop and kept in the trash — you can restore it or delete it permanently from
              there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Move to trash</AlertDialogAction>
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
            <AlertDialogAction onClick={() => void confirmPurgeProduct()}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCategoryId !== null} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategoryProductCount > 0
                ? `This category and its ${deleteCategoryProductCount} product${deleteCategoryProductCount === 1 ? "" : "s"} will be moved to the trash together — restore each from the trash below anytime.`
                : "The category will be kept in the trash — restore it anytime or delete it permanently from there."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteCategory()}>Move to trash</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeCategoryId !== null} onOpenChange={(open) => !open && setPurgeCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — the category and any of its products still in the trash will never appear in the
              shop again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmPurgeCategory()}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameCategory !== null} onOpenChange={(open) => !open && setRenameCategory(null)}>
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
                if (e.key === "Enter") void saveRenameCategory();
              }}
              placeholder="Category name (English)"
              aria-label="Category name in English"
              maxLength={40}
            />
            <Input
              value={renameZh}
              onChange={(e) => setRenameZh(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveRenameCategory();
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
            <Button onClick={() => void saveRenameCategory()} disabled={!renameEn.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
