import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { MAX_ORDER_QTY } from "@/lib/shop";

const STORAGE_KEY = "nagma-cart-v1";

export type CartLine = { id: string; qty: number };

type CartContextValue = {
  items: CartLine[];
  count: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (next: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine => !!l && typeof l === "object" && typeof (l as CartLine).id === "string")
      .map((l) => ({ id: l.id, qty: Math.min(MAX_ORDER_QTY, Math.max(1, Number(l.qty) || 1)) }));
  } catch {
    return [];
  }
}

/** Guest cart — no account needed, contents live in the browser only. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount so server and client render the same first pass.
  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked — cart just won't persist */
    }
  }, [items, hydrated]);

  const add = useCallback((id: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (!existing) return [...prev, { id, qty: Math.min(MAX_ORDER_QTY, Math.max(1, qty)) }];
      return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_ORDER_QTY, l.qty + qty) } : l));
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_ORDER_QTY, qty) } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, l) => sum + l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      open,
      setOpen,
    }),
    [items, add, setQty, remove, clear, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
