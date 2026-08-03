import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";

export function GalleryPreview() {
  const { t } = useLanguage();

  return (
    <Section id="gallery">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading label={t.gallery.label} title={t.gallery.title} body={t.gallery.body} />
        <Link
          to="/gallery"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t.gallery.cta}
        </Link>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {galleryItems.slice(0, 8).map((item, index) => (
          <li key={item.id}>
            <Link
              to="/gallery"
              className="group relative block overflow-hidden rounded-2xl border border-border"
            >
              <img
                src={item.src}
                alt={item.en}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="aspect-4/5 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs font-medium backdrop-blur-sm">
                {t.gallery.categories[index]}
              </span>
            </Link>
          </li>
        ))}
      </ul>

    </Section>
  );
}

export function VideoSection() {
  const { t } = useLanguage();

  return (
    <Section id="video" className="bg-card">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <SectionHeading label={t.video.label} title={t.video.title} body={t.video.body} />
        <div className="relative flex aspect-video items-center justify-center rounded-2xl border border-border bg-secondary/60">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            aria-label={t.video.play}
          >
            <Play className="h-4 w-4" aria-hidden />
            {t.video.play}
          </button>
          <span className="absolute bottom-3 text-[11px] text-muted-foreground">
            {t.video.note}
          </span>
        </div>
      </div>
    </Section>
  );
}
