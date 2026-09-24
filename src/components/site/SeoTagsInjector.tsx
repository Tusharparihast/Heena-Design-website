import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { usePublicSiteSettings } from "@/lib/site-settings-db";
import { seoPathKey, useSeoPages } from "@/lib/seo-pages";


function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/** Injects site-wide SEO tags (title suffix, description, OG image, robots, GA, Search Console). */
export function SeoTagsInjector() {
  const { settings, loaded } = usePublicSiteSettings();
  const { pages } = useSeoPages();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageSeo = pages[seoPathKey(pathname)];

  // Robots / verification / analytics — site-wide, applied once settings load.
  useEffect(() => {
    if (!loaded) return;

    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", settings.seoRobotsIndex ? "index, follow" : "noindex, nofollow");

    upsertMeta("name", "google-site-verification", settings.seoSearchConsoleVerification);

    const gaId = settings.seoGaMeasurementId.trim();
    // Only accept real Google tag IDs (e.g. G-XXXXXXX); never build script text from raw input.
    if (/^(G|GT|AW|UA)-[A-Z0-9-]{4,20}$/i.test(gaId) && !document.getElementById("ga-gtag-script")) {
      const script1 = document.createElement("script");
      script1.id = "ga-gtag-script";
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script1);

      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
      w.gtag("js", new Date());
      w.gtag("config", gaId);
    }
  }, [loaded, settings]);

  // Per-page: title suffix, fallback description and social tags.
  // Runs after each navigation (once the route's own head() has been applied).
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    const apply = () => {
      if (cancelled) return;
      // Admin-managed per-page overrides win over the route's own head().
      const overrideTitle = pageSeo?.title.trim();
      if (overrideTitle) document.title = overrideTitle;
      const suffix = settings.seoTitleSuffix.trim();
      const base = document.title.trim();
      if (suffix && base && !base.endsWith(suffix)) {
        document.title = `${base} ${suffix}`;
      }

      const title = document.title;
      const existingDesc = document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim();
      const description =
        pageSeo?.description.trim() || existingDesc || settings.seoDefaultDescription.trim();
      if (description) upsertMeta("name", "description", description);

      upsertMeta("property", "og:title", title);
      upsertMeta("name", "twitter:title", title);
      if (description) {
        upsertMeta("property", "og:description", description);
        upsertMeta("name", "twitter:description", description);
      }
      upsertMeta("property", "og:type", "website");
      const ogImage = pageSeo?.ogImage.trim() || settings.seoOgImage;
      upsertMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
      upsertMeta("property", "og:url", window.location.href);
      if (ogImage) {
        upsertMeta("property", "og:image", ogImage);
        upsertMeta("name", "twitter:image", ogImage);
      }
    };

    const raf = requestAnimationFrame(() => {
      apply();
      // Route head() updates can land a tick later — re-apply once.
      setTimeout(apply, 120);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [loaded, settings, pathname, pageSeo]);

  return null;
}
