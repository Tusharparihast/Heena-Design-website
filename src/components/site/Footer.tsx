import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

/** Faint four-point mehndi spark used as a background motif. */
function Motif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="currentColor" aria-hidden className={className}>
      <path d="M100 0c5.3 35.8 28.9 59.4 64.7 64.7-35.8 5.3-59.4 28.9-64.7 64.7-5.3-35.8-28.9-59.4-64.7-64.7 35.8-5.3 59.4-28.9 64.7-64.7z" />
      <circle cx="100" cy="100" r="20" />
    </svg>
  );
}

export function Footer() {
  const { t } = useLanguage();

  const copyWechatId = async () => {
    try {
      await navigator.clipboard.writeText(site.wechatId);
      toast.success(t.contact.copied);
    } catch {
      toast.error(site.wechatId);
    }
  };

  const reachLinks: Array<{
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    label: string;
    href?: string;
    onClick?: () => void;
    /** Brand-filled bubble (WeChat / WhatsApp) vs. quiet bordered bubble. */
    filled?: string;
  }> = [
    { icon: WeChatIcon, label: t.contact.wechat, onClick: copyWechatId, filled: "#07C160" },
    {
      icon: WhatsAppIcon,
      label: t.contact.whatsapp,
      href: `https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`,
      filled: "#25D366",
    },
    { icon: Phone, label: t.contact.phone, href: `tel:${site.phone}` },
    { icon: Instagram, label: t.contact.instagram, href: site.instagram },
    { icon: Facebook, label: t.contact.facebook, href: site.facebook },
    { icon: Mail, label: t.contact.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: site.city, href: site.mapUrl },
  ];

  const exploreLinks = [
    { to: "/gallery", label: t.nav.gallery },
    { to: "/shop", label: t.nav.shop },
    { to: "/courses", label: t.nav.courses },
    { to: "/about", label: t.nav.about },
    { to: "/custom-design", label: t.nav.custom },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <footer className="relative overflow-hidden border-t border-border bg-secondary/40">
      {/* Faint mehndi motifs */}
      <Motif className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 text-foreground opacity-[0.04] sm:h-96 sm:w-96" />
      <Motif className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 text-foreground opacity-[0.04] sm:h-72 sm:w-72" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-3 md:gap-16">
          {/* Explore — left on desktop, after brand on mobile */}
          <div className="order-2 md:order-1">
            <h3 className="mb-6 border-b border-border pb-2 text-xs font-light tracking-[0.2em] uppercase">
              {t.footer.explore}
            </h3>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm tracking-wide text-muted-foreground">
              {exploreLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand — centered seal */}
          <div className="order-1 flex flex-col items-center px-4 text-center md:order-2">
            <div className="mb-6 h-px w-12 bg-foreground/30" aria-hidden />
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">{site.name}</h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground italic">
              {t.footer.tagline}
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-primary">
              <Clock className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold tracking-widest uppercase">{site.hours}</span>
            </div>
            <div className="mt-8 h-px w-12 bg-foreground/30" aria-hidden />
          </div>

          {/* Reach us */}
          <div className="order-3">
            <h3 className="mb-6 border-b border-border pb-2 text-xs font-light tracking-[0.2em] uppercase">
              {t.footer.reach}
            </h3>
            <ul className="flex flex-wrap gap-3">
              {reachLinks.map((c) => {
                const Icon = c.icon;
                const cls = c.filled
                  ? "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-110"
                  : "flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground";
                const style = c.filled ? { backgroundColor: c.filled } : undefined;
                return (
                  <li key={c.label}>
                    {c.onClick ? (
                      <button
                        type="button"
                        onClick={c.onClick}
                        aria-label={c.label}
                        title={c.label}
                        className={cls}
                        style={style}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </button>
                    ) : (
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={c.label}
                        title={c.label}
                        className={cls}
                        style={style}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-xs tracking-wider text-muted-foreground uppercase">{site.city}</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-8 text-[11px] tracking-[0.2em] text-muted-foreground/70 uppercase md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. {t.footer.rights}
          </p>
          <p>{t.footer.motto}</p>
        </div>
      </div>
    </footer>
  );
}
