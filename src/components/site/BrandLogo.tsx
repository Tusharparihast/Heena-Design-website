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
      className={cn("object-contain", className)}
      loading="eager"
      decoding="async"
    />
  );
}
