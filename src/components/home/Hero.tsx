import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useHeroMedia } from "@/lib/use-homepage-media";
import { useVideoSrc } from "@/lib/use-video-src";
import { site } from "@/lib/site";

/** Fades the media into the page background on every side. */
const edgeFadeMask: CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 18%, black 82%, transparent), linear-gradient(to bottom, transparent, black 14%, black 72%, transparent)",
  WebkitMaskComposite: "source-in",
  maskImage:
    "linear-gradient(to right, transparent, black 18%, black 82%, transparent), linear-gradient(to bottom, transparent, black 14%, black 72%, transparent)",
  maskComposite: "intersect",
};

export function Hero() {
  const { t } = useLanguage();
  const { videoUrl, posterUrl, imageUrl, imageMode } = useHeroMedia();
  // Only fetch the clip on capable connections — poster image is the fallback.
  const [playVideo, setPlayVideo] = useState(false);
  const showVideo = playVideo && !imageMode;
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  useVideoSrc(heroVideoRef, showVideo ? videoUrl : undefined, posterUrl);

  useEffect(() => {
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const slow = conn?.saveData || /2g/.test(conn?.effectiveType ?? "");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!slow && !reduced) setPlayVideo(true);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-sage)" }}
        aria-hidden
      />

      {/* Media merged into the background — edges fade into the page. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {showVideo ? (
          <video
            key={videoUrl}
            ref={heroVideoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover opacity-70"
            style={edgeFadeMask}
          />
        ) : (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover opacity-70"
            style={edgeFadeMask}
          />
        )}
        {/* Soft wash so the text side stays readable in both themes. */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      {/* Decorative mehndi circle floating over the merged background. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 items-center justify-center text-primary/70 md:flex">
        <MehndiPattern className="max-h-[520px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl leading-[1.05] font-semibold sm:text-6xl">
            <span className="fade-up block" style={{ animationDelay: "0.15s" }}>
              {t.hero.title1}
            </span>
            <span
              className="fade-up block text-[color:var(--henna)]"
              style={{ animationDelay: "0.35s" }}
            >
              {t.hero.title2}
            </span>
            <span className="fade-up block text-primary" style={{ animationDelay: "0.55s" }}>
              {t.hero.title3}
            </span>
          </h1>
          <p
            className="fade-up mt-6 max-w-md text-muted-foreground"
            style={{ animationDelay: "0.7s" }}
          >
            {t.hero.body}
          </p>
          <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.85s" }}>
            <Link
              to="/appointment"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.hero.cta}
            </Link>

            <Link
              to="/gallery"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {t.hero.secondary}
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {site.city} · {site.hours}
          </p>
        </div>

        {/* Spacer keeps the original two-column rhythm; the media lives in the background now. */}
        <div className="hidden aspect-[6/7] max-h-[560px] lg:block" aria-hidden />
      </div>
    </section>
  );
}
