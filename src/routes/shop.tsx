import { createFileRoute, Outlet } from "@tanstack/react-router";

import { CartWidget } from "@/components/shop/CartWidget";
import { CartProvider } from "@/lib/cart";

export const Route = createFileRoute("/shop")({
  component: ShopLayout,
});

function ShopLayout() {
  return (
    <CartProvider>
      <Outlet />
      <CartWidget />
    </CartProvider>
  );
}
