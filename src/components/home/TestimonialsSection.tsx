import { ArrowDown, Star } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import bridal1 from "@/assets/gallery/bridal-1.jpg";
import arabic1 from "@/assets/gallery/arabic-1.jpg";
import minimal1 from "@/assets/gallery/minimal-1.jpg";
import modern1 from "@/assets/gallery/modern-1.jpg";
import festival1 from "@/assets/gallery/festival-1.jpg";
import floral1 from "@/assets/gallery/floral-1.jpg";
import finger1 from "@/assets/gallery/finger-1.jpg";
import feet1 from "@/assets/gallery/feet-1.jpg";

const galleryImages: Record<string, string> = {
  "bridal-1": bridal1,
  "arabic-1": arabic1,
  "minimal-1": minimal1,
  "modern-1": modern1,
  "festival-1": festival1,
  "floral-1": floral1,
  "finger-1": finger1,
  "feet-1": feet1,
};

const countryFlags: Record<string, string> = {
  Nepal: "🇳🇵",
  India: "🇮🇳",
  China: "🇨🇳",
  尼泊尔: "🇳🇵",
  印度: "🇮🇳",
  中国: "🇨🇳",
};

function resolveImage(key: string) {
  return galleryImages[key] ?? key;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Avatar({ value }: { value: string }) {
  const isInitials = value.length <= 3 && /^[A-Za-z\u4e00-\u9fa5]+$/.test(value);
  return (
    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-primary/10 text-lg font-semibold text-primary">
      {isInitials ? value : (
        <img
          src={resolveImage(value)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function BeforeAfter({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  return (
    <div className="mt-5 grid gap-2">
      <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/40">
        <img
          src={resolveImage(before)}
          alt={beforeLabel}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>
      <div className="flex justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/40">
        <img
          src={resolveImage(after)}
          alt={afterLabel}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const { t, locale } = useLanguage();
  const beforeLabel = locale === "zh" ? "之前" : "Before";
  const afterLabel = locale === "zh" ? "之后" : "After";

  return (
    <Section id="testimonials" className="bg-secondary/40">
      <SectionHeading label={t.testimonials.label} title={t.testimonials.title} align="center" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.testimonials.items.map((item) => (
          <figure
            key={item.name}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 text-center"
          >
            <div className="mx-auto">
              <Avatar value={item.photo} />
            </div>
            <div className="mt-4 flex justify-center">
              <StarRating rating={item.rating} />
            </div>
            <blockquote className="mt-4 text-sm leading-relaxed">{item.review}</blockquote>
            <BeforeAfter
              before={item.before}
              after={item.after}
              beforeLabel={beforeLabel}
              afterLabel={afterLabel}
            />
            <figcaption className="mt-5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{item.name}</span>
              <span className="mx-1">·</span>
              {item.role}
              <span className="mx-1">·</span>
              <span aria-label={item.country}>
                {countryFlags[item.country] ?? ""} {item.country}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
