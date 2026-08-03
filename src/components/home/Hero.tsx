import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import heroHand from "@/assets/hero-hand.jpg";
import heroVideo from "@/assets/hero-mehndi.mp4";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

export function Hero() {
  const { t } = useLanguage();
  // Only fetch the clip on capable connections — poster image is the fallback.
  const [playVideo, setPlayVideo] = useState(false);

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
          <p className="fade-up text-xs font-semibold tracking-[0.24em] text-primary uppercase">
            {t.hero.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl leading-[1.05] font-semibold sm:text-6xl">
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
              to="/contact"
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

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-primary/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            <MehndiPattern className="max-h-[520px]" />
          </div>
          {playVideo ? (
            <video
              src={heroVideo}
              poster={heroHand}
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
              src={heroHand}
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
