import { useEffect, useRef } from "react";

// Module-level (shared across every modal in the app), not per-component —
// this is what lets closing one modal to open another in the same tick
// (e.g. Cart → Order form) reuse a single history entry instead of
// stacking two, which is what caused Back to skip past the real page.
let currentCloseHandler: (() => void) | null = null;
let hasPushedEntry = false;

/**
 * Makes the device/browser Back button close an open modal/drawer first,
 * returning the user to whatever page or modal was open before it —
 * instead of navigating away from the site. The *next* Back press then
 * behaves completely normally.
 */
export function useModalBackClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      currentCloseHandler = () => onCloseRef.current();
      if (!hasPushedEntry) {
        window.history.pushState({ modalOpen: true }, "");
        hasPushedEntry = true;
      }
    } else if (currentCloseHandler !== null) {
      currentCloseHandler = null;
      // Defer: give another modal opening in this same tick (e.g. the
      // Order form replacing the Cart) a chance to claim the existing
      // entry before we pop it.
      queueMicrotask(() => {
        if (currentCloseHandler === null && hasPushedEntry) {
          hasPushedEntry = false;
          window.history.back();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    function onPopState() {
      if (currentCloseHandler) {
        const handler = currentCloseHandler;
        currentCloseHandler = null;
        hasPushedEntry = false;
        handler();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
