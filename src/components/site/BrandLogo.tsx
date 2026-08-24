import { useBranding } from "@/lib/branding";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Studio logo, sourced from the admin-managed branding document.
 *
 * It paints as a background image so the pre-hydration script in the document
 * head (which sets `--nd-logo-url` from the saved branding mirror) can apply
 * the studio's own logo on the very first frame — no flash of the packaged
 * default after a refresh.
 */
export function BrandLogo({ className }: { className?: string }) {
  const { branding, loaded } = useBranding();
  const fallback = `url("${branding.logoUrl}")`;

  return (
    <div
      role="img"
      aria-label={`${site.name} logo`}
      style={{ backgroundImage: loaded ? fallback : `var(--nd-logo-url, ${fallback})` }}
      className={cn(
        "rounded-lg bg-contain bg-center bg-no-repeat",
        // Subtle contrast so the brown line-art stays legible on light/cream backgrounds
        "bg-background/60 ring-1 ring-black/5 shadow-sm",
        "dark:bg-background/40 dark:ring-white/10 dark:shadow-none",
        className,
      )}
    >
      {/* Invisible sizer: gives the box the logo's intrinsic aspect ratio when
          callers use `w-auto`. It never paints, so no default-logo flash. */}
      <img src={branding.logoUrl} alt="" aria-hidden className="h-full w-auto opacity-0" />
    </div>
  );
}
