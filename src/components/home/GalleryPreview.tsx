import { Link } from "@tanstack/react-router";
import { Maximize2, Minimize2, Play, X } from "lucide-react";
import { useState } from "react";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { galleryItems } from "@/lib/gallery";
import { useVideoMedia } from "@/lib/use-homepage-media";



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
  const { videoUrl, posterUrl } = useVideoMedia();
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Inline player + controls.
  const video = (
    <video
      src={videoUrl}
      poster={posterUrl}
      controls
      controlsList="nofullscreen"
      autoPlay={playing}
      muted
      playsInline
      preload="metadata"
      className="aspect-video w-full bg-black"
      aria-label={t.video.title}
    />
  );


  return (
    <Section id="video" className="bg-card">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <SectionHeading label={t.video.label} title={t.video.title} body={t.video.body} />
        <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/60">
          {playing ? (
            <div className="relative">
              {video}
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={t.video.expand}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-background"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                {t.video.expand}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={t.video.play}
              className="group relative block aspect-video w-full"
            >
              <img
                src={posterUrl}
                alt={t.video.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover"
              />

              <span className="absolute inset-0 flex items-center justify-center bg-background/25 transition-colors group-hover:bg-background/10">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                  <Play className="h-4 w-4" aria-hidden />
                  {t.video.play}
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur-sm">
                {t.video.note}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Large centered box view instead of browser fullscreen so the video quality stays crisp. */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.video.title}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t.video.close}
              className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-background"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {t.video.close}
            </button>
            {video}
          </div>
        </div>
      )}
    </Section>
  );
}
