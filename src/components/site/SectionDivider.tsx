/**
 * Decorative SVG patterns for section breaks.
 *
 * All motifs are lightweight inline SVGs, rendered at 5% opacity so they sit
 * quietly behind the content without adding visual weight or hurting legibility.
 */

import { cn } from "@/lib/utils";

function MehndiFlower({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className={cn("text-primary", className)}
    >
      <g stroke="currentColor" strokeWidth="1.5">
        <circle cx="40" cy="40" r="6" />
        <path d="M40 34c-6-10-18-10-18 2 0 8 8 12 18 16" />
        <path d="M40 34c6-10 18-10 18 2 0 8-8 12-18 16" />
        <path d="M34 40c-10-6-10-18 2-18 8 0 12 8 16 18" />
        <path d="M34 40c-10 6-10 18 2 18 8 0 12-8 16-18" />
        <path d="M40 46c-6 10-18 10-18-2 0-8 8-12 18-16" />
        <path d="M40 46c6 10 18 10 18-2 0-8-8-12-18-16" />
        <path d="M46 40c10 6 10 18-2 18-8 0-12-8-16-18" />
        <path d="M46 40c10-6 10-18-2-18-8 0-12 8-16 18" />
      </g>
    </svg>
  );
}

function FloralVine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      className={cn("text-primary", className)}
    >
      <path
        d="M0 20c80-20 160 20 240 20s160-40 240-40 160 40 240 40 160-40 240-40 160 40 240 40"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M60 12c10-8 20-8 30 0s-10 14-20 10"
        fill="currentColor"
      />
      <path
        d="M300 30c10 8 20 8 30 0s-10-14-20-10"
        fill="currentColor"
      />
      <path
        d="M540 12c10-8 20-8 30 0s-10 14-20 10"
        fill="currentColor"
      />
      <path
        d="M780 30c10 8 20 8 30 0s-10-14-20-10"
        fill="currentColor"
      />
      <path
        d="M1020 12c10-8 20-8 30 0s-10 14-20 10"
        fill="currentColor"
      />
      <circle cx="120" cy="20" r="3" fill="currentColor" />
      <circle cx="360" cy="20" r="3" fill="currentColor" />
      <circle cx="600" cy="20" r="3" fill="currentColor" />
      <circle cx="840" cy="20" r="3" fill="currentColor" />
      <circle cx="1080" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

function MandalaCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={cn("text-primary", className)}
    >
      <g stroke="currentColor" strokeWidth="1.2">
        <path d="M0 120c40-80 80-120 120-120" />
        <path d="M20 120c30-60 60-90 100-100" />
        <path d="M40 120c20-40 40-70 80-80" />
        <path d="M60 120c10-25 30-50 60-60" />
        <path d="M80 120c5-15 20-30 40-40" />
        <circle cx="110" cy="10" r="4" />
        <circle cx="90" cy="30" r="3" />
        <circle cx="70" cy="55" r="2.5" />
        <circle cx="55" cy="80" r="2" />
        <circle cx="45" cy="100" r="1.5" />
      </g>
    </svg>
  );
}

export type DividerPattern = "flower" | "vine" | "mandala" | "vine-mandala";

export function SectionDivider({
  pattern = "flower",
  className,
}: {
  pattern?: DividerPattern;
  className?: string;
}) {
  if (pattern === "flower") {
    return (
      <div
        className={cn(
          "pointer-events-none relative flex h-16 items-center justify-center overflow-hidden opacity-5",
          className
        )}
        aria-hidden="true"
      >
        <div className="absolute h-px w-1/3 bg-primary/80" />
        <MehndiFlower className="relative z-10 h-10 w-10 bg-background p-1" />
      </div>
    );
  }

  if (pattern === "vine") {
    return (
      <div
        className={cn(
          "pointer-events-none h-12 w-full opacity-5",
          className
        )}
        aria-hidden="true"
      >
        <FloralVine className="h-full w-full" />
      </div>
    );
  }

  if (pattern === "mandala") {
    return (
      <div
        className={cn(
          "pointer-events-none flex h-20 items-center justify-center opacity-5",
          className
        )}
        aria-hidden="true"
      >
        <MandalaCorner className="h-16 w-16 -rotate-90" />
      </div>
    );
  }

  // vine-mandala: two mandala corners flanking a vine line
  return (
    <div
      className={cn(
        "pointer-events-none flex items-center justify-center gap-4 py-2 opacity-5",
        className
      )}
      aria-hidden="true"
    >
      <MandalaCorner className="h-12 w-12 -rotate-90" />
      <FloralVine className="h-4 w-1/3 max-w-md" />
      <MandalaCorner className="h-12 w-12 rotate-180" />
    </div>
  );
}

/**
 * Corner ornaments that can be placed inside a section wrapper.
 * Use sparingly — one corner per section is usually enough.
 */
export function SectionCorner({
  position = "top-right",
  className,
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const rotations = {
    "top-left": "rotate-90",
    "top-right": "-rotate-90",
    "bottom-left": "rotate-180",
    "bottom-right": "",
  };

  const positions = {
    "top-left": "-top-2 -left-2",
    "top-right": "-top-2 -right-2",
    "bottom-left": "-bottom-2 -left-2",
    "bottom-right": "-bottom-2 -right-2",
  };

  return (
    <MandalaCorner
      className={cn(
        "pointer-events-none absolute h-24 w-24 opacity-5",
        positions[position],
        rotations[position],
        className
      )}
    />
  );
}
