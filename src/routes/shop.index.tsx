import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Section } from "@/components/site/Section";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { DiscountBadge, ShopPrice } from "@/components/shop/DiscountBadge";
import { StockBadge } from "@/components/shop/StockBadge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { type ShopProduct } from "@/lib/shop";
import { catLabel, productCopy, toShopProduct, usePublicCatalog, type ProductCopy } from "@/lib/shop-catalog-db";
import { cn } from "@/lib/utils";
import { MehndiLoader } from "@/components/site/MehndiLoader";

const title = "Shop Henna Cones, Kits & Practice Tools | Nagma Designs";
const description =
  "Buy fresh hand-rolled henna cones, bridal and beginner kits, aftercare oil and practice tools from our mehndi studio in Maitidevi, Kathmandu.";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { t, locale } = useLanguage();
  const s = t.shopPage;
  const [filter, setFilter] = useState<string>("all");
  const { products, categories, loading } = usePublicCatalog();

  const chips = useMemo(() => {
    const cats = categories.map((c) => ({ id: c.id, label: catLabel(c, locale) }));
    return [{ id: "all", label: s.filters.all }, ...cats];
  }, [s.filters, categories, locale]);

  const activeFilter = chips.some((c) => c.id === filter) ? filter : "all";

  const items = useMemo(() => {
    return products
      .filter((p) => activeFilter === "all" || p.category === activeFilter)
      .map((p) => ({ product: toShopProduct(p), copy: productCopy(p, locale) }));
  }, [activeFilter, products, locale]);

  return (
    <main className="relative">
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 px-4 py-20 sm:py-24">
        <MehndiPattern className="pointer-events-none absolute -right-16 -bottom-24 h-80 w-80 opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{s.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{s.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{s.hero.body}</p>
        </div>
      </section>

      <Section>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              aria-pressed={activeFilter === chip.id}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                activeFilter === chip.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <MehndiLoader size={150} />
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {items.map(({ product, copy }) => (
              <ProductCard key={product.id} product={product} copy={copy} />
            ))}
          </ul>
        )}

        <p className="mt-8 text-xs text-muted-foreground italic">{s.note}</p>
      </Section>
    </main>
  );
}

function ProductCard({ product, copy }: { product: ShopProduct; copy: ProductCopy }) {
  const { t } = useLanguage();
  const s = t.shopPage;
  const { add } = useCart();
  const out = product.stock === "out";

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md sm:rounded-2xl">
      <Link
        to="/shop/$productId"
        params={{ productId: product.id }}
        className="group relative block aspect-[4/3] overflow-hidden bg-secondary/40 sm:aspect-square"
        aria-label={copy.name}
      >
        <img
          src={product.image}
          alt={copy.name}
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.featured ? (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground sm:top-3 sm:left-3 sm:px-3 sm:py-1 sm:text-[11px]">
            {s.featured}
          </span>
        ) : null}
        <DiscountBadge percent={product.discount} className="absolute top-2 right-2 sm:top-3 sm:right-3" />
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-5">
        <h3 className="line-clamp-2 text-xs font-semibold sm:line-clamp-none sm:text-base">
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="transition-colors hover:text-primary"
          >
            {copy.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground sm:mt-2 sm:line-clamp-none sm:text-sm">
          {copy.body}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 sm:mt-4 sm:gap-2">
          <ShopPrice product={product} price={copy.price} className="text-xs font-semibold text-primary sm:text-sm" />
          <StockBadge status={product.stock} />
        </div>

        <div className="mt-2 flex items-center gap-1.5 sm:mt-4 sm:gap-2">
          <button
            type="button"
            disabled={out}
            onClick={() => {
              add(product.id, 1);
              toast.success(s.added);
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
          >
            <ShoppingCart className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="truncate">{s.addToCart}</span>
          </button>

          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="hidden flex-1 items-center justify-center rounded-full border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex sm:px-4 sm:py-2 sm:text-sm sm:text-foreground"
          >
            <span className="truncate">{s.details}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
