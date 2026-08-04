import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, MapPin, QrCode, ShoppingBag } from "lucide-react";
import { Section } from "@/components/site/Section";
import { DiscountBadge, ShopPrice } from "@/components/shop/DiscountBadge";
import { OrderRequestModal } from "@/components/shop/OrderRequestModal";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { StockBadge } from "@/components/shop/StockBadge";
import { en } from "@/i18n/dictionaries";
import { useLanguage } from "@/i18n/LanguageProvider";
import { MAX_ORDER_QTY, type ShopProduct } from "@/lib/shop";
import {
  categoryLabel,
  effectiveProducts,
  relatedFrom,
  resolveCopy,
  useCatalogOverrides,
  type ProductCopy,
} from "@/lib/catalog-overrides";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/$productId")({
  head: ({ params }) => {
    const item = en.shopPage.items.find((i) => i.id === params.productId);
    const title = item ? `${item.name} | Nagma Designs Shop` : "Product | Nagma Designs Shop";
    const description =
      item?.body ?? "Order handmade henna cones, kits and practice tools from our studio in Maitidevi, Kathmandu.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { t, locale } = useLanguage();
  const s = t.shopPage;
  const d = s.detailsPage;

  const overrides = useCatalogOverrides();
  const catalog = useMemo(() => effectiveProducts(overrides), [overrides]);
  const baseProduct = catalog.find((p) => p.id === productId);
  const copy = baseProduct
    ? resolveCopy(baseProduct, s.items.find((i) => i.id === productId), overrides, locale)
    : null;
  if (!baseProduct || !copy) throw notFound();
  const product = baseProduct;

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    setImgIdx(0);
    setQty(1);
    setOrderOpen(false);
    window.scrollTo(0, 0);
  }, [productId]);

  const images = product.gallery.length > 0 ? product.gallery : [product.image];
  const out = product.stock === "out";
  const related = relatedFrom(catalog, product.id, 3)
    .map((p) => ({ ...p, copy: resolveCopy(p, s.items.find((i) => i.id === p.id), overrides, locale) }))
    .filter((p): p is ShopProduct & { copy: ProductCopy } => p.copy !== null);

  return (
    <main className="relative">
      <Section className="pt-10 sm:pt-12">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {d.back}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary/40">
              <img
                src={images[imgIdx]}
                alt={copy.name}
                width={1000}
                height={1000}
                className="h-full w-full object-cover"
              />
              {product.featured ? (
                <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                  {s.featured}
                </span>
              ) : null}
              <DiscountBadge percent={product.discount} className="absolute top-3 right-3" />
            </div>
            {images.length > 1 ? (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    aria-pressed={imgIdx === i}
                    className={cn(
                      "h-20 w-20 overflow-hidden rounded-xl border transition-all",
                      imgIdx === i ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" width={160} height={160} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{categoryLabel(product.category, overrides, locale, s.filters)}</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{copy.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ShopPrice product={product} price={copy.price} className="text-xl font-semibold text-primary" />
              <StockBadge status={product.stock} />
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{copy.details}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <QuantityStepper value={qty} onChange={setQty} max={MAX_ORDER_QTY} label={s.quantity} />
              <button
                type="button"
                disabled={out}
                onClick={() => setOrderOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-8"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                {s.orderNow}
              </button>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {d.pickup}
            </p>

            {/* Payment reassurance (no online checkout) */}
            <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-primary" aria-hidden />
                {d.paymentTitle}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d.paymentBody}</p>
              <p className="mt-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {d.paymentMethodsLabel}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {d.paymentMethods.map((method) => (
                  <li
                    key={method}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {method}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Features + usage (hidden for custom products without this content) */}
        {copy.features.length > 0 || copy.usage.length > 0 ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {copy.features.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold">{d.features}</h2>
                <ul className="mt-4 space-y-2.5">
                  {copy.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {copy.usage.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold">{d.usage}</h2>
                <ol className="mt-4 space-y-2.5">
                  {copy.usage.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Related products */}
        {related.length > 0 ? (
          <div className="mt-14">
            <h2 className="text-2xl font-semibold">{d.related}</h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/shop/$productId"
                    params={{ productId: p.id }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-secondary/40">
                      <img
                        src={p.image}
                        alt={p.copy!.name}
                        width={800}
                        height={800}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <DiscountBadge percent={p.discount} className="absolute top-3 right-3" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-base font-semibold transition-colors group-hover:text-primary">
                        {p.copy!.name}
                      </h3>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <ShopPrice product={p} price={p.copy!.price} className="text-sm font-semibold text-primary" />
                        <StockBadge status={p.stock} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <OrderRequestModal productId={orderOpen ? product.id : null} initialQty={qty} onClose={() => setOrderOpen(false)} />
    </main>
  );
}

function ProductNotFound() {
  const { t } = useLanguage();
  const d = t.shopPage.detailsPage;
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">{d.notFoundTitle}</h1>
      <p className="mt-4 text-muted-foreground">{d.notFoundBody}</p>
      <Link
        to="/shop"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {d.back}
      </Link>
    </main>
  );
}
