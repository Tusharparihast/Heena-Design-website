import { useBranding } from "@/lib/branding";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Studio logo image, sourced from the admin-managed branding document. */
export function BrandLogo({ className }: { className?: string }) {
  const { branding } = useBranding();
  return (
    <img
      src={branding.logoUrl}
      alt={`${site.name} logo`}
      className={cn(
        "rounded-lg object-contain",
        // Subtle contrast so the brown line-art stays legible on light/cream backgrounds
        "bg-background/60 ring-1 ring-black/5 shadow-sm",
        "dark:bg-background/40 dark:ring-white/10 dark:shadow-none",
        className,
      )}
      loading="eager"
      decoding="async"
    />
  );
}
