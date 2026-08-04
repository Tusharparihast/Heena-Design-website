import { useRef, useState } from "react";
import { ImagePlus, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import type { ShopCategory, StockStatus } from "@/lib/shop";

/** Values the editor produces on save. `image` is only set when the photo changed. */
export interface ProductFormValues {
  nameEn: string;
  nameZh: string;
  bodyEn: string;
  bodyZh: string;
  priceNpr: number;
  category: ShopCategory;
  stock: StockStatus;
  discount?: number | undefined;
  featured: boolean;
  image?: string | undefined;
}

/** Current values used to prefill the form. */
export interface ProductEditorInitial {
  /** null = creating a new product. */
  id: string | null;
  isCustom: boolean;
  image: string;
  /** Original bundled photo (built-in products only) for "restore photo". */
  defaultImage?: string | undefined;
  nameEn: string;
  nameZh: string;
  bodyEn: string;
  bodyZh: string;
  priceNpr: number;
  category: ShopCategory;
  stock: StockStatus;
  discount?: number | undefined;
  featured: boolean;
  /** Whether a built-in product already has overrides (shows the reset button). */
  hasEdit: boolean;
}

const categories: { value: ShopCategory; label: string }[] = [
  { value: "cones", label: "Fresh cones" },
  { value: "kits", label: "Kits" },
  { value: "care", label: "Aftercare" },
  { value: "practice", label: "Practice tools" },
];

const stockOptions: { value: StockStatus; label: string }[] = [
  { value: "in", label: "In stock" },
  { value: "low", label: "Only a few left" },
  { value: "out", label: "Out of stock" },
];

type FormErrors = { name?: string; price?: string; discount?: string; image?: string };

/** Read an image file and downscale it so localStorage stays small. */
async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load the image."));
    el.src = raw;
  });
  const max = 720;
  const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function ProductEditorDialog({
  open,
  initial,
  onOpenChange,
  onSave,
  onResetEdit,
}: {
  open: boolean;
  initial: ProductEditorInitial | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ProductFormValues) => void;
  /** Clear all overrides for a built-in product. */
  onResetEdit?: (() => void) | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {initial ? (
          <ProductEditorForm
            key={initial.id ?? "new"}
            initial={initial}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
            onResetEdit={onResetEdit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProductEditorForm({
  initial,
  onCancel,
  onSave,
  onResetEdit,
}: {
  initial: ProductEditorInitial;
  onCancel: () => void;
  onSave: (values: ProductFormValues) => void;
  onResetEdit?: (() => void) | undefined;
}) {
  const isNew = initial.id === null;
  const fileInput = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState(initial.image);
  const [imageChanged, setImageChanged] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [nameEn, setNameEn] = useState(initial.nameEn);
  const [nameZh, setNameZh] = useState(initial.nameZh);
  const [bodyEn, setBodyEn] = useState(initial.bodyEn);
  const [bodyZh, setBodyZh] = useState(initial.bodyZh);
  const [price, setPrice] = useState(String(initial.priceNpr || ""));
  const [category, setCategory] = useState<ShopCategory>(initial.category);
  const [stock, setStock] = useState<StockStatus>(initial.stock);
  const [discount, setDiscount] = useState(initial.discount ? String(initial.discount) : "");
  const [featured, setFeatured] = useState(initial.featured);
  const [errors, setErrors] = useState<FormErrors>({});

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please choose an image file." }));
      return;
    }
    setImageLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setImage(dataUrl);
      setImageChanged(true);
      setErrors((prev) => ({ ...prev, image: "" }));
    } catch {
      setErrors((prev) => ({ ...prev, image: "That image could not be used. Try another one." }));
    } finally {
      setImageLoading(false);
    }
  };

  const restoreDefaultImage = () => {
    if (!initial.defaultImage) return;
    setImage(initial.defaultImage);
    setImageChanged(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    const priceNpr = Number.parseInt(price, 10);
    const pct = discount.trim() ? Number.parseInt(discount, 10) : undefined;

    if (!nameEn.trim()) next.name = "An English name is required.";
    if (!Number.isFinite(priceNpr) || priceNpr < 1) next.price = "Enter a price of at least Rs. 1.";
    if (discount.trim() && (!Number.isFinite(pct) || pct! < 1 || pct! > 99))
      next.discount = "Discount must be between 1 and 99.";
    if (!image) next.image = isNew ? "A product photo is required." : "Please add a photo.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      nameEn: nameEn.trim(),
      nameZh: nameZh.trim(),
      bodyEn: bodyEn.trim(),
      bodyZh: bodyZh.trim(),
      priceNpr,
      category,
      stock,
      discount: pct,
      featured,
      image: imageChanged ? image : undefined,
    });
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isNew ? "Add a new product" : `Edit “${initial.nameEn}”`}
        </DialogTitle>
        <DialogDescription>
          {isNew
            ? "Fill in the details below — the product goes live in the shop as soon as you save."
            : "Changes apply to the shop instantly after saving."}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 grid gap-5 sm:grid-cols-[160px_1fr]">
        {/* Photo */}
        <div>
          <Label>Photo</Label>
          <div className="mt-1.5 aspect-square overflow-hidden rounded-xl border border-border bg-secondary/40">
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No photo
              </div>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            disabled={imageLoading}
            onClick={() => fileInput.current?.click()}
          >
            {imageLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
            )}
            {image ? "Change photo" : "Upload photo"}
          </Button>
          {initial.defaultImage && imageChanged ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 w-full text-xs"
              onClick={restoreDefaultImage}
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Restore original photo
            </Button>
          ) : null}
          {errors.image ? <p className="mt-1.5 text-xs text-destructive">{errors.image}</p> : null}
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Square photos look best. Large photos are resized automatically.
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pe-name-en">Name (English) *</Label>
              <Input
                id="pe-name-en"
                className="mt-1.5"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Fresh Henna Cone"
                maxLength={80}
              />
              {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name}</p> : null}
            </div>
            <div>
              <Label htmlFor="pe-name-zh">Name (中文)</Label>
              <Input
                id="pe-name-zh"
                className="mt-1.5"
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                placeholder="新鲜海娜膏"
                maxLength={80}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pe-body-en">Short description (English)</Label>
            <Textarea
              id="pe-body-en"
              className="mt-1.5"
              rows={2}
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              placeholder="One or two sentences shown on the product card."
              maxLength={300}
            />
          </div>
          <div>
            <Label htmlFor="pe-body-zh">Short description (中文)</Label>
            <Textarea
              id="pe-body-zh"
              className="mt-1.5"
              rows={2}
              value={bodyZh}
              onChange={(e) => setBodyZh(e.target.value)}
              placeholder="显示在商品卡片上的一两句介绍。"
              maxLength={300}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="pe-price">Price (NPR) *</Label>
              <Input
                id="pe-price"
                className="mt-1.5"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, "").slice(0, 7))}
                placeholder="150"
              />
              {errors.price ? <p className="mt-1 text-xs text-destructive">{errors.price}</p> : null}
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ShopCategory)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stock</Label>
              <Select value={stock} onValueChange={(v) => setStock(v as StockStatus)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pe-discount">Discount % (optional)</Label>
              <Input
                id="pe-discount"
                className="mt-1.5"
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="—"
              />
              {errors.discount ? (
                <p className="mt-1 text-xs text-destructive">{errors.discount}</p>
              ) : null}
            </div>
            <div className="flex items-end pb-1">
              <label
                htmlFor="pe-featured"
                className="flex cursor-pointer items-center gap-2.5 text-sm select-none"
              >
                <Switch id="pe-featured" checked={featured} onCheckedChange={setFeatured} />
                Show “Popular” badge
              </label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6 gap-2 sm:justify-between">
        <div>
          {!isNew && !initial.isCustom && initial.hasEdit && onResetEdit ? (
            <Button type="button" variant="ghost" size="sm" onClick={onResetEdit}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset to defaults
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isNew ? "Add product" : "Save product"}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}
