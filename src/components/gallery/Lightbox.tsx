import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { site } from "@/lib/site";
import type { GalleryItem } from "@/lib/gallery";

export function Lightbox({
  item,
  label,
  labels,
  onClose,
  onPrev,
  onNext,
}: {
  item: GalleryItem;
  label: string;
  labels: { close: string; prev: string; next: string; zoom: string; fullscreen: string };
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setZoomed(false), [item.id]);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [handleKey]);

  const toggleFullscreen = () => {
    const node = containerRef.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void node.requestFullscreen?.();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-foreground/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="truncate px-2 text-sm text-background">{label}</p>
        <div className="flex items-center gap-1">
          <IconButton label={labels.zoom} onClick={() => setZoomed((v) => !v)}>
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </IconButton>
          <IconButton label={labels.fullscreen} onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </IconButton>
          <IconButton label={labels.close} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-auto px-2 pb-4">
        <IconButton
          label={labels.prev}
          onClick={onPrev}
          className="absolute left-2 z-10 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <img
          src={item.src}
          alt={label}
          width={item.width}
          height={item.height}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          onClick={() => setZoomed((v) => !v)}
          className={
            zoomed
              ? "max-w-none cursor-zoom-out rounded-lg"
              : "max-h-[80vh] w-auto max-w-[92vw] cursor-zoom-in rounded-lg object-contain"
          }
          style={zoomed ? { width: "min(1600px, 190vw)" } : undefined}
        />
        <span className="pointer-events-none absolute bottom-6 rounded-full bg-background/70 px-3 py-1 text-[11px] text-foreground/70">
          {site.shortName}
        </span>
        <IconButton
          label={labels.next}
          onClick={onNext}
          className="absolute right-2 z-10 sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
