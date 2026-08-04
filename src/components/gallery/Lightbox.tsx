import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { site } from "@/lib/site";
import type { GalleryItem } from "@/lib/gallery";

const ZOOM_SCALE = 1.6;
const DRAG_THRESHOLD = 6;

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0, moved: false });
  const isDragging = useRef(false);

  const resetPan = useCallback(() => setPan({ x: 0, y: 0 }), []);

  useEffect(() => {
    setZoomed(false);
    resetPan();
  }, [item.id, resetPan]);

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

  const clampPan = useCallback(
    (nextX: number, nextY: number) => {
      const img = imageRef.current;
      const viewport = viewportRef.current;
      if (!img || !viewport) return { x: nextX, y: nextY };
      const imgRect = img.getBoundingClientRect();
      const viewRect = viewport.getBoundingClientRect();
      const zoomedWidth = imgRect.width;
      const zoomedHeight = imgRect.height;
      const maxX = Math.max(0, (zoomedWidth - viewRect.width) / 2);
      const maxY = Math.max(0, (zoomedHeight - viewRect.height) / 2);
      return { x: Math.max(-maxX, Math.min(maxX, nextX)), y: Math.max(-maxY, Math.min(maxY, nextY)) };
    },
    [],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    dragStart.current.moved = false;
    if (!zoomed) return;
    event.preventDefault();
    isDragging.current = true;
    setDragging(true);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging.current) return;
    event.preventDefault();
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragStart.current.moved = true;
    }
    setPan(clampPan(dragStart.current.panX + dx, dragStart.current.panY + dy));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
    isDragging.current = false;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
    if (!dragStart.current.moved) {
      setZoomed((v) => !v);
      if (zoomed) resetPan();
    }
  };

  const handleZoomToggle = () => {
    setZoomed((v) => {
      if (v) resetPan();
      return !v;
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col bg-foreground/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="flex items-center justify-between gap-2 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="truncate px-2 text-sm text-background">{label}</p>
        <div className="flex items-center gap-1">
          <IconButton label={labels.zoom} onClick={handleZoomToggle}>
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

      <div
        ref={viewportRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4"
      >
        <IconButton
          label={labels.prev}
          onClick={onPrev}
          className="absolute left-2 z-20 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </IconButton>

        <div className="relative flex max-h-full max-w-full items-center justify-center overflow-hidden">
          <img
            ref={imageRef}
            src={item.src}
            alt={label}
            width={item.width}
            height={item.height}
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleImageClick}
            className={`max-h-[80vh] w-auto max-w-[92vw] select-none rounded-lg object-contain transition-transform duration-300 ease-out will-change-transform ${
              zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            }`}
            style={{
              transform: zoomed ? `translate(${pan.x}px, ${pan.y}px) scale(${ZOOM_SCALE})` : undefined,
            }}
          />
          <span className="pointer-events-none absolute bottom-4 rounded-full bg-background/70 px-3 py-1 text-[11px] text-foreground/70">
            {site.shortName}
          </span>
        </div>

        <IconButton
          label={labels.next}
          onClick={onNext}
          className="absolute right-2 z-20 sm:right-4"
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
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
