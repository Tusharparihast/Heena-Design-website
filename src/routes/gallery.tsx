import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/site/ComingSoon";
import { useLanguage } from "@/i18n/LanguageProvider";

const title = "Mehndi Gallery — Bridal, Arabic & Modern Henna Designs | Rachana";
const description =
  "Browse categorised mehndi designs: traditional bridal, Arabic, minimal, festival, floral and finger designs by our Kathmandu studio.";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { t } = useLanguage();
  return <ComingSoon heading={t.nav.gallery} />;
}
