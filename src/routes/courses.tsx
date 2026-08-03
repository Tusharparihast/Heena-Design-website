import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/site/ComingSoon";
import { useLanguage } from "@/i18n/LanguageProvider";

const title = "Mehndi Courses in Kathmandu — Beginner to Bridal | Rachana";
const description =
  "In-person henna courses in Maitidevi, Kathmandu: beginner foundation, bridal intensive and modern Arabic mehndi training with hands-on practice.";

export const Route = createFileRoute("/courses")({
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
  component: CoursesPage,
});

function CoursesPage() {
  const { t } = useLanguage();
  return <ComingSoon heading={t.nav.courses} />;
}
