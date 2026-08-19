import { useEffect } from "react";

import { useBranding } from "@/lib/branding";

/** Keeps the browser tab icon in sync with the admin-managed logo. */
export function FaviconInjector() {
  const { branding, loaded } = useBranding();

  useEffect(() => {
    if (!loaded || typeof document === "undefined") return;
    const href = branding.faviconUrl || branding.logoUrl;
    if (!href) return;

    document.head.querySelectorAll('link[rel~="icon"]').forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    if (href.startsWith("data:")) {
      const type = href.slice(5, href.indexOf(";"));
      if (type) link.type = type;
    } else if (href.endsWith(".png")) {
      link.type = "image/png";
    }
    document.head.appendChild(link);

    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = href;
    document.head.appendChild(apple);

    return () => {
      apple.remove();
    };
  }, [loaded, branding.faviconUrl, branding.logoUrl]);

  return null;
}
