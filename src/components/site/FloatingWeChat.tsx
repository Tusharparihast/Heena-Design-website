import { useEffect, useRef, useState } from "react";
import { Phone, QrCode, X } from "lucide-react";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { useWeChatQr } from "@/components/site/WeChatQr";
import { useLanguage } from "@/i18n/language-context";
import { useContactInfo, waLink } from "@/lib/contact-info";

/**
 * Floating WeChat contact widget, fixed to the bottom-right corner.
 * WeChat offers no web chat link, so the panel copies the studio's
 * WeChat ID (with toast feedback), shows a scannable QR that can be
 * expanded, and offers WhatsApp / phone fallbacks.
 */
export function FloatingWeChat() {
  const { t } = useLanguage();
  const c = useContactInfo();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const { openQr, overlay } = useWeChatQr(c.wechatId);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const panelOpen = open && visible;

  return (
    <>
      <div ref={rootRef} className="pointer-events-none fixed right-4 bottom-6 z-50 flex flex-col sm:right-7 sm:bottom-8">
        {/* Contact panel */}
        <div
          role="dialog"
          aria-label={t.wechatWidget.title}
          aria-hidden={!open}
          className={`absolute right-0 bottom-[68px] w-72 max-w-[calc(100vw-2rem)] origin-bottom-right rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-200 ${
            panelOpen ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          } ${open ? "" : "invisible"}`}
        >
          <div className="flex items-center gap-3 border-b border-border p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-wechat/15 text-wechat">
              <WeChatIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.wechatWidget.title}</p>
              <p className="truncate text-xs text-muted-foreground">Nagma Designs</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.wechatWidget.close}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">{t.wechatWidget.body}</p>

            <button
              type="button"
              onClick={openQr}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            >
              <span>
                <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                  {t.wechatWidget.idLabel}
                </span>
                <span className="block text-sm font-medium">{c.wechatId}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-wechat/15 px-2.5 py-1 text-xs font-medium text-foreground">
                <QrCode className="h-3 w-3" aria-hidden />
                {t.wechatWidget.copy}
              </span>
            </button>

            <a
              href={waLink(c.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent/40"
            >
              <WhatsAppIcon className="h-5 w-5" fill="#25D366" />
              {t.wechatWidget.whatsapp}
            </a>

            <a
              href={`tel:${c.phone}`}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent/40"
            >
              <Phone className="h-5 w-5 text-primary" aria-hidden />
              {t.wechatWidget.phone}
            </a>
          </div>
        </div>

        {/* Floating toggle button — fixed in place */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? t.wechatWidget.close : t.wechatWidget.open}
          className="pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full bg-wechat shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="wechat-ping absolute inset-0 rounded-full bg-wechat" aria-hidden />
          <span className="wechat-float relative grid place-items-center">
            {open ? (
              <X className="h-6 w-6 text-white" aria-hidden />
            ) : (
              <WeChatIcon className="h-7 w-7" fill="#ffffff" aria-hidden />
            )}
          </span>
        </button>
      </div>

      {overlay}
    </>
  );
}
