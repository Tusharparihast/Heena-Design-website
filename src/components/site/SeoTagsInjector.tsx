import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { usePublicSiteSettings } from "@/lib/site-settings-db";

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

    if (settings.seoGaMeasurementId && !document.getElementById("ga-gtag-script")) {
      const script1 = document.createElement("script");
      script1.id = "ga-gtag-script";
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.seoGaMeasurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement("script");
      script2.id = "ga-gtag-init";
      script2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.seoGaMeasurementId}');`;
      document.head.appendChild(script2);
    }
  }, [loaded, settings]);

  // Per-page: title suffix, fallback description and social tags.
  // Runs after each navigation (once the route's own head() has been applied).
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    const apply = () => {
      if (cancelled) return;
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
      const description = existingDesc || settings.seoDefaultDescription.trim();
      if (description) upsertMeta("name", "description", description);

      upsertMeta("property", "og:title", title);
      upsertMeta("name", "twitter:title", title);
      if (description) {
        upsertMeta("property", "og:description", description);
        upsertMeta("name", "twitter:description", description);
      }
      upsertMeta("property", "og:type", "website");
      upsertMeta("name", "twitter:card", settings.seoOgImage ? "summary_large_image" : "summary");
      upsertMeta("property", "og:url", window.location.href);
      if (settings.seoOgImage) {
        upsertMeta("property", "og:image", settings.seoOgImage);
        upsertMeta("name", "twitter:image", settings.seoOgImage);
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
  }, [loaded, settings, pathname]);

  return null;
}
