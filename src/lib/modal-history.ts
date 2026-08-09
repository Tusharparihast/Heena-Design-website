import { useEffect, useRef } from "react";

// Module-level (shared across every modal in the app) so that one modal
// closing while another opens in the same tick — e.g. Cart → Order form —
// can hand off a single history entry instead of stacking two.
let currentToken: symbol | null = null;
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
  const tokenRef = useRef<symbol | null>(null);

  useEffect(() => {
    if (isOpen) {
      const token = Symbol("modal");
      tokenRef.current = token;
      currentToken = token;
      currentCloseHandler = () => onCloseRef.current();
      if (!hasPushedEntry) {
        window.history.pushState({ modalOpen: true }, "");
        hasPushedEntry = true;
      }
    } else if (tokenRef.current !== null) {
      const myToken = tokenRef.current;
      tokenRef.current = null;
      // Defer: give another modal opening in this same tick (e.g. the
      // Order form replacing the Cart) a chance to claim the slot before
      // we release it — only clean up if we still own it afterward.
      queueMicrotask(() => {
        if (currentToken === myToken) {
          currentToken = null;
          currentCloseHandler = null;
          if (hasPushedEntry) {
            hasPushedEntry = false;
            window.history.back();
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    function onPopState() {
      if (currentCloseHandler) {
        const handler = currentCloseHandler;
        currentToken = null;
        currentCloseHandler = null;
        hasPushedEntry = false;
        handler();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
