import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/language-context";
import { effectiveFaqItems, faqSectionHeading, faqText, useFaqOverrides } from "@/lib/faq-overrides";

export function FaqSection() {
  const { locale } = useLanguage();
  const overrides = useFaqOverrides();
  const items = effectiveFaqItems(overrides);
  const heading = faqSectionHeading(overrides);
  const zh = locale === "zh";

  if (items.length === 0) return null;

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading
          label={zh ? heading.labelZh || heading.labelEn : heading.labelEn}
          title={zh ? heading.titleZh || heading.titleEn : heading.titleEn}
        />
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => {
            const { q, a } = faqText(item, locale);
            return (
              <AccordionItem key={item.id} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-lg md:text-xl font-medium">{q}</AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-base md:text-lg leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </Section>
  );
}
