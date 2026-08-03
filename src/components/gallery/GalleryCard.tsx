import { site } from "@/lib/site";
import type { GalleryItem } from "@/lib/gallery";

/**
 * Single gallery thumbnail.
 * - lazy loaded + async decoding (kind to slow connections)
 * - fixed aspect box so nothing shifts while images arrive
 * - watermark overlay, drag + context menu disabled to discourage downloads
 */
export function GalleryCard({
  item,
  label,
  onOpen,
  priority,
}: {
  item: GalleryItem;
  label: string;
  onOpen: () => void;
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-secondary/40 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      aria-label={label}
    >
      <div className="aspect-4/5 w-full">
        <img
          src={item.src}
          alt={label}
          width={item.width}
          height={item.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-background/70 px-2 py-1 text-[10px] font-medium tracking-wide text-foreground/70 backdrop-blur-sm">
        {site.shortName}
      </span>
    </button>
  );
}
