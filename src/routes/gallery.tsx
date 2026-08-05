import { createFileRoute } from "@tanstack/react-router";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  useEffectiveGalleryCategories,
  useEffectiveGalleryItems,
} from "@/lib/gallery-overrides";

const title = "Mehndi Gallery — Bridal, Arabic & Modern Henna Designs | Nagma Designs";
const description =
  "Browse categorised mehndi designs: traditional bridal, Arabic, minimal, festival, floral, finger and feet designs by our Kathmandu studio.";

export const Route = createFileRoute("/gallery")({
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
  component: GalleryPage,
});

function GalleryPage() {
  const { t } = useLanguage();
  const items = useEffectiveGalleryItems("gallery");
  const categories = useEffectiveGalleryCategories();

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
        {t.gallery.label}
      </p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{t.galleryPage.title}</h1>

      <div className="mt-6">
        <GalleryBrowser
          items={items}
          categories={categories.map((c) => ({ id: c.id, en: c.nameEn, zh: c.nameZh }))}
        />
      </div>
    </main>
  );
}
