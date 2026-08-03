import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/site/ComingSoon";
import { useLanguage } from "@/i18n/LanguageProvider";

const title = "About Our Mehndi Studio in Maitidevi, Kathmandu | Rachana";
const description =
  "A small home studio in Maitidevi, Kathmandu, drawing traditional and modern mehndi and teaching the craft in person, open 9 AM to 9 PM.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLanguage();
  return <ComingSoon heading={t.nav.about} />;
}
