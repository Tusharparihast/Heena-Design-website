import { createFileRoute } from "@tanstack/react-router";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { useLanguage } from "@/i18n/LanguageProvider";
import { studentWorkItems } from "@/lib/gallery";

const title = "Student Mehndi Work — Beginner to Bridal Practice | Nagma Designs";
const description =
  "See what students have created in our in-person mehndi courses: practice pieces, assessment designs and progress from beginner to bridal work.";

export const Route = createFileRoute("/student-work")({
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
  component: StudentWorkPage,
});

function StudentWorkPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
        {t.studentWorkPage.label}
      </p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{t.studentWorkPage.title}</h1>

      <div className="mt-6">
        <GalleryBrowser items={studentWorkItems} intro={t.studentWorkPage.intro} />
      </div>
    </main>
  );
}
