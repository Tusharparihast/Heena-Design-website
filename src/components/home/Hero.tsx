import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { useLanguage } from "@/i18n/language-context";
import { useHeroMedia } from "@/lib/use-homepage-media";
import { useVideoSrc } from "@/lib/use-video-src";
import { useContactInfo } from "@/lib/contact-info";


export function Hero() {
  const { t, locale } = useLanguage();
  const contact = useContactInfo();
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
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
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
            {locale === "zh" ? contact.cityZh : contact.cityEn} · {locale === "zh" ? contact.hoursZh : contact.hoursEn}
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-primary/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            <MehndiPattern className="max-h-[520px]" />
          </div>
          {showVideo ? (
            <video
              key={videoUrl}
              ref={heroVideoRef}
              src={videoUrl}
              poster={posterUrl}
              width={1200}
              height={1400}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Artist applying henna mehndi to a hand"
              className="aspect-[6/7] w-full rounded-[2rem] object-cover"
              style={{ boxShadow: "var(--shadow-soft)" }}
            />
          ) : (
            <img
              src={imageUrl}
              width={1200}
              height={1400}
              alt="Hand decorated with an intricate traditional bridal mehndi design"
              className="aspect-[6/7] w-full rounded-[2rem] object-cover"
              style={{ boxShadow: "var(--shadow-soft)" }}
            />
          )}
        </div>

      </div>
    </section>
  );
}
