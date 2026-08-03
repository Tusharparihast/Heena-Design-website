import { createFileRoute } from "@tanstack/react-router";
import { ContactSection } from "@/components/home/ContactSection";

const title = "Contact & Appointments — Mehndi Studio Kathmandu | Rachana";
const description =
  "Reach our Maitidevi studio on WeChat, WhatsApp or phone to book a mehndi appointment or ask about henna classes. Open daily 9 AM to 9 PM.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

function ContactPage() {
  return (
    <main>
      <h1 className="sr-only">{title}</h1>
      <ContactSection />
    </main>
  );
}
