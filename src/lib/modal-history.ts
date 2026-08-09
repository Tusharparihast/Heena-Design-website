import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

let currentToken: symbol | null = null;
let currentCloseHandler: (() => void) | null = null;
let hasPushedEntry = false;
let suppressNextChange = false;

/**
 * Makes the device/browser Back button close an open modal/drawer first,
 * returning the user to whatever page or modal was open before it —
 * instead of navigating away from the site. The *next* Back press then
 * behaves completely normally.
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
        // Claim the slot immediately so a second open in the same tick
        // doesn't also try to push, but defer the actual history mutation
        // to the next paint — this is what lets the drawer render and
        // become visible on the very first click, instead of racing with it.
        hasPushedEntry = true;
        const id = window.requestAnimationFrame(() => {
          const here = window.location.pathname + window.location.search;
          suppressNextChange = true;
          router.history.push(here, { modalOpen: true });
        });
        return () => window.cancelAnimationFrame(id);
      }
      return undefined;
    }

    if (tokenRef.current !== null && currentToken === tokenRef.current) {
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
    return undefined;
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
