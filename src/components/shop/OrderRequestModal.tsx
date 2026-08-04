import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, QrCode, Send, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { MAX_ORDER_QTY, formatCny, formatNpr, unitPriceNpr } from "@/lib/shop";
import { effectiveProducts, resolveCopy, useCatalogOverrides } from "@/lib/catalog-overrides";
import { useCnyRate } from "@/lib/use-cny-rate";
import { cn } from "@/lib/utils";
import { ShopPrice } from "./DiscountBadge";
import { QuantityStepper } from "./QuantityStepper";


type ContactMethod = "wechat" | "whatsapp" | "phone" | "email";
type Status = "idle" | "sending" | "done";

type Fields = {
  name: string;
  phone: string;
  wechat: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
};

const emptyFields: Fields = {
  name: "",
  phone: "",
  wechat: "",
  whatsapp: "",
  email: "",
  address: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground/60 focus:border-primary";

export function OrderRequestModal({
  productId,
  initialQty = 1,
  onClose,
}: {
  productId: string | null;
  initialQty?: number;
  onClose: () => void;
}) {
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const cnyRate = useCnyRate();
  const f = t.shopPage.orderForm;

  const [mounted, setMounted] = useState(false);
  const [qty, setQty] = useState(initialQty);
  const [contact, setContact] = useState<ContactMethod>("wechat");
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const overrides = useCatalogOverrides();
  const product = useMemo(
    () => effectiveProducts(overrides).find((p) => p.id === productId) ?? null,
    [overrides, productId]
  );
  const copy = product
    ? resolveCopy(product, t.shopPage.items.find((i) => i.id === productId), overrides, locale)
    : null;

  // Reset everything whenever a product opens the drawer.
  useEffect(() => {
    if (!productId) {
      setMounted(false);
      return undefined;
    }
    setQty(initialQty);
    setFields(emptyFields);
    setErrors({});
    setContact("wechat");
    setStatus("idle");
    document.body.classList.add("overflow-hidden");
    const timer = window.setTimeout(() => setMounted(true), 10);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.clearTimeout(timer);
    };
  }, [productId, initialQty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, f.errors.name).max(100, f.errors.name),
          phone: z.string().trim().regex(/^[+0-9][0-9\s()-]{5,19}$/, f.errors.phone),
          wechat: z.string().trim().max(100),
          whatsapp: z.string().trim().max(30),
          email: z.string().trim().max(255),
          address: z.string().trim().min(1, f.errors.address).max(300),
          notes: z.string().trim().max(500),
          contact: z.enum(["wechat", "whatsapp", "phone", "email"]),
        })
        .superRefine((val, ctx) => {
          if (val.contact === "wechat" && !val.wechat) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["wechat"], message: f.errors.wechat });
          }
          if (val.contact === "email" && !val.email) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: f.errors.email });
          }
          if (val.email && !z.string().email().safeParse(val.email).success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: f.errors.email });
          }
        }),
    [f]
  );

  if (!product || !copy) return null;

  const total = unitPriceNpr(product) * qty;

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ ...fields, contact });
    if (!result.success) {
      const next: Partial<Record<keyof Fields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("sending");
    // No backend yet — the request is prepared for a future server function.
    window.setTimeout(() => {
      setStatus("done");
      toast.success(f.toast?.title ?? "Order submitted", {
        description: f.toast?.description ?? "We will contact you shortly to confirm your order.",
        duration: 5000,
      });
    }, 900);

  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 h-full w-full cursor-default bg-foreground/20 backdrop-blur-md transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={f.title}
        className={cn(
          "absolute flex flex-col bg-card shadow-2xl duration-300 ease-out",
          // Mobile: full-height drawer sliding in from the right edge.
          // Desktop: centered dialog fading/scaling in — a side drawer feels out of place on wide screens.
          isMobile
            ? cn(
                "inset-y-0 right-0 h-full w-full max-w-md border-l border-border transition-transform",
                mounted ? "translate-x-0" : "translate-x-full"
              )
            : cn(
                "top-1/2 left-1/2 max-h-[88vh] w-[min(38rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border transition-[opacity,scale]",
                mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
              )
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">{f.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{f.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {status === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </span>
            <h3 className="text-xl font-semibold">{f.confirm.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.confirm.body}</p>
            <div className="w-full rounded-xl border border-border bg-secondary/40 p-4 text-left">
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] text-primary uppercase">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {f.confirm.responseLabel}
              </p>
              <p className="mt-1.5 text-sm">{f.confirm.responseTime}</p>
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {f.confirm.paymentLine}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {f.confirm.close}
            </button>
          </div>
        ) : (
          <>
            <form id="order-request-form" onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto p-5" noValidate>
              {/* Selected product summary */}
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={copy.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {f.productLabel}
                    </p>
                    <p className="truncate text-sm font-semibold">{copy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <ShopPrice product={product} price={copy.price} className="font-semibold text-primary" />
                    </p>
                  </div>
                  <QuantityStepper small value={qty} onChange={setQty} max={MAX_ORDER_QTY} label={t.shopPage.quantity} />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">{f.estimatedTotal}</span>
                  <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 text-base font-semibold text-primary">
                    {formatNpr(total)}
                    {locale === "zh" ? (
                      <span className="text-xs font-normal text-muted-foreground">{formatCny(total, cnyRate)}</span>
                    ) : null}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{f.totalNote}</p>
              </div>

              {/* Customer details */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold tracking-[0.15em] text-foreground uppercase">
                  {f.customer}
                </legend>

                {/* Two columns on the wider desktop dialog; single column in the mobile drawer. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={f.fullName} error={errors.name}>
                    <input type="text" value={fields.name} onChange={set("name")} placeholder={f.fullNamePh} maxLength={100} className={inputClass} autoComplete="name" />
                  </Field>

                  <Field label={f.phone} error={errors.phone}>
                    <input type="tel" value={fields.phone} onChange={set("phone")} placeholder={f.phonePh} maxLength={20} className={inputClass} autoComplete="tel" />
                  </Field>
                </div>

                <Field label={f.wechat} error={errors.wechat}>
                  <input type="text" value={fields.wechat} onChange={set("wechat")} placeholder={f.wechatPh} maxLength={100} className={inputClass} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={f.whatsapp} error={errors.whatsapp}>
                    <input type="tel" value={fields.whatsapp} onChange={set("whatsapp")} placeholder={f.whatsappPh} maxLength={30} className={inputClass} />
                  </Field>
                  <Field label={f.email} error={errors.email}>
                    <input type="email" value={fields.email} onChange={set("email")} placeholder={f.emailPh} maxLength={255} className={inputClass} autoComplete="email" />
                  </Field>
                </div>

                <Field label={f.address} error={errors.address}>
                  <textarea value={fields.address} onChange={set("address")} placeholder={f.addressPh} maxLength={300} rows={2} className={cn(inputClass, "resize-none")} />
                </Field>

                <Field label={f.notes} error={errors.notes}>
                  <textarea value={fields.notes} onChange={set("notes")} placeholder={f.notesPh} maxLength={500} rows={2} className={cn(inputClass, "resize-none")} />
                </Field>
              </fieldset>

              {/* Preferred contact method */}
              <fieldset>
                <legend className="text-xs font-semibold tracking-[0.15em] text-foreground uppercase">{f.contact}</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(Object.keys(f.contactMethods) as ContactMethod[]).map((method) => (
                    <label
                      key={method}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        contact === method ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-accent"
                      )}
                    >
                      <input
                        type="radio"
                        name="order-contact-method"
                        value={method}
                        checked={contact === method}
                        onChange={() => setContact(method)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                          contact === method ? "border-primary" : "border-border"
                        )}
                        aria-hidden
                      >
                        {contact === method ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </span>
                      {f.contactMethods[method]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </form>

            <div className="border-t border-border p-4">
              <p className="mb-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {f.paymentHint}
              </p>
              <button
                type="submit"
                form="order-request-form"
                disabled={status === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden />
                {status === "sending" ? f.sending : f.submit}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1 block text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
