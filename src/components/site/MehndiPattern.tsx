import { cn } from "@/lib/utils";

/**
 * Lightweight SVG "mehndi cone drawing" animation.
 * Pure CSS stroke-dashoffset animation — no JS, no 3D library.
 */
export function MehndiPattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("h-full w-full", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <g strokeWidth="2.6">
        <circle
          cx="200"
          cy="200"
          r="150"
          className="mehndi-path"
          style={{ animationDelay: "0.1s" }}
        />
        <circle
          cx="200"
          cy="200"
          r="118"
          className="mehndi-path"
          style={{ animationDelay: "0.5s" }}
        />
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d="M200 82 C214 112, 214 138, 200 160 C186 138, 186 112, 200 82 Z"
            transform={`rotate(${i * 30} 200 200)`}
            className="mehndi-path"
            style={{ animationDelay: `${0.8 + i * 0.09}s` }}
          />
        ))}
        {Array.from({ length: 24 }).map((_, i) => (
          <circle
            key={`d${i}`}
            cx="200"
            cy="38"
            r="3"
            transform={`rotate(${i * 15} 200 200)`}
            className="fade-up"
            style={{ animationDelay: `${1.8 + i * 0.03}s` }}
          />
        ))}
        <path
          d="M200 178 C188 190, 188 210, 200 222 C212 210, 212 190, 200 178 Z"
          className="mehndi-path"
          style={{ animationDelay: "2.2s" }}
        />
      </g>
    </svg>
  );
}
