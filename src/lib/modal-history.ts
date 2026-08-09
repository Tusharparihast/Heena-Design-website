import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

// Module-level (shared across every modal in the app) so that one modal
// closing while another opens in the same tick — e.g. Cart → Order form —
// can hand off a single history entry instead of stacking two.
let currentToken: symbol | null = null;
let currentCloseHandler: (() => void) | null = null;
let hasPushedEntry = false;
// Set right before any history change *we* trigger ourselves, so our own
// subscribe listener below can tell it apart from a real Back/Forward press.
let suppressNextChange = false;

/**
 * Makes the device/browser Back button close an open modal/drawer first,
 * returning the user to whatever page or modal was open before it —
 * instead of navigating away from the site. The *next* Back press then
 * behaves completely normally.
 *
 * Goes through the router's own history object (not raw window.history)
 * so it stays in sync with the router's internal route/scroll tracking.
 */
export function useModalBackClose(isOpen: boolean, onClose: () => void) {
  const router = useRouter();
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
        const here = window.location.pathname + window.location.search;
        suppressNextChange = true;
        router.history.push(here, { modalOpen: true });
        hasPushedEntry = true;
      }
    } else if (tokenRef.current !== null && currentToken === tokenRef.current) {
      tokenRef.current = null;
      currentToken = null;
      currentCloseHandler = null;
      if (hasPushedEntry) {
        hasPushedEntry = false;
        suppressNextChange = true;
        router.history.back();
      }
    } else {
      tokenRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, router]);

  useEffect(() => {
    return router.history.subscribe(() => {
      if (suppressNextChange) {
        suppressNextChange = false;
        return;
      }
      if (currentCloseHandler) {
        const handler = currentCloseHandler;
        currentToken = null;
        currentCloseHandler = null;
        hasPushedEntry = false;
        handler();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
}
