import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/site/ComingSoon";
import { useLanguage } from "@/i18n/LanguageProvider";

const title = "Custom Mehndi Design Requests — Weddings & Events | Rachana";
const description =
  "Request a custom henna design for weddings, festivals and private events in Kathmandu. Share references and we will shape the design with you.";

export const Route = createFileRoute("/custom-design")({
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
  component: CustomDesignPage,
});

function CustomDesignPage() {
  const { t } = useLanguage();
  return <ComingSoon heading={t.nav.custom} />;
}
