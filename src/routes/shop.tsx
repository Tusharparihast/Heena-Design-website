import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, MessageCircle, ShoppingBag, X } from "lucide-react";
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
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = useMemo(() => {
    const byId = new Map(s.items.map((i) => [i.id, i]));
    return shopProducts
      .filter((p) => filter === "all" || p.category === (filter as ShopCategory))
      .map((p) => ({ ...p, copy: byId.get(p.id) }))
      .filter((p) => Boolean(p.copy));
  }, [filter, s.items]);

  const waLink = (productName?: string) =>
    `https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
      productName ? `Hello ${site.name}, I would like to order: ${productName}` : `Hello ${site.name}, I would like to order from your shop.`
    )}`;

  return (
    <main>
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
          {items.map((p) => {
            const isExpanded = expanded === p.id;
            return (
              <li
                key={p.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
                  isExpanded ? "ring-1 ring-primary/30 shadow-lg" : "hover:border-primary/40"
                )}
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
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-primary">{p.copy!.price}</span>
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : p.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      {isExpanded ? (
                        <>
                          <X className="h-3.5 w-3.5" aria-hidden />
                          {s.hideDetails}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                          {s.details}
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    className={cn(
                      "grid overflow-hidden transition-all duration-300 ease-out",
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="text-sm leading-relaxed text-foreground">{p.copy!.details}</p>
                        <a
                          href={waLink(p.copy!.name)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <ShoppingBag className="h-4 w-4" aria-hidden />
                          {s.order}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-xs text-muted-foreground italic">{s.note}</p>
      </Section>
    </main>
  );
}
