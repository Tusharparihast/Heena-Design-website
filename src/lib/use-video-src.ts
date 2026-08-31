import { useEffect, type RefObject } from "react";

/**
 * Keeps a <video> element's actual source in sync with the saved link.
 *
 * The first HTML the browser receives is rendered before the studio's saved
 * content has loaded, so it carries the bundled default clip. When React later
 * adopts that markup it does not always re-apply the `src` attribute on media
 * elements, which left the Watch / hero / About players showing the old video
 * even though the new one was saved. Setting it directly (and reloading the
 * element) guarantees the saved clip is the one that plays.
 */
export function useVideoSrc(
  ref: RefObject<HTMLVideoElement | null>,
  src: string | undefined,
  poster?: string | undefined,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    if (poster && el.getAttribute("poster") !== poster) el.setAttribute("poster", poster);
    if (el.getAttribute("src") === src) return;
    el.setAttribute("src", src);
    el.load();
  }, [ref, src, poster]);
}
