import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";


/**
 * Lightweight SVG "mehndi cone drawing" animation.
 * Hand-drawn style mandala: scalloped rings, paisleys, petals and dot work.
 * Pure CSS stroke-dashoffset animation — no JS, no 3D library.
 */

const C = 200;

/** Deterministic jitter so each stroke draws at a slightly different pace. */
function draw(delay: number, seed: number): React.CSSProperties {
  const n = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  const dur = 2.4 + n * 1.6; // 2.4s – 4.0s
  const jitter = (n - 0.5) * 0.24; // ±0.12s uneven start
  return {
    animationDelay: `${(delay + jitter).toFixed(2)}s`,
    ["--draw-dur" as string]: `${dur.toFixed(2)}s`,
  } as React.CSSProperties;
}


/** Scalloped (petal edge) ring, the classic mehndi border. */
function scallopRing(radius: number, count: number, depth: number) {
  const step = (Math.PI * 2) / count;
  let d = "";
  for (let i = 0; i < count; i++) {
    const a0 = i * step;
    const a1 = a0 + step;
    const x0 = C + radius * Math.cos(a0);
    const y0 = C + radius * Math.sin(a0);
    const x1 = C + radius * Math.cos(a1);
    const y1 = C + radius * Math.sin(a1);
    const am = a0 + step / 2;
    const xm = C + (radius + depth) * Math.cos(am);
    const ym = C + (radius + depth) * Math.sin(am);
    if (i === 0) d += `M${x0.toFixed(1)} ${y0.toFixed(1)}`;
    d += ` Q${xm.toFixed(1)} ${ym.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return `${d} Z`;
}

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
      {/* outer scalloped border */}
      <g strokeWidth="1.6">
        <path
          d={scallopRing(146, 24, 10)}
          className="mehndi-path"
          style={draw(0.1, 1)}
        />
        <path
          d={scallopRing(138, 24, 7)}
          className="mehndi-path"
          style={draw(0.35, 2)}
        />
      </g>

      {/* paisley ring — the signature mehndi motif */}
      <g strokeWidth="2">
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={`p${i}`} transform={`rotate(${i * 45} 200 200)`}>
            <path
              d="M200 68 C226 84, 232 116, 214 132 C202 143, 184 138, 182 124 C180 111, 192 103, 200 110"
              className="mehndi-path"
              style={draw(0.6 + i * 0.12, 5 + i)}
            />
            <path
              d="M203 82 C218 94, 220 114, 209 124"
              className="mehndi-path"
              style={draw(0.75 + i * 0.12, 6 + i)}
            />
          </g>
        ))}
      </g>

      {/* fine vine + leaf work between paisleys */}
      <g strokeWidth="1.3">
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={`v${i}`} transform={`rotate(${i * 45 + 22.5} 200 200)`}>
            <path
              d="M200 128 C196 108, 204 92, 200 74"
              className="mehndi-path"
              style={draw(1.3 + i * 0.07, 7 + i)}
            />
            <path
              d="M200 116 C209 111, 213 102, 210 94 C202 96, 198 106, 200 116 Z"
              className="mehndi-path"
              style={draw(1.45 + i * 0.07, 8 + i)}
            />
            <path
              d="M200 100 C191 96, 187 88, 189 80 C197 83, 202 92, 200 100 Z"
              className="mehndi-path"
              style={draw(1.55 + i * 0.07, 9 + i)}
            />
          </g>
        ))}
      </g>

      {/* inner lotus core */}
      <g strokeWidth="1.8">
        <path
          d={scallopRing(58, 14, 9)}
          className="mehndi-path"
          style={draw(1.9, 3)}
        />
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={`l${i}`}
            d="M200 156 C212 170, 212 190, 200 202 C188 190, 188 170, 200 156 Z"
            transform={`rotate(${i * 51.4} 200 200)`}
            className="mehndi-path"
            style={draw(2.1 + i * 0.08, 10 + i)}
          />
        ))}
        <circle
          cx="200"
          cy="200"
          r="9"
          className="mehndi-path"
          style={draw(2.7, 4)}
        />
      </g>

      {/* dot work — uneven sizes so it reads hand-applied */}
      <g strokeWidth="0">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r = 160;
          return (
            <circle
              key={`d${i}`}
              cx={(C + r * Math.cos(a)).toFixed(1)}
              cy={(C + r * Math.sin(a)).toFixed(1)}
              r={i % 3 === 0 ? 2.6 : 1.7}
              fill="currentColor"
              className="fade-up"
              style={draw(2.4 + i * 0.03, 11 + i)}
            />
          );
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          const r = 78;
          return (
            <circle
              key={`dd${i}`}
              cx={(C + r * Math.cos(a)).toFixed(1)}
              cy={(C + r * Math.sin(a)).toFixed(1)}
              r="2.2"
              fill="currentColor"
              className="fade-up"
              style={draw(2.8 + i * 0.05, 12 + i)}
            />
          );
        })}
      </g>
    </svg>
  );
}
