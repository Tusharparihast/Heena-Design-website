/**
 * Ambient, fixed background for every page.
 * Pure CSS/SVG — a handful of slowly drifting mehndi motifs.
 * No JS, no images, negligible cost on slow connections.
 */

function Motif({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="50" cy="50" r="6" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 50 50)`}>
          <path d="M50 42 C58 32, 58 20, 50 12 C42 20, 42 32, 50 42 Z" />
          <path d="M50 12 C54 8, 54 4, 50 1" />
          <circle cx="50" cy="26" r="1.6" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

export function MehndiBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
      data-mehndi-backdrop
    >
      <Motif
        className="mehndi-drift absolute -top-16 -left-16 h-72 w-72 text-primary/[0.09]"
        style={{ animationDuration: "38s" }}
      />
      <Motif
        className="mehndi-drift absolute top-1/3 -right-20 h-96 w-96 text-[color:var(--henna)]/[0.07]"
        style={{ animationDuration: "52s", animationDirection: "reverse" }}
      />
      <Motif
        className="mehndi-drift absolute bottom-[-6rem] left-1/4 h-80 w-80 text-primary/[0.07]"
        style={{ animationDuration: "64s" }}
      />
    </div>
  );
}
