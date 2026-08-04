import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Percent, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { StockBadge } from "@/components/shop/StockBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { en } from "@/i18n/dictionaries";
import { formatNpr, shopProducts, unitPriceNpr } from "@/lib/shop";
import {
  clearDiscountOverrides,
  readDiscountOverrides,
  resolveDiscount,
  writeDiscountOverrides,
  type DiscountOverrides,
} from "@/lib/shop-overrides";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [{ title: "Products — Nagma Designs Admin" }],
  }),
  component: AdminProductsPage,
});

const productNames = new Map(en.shopPage.items.map((item) => [item.id, item.name]));

function parsePercent(raw: string): number | undefined {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 99) return undefined;
  return n;
}

/** Input values mirroring the effective discount of every product. */
function draftsFrom(overrides: DiscountOverrides): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const p of shopProducts) {
    const eff = resolveDiscount(p, overrides);
    drafts[p.id] = eff ? String(eff) : "";
  }
  return drafts;
}

function AdminProductsPage() {
  const [overrides, setOverrides] = useState<DiscountOverrides>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  // Load saved overrides once on mount (localStorage is client-only).
  useEffect(() => {
    const saved = readDiscountOverrides();
    setOverrides(saved);
    setDrafts(draftsFrom(saved));
    setLoaded(true);
  }, []);

  const dirty = useMemo(
    () =>
      loaded &&
      shopProducts.some(
        (p) => (drafts[p.id] ?? "") !== String(resolveDiscount(p, overrides) ?? ""),
      ),
    [drafts, overrides, loaded],
  );

  const hasOverrides = Object.keys(overrides).length > 0;

  const setDraft = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setDrafts((prev) => ({ ...prev, [id]: digits }));
  };

  const save = () => {
    const next: DiscountOverrides = {};
    for (const p of shopProducts) {
      const pct = parsePercent((drafts[p.id] ?? "").trim());
      if (pct === undefined) {
        // Empty field = no discount; only record an override when a default exists.
        if (p.discount !== undefined) next[p.id] = null;
      } else if (pct !== p.discount) {
        next[p.id] = pct;
      }
    }
    writeDiscountOverrides(next);
    setOverrides(next);
    setDrafts(draftsFrom(next));
    toast.success("Discounts updated", {
      description: "The shop now shows your new sale prices.",
    });
  };

  const reset = () => {
    clearDiscountOverrides();
    setOverrides({});
    setDrafts(draftsFrom({}));
    toast.success("Discounts reset", {
      description: "All products are back to their default prices.",
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set or remove a discount percentage per item — the shop updates instantly, no code
            changes needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={!loaded || (!hasOverrides && !dirty)}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to defaults
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save changes
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Discounts</CardTitle>
          <p className="text-xs text-muted-foreground">Leave a field empty for full price.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Discount %</TableHead>
                <TableHead className="pr-6 text-right">Shop shows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shopProducts.map((p) => {
                const pct = parsePercent((drafts[p.id] ?? "").trim());
                const salePrice = pct ? unitPriceNpr({ ...p, discount: pct }) : undefined;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt=""
                          width={40}
                          height={40}
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{productNames.get(p.id) ?? p.id}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatNpr(p.priceNpr)}</TableCell>
                    <TableCell>
                      <StockBadge status={p.stock} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          inputMode="numeric"
                          aria-label={`Discount percentage for ${productNames.get(p.id) ?? p.id}`}
                          placeholder="—"
                          value={drafts[p.id] ?? ""}
                          onChange={setDraft(p.id)}
                          disabled={!loaded}
                          className="h-8 w-16 text-center"
                        />
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        {p.discount !== undefined ? (
                          <span className="text-[11px] whitespace-nowrap text-muted-foreground">
                            default {p.discount}%
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right whitespace-nowrap">
                      {pct && salePrice !== undefined ? (
                        <span className="inline-flex items-center justify-end gap-2">
                          <Badge variant="destructive">-{pct}%</Badge>
                          <span className="font-semibold text-primary">
                            {formatNpr(salePrice)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Discounts are saved in this browser for now — they'll move to the database with the backend
        phase so every visitor sees them.
      </p>
    </div>
  );
}
