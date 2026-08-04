import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/Section";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { DiscountBadge, ShopPrice } from "@/components/shop/DiscountBadge";
import { OrderRequestModal } from "@/components/shop/OrderRequestModal";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { StockBadge } from "@/components/shop/StockBadge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { MAX_ORDER_QTY, type ShopCategory, type ShopProduct } from "@/lib/shop";
import {
  effectiveProducts,
  resolveCopy,
  useCatalogOverrides,
  type ProductCopy,
} from "@/lib/catalog-overrides";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

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

const filterKeys = ["all", "cones", "kits", "care", "practice"] as const;
type FilterKey = (typeof filterKeys)[number];

function ShopPage() {
  const { t, locale } = useLanguage();
  const s = t.shopPage;
  const [filter, setFilter] = useState<FilterKey>("all");
  const [order, setOrder] = useState<{ id: string; qty: number } | null>(null);
  const overrides = useCatalogOverrides();

  const items = useMemo(() => {
    const byId = new Map(s.items.map((i) => [i.id, i]));
    return effectiveProducts(overrides)
      .filter((p) => filter === "all" || p.category === (filter as ShopCategory))
      .map((product) => ({ product, copy: resolveCopy(product, byId.get(product.id), overrides, locale) }))
      .filter((x): x is { product: ShopProduct; copy: ProductCopy } => x.copy !== null);
  }, [filter, s.items, overrides, locale]);

  const waLink = `https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    `Hello ${site.name}, I would like to order from your shop.`
  )}`;

  return (
    <main className="relative">
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 px-4 py-20 sm:py-24">
        <MehndiPattern className="pointer-events-none absolute -right-16 -bottom-24 h-80 w-80 opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{s.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{s.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{s.hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {s.hero.cta}
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {s.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading label={s.hero.eyebrow} title={s.hero.title} />

        <div className="mt-8 flex flex-wrap gap-2">
          {filterKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                filter === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
              )}
            >
              {s.filters[key]}
            </button>
          ))}
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ product, copy }) => (
            <ProductCard
              key={product.id}
              product={product}
              copy={copy}
              onOrder={(id, qty) => setOrder({ id, qty })}
            />
          ))}
        </ul>

        <p className="mt-8 text-xs text-muted-foreground italic">{s.note}</p>
      </Section>

      <OrderRequestModal
        productId={order?.id ?? null}
        initialQty={order?.qty ?? 1}
        onClose={() => setOrder(null)}
      />
    </main>
  );
}

function ProductCard({
  product,
  copy,
  onOrder,
}: {
  product: ShopProduct;
  copy: ProductCopy;
  onOrder: (id: string, qty: number) => void;
}) {
  const { t } = useLanguage();
  const s = t.shopPage;
  const [qty, setQty] = useState(1);
  const out = product.stock === "out";

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
      <Link
        to="/shop/$productId"
        params={{ productId: product.id }}
        className="group relative block aspect-square overflow-hidden bg-secondary/40"
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
          <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
            {s.featured}
          </span>
        ) : null}
        <DiscountBadge percent={product.discount} className="absolute top-3 right-3" />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold">
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="transition-colors hover:text-primary"
          >
            {copy.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <ShopPrice product={product} price={copy.price} className="text-sm font-semibold text-primary" />
          <StockBadge status={product.stock} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{s.quantity}</span>
          <QuantityStepper small value={qty} onChange={setQty} max={MAX_ORDER_QTY} label={s.quantity} />
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            {s.details}
          </Link>
          <button
            type="button"
            disabled={out}
            onClick={() => onOrder(product.id, qty)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {s.orderNow}
          </button>
        </div>
      </div>
    </li>
  );
}
