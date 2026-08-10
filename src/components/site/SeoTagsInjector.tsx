import { useEffect } from "react";
import { usePublicSiteSettings } from "@/lib/site-settings-db";

/** Injects site-wide SEO tags (robots, GA, Search Console) from admin-managed settings. */
export function SeoTagsInjector() {
  const { settings, loaded } = usePublicSiteSettings();

  useEffect(() => {
    if (!loaded) return;

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", settings.seoRobotsIndex ? "index, follow" : "noindex, nofollow");

    if (settings.seoSearchConsoleVerification) {
      let verify = document.querySelector('meta[name="google-site-verification"]');
      if (!verify) {
        verify = document.createElement("meta");
        verify.setAttribute("name", "google-site-verification");
        document.head.appendChild(verify);
      }
      verify.setAttribute("content", settings.seoSearchConsoleVerification);
    }

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

  return null;
}
