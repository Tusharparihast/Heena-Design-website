import type { ComponentType } from "react";
import { Clock, Copy, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { Section, SectionHeading } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

export function ContactSection() {
  const { t } = useLanguage();

  const copyWechatId = async () => {
    try {
      await navigator.clipboard.writeText(site.wechatId);
      toast.success(t.contact.copied);
    } catch {
      toast.error(site.wechatId);
    }
  };

  const channels: Array<{
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    label: string;
    value: string;
    href?: string;
    onClick?: () => void;
    hint?: string;
  }> = [
    {
      icon: WeChatIcon,
      label: t.contact.wechat,
      value: site.wechatId,
      onClick: copyWechatId,
      hint: t.contact.copyWechat,
    },
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
                  {c.hint ? (
                    <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                      <Copy className="h-3 w-3" aria-hidden />
                      {c.hint}
                    </span>
                  ) : null}
                </span>
              </span>
            );
            return (
              <li
                key={c.label}
                className="rounded-xl border border-border bg-background transition-colors hover:bg-accent/40"
              >
                {c.onClick ? (
                  <button
                    type="button"
                    onClick={c.onClick}
                    className="block w-full cursor-pointer p-4 text-left"
                  >
                    {inner}
                  </button>
                ) : c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer" className="block p-4">
                    {inner}
                  </a>
                ) : (
                  <div className="p-4">{inner}</div>
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
