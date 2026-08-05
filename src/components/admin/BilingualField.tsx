import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function LangBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted px-1.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

/** A text field edited in both languages at once — English first, 中文 below. */
export function BilingualField({
  label,
  valueEn,
  valueZh,
  onChange,
  placeholder,
  multiline,
  className,
}: {
  label: string;
  valueEn: string | undefined;
  valueZh: string | undefined;
  onChange: (locale: Locale, value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const baseId = useId();
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`${baseId}-${slug}-en`}>{label}</Label>
      <div className="space-y-2">
        <div className={cn("flex gap-2", multiline ? "items-start" : "items-center")}>
          <LangBadge>EN</LangBadge>
          {multiline ? (
            <Textarea
              id={`${baseId}-${slug}-en`}
              value={valueEn ?? ""}
              onChange={(e) => onChange("en", e.target.value)}
              placeholder={placeholder}
              rows={multiline === true ? 4 : undefined}
            />
          ) : (
            <Input
              id={`${baseId}-${slug}-en`}
              value={valueEn ?? ""}
              onChange={(e) => onChange("en", e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
        <div className={cn("flex gap-2", multiline ? "items-start" : "items-center")}>
          <LangBadge>中文</LangBadge>
          {multiline ? (
            <Textarea
              id={`${baseId}-${slug}-zh`}
              value={valueZh ?? ""}
              onChange={(e) => onChange("zh", e.target.value)}
              placeholder={placeholder}
              rows={4}
            />
          ) : (
            <Input
              id={`${baseId}-${slug}-zh`}
              value={valueZh ?? ""}
              onChange={(e) => onChange("zh", e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
      </div>
    </div>
  );
}
