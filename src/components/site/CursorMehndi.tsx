import { useEffect } from "react";

/**
 * Cursor trail that leaves tiny mehndi dots.
 * Direct DOM writes (no React state), throttled to one dot every ~70ms,
 * skipped for touch devices and reduced-motion users.
 */
export function CursorMehndi() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const layer = document.createElement("div");
    layer.className = "pointer-events-none fixed inset-0 z-50";
    document.body.appendChild(layer);

    let last = 0;
    let count = 0;

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      count += 1;

      const dot = document.createElement("span");
      dot.className = "mehndi-dot";
      const big = count % 4 === 0;
      const size = big ? 7 : 4;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      if (big) dot.style.opacity = "0.55";
      layer.appendChild(dot);
      window.setTimeout(() => dot.remove(), 900);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      layer.remove();
    };
  }, []);

  return null;
}
