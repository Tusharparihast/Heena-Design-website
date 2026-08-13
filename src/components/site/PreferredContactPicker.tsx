import { cn } from "@/lib/utils";

/** Contact channels a client can mark as preferred on a booking request. */
export const preferredContactOptions = ["wechat", "whatsapp", "phone", "email"] as const;
export type PreferredContact = (typeof preferredContactOptions)[number];

export const preferredContactLabels: Record<PreferredContact, { en: string; zh: string }> = {
  wechat: { en: "WeChat", zh: "微信" },
  whatsapp: { en: "WhatsApp", zh: "WhatsApp" },
  phone: { en: "Phone", zh: "电话" },
  email: { en: "Email", zh: "邮箱" },
};

interface PreferredContactPickerProps {
  value: PreferredContact[];
  onChange: (next: PreferredContact[]) => void;
  locale: string;
  className?: string;
}

/**
 * Multi-select "Preferred Contact Options" chips — same channels as the
 * shop's Order Request form, but the client may pick more than one.
 */
export function PreferredContactPicker({ value, onChange, locale, className }: PreferredContactPickerProps) {
  const zh = locale === "zh";
  const toggle = (id: PreferredContact) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className={className}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {zh ? "首选联系方式" : "Preferred contact options"}
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {preferredContactOptions.map((id) => {
          const active = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(id)}
              className={cn(
                "flex items-center justify-center rounded-lg border py-2 text-xs font-medium transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {zh ? preferredContactLabels[id].zh : preferredContactLabels[id].en}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {zh ? "可多选，我们会通过您选择的方式联系您。" : "Pick one or more — we'll reply the way you prefer."}
      </p>
    </div>
  );
}

/** Human-readable list, e.g. "WeChat, Phone". Empty string when nothing is picked. */
export function formatPreferredContacts(value: string[], locale = "en"): string {
  const zh = locale === "zh";
  return value
    .filter((v): v is PreferredContact => (preferredContactOptions as readonly string[]).includes(v))
    .map((v) => (zh ? preferredContactLabels[v].zh : preferredContactLabels[v].en))
    .join(", ");
}
