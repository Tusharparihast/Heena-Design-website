import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { OrderRequestModal } from "@/components/shop/OrderRequestModal";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCart } from "@/lib/cart";
import { MAX_ORDER_QTY, formatCny, formatNpr, unitPriceNpr } from "@/lib/shop";
import { productCopy, toShopProduct, usePublicCatalog } from "@/lib/shop-catalog-db";
import { useCnyRate } from "@/lib/use-cny-rate";
import { cn } from "@/lib/utils";

/** Floating cart button + guest cart drawer. Rendered once for the whole /shop area. */
export function CartWidget() {
  const { t, locale } = useLanguage();
  const c = t.shopPage.cart;
  const isMobile = useIsMobile();
  const cnyRate = useCnyRate();
  const { items, count, setQty, remove, clear, open, setOpen } = useCart();
  const { products } = usePublicCatalog();
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  const lines = useMemo(
    () =>
      items
        .map((line) => {
          const db = products.find((p) => p.id === line.id);
          if (!db) return null;
          const product = toShopProduct(db);
          const copy = productCopy(db, locale);
          const unit = unitPriceNpr(product);
          return { id: line.id, qty: line.qty, name: copy.name, image: product.image, unit, total: unit * line.qty };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null),
    [items, products, locale],
  );

  const total = lines.reduce((sum, l) => sum + l.total, 0);

  // Make the device/browser Back button close the cart first, before it
  // navigates the underlying page.
  const historyPushedRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (!historyPushedRef.current) {
        window.history.pushState({ cartOpen: true }, "");
        historyPushedRef.current = true;
      }
    } else if (historyPushedRef.current) {
      // Cart was closed by something other than the back button (the X
      // button, the backdrop, "Order request", etc.) — remove the extra
      // history entry we pushed so a later real Back press works normally.
      historyPushedRef.current = false;
      window.history.back();
    }
  }, [open]);

  useEffect(() => {
    function onPopState() {
      if (open) {
        historyPushedRef.current = false;
        setOpen(false);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={c.title}
        className="fixed right-4 bottom-24 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:right-6 sm:h-14 sm:w-14"
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-foreground px-1 text-[10px] font-semibold text-background sm:h-6 sm:min-w-6 sm:text-[11px]">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={c.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-foreground/20 backdrop-blur-md"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={c.title}
            className={cn(
              "absolute flex flex-col bg-card shadow-2xl",
              isMobile
                ? "inset-y-0 right-0 h-full w-full border-l border-border"
                : "top-1/2 right-4 h-[min(44rem,90vh)] w-[min(28rem,calc(100vw-2rem))] -translate-y-1/2 rounded-2xl border border-border",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{c.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={c.close}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShoppingCart className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-sm text-muted-foreground">{c.empty}</p>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-border overflow-y-auto">
                  {lines.map((l) => (
                    <li key={l.id} className="flex gap-3 p-4">
                      <img
                        src={l.image}
                        alt={l.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatNpr(l.unit)} {c.each}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <QuantityStepper
                            small
                            value={l.qty}
                            onChange={(next) => setQty(l.id, next)}
                            max={MAX_ORDER_QTY}
                            label={t.shopPage.quantity}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary tabular-nums">
                              {formatNpr(l.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => remove(l.id)}
                              aria-label={`${c.remove} — ${l.name}`}
                              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-border p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">{c.estimatedTotal}</span>
                    <span className="text-lg font-semibold text-primary tabular-nums">
                      {formatNpr(total)}
                      {locale === "zh" ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {formatCny(total, cnyRate)}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <p className="rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
                    {c.disclaimer}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setPlacingOrder(true);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    {t.shopPage.orderForm.title}
                  </button>

                  <button
                    type="button"
                    onClick={() => clear()}
                    className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    {c.clear}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}

      <OrderRequestModal target={placingOrder ? { kind: "cart" } : null} onClose={() => setPlacingOrder(false)} />
    </>
  );
}
