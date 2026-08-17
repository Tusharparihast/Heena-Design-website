import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, QrCode, X } from "lucide-react";
import { WeChatIcon, WhatsAppIcon } from "@/components/site/BrandIcons";
import { useWeChatQr } from "@/components/site/WeChatQr";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";

const POS_KEY = "nd-wechat-fab-pos";
const BTN = 56; // 14 * 4px
const MARGIN = 12;
const PANEL_W = 288; // w-72
const PANEL_H = 380; // approx content height
const GAP = 12;

interface Pos {
  x: number;
  y: number;
}

type Placement = "up" | "down" | "left" | "right";

/** Default position (bottom-right) used before the user drags. */
function defaultPos(): Pos {
  return {
    x: window.innerWidth - BTN - MARGIN,
    y: window.innerHeight - BTN - MARGIN,
  };
}

/** Choose which side the panel opens toward, based on available space. */
function choosePlacement(p: Pos): { placement: Placement; anchoredLeft: boolean } {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const spaceUp = p.y - MARGIN;
  const spaceDown = VH - p.y - BTN - MARGIN;
  const spaceLeft = p.x - MARGIN;
  const spaceRight = VW - p.x - BTN - MARGIN;
  const cands: { dir: Placement; space: number; need: number }[] = [
    { dir: "up", space: spaceUp, need: PANEL_H },
    { dir: "down", space: spaceDown, need: PANEL_H },
    { dir: "left", space: spaceLeft, need: PANEL_W },
    { dir: "right", space: spaceRight, need: PANEL_W },
  ];
  const fitting = cands.filter((c) => c.space >= c.need);
  const pool = fitting.length ? fitting : cands;
  let best = pool[0]!;
  for (const c of pool) if (c.space > best.space) best = c;
  return { placement: best.dir, anchoredLeft: p.x < VW / 2 };
}

/** If the button was dropped in the middle of the screen, slide it to the nearest side. */
function snapToSide(p: Pos): Pos {
  const VW = window.innerWidth;
  const leftEdge = MARGIN;
  const rightEdge = VW - BTN - MARGIN;
  const distLeft = p.x - leftEdge;
  const distRight = rightEdge - p.x;
  const edgeBand = VW * 0.22;
  if (Math.min(distLeft, distRight) > edgeBand) {
    const x = distLeft <= distRight ? leftEdge : rightEdge;
    return { x, y: p.y };
  }
  return p;
}

/**
 * Floating WeChat contact widget.
 * WeChat offers no web chat link, so the panel copies the studio's
 * WeChat ID (with toast feedback), shows a scannable QR that can be
 * expanded, and offers WhatsApp / phone fallbacks.
 * The floating button can be dragged anywhere on screen (touch or mouse);
 * dropped in the middle it slides to the nearest side, and the panel opens
 * up/down/left/right depending on where there is room.
 */
export function FloatingWeChat() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const { openQr, overlay } = useWeChatQr(site.wechatId);
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

  // Restore saved position after hydration (and snap to side if it was mid-screen).
  useEffect(() => {
    let restored: Pos | null = null;
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Pos;
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          restored = clamp(snapToSide(parsed));
        }
      }
    } catch {
      /* ignore */
    }
    if (restored) setPos(restored);
    const onResize = () =>
      setPos((p) => (p ? clamp(snapToSide(p)) : p));
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
        if (!p) return p;
        const snapped = clamp(snapToSide(p));
        try {
          localStorage.setItem(POS_KEY, JSON.stringify(snapped));
        } catch {
          /* ignore */
        }
        return snapped;
      });
      return; // treat as drag, not a click
    }
    setOpen((o) => !o);
  };

  const effectivePos = pos ?? (typeof window !== "undefined" ? defaultPos() : null);
  const { placement, anchoredLeft } = effectivePos
    ? choosePlacement(effectivePos)
    : { placement: "up" as Placement, anchoredLeft: false };

  const panelOpen = open && visible;

  // Panel position relative to the 56×56 root box.
  const panelStyle: React.CSSProperties = {};
  if (placement === "up") {
    panelStyle.bottom = BTN + GAP;
    if (anchoredLeft) panelStyle.left = 0;
    else panelStyle.right = 0;
    panelStyle.transformOrigin = anchoredLeft ? "bottom left" : "bottom right";
  } else if (placement === "down") {
    panelStyle.top = BTN + GAP;
    if (anchoredLeft) panelStyle.left = 0;
    else panelStyle.right = 0;
    panelStyle.transformOrigin = anchoredLeft ? "top left" : "top right";
  } else if (placement === "left") {
    panelStyle.right = BTN + GAP;
    panelStyle.top = "50%";
    panelStyle.transformOrigin = "right center";
  } else {
    panelStyle.left = BTN + GAP;
    panelStyle.top = "50%";
    panelStyle.transformOrigin = "left center";
  }
  const baseTransform = placement === "left" || placement === "right" ? "translateY(-50%) " : "";
  panelStyle.transform = panelOpen
    ? `${baseTransform}scale(1)`
    : `${baseTransform}scale(0.92)`;
  panelStyle.opacity = panelOpen ? 1 : 0;

  return (
    <>
      <div
        ref={rootRef}
        style={
          pos
            ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
            : undefined
        }
        className={`pointer-events-none fixed z-50 flex flex-col ${
          pos ? "" : "right-4 bottom-6 sm:right-7 sm:bottom-8"
        } ${!dragging && pos ? "transition-[left,top] duration-300 ease-out" : ""}`}
      >
        {/* Contact panel */}
        <div
          role="dialog"
          aria-label={t.wechatWidget.title}
          aria-hidden={!open}
          style={panelStyle}
          className={`absolute w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-200 ${
            panelOpen ? "pointer-events-auto" : "pointer-events-none"
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
              onClick={openQr}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            >
              <span>
                <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                  {t.wechatWidget.idLabel}
                </span>
                <span className="block text-sm font-medium">{site.wechatId}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-wechat/15 px-2.5 py-1 text-xs font-medium text-foreground">
                <QrCode className="h-3 w-3" aria-hidden />
                {t.wechatWidget.copy}
              </span>
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

      {overlay}
    </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {t.wechatWidget.copy}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={copyId}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-wechat/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-wechat/25"
            >
              <Copy className="h-3 w-3" aria-hidden />
              {t.wechatWidget.copy}
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground">{t.wechatWidget.qrTapHint}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
