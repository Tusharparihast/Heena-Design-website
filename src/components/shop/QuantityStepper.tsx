import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
  small = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
  small?: boolean;
}) {
  const buttonClass = cn(
    "flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-40",
    small ? "h-7 w-7" : "h-9 w-9"
  );

  return (
    <div
      className={cn("inline-flex items-center rounded-full border border-border bg-background", small ? "p-0.5" : "p-1")}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={buttonClass}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className={cn("text-center text-sm font-medium tabular-nums", small ? "w-7" : "w-9")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={buttonClass}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
