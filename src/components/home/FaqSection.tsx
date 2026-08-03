import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";

export function FaqSection() {
  const { t } = useLanguage();

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading label={t.faq.label} title={t.faq.title} />
        <Accordion type="single" collapsible className="w-full">
          {t.faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
