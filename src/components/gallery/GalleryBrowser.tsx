import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import { Lightbox } from "@/components/gallery/Lightbox";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  GALLERY_PAGE_SIZE,
  galleryCategories,
  galleryItems,
  type CategoryId,
  type GalleryItem,
} from "@/lib/gallery";
import { cn } from "@/lib/utils";

type GalleryBrowserProps = {
  items?: GalleryItem[];
  categories?: { id: CategoryId; en: string; zh: string }[];
  intro?: string;
};

export function GalleryBrowser({ items = galleryItems, categories = galleryCategories, intro }: GalleryBrowserProps) {
  const { t, locale } = useLanguage();
  const g = t.galleryPage;
  const displayedIntro = intro ?? t.galleryPage.intro;

  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(GALLERY_PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && !item.categories.includes(category)) return false;
      if (!q) return true;
      const haystack = [
        item.en,
        item.zh,
        ...item.categories.map((id) => {
          const found = categories.find((c) => c.id === id);
          return `${found?.en ?? ""} ${found?.zh ?? ""}`;
        }),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [category, query, items, categories]);

  const shown = filtered.slice(0, visible);
  const labelFor = (index: number) => {
    const item = filtered[index];
    return item ? (locale === "zh" ? item.zh : item.en) : "";
  };

  const reset = (next: () => void) => {
    next();
    setVisible(GALLERY_PAGE_SIZE);
  };

  return (
    <div>
      <p className="mt-4 max-w-2xl text-muted-foreground">{displayedIntro}</p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => reset(() => setQuery(event.target.value))}
            placeholder={g.search}
            aria-label={g.search}
            className="w-full rounded-full border border-border bg-card py-2.5 pr-4 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} {g.results}
        </p>
      </div>

      <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-1">
        <div className="flex w-max gap-2">
          <Chip active={category === "all"} onClick={() => reset(() => setCategory("all"))}>
            {g.all}
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => reset(() => setCategory(c.id))}
            >
              {locale === "zh" ? c.zh : c.en}
            </Chip>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">{g.empty}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {shown.map((item, index) => (
            <li key={item.id}>
              <GalleryCard
                item={item}
                label={locale === "zh" ? item.zh : item.en}
                priority={index < 4}
                onOpen={() => setOpenIndex(index)}
              />
            </li>
          ))}
        </ul>
      )}

      {visible < filtered.length ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + GALLERY_PAGE_SIZE)}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {g.loadMore}
          </button>
        </div>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted-foreground">{g.note}</p>

      {openIndex !== null && filtered[openIndex] ? (
        <Lightbox
          item={filtered[openIndex]}
          label={labelFor(openIndex)}
          labels={{
            close: g.close,
            prev: g.prev,
            next: g.next,
            zoom: g.zoom,
            fullscreen: g.fullscreen,
          }}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length))}
          onNext={() => setOpenIndex((i) => (i === null ? i : (i + 1) % filtered.length))}
        />
      ) : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
