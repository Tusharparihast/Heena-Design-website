import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

// Module-level (shared across every modal in the app) so that one modal
// closing while another opens in the same tick — e.g. Cart → Order form —
// can hand off a single history entry instead of stacking two.
let currentToken: symbol | null = null;
let currentCloseHandler: (() => void) | null = null;
let hasPushedEntry = false;
// History changes we cause ourselves (push on open, back on close) must not be
// mistaken for a user pressing Back — otherwise the modal closes the instant it
// opens and the user has to click twice.
let selfNav = false;
function markSelfNav() {
  selfNav = true;
  // Subscribers fire synchronously during the history change; clear right after.
  queueMicrotask(() => {
    selfNav = false;
  });
}

/**
 * Makes the device/browser Back button close an open modal/drawer first,
 * returning the user to whatever page or modal was open before it —
 * instead of navigating away from the site. The *next* Back press then
 * behaves completely normally.
 *
 * Goes through the router's own history object (not raw window.history)
 * so it stays in sync with the router's internal route/scroll tracking
 * instead of fighting it.
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
        hasPushedEntry = true;
        markSelfNav();
        router.history.push(here, { modalOpen: true });
      }
    } else if (tokenRef.current !== null && currentToken === tokenRef.current) {
      // This modal owned the shared slot and was closed by something other
      // than the Back button (X button, backdrop, form submit) — clean up
      // the entry we pushed so a later real Back press behaves normally.
      tokenRef.current = null;
      currentToken = null;
      currentCloseHandler = null;
      if (hasPushedEntry) {
        hasPushedEntry = false;
        markSelfNav();
        router.history.back();
      }
    } else {
      tokenRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, router]);

  useEffect(() => {
    return router.history.subscribe(() => {
      if (selfNav) return;
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
