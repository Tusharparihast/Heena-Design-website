import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Section, SectionHeading } from "@/components/site/Section";
import { SectionDivider } from "@/components/site/SectionDivider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/language-context";
import { pickLang, pickList, useAboutContent } from "@/lib/about-content";
import { site } from "@/lib/site";
import { useVideoSrc } from "@/lib/use-video-src";

const title = "About Nagma Designs — Mehndi Studio in Maitidevi, Kathmandu";
const description =
  "A small home studio in Maitidevi, Kathmandu, drawing traditional and modern mehndi and teaching the craft in person, open 9 AM to 9 PM.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

function paragraphs(value: string): string[] {
  return value
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

function BehindTheScenesVideo({
  src,
  poster,
  title,
}: {
  src: string;
  poster: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  useVideoSrc(videoRef, src, poster);

  // Autoplay when scrolled into view, pause when it scrolls away.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="mx-auto mt-10 w-full max-w-3xl">
      <video
        key={src}
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight);
        }}
        className="w-full rounded-2xl bg-black object-contain"
        style={{
          aspectRatio: aspect,
          maxHeight: "70vh",
          marginInline: "auto",
          boxShadow: "var(--shadow-soft)",
        }}
        aria-label={title}
      />
    </div>
  );
}

function AboutPage() {
  const { locale } = useLanguage();
  const { about } = useAboutContent();
  const pick = (en: string, zh: string) => pickLang(en, zh, locale);

  return (
    <main>
      {/* Hero */}
      <section className="px-4 pt-28 pb-16 sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{site.name}</p>
            <h1 className="font-display mt-3 text-4xl font-semibold sm:text-5xl">
              {pick(about.heroTitleEn, about.heroTitleZh)}
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground">{pick(about.heroBodyEn, about.heroBodyZh)}</p>
          </div>
          <img
            src={about.heroImageUrl}
            alt={pick(about.heroTitleEn, about.heroTitleZh)}
            width={1200}
            height={900}
            className="aspect-4/3 w-full rounded-3xl object-cover"
            style={{ boxShadow: "var(--shadow-soft)" }}
          />
        </div>
      </section>

      <SectionDivider pattern="vine" />

      {/* Story */}
      <Section id="story" className="bg-card">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <img
            src={about.storyImageUrl}
            alt={pick(about.storyTitleEn, about.storyTitleZh)}
            width={1000}
            height={1000}
            loading="lazy"
            className="aspect-square w-full rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-soft)" }}
          />
          <div>
            <SectionHeading label={site.city} title={pick(about.storyTitleEn, about.storyTitleZh)} />
            <div className="mt-4 space-y-4 text-muted-foreground">
              {paragraphs(pick(about.storyBodyEn, about.storyBodyZh)).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <SectionDivider pattern="flower" />

      {/* Values */}
      <Section id="values">
        <SectionHeading
          label={locale === "zh" ? "理念" : "Values"}
          title={pick(about.valuesTitleEn, about.valuesTitleZh)}
          align="center"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.values.map((v, i) => (
            <article key={`${v.titleEn}-${i}`} className="rounded-2xl border border-border bg-card p-6">
              <span className="font-display text-3xl text-primary/50">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{pick(v.titleEn, v.titleZh)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pick(v.bodyEn, v.bodyZh)}</p>
            </article>
          ))}
        </div>
      </Section>

      <SectionDivider pattern="mandala" />

      {/* Art gallery */}
      <Section id="art" className="bg-card">
        <SectionHeading
          label={locale === "zh" ? "作品" : "Craft"}
          title={pick(about.artTitleEn, about.artTitleZh)}
          body={pick(about.artBodyEn, about.artBodyZh)}
          align="center"
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {about.artImages.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`${pick(about.artTitleEn, about.artTitleZh)} ${i + 1}`}
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full rounded-xl object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          ))}
        </div>
      </Section>

      <SectionDivider pattern="vine-mandala" />

      {/* Teaching approach */}
      <Section id="teaching">
        <SectionHeading
          label={locale === "zh" ? "教学" : "Teaching"}
          title={pick(about.teachingTitleEn, about.teachingTitleZh)}
          align="center"
        />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.teaching.map((step, i) => (
            <li key={`${step.titleEn}-${i}`} className="relative rounded-2xl bg-secondary/60 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{pick(step.titleEn, step.titleZh)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pick(step.bodyEn, step.bodyZh)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <SectionDivider pattern="flower" />

      {/* Artist */}
      <Section id="artist" className="bg-card">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <img
            src={about.artistImageUrl}
            alt={pick(about.artistNameEn, about.artistNameZh)}
            width={900}
            height={1100}
            loading="lazy"
            className="aspect-4/5 w-full rounded-3xl object-cover"
            style={{ boxShadow: "var(--shadow-soft)" }}
          />
          <div>
            <SectionHeading
              label={pick(about.artistTitleEn, about.artistTitleZh)}
              title={pick(about.artistNameEn, about.artistNameZh)}
            />
            <p className="mt-2 text-sm font-medium text-primary">{pick(about.artistRoleEn, about.artistRoleZh)}</p>
            <div className="mt-4 space-y-4 text-muted-foreground">
              {paragraphs(pick(about.artistBodyEn, about.artistBodyZh)).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <SectionDivider pattern="vine" />

      {/* Studio */}
      <Section id="studio">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              label={locale === "zh" ? "工作室" : "Studio"}
              title={pick(about.studioTitleEn, about.studioTitleZh)}
              body={pick(about.studioBodyEn, about.studioBodyZh)}
            />
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <dd>{pick(about.studioAddressEn, about.studioAddressZh)}</dd>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <dd>{pick(about.studioHoursEn, about.studioHoursZh)}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="mt-6">
              <a href={site.mapUrl} target="_blank" rel="noreferrer">
                {locale === "zh" ? "在地图中查看" : "Open in Maps"}
              </a>
            </Button>
          </div>
          <img
            src={about.studioImageUrl}
            alt={pick(about.studioTitleEn, about.studioTitleZh)}
            width={1200}
            height={900}
            loading="lazy"
            className="aspect-4/3 w-full rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-soft)" }}
          />
        </div>
      </Section>

      <SectionDivider pattern="mandala" />

      {/* Behind the scenes video */}
      <Section id="behind-the-scenes" className="bg-card">
        <SectionHeading
          label={locale === "zh" ? "视频" : "Video"}
          title={pick(about.videoTitleEn, about.videoTitleZh)}
          body={pick(about.videoBodyEn, about.videoBodyZh)}
          align="center"
        />
        <BehindTheScenesVideo
          src={about.videoUrl}
          poster={about.videoPosterUrl}
          title={pick(about.videoTitleEn, about.videoTitleZh)}
        />
      </Section>

      <SectionDivider pattern="vine-mandala" />

      {/* Why learn with us */}
      <Section id="why-learn">
        <SectionHeading
          label={locale === "zh" ? "优势" : "Why us"}
          title={pick(about.whyTitleEn, about.whyTitleZh)}
          align="center"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.why.map((item, i) => (
            <article key={`${item.titleEn}-${i}`} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">{pick(item.titleEn, item.titleZh)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pick(item.bodyEn, item.bodyZh)}</p>
            </article>
          ))}
        </div>
      </Section>

      <SectionDivider pattern="flower" />

      {/* International students */}
      <Section id="international" className="bg-card">
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionHeading
            label={locale === "zh" ? "国际" : "International"}
            title={pick(about.intlTitleEn, about.intlTitleZh)}
            body={pick(about.intlBodyEn, about.intlBodyZh)}
          />
          <ul className="space-y-3">
            {pickList(about.intlPointsEn, about.intlPointsZh, locale).map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <SectionDivider pattern="vine" />

      {/* Final CTA */}
      <Section id="about-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{pick(about.ctaTitleEn, about.ctaTitleZh)}</h2>
          <p className="mt-4 text-muted-foreground">{pick(about.ctaBodyEn, about.ctaBodyZh)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/courses">{locale === "zh" ? "浏览课程" : "Explore Courses"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/gallery">{locale === "zh" ? "查看作品集" : "View Gallery"}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
