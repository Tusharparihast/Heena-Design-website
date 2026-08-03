import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, ShoppingBag, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/Section";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { useLanguage } from "@/i18n/LanguageProvider";
import { shopImages, shopProducts, type ShopCategory } from "@/lib/shop";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const title = "Shop Henna Cones, Kits & Practice Tools | Nagma Designs";
const description =
  "Buy fresh hand-rolled henna cones, bridal and beginner kits, aftercare oil and practice tools from our mehndi studio in Maitidevi, Kathmandu.";

export const Route = createFileRoute("/shop")({
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
  const { t } = useLanguage();
  const s = t.shopPage;
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const items = useMemo(() => {
    const byId = new Map(s.items.map((i) => [i.id, i]));
    return shopProducts
      .filter((p) => filter === "all" || p.category === (filter as ShopCategory))
      .map((p) => ({ ...p, copy: byId.get(p.id) }))
      .filter((p) => Boolean(p.copy));
  }, [filter, s.items]);

  const selectedItem = useMemo(() => items.find((i) => i.id === selected), [items, selected]);

  useEffect(() => {
    if (selected) {
      document.body.classList.add("overflow-hidden");
      const timer = setTimeout(() => closeRef.current?.focus(), 50);
      return () => {
        document.body.classList.remove("overflow-hidden");
        clearTimeout(timer);
      };
    }
    document.body.classList.remove("overflow-hidden");
    return undefined;
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const waLink = (productName?: string) =>
    `https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
      productName ? `Hello ${site.name}, I would like to order: ${productName}` : `Hello ${site.name}, I would like to order from your shop.`
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
              href={waLink()}
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
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p.id)}
                className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-secondary/40">
                  <img
                    src={shopImages[p.id]}
                    alt={p.copy!.name}
                    width={800}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {p.featured ? (
                    <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                      {s.featured}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-semibold">{p.copy!.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.copy!.body}</p>
                  <span className="mt-4 text-sm font-semibold text-primary">{p.copy!.price}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary/80">
                    {s.details} →
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xs text-muted-foreground italic">{s.note}</p>
      </Section>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-foreground/20"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.copy!.name}
        >
          <div className="relative w-full max-w-3xl scale-100 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300">
            <button
              ref={closeRef}
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-background/80 p-2 text-foreground shadow-sm transition-colors hover:bg-accent"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-square bg-secondary/40 md:aspect-auto">
                <img
                  src={shopImages[selectedItem.id]}
                  alt={selectedItem.copy!.name}
                  width={800}
                  height={800}
                  className="h-full w-full object-cover"
                />
                {selectedItem.featured ? (
                  <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                    {s.featured}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col p-6 sm:p-8">
                <h2 className="text-2xl font-semibold">{selectedItem.copy!.name}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{selectedItem.copy!.details}</p>
                <div className="mt-auto pt-6">
                  <span className="text-xl font-semibold text-primary">{selectedItem.copy!.price}</span>
                  <a
                    href={waLink(selectedItem.copy!.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    {s.order}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
