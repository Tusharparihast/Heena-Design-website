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
        {t.gallery.categories.map((category) => (
          <li key={category}>
            <Link
              to="/gallery"
              className="group flex aspect-4/5 flex-col justify-end rounded-2xl border border-border bg-accent/50 p-4 transition-colors hover:bg-accent"
            >
              <span className="text-sm font-medium group-hover:text-primary">{category}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {t.common.comingSoon}
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
