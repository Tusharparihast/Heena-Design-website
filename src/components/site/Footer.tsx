import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { BrandLogo } from "@/components/site/BrandLogo";
import { useWeChatQr } from "@/components/site/WeChatQr";
import { useLanguage } from "@/i18n/language-context";
import { site } from "@/lib/site";
import { useContactInfo, waLink } from "@/lib/contact-info";

/** Faint four-point mehndi spark used as a background motif. */
function Motif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="currentColor" aria-hidden className={className}>
      <path d="M100 0c5.3 35.8 28.9 59.4 64.7 64.7-35.8 5.3-59.4 28.9-64.7 64.7-5.3-35.8-28.9-59.4-64.7-64.7 35.8-5.3 59.4-28.9 64.7-64.7z" />
      <circle cx="100" cy="100" r="20" />
    </svg>
  );
}

function ReachButton({
  href,
  onClick,
  label,
  filled,
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  filled?: string;
  children: ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl p-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const bubble = filled
    ? "grid h-12 w-12 place-items-center rounded-full text-white shadow-sm transition-transform group-hover:scale-110 group-hover:shadow-md"
    : "grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-all group-hover:border-foreground/40 group-hover:bg-accent/50 group-hover:text-foreground";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${base} cursor-pointer group`}
    >
      <span className={bubble} style={filled ? { backgroundColor: filled } : undefined}>
        {children}
      </span>
    </button>
  ) : (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      aria-label={label}
      title={label}
      className={`${base} group`}
    >
      <span className={bubble} style={filled ? { backgroundColor: filled } : undefined}>
        {children}
      </span>
    </a>
  );
}


export function Footer() {
  const { t, locale } = useLanguage();
  const c = useContactInfo();
  const city = locale === "zh" ? c.cityZh : c.cityEn;
  const hours = locale === "zh" ? c.hoursZh : c.hoursEn;

  const { openQr, overlay } = useWeChatQr(c.wechatId);

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

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-28 sm:px-8 md:py-16">
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
            <BrandLogo className="mb-4 h-24 w-auto" />
            <div className="mb-6 h-px w-12 bg-foreground/30" aria-hidden />
            <Link to="/" className="transition-opacity hover:opacity-80">
              <h2 className="font-display text-4xl tracking-tight md:text-5xl">{site.name}</h2>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground italic">
              {t.footer.tagline}
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-primary">
              <Clock className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold tracking-widest uppercase">{hours}</span>
            </div>
            <div className="mt-8 h-px w-12 bg-foreground/30" aria-hidden />
          </div>

          {/* Reach us — labeled icon buttons, clearly clickable */}
          <div className="order-3">
            <h3 className="mb-6 border-b border-border pb-2 text-xs font-light tracking-[0.2em] uppercase">
              {t.footer.reach}
            </h3>
            <div className="flex flex-wrap gap-1">
              <ReachButton label={t.contact.wechat} onClick={openQr} filled="#07C160">
                <WeChatIcon className="h-5 w-5" fill="#ffffff" aria-hidden />
              </ReachButton>
              <ReachButton
                label={t.contact.whatsapp}
                href={waLink(c.whatsapp)}
                filled="#25D366"
              >
                <WhatsAppIcon className="h-5 w-5" fill="#ffffff" aria-hidden />
              </ReachButton>
              <ReachButton label={t.contact.phone} href={`tel:${c.phone}`}>
                <Phone className="h-5 w-5" aria-hidden />
              </ReachButton>
              <ReachButton label={t.contact.instagram} href={c.instagram}>
                <Instagram className="h-5 w-5" aria-hidden />
              </ReachButton>
              <ReachButton label={t.contact.facebook} href={c.facebook}>
                <Facebook className="h-5 w-5" aria-hidden />
              </ReachButton>
              <ReachButton label={t.contact.email} href={`mailto:${c.email}`}>
                <Mail className="h-5 w-5" aria-hidden />
              </ReachButton>
              <ReachButton label={city} href={c.mapUrl}>
                <MapPin className="h-5 w-5" aria-hidden />
              </ReachButton>
            </div>
            <p className="mt-6 text-xs tracking-wider text-muted-foreground uppercase">{city}</p>
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
      {overlay}
    </footer>
  );
}
