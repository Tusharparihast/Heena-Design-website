import { cn } from "@/lib/utils";

type MehndiLoaderProps = {
  /** Diameter of the rotating mehndi ring in px. */
  size?: number;
  label?: string;
  sublabel?: string;
  /** Hide the centered text (for compact/inline use). */
  textless?: boolean;
  className?: string;
};

/**
 * Premium mehndi-themed loading indicator.
 * Only the vine ring rotates; the centered text stays upright and stable.
 * Pure SVG + CSS so it stays light on mobile and slow connections.
 */
export function MehndiLoader({
  size = 140,
  label = "Loading...",
  sublabel = "Please wait",
  textless = false,
  className,
}: MehndiLoaderProps) {
  const petals = Array.from({ length: 12 });
  const leaves = Array.from({ length: 8 });

  return (
    <div
      className={cn("flex flex-col items-center justify-center", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          className="mehndi-spin block"
          aria-hidden="true"
        >
          {/* outer hairline circle */}
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="var(--henna)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          {/* main vine circle */}
          <circle
            cx="100"
            cy="100"
            r="84"
            fill="none"
            stroke="var(--henna)"
            strokeWidth="1.6"
            strokeDasharray="14 7"
            strokeLinecap="round"
          />
          {/* inner delicate circle */}
          <circle
            cx="100"
            cy="100"
            r="62"
            fill="none"
            stroke="var(--primary)"
            strokeOpacity="0.55"
            strokeWidth="1"
            strokeDasharray="3 6"
            strokeLinecap="round"
          />

          {/* leaf/paisley motifs around the vine */}
          {leaves.map((_, i) => (
            <g key={`leaf-${i}`} transform={`rotate(${(360 / leaves.length) * i} 100 100)`}>
              <path
                d="M100 16 C110 26, 110 40, 100 50 C90 40, 90 26, 100 16 Z"
                fill="none"
                stroke="var(--henna)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M100 22 L100 46" stroke="var(--primary)" strokeOpacity="0.7" strokeWidth="0.9" />
            </g>
          ))}

          {/* small dots between leaves */}
          {petals.map((_, i) => (
            <g key={`dot-${i}`} transform={`rotate(${(360 / petals.length) * i + 15} 100 100)`}>
              <circle cx="100" cy="72" r="1.7" fill="var(--henna)" fillOpacity="0.75" />
            </g>
          ))}

          {/* floral accent motif on the ring */}
          <g transform="translate(100 100)">
            {petals.slice(0, 6).map((_, i) => (
              <ellipse
                key={`petal-${i}`}
                cx="0"
                cy="-84"
                rx="4"
                ry="9"
                fill="none"
                stroke="var(--primary)"
                strokeOpacity="0.8"
                strokeWidth="1.1"
                transform={`rotate(${i * 60})`}
              />
            ))}
          </g>
        </svg>

        {!textless && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="font-display font-semibold text-foreground"
              style={{ fontSize: Math.max(13, size * 0.13) }}
            >
              {label}
            </span>
            <span
              className="text-muted-foreground"
              style={{ fontSize: Math.max(10, size * 0.075) }}
            >
              {sublabel}
            </span>
            <span className="mt-1 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="mehndi-dot-pulse block rounded-full bg-primary"
                  style={{
                    width: Math.max(3, size * 0.028),
                    height: Math.max(3, size * 0.028),
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </span>
          </div>
        )}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
