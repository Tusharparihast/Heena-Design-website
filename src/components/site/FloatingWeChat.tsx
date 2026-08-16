import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Phone, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

const POS_KEY = "nd-wechat-fab-pos";
const BTN = 56; // 14 * 4px
const MARGIN = 12;

interface Pos {
  x: number;
  y: number;
}

/**
 * Floating WeChat contact widget.
 * WeChat offers no web chat link, so the panel copies the studio's
 * WeChat ID (with toast feedback), shows a scannable QR that can be
 * expanded, and offers WhatsApp / phone fallbacks.
 * The floating button can be dragged anywhere on screen (touch or mouse).
 */
export function FloatingWeChat() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  const clamp = useCallback((p: Pos): Pos => {
    const maxX = window.innerWidth - BTN - MARGIN;
    const maxY = window.innerHeight - BTN - MARGIN;
    return {
      x: Math.min(Math.max(p.x, MARGIN), Math.max(MARGIN, maxX)),
      y: Math.min(Math.max(p.y, MARGIN), Math.max(MARGIN, maxY)),
    };
  }, []);

  // Restore saved position after hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Pos;
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") setPos(clamp(parsed));
      }
    } catch {
      /* ignore */
    }
    const onResize = () => setPos((p) => (p ? clamp(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQrOpen(false);
        setOpen(false);
      }
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

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(site.wechatId);
      toast.success(t.contact.copied);
    } catch {
      toast.error(site.wechatId);
    }
  };

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const next = clamp({ x: e.clientX - d.dx, y: e.clientY - d.dy });
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    setPos(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (d?.moved) {
      setDragging(false);
      setPos((p) => {
        if (p) {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(p));
          } catch {
            /* ignore */
          }
        }
        return p;
      });
      return; // treat as drag, not a click
    }
    setOpen((o) => !o);
  };

  const panelOpen = open && visible;
  const anchoredLeft = pos != null && typeof window !== "undefined" && pos.x < window.innerWidth / 2;

  return (
    <>
      <div
        ref={rootRef}
        style={
          pos
            ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
            : undefined
        }
        className={`pointer-events-none fixed z-50 flex flex-col gap-3 ${
          pos ? "" : "right-4 bottom-6 sm:right-7 sm:bottom-8"
        } ${anchoredLeft ? "items-start" : "items-end"}`}
      >
        {/* Contact panel */}
        <div
          role="dialog"
          aria-label={t.wechatWidget.title}
          aria-hidden={!open}
          className={`absolute bottom-[calc(100%+0.75rem)] w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-200 ${
            anchoredLeft ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"
          } ${
            panelOpen
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-90 opacity-0"
          } ${open ? "" : "invisible"}`}
        >
          <div className="flex items-center gap-3 border-b border-border p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-wechat/15 text-wechat">
              <WeChatIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.wechatWidget.title}</p>
              <p className="truncate text-xs text-muted-foreground">{site.name}</p>
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
              onClick={copyId}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            >
              <span>
                <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                  {t.wechatWidget.idLabel}
                </span>
                <span className="block text-sm font-medium">{site.wechatId}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-wechat/15 px-2.5 py-1 text-xs font-medium text-foreground">
                <Copy className="h-3 w-3" aria-hidden />
                {t.wechatWidget.copy}
              </span>
            </button>

            {/* QR — tap to expand, copies the ID at the same time */}
            <button
              type="button"
              onClick={() => {
                setQrOpen(true);
                void copyId();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            >
              <span className="rounded-lg bg-white p-1.5">
                <QRCodeSVG value={site.wechatId} size={44} level="M" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {t.wechatWidget.qrTitle}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t.wechatWidget.qrHint}
                </span>
              </span>
              <QrCode className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>

            <a
              href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent/40"
            >
              <WhatsAppIcon className="h-5 w-5" fill="#25D366" />
              {t.wechatWidget.whatsapp}
            </a>
            <a
              href={`tel:${site.phone}`}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent/40"
            >
              <Phone className="h-5 w-5 text-primary" aria-hidden />
              {t.wechatWidget.phone}
            </a>
          </div>
        </div>

        {/* Floating toggle button — draggable */}
        <button
          type="button"
          onPointerDown={startDrag}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
          onPointerCancel={() => {
            dragRef.current = null;
            setDragging(false);
          }}
          aria-expanded={open}
          aria-label={open ? t.wechatWidget.close : t.wechatWidget.open}
          className={`pointer-events-auto relative grid h-14 w-14 touch-none place-items-center rounded-full bg-wechat shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            dragging ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-105"
          }`}
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

      {/* Expanded QR overlay */}
      {qrOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center p-6">
          <button
            type="button"
            aria-label={t.wechatWidget.close}
            onClick={() => setQrOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-xs rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label={t.wechatWidget.close}
              className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-sm font-semibold">{t.wechatWidget.title}</p>
            <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-3">
              <QRCodeSVG value={site.wechatId} size={200} level="M" />
            </div>
            <p className="mt-4 text-sm font-medium">{site.wechatId}</p>
            <button
              type="button"
              onClick={copyId}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-wechat/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-wechat/25"
            >
              <Copy className="h-3 w-3" aria-hidden />
              {t.wechatWidget.copy}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
