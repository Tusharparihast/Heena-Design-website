import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";

export function DesignsSection() {
  const { t } = useLanguage();

  const blocks = [
    { id: "traditional", data: t.traditional, tone: "bg-card" },
    { id: "modern", data: t.modern, tone: "bg-secondary/40" },
  ];

  return (
    <>
      {blocks.map((block) => (
        <Section key={block.id} id={block.id} className={block.tone}>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                label={block.data.label}
                title={block.data.title}
                body={block.data.body}
              />
              <ul className="mt-6 flex flex-wrap gap-2">
                {block.data.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-xl bg-accent/60 text-xs text-muted-foreground"
                >
                  {t.common.placeholder.slice(0, 11)}
                </div>
              ))}
            </div>
          </div>
        </Section>
      ))}
    </>
  );
}
