import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { modernImages, traditionalImages } from "@/lib/design-images";

export function DesignsSection() {
  const { t, locale, homeOverrides } = useLanguage();

  const pickImages = (key: "traditional" | "modern", defaults: string[]) => {
    const override = homeOverrides[locale]?.[key]?.images;
    return override && override.length > 0 ? override : defaults;
  };

  const blocks = [
    {
      id: "traditional",
      data: t.traditional,
      tone: "bg-card",
      images: pickImages("traditional", traditionalImages),
    },
    {
      id: "modern",
      data: t.modern,
      tone: "bg-secondary/40",
      images: pickImages("modern", modernImages),
    },
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
              {block.images.map((src, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-xl bg-accent/30"
                >
                  <img
                    src={src}
                    alt={`${block.data.label} design ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>
      ))}
    </>
  );
}
