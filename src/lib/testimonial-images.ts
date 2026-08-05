import bridal1 from "@/assets/gallery/bridal-1.jpg";
import arabic1 from "@/assets/gallery/arabic-1.jpg";
import minimal1 from "@/assets/gallery/minimal-1.jpg";
import modern1 from "@/assets/gallery/modern-1.jpg";
import festival1 from "@/assets/gallery/festival-1.jpg";
import floral1 from "@/assets/gallery/floral-1.jpg";
import finger1 from "@/assets/gallery/finger-1.jpg";
import feet1 from "@/assets/gallery/feet-1.jpg";
import person1 from "@/assets/testimonials/person-1.jpg";
import person2 from "@/assets/testimonials/person-2.jpg";
import person3 from "@/assets/testimonials/person-3.jpg";

/**
 * Image keys usable for testimonial avatars and before/after frames.
 * Values can also be data URLs (studio uploads) or absolute URLs —
 * resolveTestimonialImage passes anything unknown through unchanged.
 */
export const testimonialImageMap: Record<string, string> = {
  "bridal-1": bridal1,
  "arabic-1": arabic1,
  "minimal-1": minimal1,
  "modern-1": modern1,
  "festival-1": festival1,
  "floral-1": floral1,
  "finger-1": finger1,
  "feet-1": feet1,
  "person-1": person1,
  "person-2": person2,
  "person-3": person3,
};

/** Mehndi photos offered as built-in before/after choices in the admin editor. */
export const beforeAfterPresets = [
  "bridal-1",
  "arabic-1",
  "minimal-1",
  "modern-1",
  "festival-1",
  "floral-1",
  "finger-1",
  "feet-1",
] as const;

/** Portraits offered as built-in avatar choices in the admin editor. */
export const avatarPresets = ["person-1", "person-2", "person-3"] as const;

/** True when the value is a usable image reference (preset key, data URL or URL). */
export function isTestimonialImageRef(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  return (
    value in testimonialImageMap ||
    value.startsWith("data:image/") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("/")
  );
}

export function resolveTestimonialImage(key: string): string {
  return testimonialImageMap[key] ?? key;
}
