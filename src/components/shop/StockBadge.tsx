import { useLanguage } from "@/i18n/LanguageProvider";
import type { StockStatus } from "@/lib/shop";
import { cn } from "@/lib/utils";

const styles: Record<StockStatus, string> = {
  in: "bg-primary/10 text-primary",
  low: "bg-accent text-accent-foreground",
  out: "bg-muted text-muted-foreground",
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const { t } = useLanguage();
  const label = t.shopPage.stock[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        styles[status],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "in" && "bg-primary",
          status === "low" && "bg-foreground/50",
          status === "out" && "bg-muted-foreground/60"
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
