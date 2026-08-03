import { Link } from "@tanstack/react-router";
import { Clock, GraduationCap } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";

export function CoursesSection() {
  const { t } = useLanguage();

  return (
    <Section id="courses" className="bg-secondary/40">
      <SectionHeading label={t.courses.label} title={t.courses.title} />
      <p className="mt-3 text-xs text-muted-foreground italic">{t.courses.note}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {t.courses.items.map((course) => (
          <article
            key={course.name}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="text-xl font-semibold">{course.name}</h3>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{course.body}</p>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
                <dt className="sr-only">{t.courses.level}</dt>
                <dd>{course.level}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" aria-hidden />
                <dt className="sr-only">{t.courses.duration}</dt>
                <dd>{course.duration}</dd>
              </div>
            </dl>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {t.courses.cta}
            </Link>

          </article>
        ))}
      </div>
    </Section>
  );
}
