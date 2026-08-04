import type { ComponentType } from "react";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

export function ContactSection() {
  const { t } = useLanguage();

  const channels: Array<{
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    label: string;
    value: string;
    href?: string;
  }> = [
    { icon: WeChatIcon, label: t.contact.wechat, value: site.wechatId },
    {
      icon: WhatsAppIcon,
      label: t.contact.whatsapp,
      value: site.whatsapp,
      href: `https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`,
    },
    { icon: Phone, label: t.contact.phone, value: site.phone, href: `tel:${site.phone}` },
    { icon: Instagram, label: t.contact.instagram, value: "@mehndi", href: site.instagram },
    { icon: Facebook, label: t.contact.facebook, value: site.name, href: site.facebook },
    { icon: Mail, label: t.contact.email, value: site.email, href: `mailto:${site.email}` },
  ];

  return (
    <Section id="contact" className="bg-card">
      <SectionHeading label={t.contact.label} title={t.contact.title} body={t.contact.body} />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ul className="grid gap-4 sm:grid-cols-2">
          {channels.map((c) => {
            const Icon = c.icon;
            const inner = (
              <span className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block text-sm text-muted-foreground">{c.value}</span>
                </span>
              </span>
            );
            return (
              <li
                key={c.label}
                className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-accent/40"
              >
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>

        <div className="rounded-2xl border border-border bg-secondary/50 p-6">
          <h3 className="text-lg font-semibold">{t.contact.location}</h3>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
            {site.city}
          </p>
          <h3 className="mt-6 text-lg font-semibold">{t.contact.hours}</h3>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
            {site.hours}
          </p>
          <a
            href={site.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.contact.directions}
          </a>
        </div>
      </div>
    </Section>
  );
}
