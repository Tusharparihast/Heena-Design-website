import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Award, Check, Clock, GraduationCap, Package, Users } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/Section";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { useLanguage } from "@/i18n/LanguageProvider";

const title = "Mehndi Courses in Kathmandu — Beginner to Bridal | Nagma Designs";
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
  const c = t.coursesPage;
  const L = c.detailLabels;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 px-4 py-20 sm:py-24">
        <MehndiPattern className="pointer-events-none absolute -right-16 -bottom-24 h-80 w-80 opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {c.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{c.hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {c.hero.cta}
            </Link>

            <Link
              to="/student-work"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {c.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <Section>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.highlights.map((h, i) => {
            const Icon = [Users, Package, Award, Clock][i] ?? Users;
            return (
              <li key={h.title} className="rounded-2xl border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="mt-3 text-base font-semibold">{h.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{h.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section className="bg-secondary/40">
        <SectionHeading label={t.courses.label} title={t.courses.title} />
        <p className="mt-3 text-xs text-muted-foreground italic">{c.note}</p>

        <div className="mt-10 space-y-6">
          {c.items.map((course) => (
            <article
              key={course.id}
              id={course.id}
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                <div>
                  <h3 className="text-2xl font-semibold">{course.name}</h3>
                  <p className="mt-3 text-muted-foreground">{course.body}</p>

                  <h4 className="mt-6 text-sm font-semibold tracking-wide uppercase">{L.learn}</h4>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {course.learn.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <h4 className="mt-6 text-sm font-semibold tracking-wide uppercase">
                    {L.includes}
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {course.includes.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-secondary/50 p-5">
                  <dl className="space-y-3 text-sm">
                    <Detail icon={GraduationCap} label={L.level} value={course.level} />
                    <Detail icon={Clock} label={L.duration} value={course.duration} />
                    <Detail icon={Clock} label={L.schedule} value={course.schedule} />
                    <Detail icon={Users} label={L.batch} value={course.batch} />
                    <Detail icon={Award} label={L.price} value={course.price} />
                  </dl>
                  <p className="mt-4 text-xs text-muted-foreground italic">{c.priceNote}</p>
                  <Link
                    to="/contact"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >

                    {L.enquire}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="text-3xl font-semibold sm:text-4xl">{c.process.title}</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {c.process.steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 hidden justify-center gap-4 md:flex">
          {[0, 1].map((i) => (
            <ArrowRight
              key={i}
              className="h-6 w-6 text-primary/70 arrow-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
              aria-hidden
            />
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-4 md:hidden">
          {[0, 1].map((i) => (
            <ArrowDown
              key={i}
              className="h-6 w-6 text-primary/70 arrow-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
              aria-hidden
            />
          ))}
        </div>
      </Section>

      <Section className="bg-card">
        <h2 className="text-3xl font-semibold sm:text-4xl">{c.faqTitle}</h2>
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {c.faq.map((item) => (
            <div key={item.q} className="rounded-2xl border border-border bg-background p-6">
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </main>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div>
        <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}
