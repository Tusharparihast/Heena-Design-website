import { Percent } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatNpr, unitPriceNpr, type ShopProduct } from "@/lib/shop";
import { cn } from "@/lib/utils";

/**
 * Small sale badge shown on products that carry a studio discount.
 * The discount itself is set per product in src/lib/shop.ts (admin-managed later).
 */
export function DiscountBadge({ percent, className }: { percent?: number; className?: string }) {
  const { t } = useLanguage();
  if (!percent) return null;
  return (
    <span
      title={t.shopPage.sale}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground shadow-sm",
        className
      )}
    >
      <Percent className="h-3 w-3" aria-hidden />
      -{percent}%
    </span>
  );
}

/**
 * Price with discount applied: discounted price first, original struck through.
 * Falls back to the i18n display price when there is no discount.
 */
export function ShopPrice({
  product,
  price,
  className,
}: {
  product: ShopProduct;
  /** i18n display price, e.g. "Rs. 650 / pack". */
  price: string;
  className?: string;
}) {
  if (!product.discount) return <span className={className}>{price}</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={className}>{formatNpr(unitPriceNpr(product))}</span>
      <span className="text-xs font-normal text-muted-foreground line-through">{formatNpr(product.priceNpr)}</span>
    </span>
  );
}
