import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";
import { useContactInfo } from "@/lib/contact-info";

/**
 * Shared WeChat QR overlay used by every WeChat contact touchpoint
 * (contact section, footer, floating widget). Opening it copies the
 * WeChat ID and shows a single copy/copied confirmation control.
 */
export function WeChatQrOverlay({
  wechatId,
  qrImage,
  onClose,
  copied,
  onCopy,
}: {
  wechatId: string;
  qrImage?: string;
  onClose: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-6">
      <button
        type="button"
        aria-label={t.wechatWidget.close}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-xs rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.wechatWidget.close}
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p className="text-sm font-semibold">{t.wechatWidget.title}</p>
        <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-3">
          {qrImage ? (
            <img src={qrImage} alt={`${t.wechatWidget.qrTitle} — ${wechatId}`} className="h-[200px] w-[200px] object-contain" />
          ) : (
            <QRCodeSVG value={wechatId} size={200} level="M" />
          )}
        </div>
        <p className="mt-4 text-sm font-medium">{wechatId}</p>

        <button
          type="button"
          onClick={onCopy}
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            copied ? "bg-wechat/20 text-wechat" : "bg-wechat/10 text-foreground hover:bg-wechat/20"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t.wechatWidget.qrCopied}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {t.wechatWidget.copy}
            </>
          )}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">{t.wechatWidget.qrTapHint}</p>
      </div>
    </div>
  );
}

/**
 * Hook wiring the WeChat "copy ID + expand QR" behaviour.
 * Render `overlay` anywhere in the tree and call `openQr()` on the
 * WeChat contact control.
 */
export function useWeChatQr(wechatIdOverride?: string) {
  const { t } = useLanguage();
  const info = useContactInfo();
  const wechatId = wechatIdOverride || info.wechatId || site.wechatId;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
    } catch {
      /* clipboard may be blocked; still confirm visually */
    }
    toast.success(t.contact.copied);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  }, [t.contact.copied, wechatId]);

  const openQr = useCallback(() => {
    setOpen(true);
    void copyId();
  }, [copyId]);

  const overlay = open ? (
    <WeChatQrOverlay
      wechatId={wechatId}
      qrImage={info.wechatQr}
      copied={copied}
      onCopy={() => void copyId()}
      onClose={() => setOpen(false)}
    />
  ) : null;

  return { openQr, overlay, copyId, copied, qrOpen: open, setQrOpen: setOpen };
}
