import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { resolveTestimonialImage } from "@/lib/testimonial-images";
import {
  useEffectiveTestimonials,
  type ResolvedTestimonial,
} from "@/lib/testimonial-overrides";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const countryFlags: Record<string, string> = {
  Nepal: "🇳🇵",
  India: "🇮🇳",
  China: "🇨🇳",
  尼泊尔: "🇳🇵",
  印度: "🇮🇳",
  中国: "🇨🇳",
};

function Avatar({ value, name }: { value: string; name: string }) {
  return (
    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary/30 bg-primary/10">
      <img
        src={resolveTestimonialImage(value)}
        alt={name}
        loading="lazy"
        decoding="async"
        width={512}
        height={512}
        className="h-full w-full object-cover"
      />
    </div>
  );
}


function BeforeAfter({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  const [pos, setPos] = useState(50);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative mt-5 select-none overflow-hidden rounded-xl border border-border bg-secondary/40 touch-none"
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (dragging.current) setFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        dragging.current = false;
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        dragging.current = false;
      }}
    >
      <img
        src={resolveTestimonialImage(after)}
        alt={afterLabel}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img
          src={resolveTestimonialImage(before)}
          alt={beforeLabel}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
        {afterLabel}
      </span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-background/90" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-primary shadow-md">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 6 4 12l5 6M15 6l5 6-5 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`${beforeLabel} / ${afterLabel}`}
        className="absolute inset-x-0 bottom-0 h-8 w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

function TestimonialCard({
  item,
  beforeLabel,
  afterLabel,
}: {
  item: ResolvedTestimonial;
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <figure className="flex h-full w-full flex-col rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto">
        <Avatar value={item.photo} name={item.name} />
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-foreground">{item.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span aria-label={item.country}>
            {countryFlags[item.country] ?? ""} {item.country}
          </span>
          <span className="mx-1">·</span>
          {item.role}
        </p>
        <p className="mt-2 flex items-center justify-center gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < item.rating ? "fill-primary text-primary" : "fill-muted text-muted"}`}
            />
          ))}
        </p>
      </div>
      <blockquote className="mt-4 flex-grow text-sm leading-relaxed">{item.review}</blockquote>
      <BeforeAfter
        before={item.before}
        after={item.after}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
      />
    </figure>
  );
}

export function TestimonialsSection() {
  const { t, locale } = useLanguage();
  const beforeLabel = locale === "zh" ? "之前" : "Before";
  const afterLabel = locale === "zh" ? "之后" : "After";
  const section = useEffectiveTestimonials(locale);
  const items = section.items;

  const [active, setActive] = useState(0);
  const [perPage, setPerPage] = useState(3);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const lastPointerX = useRef<number | null>(null);
  const pointerDown = useRef(false);
  const maxIndex = Math.max(0, items.length - perPage);

  useEffect(() => {
    const update = () => {
      setPerPage(window.innerWidth < 768 ? 1 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setActive((prev) => Math.min(prev, maxIndex));
  }, [perPage, maxIndex]);

  const prev = useCallback(() => {
    setActive((idx) => (idx <= 0 ? maxIndex : idx - 1));
  }, [maxIndex]);

  const next = useCallback(() => {
    setActive((idx) => (idx >= maxIndex ? 0 : idx + 1));
  }, [maxIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDown.current = true;
    lastPointerX.current = e.clientX;
    touchStartX.current = e.clientX;
    if (trackRef.current) trackRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current || lastPointerX.current == null) return;
    lastPointerX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerDown.current || touchStartX.current == null) return;
    pointerDown.current = false;
    const diff = e.clientX - touchStartX.current;
    if (diff < -40) next();
    else if (diff > 40) prev();
  };

  const handlePointerCancel = () => {
    pointerDown.current = false;
    touchStartX.current = null;
    lastPointerX.current = null;
  };

  return (
    <Section id="testimonials" className="bg-secondary/40">
      <SectionHeading label={section.label} title={section.title} align="center" />
      <div className="relative mx-auto mt-12 max-w-6xl">
        <button
          type="button"
          onClick={prev}
          aria-label={t.testimonials.prev}
          className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background p-2 text-primary shadow-sm transition hover:bg-primary/10 hover:shadow-md md:-left-5 md:block md:p-3"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={next}
          aria-label={t.testimonials.next}
          className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background p-2 text-primary shadow-sm transition hover:bg-primary/10 hover:shadow-md md:-right-5 md:block md:p-3"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          className="overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div
            ref={trackRef}
            className="flex touch-pan-y transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${active * (100 / perPage)}%)` }}
          >
            {items.map((item) => (
              <div
                key={item.name}
                className="w-full shrink-0 px-3 md:w-1/3"
              >
                <TestimonialCard item={item} beforeLabel={beforeLabel} afterLabel={afterLabel} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${t.testimonials.slide} ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground md:hidden">
          {t.testimonials.swipeHint}
        </div>
      </div>
    </Section>
  );
}
