import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, MapPin, QrCode, ShoppingBag, ShoppingCart } from "lucide-react";
import { Section } from "@/components/site/Section";
import { DiscountBadge, ShopPrice } from "@/components/shop/DiscountBadge";
import { OrderRequestModal } from "@/components/shop/OrderRequestModal";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { StockBadge } from "@/components/shop/StockBadge";
import { en } from "@/i18n/dictionaries";
import { useLanguage } from "@/i18n/language-context";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { MAX_ORDER_QTY, type ShopProduct } from "@/lib/shop";
import {
  catLabel,
  productCopy,
  relatedFrom,
  toShopProduct,
  usePublicCatalog,
  type ProductCopy,
} from "@/lib/shop-catalog-db";
import { getSeoProduct, type SeoProduct } from "@/lib/shop-seo.functions";
import { cn } from "@/lib/utils";
import { MehndiLoader } from "@/components/site/MehndiLoader";

const PUBLISHED_ORIGIN = "https://n-designs.lovable.app";

function buildProductJsonLd(p: SeoProduct): string {
  const name = p.nameEn || p.nameZh || p.id;
  const description = p.bodyEn || p.bodyZh || name;
  const image = p.gallery.length > 0 ? p.gallery : p.image ? [p.image] : [];
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    sku: p.id,
    brand: { "@type": "Brand", name: "Nagma Designs" },
    offers: {
      "@type": "Offer",
      url: `${PUBLISHED_ORIGIN}/shop/${p.id}`,
      priceCurrency: "NPR",
      price: p.priceNpr,
      availability:
        p.stock === "out"
          ? "https://schema.org/OutOfStock"
          : p.stock === "low"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Nagma Designs" },
    },
  };
  return JSON.stringify(ld);
}

export const Route = createFileRoute("/shop/$productId")({
  loader: async ({ params }) => {
    // Best-effort SSR fetch for metadata; the interactive UI still reads the
    // live catalog client-side. Returns null when the product is missing.
    try {
      return await getSeoProduct({ data: { id: params.productId } });
    } catch {
      return null;
    }
  },
  head: ({ params, loaderData }) => {
    const fallback = en.shopPage.items.find((i) => i.id === params.productId);
    const p = loaderData;
    const name = p ? (p.nameEn || p.nameZh || fallback?.name) : fallback?.name;
    const title = name ? `${name} | Nagma Designs Shop` : "Product | Nagma Designs Shop";
    const description =
      (p && (p.bodyEn || p.bodyZh)) ||
      fallback?.body ||
      "Order handmade henna cones, kits and practice tools from our studio in Maitidevi, Kathmandu.";
    const url = `${PUBLISHED_ORIGIN}/shop/${params.productId}`;
    const image = p ? (p.gallery.length > 0 ? p.gallery[0] : p.image) : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [{ type: "application/ld+json", children: buildProductJsonLd(p) }]
        : [],
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

  const { products, categories, loading } = usePublicCatalog();
  const dbProduct = products.find((p) => p.id === productId);
  const baseProduct = dbProduct ? toShopProduct(dbProduct) : null;
  const copy = dbProduct ? productCopy(dbProduct, locale) : null;

  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    setImgIdx(0);
    setQty(1);
    setOrderOpen(false);
    window.scrollTo(0, 0);
  }, [productId]);

  if (!baseProduct || !copy) {
    if (loading) {
      return (
        <main className="flex min-h-[60vh] items-center justify-center">
          <MehndiLoader size={150} />
        </main>
      );
    }
    throw notFound();
  }
  const product = baseProduct;

  const images = product.gallery.length > 0 ? product.gallery : [product.image];
  const out = product.stock === "out";
  const category = categories.find((c) => c.id === dbProduct!.category);
  const related = relatedFrom(products, product.id, 3).map((p) => ({
    ...toShopProduct(p),
    copy: productCopy(p, locale),
  }));

  return (
    <main className="relative">
      <Section className="pt-6 sm:pt-12">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {d.back}
        </Link>

        <div className="mt-4 grid gap-4 sm:mt-8 sm:gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary/40 sm:aspect-square sm:rounded-2xl">
              <img
                src={images[imgIdx]}
                alt={copy.name}
                width={1000}
                height={1000}
                className="h-full w-full object-cover"
              />
              {product.featured ? (
                <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground sm:top-3 sm:left-3 sm:px-3 sm:py-1 sm:text-[11px]">
                  {s.featured}
                </span>
              ) : null}
              <DiscountBadge percent={product.discount} className="absolute top-2 right-2 sm:top-3 sm:right-3" />
            </div>
            {images.length > 1 ? (
              <div className="mt-2.5 flex gap-2.5 sm:mt-3 sm:gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    aria-pressed={imgIdx === i}
                    className={cn(
                      "h-14 w-14 overflow-hidden rounded-lg border transition-all sm:h-20 sm:w-20 sm:rounded-xl",
                      imgIdx === i
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border opacity-70 hover:opacity-100",
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      width={160}
                      height={160}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase sm:text-xs">
              {category ? catLabel(category, locale) : product.category}
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl lg:text-4xl">{copy.name}</h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:mt-4 sm:gap-3">
              <ShopPrice
                product={product}
                price={copy.price}
                className="text-lg font-semibold text-primary sm:text-xl"
              />
              <StockBadge status={product.stock} />
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-5">{copy.details}</p>

            {/* Quantity + actions — compact stacked row on mobile, original flex row on desktop */}
            <div className="mt-3 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex justify-start sm:block">
                <QuantityStepper value={qty} onChange={setQty} max={MAX_ORDER_QTY} label={s.quantity} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <button
                  type="button"
                  disabled={out}
                  onClick={() => setOrderOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:gap-2 sm:px-8 sm:py-3 sm:text-sm"
                >
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  {s.orderNow}
                </button>
                <button
                  type="button"
                  disabled={out}
                  onClick={() => {
                    add(product.id, qty);
                    toast.success(s.added);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:gap-2 sm:px-8 sm:py-3 sm:text-sm"
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  {s.addToCart}
                </button>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground sm:mt-4">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {d.pickup}
            </p>

            {/* Payment reassurance (no online checkout) */}
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3 sm:mt-6 sm:rounded-2xl sm:p-5">
              <p className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                <QrCode className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" aria-hidden />
                {d.paymentTitle}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-xs">
                {d.paymentBody}
              </p>
              <p className="mt-2.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase sm:mt-3 sm:text-[11px]">
                {d.paymentMethodsLabel}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2">
                {d.paymentMethods.map((method) => (
                  <li
                    key={method}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground sm:px-2.5 sm:py-1 sm:text-[11px]"
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
          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-8">
            {copy.features.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6">
                <h2 className="text-sm font-semibold sm:text-base">{d.features}</h2>
                <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                  {copy.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-muted-foreground sm:gap-2.5 sm:text-sm"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {copy.usage.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6">
                <h2 className="text-sm font-semibold sm:text-base">{d.usage}</h2>
                <ol className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                  {copy.usage.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 text-xs text-muted-foreground sm:gap-3 sm:text-sm"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary sm:h-5 sm:w-5 sm:text-[11px]">
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
          <div className="mt-10 sm:mt-14">
            <h2 className="text-xl font-semibold sm:text-2xl">{d.related}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/shop/$productId"
                    params={{ productId: p.id }}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md sm:rounded-2xl"
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
                      <DiscountBadge percent={p.discount} className="absolute top-2 right-2 sm:top-3 sm:right-3" />
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-5">
                      <h3 className="line-clamp-2 text-xs font-semibold transition-colors group-hover:text-primary sm:line-clamp-none sm:text-base">
                        {p.copy!.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
                        <ShopPrice
                          product={p}
                          price={p.copy!.price}
                          className="text-xs font-semibold text-primary sm:text-sm"
                        />
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

      <OrderRequestModal
        target={orderOpen ? { kind: "single", productId: product.id, qty } : null}
        onClose={() => setOrderOpen(false)}
      />
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
