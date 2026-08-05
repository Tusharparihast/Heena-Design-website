import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAboutMedia } from "@/lib/use-homepage-media";


export function AboutSection() {
  const { t } = useLanguage();
  const media = useAboutMedia();

  const stats = [
    { value: t.about.statValue1, label: t.about.stat1 },
    { value: t.about.statValue2, label: t.about.stat2 },
    { value: t.about.statValue3, label: t.about.stat3 },
  ];

  return (
    <Section id="about" className="bg-card">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {media.videoUrl ? (
          <video
            src={media.videoUrl}
            poster={media.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-soft)" }}
          />
        ) : (
          <img
            src={media.imageUrl}
            width={1200}
            height={900}
            loading="lazy"
            alt="Henna cones, dried henna leaves and mehndi stencils arranged on cream cloth"
            className="w-full rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-soft)" }}
          />
        )}

        <div>
          <SectionHeading label={t.about.label} title={t.about.title} />
          <p className="mt-4 text-muted-foreground">{t.about.body1}</p>
          <p className="mt-4 text-muted-foreground">{t.about.body2}</p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-secondary/60 p-4">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-display block text-2xl font-semibold text-primary">
                    {s.value}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}

export function WhySection() {
  const { t } = useLanguage();

  return (
    <Section id="why">
      <SectionHeading label={t.why.label} title={t.why.title} align="center" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {t.why.items.map((item, i) => (
          <article key={item.title} className="rounded-2xl border border-border bg-card p-6">
            <span className="font-display text-3xl text-primary/50">0{i + 1}</span>
            <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
