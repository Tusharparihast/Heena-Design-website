import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/language-context";
import { useEffectiveGalleryItems } from "@/lib/gallery-overrides";
import { useVideoMedia } from "@/lib/use-homepage-media";
import { useVideoSrc } from "@/lib/use-video-src";



export function GalleryPreview() {
  const { t } = useLanguage();
  const galleryItems = useEffectiveGalleryItems("gallery");

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
  const { videoUrl } = useVideoMedia();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  useVideoSrc(videoRef, videoUrl);

  const readAspect = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight);
  };

  // Autoplay when the video scrolls into view, pause when it scrolls out.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Inline player — no controls, just keeps playing silently on loop.
  return (
    <Section id="video" className="bg-card">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <SectionHeading label={t.video.label} title={t.video.title} body={t.video.body} />
        <div ref={containerRef} className="relative overflow-hidden rounded-2xl border border-border bg-secondary/60">
          <video
            key={videoUrl}
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={readAspect}
            className="w-full bg-black object-contain"
            style={{ aspectRatio: aspect, maxHeight: "70vh", marginInline: "auto" }}
            aria-label={t.video.title}
          />
        </div>
      </div>
    </Section>
  );
}
