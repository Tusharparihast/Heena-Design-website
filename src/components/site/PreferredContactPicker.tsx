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

/** Per-channel contact details, e.g. { wechat: "nagma_designs" }. */
export type PreferredContactDetails = Partial<Record<PreferredContact, string>>;

const detailLabels: Record<PreferredContact, { en: string; zh: string }> = {
  wechat: { en: "WeChat ID", zh: "微信号" },
  whatsapp: { en: "WhatsApp number", zh: "WhatsApp 号码" },
  phone: { en: "Phone number", zh: "电话号码" },
  email: { en: "Email address", zh: "邮箱地址" },
};

const detailPlaceholders: Record<PreferredContact, string> = {
  wechat: "nagma_designs",
  whatsapp: "+977 98XXXXXXXX",
  phone: "+977 98XXXXXXXX",
  email: "you@example.com",
};

interface PreferredContactPickerProps {
  value: PreferredContact[];
  onChange: (next: PreferredContact[]) => void;
  details: PreferredContactDetails;
  onDetailsChange: (next: PreferredContactDetails) => void;
  locale: string;
  className?: string;
}

/**
 * Single-select "Preferred Contact Option" chips — same channels as the
 * shop's Order Request form. Picking a channel reveals its own required
 * contact-detail input.
 */
export function PreferredContactPicker({
  value,
  onChange,
  details,
  onDetailsChange,
  locale,
  className,
}: PreferredContactPickerProps) {
  const zh = locale === "zh";
  const select = (id: PreferredContact) => {
    if (value.includes(id)) {
      onChange([]);
      onDetailsChange({});
      return;
    }
    onChange([id]);
    onDetailsChange({ [id]: details[id] ?? "" });
  };

  return (
    <div className={className}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {zh ? "首选联系方式" : "Preferred contact option"}
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

      {value.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {preferredContactOptions
            .filter((id) => value.includes(id))
            .map((id) => (
              <label key={id} className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {zh ? detailLabels[id].zh : detailLabels[id].en} *
                </span>
                <input
                  type={id === "email" ? "email" : id === "wechat" ? "text" : "tel"}
                  value={details[id] ?? ""}
                  onChange={(e) => onDetailsChange({ ...details, [id]: e.target.value })}
                  placeholder={detailPlaceholders[id]}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            ))}
        </div>
      )}

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

/** "WeChat: abc · Phone: 98…" — used in booking summaries and handoff messages. */
export function formatPreferredContactDetails(
  value: string[],
  details: PreferredContactDetails | null | undefined,
  locale = "en",
): string {
  const zh = locale === "zh";
  return value
    .filter((v): v is PreferredContact => (preferredContactOptions as readonly string[]).includes(v))
    .map((v) => {
      const label = zh ? preferredContactLabels[v].zh : preferredContactLabels[v].en;
      const detail = (details?.[v] ?? "").trim();
      return detail ? `${label}: ${detail}` : label;
    })
    .join(" · ");
}

/** Trims details down to the selected channels. */
export function cleanPreferredContactDetails(
  value: PreferredContact[],
  details: PreferredContactDetails,
): Record<string, string> {
  const out: Record<string, string> = {};
  value.forEach((id) => {
    const detail = (details[id] ?? "").trim().slice(0, 160);
    if (detail) out[id] = detail;
  });
  return out;
}

/**
 * Returns a validation message when the picker is incomplete, or null when the
 * selection (at least one channel, each with its detail filled in) is valid.
 */
export function validatePreferredContacts(
  value: PreferredContact[],
  details: PreferredContactDetails,
  locale = "en",
): string | null {
  const zh = locale === "zh";
  if (value.length === 0) {
    return zh ? "请至少选择一种联系方式。" : "Please select at least one preferred contact option.";
  }
  for (const id of value) {
    const detail = (details[id] ?? "").trim();
    const label = zh ? detailLabels[id].zh : detailLabels[id].en;
    if (!detail) return zh ? `请填写${label}。` : `Please enter your ${label.toLowerCase()}.`;
    if (id === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(detail)) {
      return zh ? "请输入有效的邮箱地址。" : "Please enter a valid email address.";
    }
    if ((id === "phone" || id === "whatsapp") && !/^[+0-9][0-9\s()-]{5,19}$/.test(detail)) {
      return zh ? `请输入有效的${label}。` : `Please enter a valid ${label.toLowerCase()}.`;
    }
  }
  return null;
}

