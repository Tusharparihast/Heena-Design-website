import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";

import bridal from "@/assets/gallery/bridal-1.jpg";
import arabic from "@/assets/gallery/arabic-1.jpg";
import minimal from "@/assets/gallery/minimal-1.jpg";
import modern from "@/assets/gallery/modern-1.jpg";
import festival from "@/assets/gallery/festival-1.jpg";
import floral from "@/assets/gallery/floral-1.jpg";
import finger from "@/assets/gallery/finger-1.jpg";
import feet from "@/assets/gallery/feet-1.jpg";

const traditionalImages = [
  { src: bridal, alt: "Traditional bridal full-hand panel" },
  { src: feet, alt: "Traditional bridal feet design" },
  { src: festival, alt: "Traditional festival mehndi" },
  { src: floral, alt: "Traditional floral vine" },
  { src: finger, alt: "Traditional finger detailing" },
  { src: arabic, alt: "Traditional Arabic flowing pattern" },
];

const modernImages = [
  { src: modern, alt: "Modern mandala design" },
  { src: minimal, alt: "Minimal dotted line design" },
  { src: arabic, alt: "Modern Arabic flowing pattern" },
  { src: floral, alt: "Modern floral trail" },
  { src: finger, alt: "Modern finger tip design" },
  { src: festival, alt: "Modern festival style" },
];

export function DesignsSection() {
  const { t } = useLanguage();

  const blocks = [
    { id: "traditional", data: t.traditional, tone: "bg-card", images: traditionalImages },
    { id: "modern", data: t.modern, tone: "bg-secondary/40", images: modernImages },
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
              {block.images.map((img, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-xl bg-accent/30"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
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
