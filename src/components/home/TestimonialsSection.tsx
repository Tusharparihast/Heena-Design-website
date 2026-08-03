import { Quote } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";

export function TestimonialsSection() {
  const { t } = useLanguage();

  return (
    <Section id="testimonials" className="bg-secondary/40">
      <SectionHeading label={t.testimonials.label} title={t.testimonials.title} align="center" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.testimonials.items.map((item) => (
          <figure key={item.name} className="rounded-2xl border border-border bg-card p-6">
            <Quote className="h-5 w-5 text-primary" aria-hidden />
            <blockquote className="mt-4 text-sm leading-relaxed">{item.quote}</blockquote>
            <figcaption className="mt-5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{item.name}</span> · {item.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
