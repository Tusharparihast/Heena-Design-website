import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

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
  }> = [
    { icon: WeChatIcon, label: t.contact.wechat, onClick: copyWechatId },
    {
      icon: WhatsAppIcon,
      label: t.contact.whatsapp,
      href: `https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`,
    },
    { icon: Phone, label: t.contact.phone, href: `tel:${site.phone}` },
    { icon: Instagram, label: t.contact.instagram, href: site.instagram },
    { icon: Facebook, label: t.contact.facebook, href: site.facebook },
    { icon: Mail, label: t.contact.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: site.city, href: site.mapUrl },
  ];

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{site.name}</h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase">{t.footer.explore}</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/gallery" className="hover:text-foreground">
                {t.nav.gallery}
              </Link>
            </li>
            <li>
              <Link to="/courses" className="hover:text-foreground">
                {t.nav.courses}
              </Link>
            </li>
            <li>
              <Link to="/custom-design" className="hover:text-foreground">
                {t.nav.custom}
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-foreground">
                {t.nav.shop}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                {t.nav.about}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase">{t.footer.reach}</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              {t.contact.wechat}: {site.wechatId}
            </li>
            <li>
              {t.contact.whatsapp}: {site.whatsapp}
            </li>
            <li>
              {t.contact.phone}: {site.phone}
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-foreground">
                {site.email}
              </a>
            </li>
            <li>
              {t.contact.hours}: {site.hours}
            </li>
            <li>
              <a
                href={site.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                {site.city}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {site.name}. {t.footer.rights}
      </div>
    </footer>
  );
}
