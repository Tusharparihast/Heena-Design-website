import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Copy, MapPin, QrCode, Send, Store, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/lib/cart";
import { MAX_ORDER_QTY, formatCny, formatNpr, unitPriceNpr } from "@/lib/shop";
import { productCopy, toShopProduct, usePublicCatalog } from "@/lib/shop-catalog-db";
import { useCnyRate } from "@/lib/use-cny-rate";
import { logOrderRequest } from "@/lib/bookings-db";
import { usePublicPaymentMethods } from "@/lib/payments-db";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useModalBackClose } from "@/lib/modal-history";
import { QuantityStepper } from "./QuantityStepper";

export type OrderTarget = { kind: "single"; productId: string; qty: number } | { kind: "cart" };

type Status = "idle" | "sending" | "done";
type DeliveryMethod = "pickup" | "delivery";
type ContactMethod = "wechat" | "whatsapp" | "phone" | "email";

type Fields = {
  name: string;
  phone: string;
  contactMethod: ContactMethod;
  wechat: string;
  whatsapp: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  address: string;
  notes: string;
};

const emptyFields: Fields = {
  name: "",
  phone: "",
  contactMethod: "wechat",
  wechat: "",
  whatsapp: "",
  email: "",
  deliveryMethod: "delivery",
  address: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground/60 focus:border-primary";

interface OrderLine {
  id: string;
  name: string;
  image: string;
  qty: number;
  unitPriceNpr: number;
}

export function OrderRequestModal({ target, onClose }: { target: OrderTarget | null; onClose: () => void }) {
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const cnyRate = useCnyRate();
  const { methods: paymentMethods } = usePublicPaymentMethods();
  const { items: cartItems, clear: clearCart } = useCart();
  const { products } = usePublicCatalog();
  const f = t.shopPage.orderForm;
  const c = t.shopPage.cart;

  const [mounted, setMounted] = useState(false);
  const [qty, setQty] = useState(1);
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [summaryText, setSummaryText] = useState("");
  const [copied, setCopied] = useState(false);

  useModalBackClose(target !== null, onClose);

  useEffect(() => {
    if (!target) {
      setMounted(false);
      return undefined;
    }
    if (target.kind === "single") setQty(target.qty);
    setFields(emptyFields);
    setErrors({});
    setStatus("idle");
    setSummaryText("");
    document.body.classList.add("overflow-hidden");
    const timer = window.setTimeout(() => setMounted(true), 10);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.clearTimeout(timer);
    };
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const orderLines = useMemo<OrderLine[]>(() => {
    if (!target) return [];
    if (target.kind === "single") {
      const db = products.find((p) => p.id === target.productId);
      if (!db) return [];
      const product = toShopProduct(db);
      const copy = productCopy(db, locale);
      return [{ id: db.id, name: copy.name, image: product.image, qty, unitPriceNpr: unitPriceNpr(product) }];
    }
    return cartItems
      .map((line) => {
        const db = products.find((p) => p.id === line.id);
        if (!db) return null;
        const product = toShopProduct(db);
        const copy = productCopy(db, locale);
        return { id: db.id, name: copy.name, image: product.image, qty: line.qty, unitPriceNpr: unitPriceNpr(product) };
      })
      .filter((l): l is OrderLine => l !== null);
  }, [target, qty, cartItems, products, locale]);

  const total = orderLines.reduce((sum, l) => sum + l.unitPriceNpr * l.qty, 0);

  // Dynamic Validation Schema based on options selected
  const schema = useMemo(() => {
    return z.object({
      name: z.string().trim().min(1, f.errors.name).max(100, f.errors.name),
      phone: z
        .string()
        .trim()
        .regex(/^[+0-9][0-9\s()-]{5,19}$/, f.errors.phone),
      contactMethod: z.enum(["wechat", "whatsapp", "phone", "email"]),
      wechat:
        fields.contactMethod === "wechat"
          ? z.string().trim().min(1, f.errors.wechat).max(100, f.errors.wechat)
          : z.string().optional(),
      whatsapp:
        fields.contactMethod === "whatsapp"
          ? z
              .string()
              .trim()
              .regex(/^[+0-9][0-9\s()-]{5,19}$/, f.errors.phone)
          : z.string().optional(),
      email:
        fields.contactMethod === "email"
          ? z
              .string()
              .trim()
              .email(locale === "zh" ? "请输入有效的邮箱地址" : "Invalid email address")
          : z.string().optional(),
      deliveryMethod: z.enum(["pickup", "delivery"]),
      address:
        fields.deliveryMethod === "delivery"
          ? z.string().trim().min(1, f.errors.address).max(300)
          : z.string().optional(),
      notes: z.string().trim().max(500),
    });
  }, [f, fields.contactMethod, fields.deliveryMethod, locale]);

  if (!target || (orderLines.length === 0 && status !== "done")) return null;

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  function buildSummary(): string {
    const header = `${f.title} — ${site.name}`;
    const itemLines = orderLines
      .map((l, i) => `${i + 1}. ${l.name} × ${l.qty} — ${formatNpr(l.unitPriceNpr * l.qty)}`)
      .join("\n");
    const totalLine = `${f.estimatedTotal}: ${formatNpr(total)}`;

    let activeContactDetail = "";
    if (fields.contactMethod === "wechat") activeContactDetail = `${f.wechat}: ${fields.wechat}`;
    else if (fields.contactMethod === "whatsapp") activeContactDetail = `${f.whatsapp}: ${fields.whatsapp}`;
    else if (fields.contactMethod === "email") activeContactDetail = `Email: ${fields.email}`;
    else activeContactDetail = `Phone: ${fields.phone}`;

    const customerLines = [
      `${f.fullName}: ${fields.name}`,
      `${f.phone}: ${fields.phone}`,
      activeContactDetail,
      `Delivery Option: ${fields.deliveryMethod === "pickup" ? "Pickup from Maitidevi" : "Delivery"}`,
      fields.deliveryMethod === "delivery" ? `${f.address}: ${fields.address}` : "",
      fields.notes ? `${f.notes}: ${fields.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return `${header}\n\n${itemLines}\n\n${totalLine}\n\n${customerLines}`;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const result = schema.safeParse(fields);
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

    const ok = await logOrderRequest({
      name: fields.name,
      phone: fields.phone,
      wechat: fields.contactMethod === "wechat" ? fields.wechat : "",
      whatsapp: fields.contactMethod === "whatsapp" ? fields.whatsapp : "",
      email: fields.contactMethod === "email" ? fields.email : "",
      address: fields.deliveryMethod === "delivery" ? fields.address : "Pickup from Maitidevi",
      notes: fields.notes,
      contactMethod: fields.contactMethod,
      deliveryMethod: fields.deliveryMethod,
      items: orderLines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, unitPriceNpr: l.unitPriceNpr })),
      totalNpr: total,
      locale,
    });

    if (!ok) {
      setStatus("idle");
      toast.error(
        locale === "zh"
          ? "提交失败，请重试或直接通过微信联系我们。"
          : "Couldn't submit the request. Please try again or reach us on WeChat.",
      );
      return;
    }

    setSummaryText(buildSummary());
    if (target.kind === "cart") clearCart();
    setStatus("done");
    toast.success(f.toast?.title ?? "Order submitted", {
      description: f.toast?.description ?? "We will contact you shortly to confirm your order.",
      duration: 5000,
    });
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success(c.copied);
    } catch {
      toast.error(c.copyFailed);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 h-full w-full cursor-default bg-foreground/20 backdrop-blur-md transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={f.title}
        className={cn(
          "absolute flex flex-col bg-card shadow-2xl duration-300 ease-out",
          isMobile
            ? cn(
                "inset-y-0 right-0 h-full w-full max-w-md border-l border-border transition-transform",
                mounted ? "translate-x-0" : "translate-x-full",
              )
            : cn(
                "top-1/2 left-1/2 max-h-[88vh] w-[min(38rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border transition-[opacity,scale]",
                mounted ? "scale-100 opacity-100" : "scale-95 opacity-0",
              ),
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

              {paymentMethods.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {paymentMethods.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border bg-background p-2 text-center">
                      <img
                        src={m.qrImage}
                        alt={m.label}
                        width={80}
                        height={80}
                        className="mx-auto h-20 w-20 rounded-md bg-white object-contain p-1"
                      />
                      <p className="mt-1.5 truncate text-xs font-medium">{m.label}</p>
                      {m.accountNumber ? (
                        <p className="truncate text-[10px] text-muted-foreground">{m.accountNumber}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void copySummary()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:underline"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copied ? c.copied : c.copyDetails}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {f.confirm.close}
            </button>
          </div>
        ) : (
          <>
            <form
              id="order-request-form"
              onSubmit={(e) => void submit(e)}
              className="flex-1 space-y-5 overflow-y-auto p-5"
              noValidate
            >
              {/* ORDER SUMMARY */}
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                {target.kind === "single" && orderLines[0] ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={orderLines[0].image}
                      alt={orderLines[0].name}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {f.productLabel}
                      </p>
                      <p className="truncate text-sm font-semibold">{orderLines[0].name}</p>
                      <p className="text-xs font-semibold text-primary">{formatNpr(orderLines[0].unitPriceNpr)}</p>
                    </div>
                    <QuantityStepper
                      small
                      value={qty}
                      onChange={setQty}
                      max={MAX_ORDER_QTY}
                      label={t.shopPage.quantity}
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {orderLines.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                        <img
                          src={l.image}
                          alt={l.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{l.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.qty} × {formatNpr(l.unitPriceNpr)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          {formatNpr(l.unitPriceNpr * l.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
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

              {/* CUSTOMER & ORDER DETAILS */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold tracking-[0.15em] text-foreground uppercase">
                  {f.customer}
                </legend>

                {/* NAME & PHONE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={f.fullName} error={errors.name}>
                    <input
                      type="text"
                      value={fields.name}
                      onChange={set("name")}
                      placeholder={f.fullNamePh}
                      maxLength={100}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label={f.phone} error={errors.phone}>
                    <input
                      type="tel"
                      value={fields.phone}
                      onChange={set("phone")}
                      placeholder={f.phonePh}
                      maxLength={20}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </Field>
                </div>

                {/* PREFERRED CONTACT METHOD */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    {locale === "zh" ? "首选联系方式" : "Preferred Contact Method"}
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        { id: "wechat", label: "WeChat" },
                        { id: "whatsapp", label: "WhatsApp" },
                        { id: "phone", label: locale === "zh" ? "电话" : "Phone" },
                        { id: "email", label: "Email" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFields((prev) => ({ ...prev, contactMethod: m.id }))}
                        className={cn(
                          "flex items-center justify-center rounded-lg border py-2 text-xs font-medium transition-all",
                          fields.contactMethod === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:bg-accent text-muted-foreground",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC CONTACT FIELD */}
                {fields.contactMethod === "wechat" && (
                  <Field label={f.wechat} error={errors.wechat}>
                    <input
                      type="text"
                      value={fields.wechat}
                      onChange={set("wechat")}
                      placeholder={f.wechatPh}
                      maxLength={100}
                      className={inputClass}
                    />
                  </Field>
                )}

                {fields.contactMethod === "whatsapp" && (
                  <Field label={f.whatsapp} error={errors.whatsapp}>
                    <input
                      type="tel"
                      value={fields.whatsapp}
                      onChange={set("whatsapp")}
                      placeholder={f.whatsappPh}
                      maxLength={30}
                      className={inputClass}
                    />
                  </Field>
                )}

                {fields.contactMethod === "email" && (
                  <Field label="Email Address" error={errors.email}>
                    <input
                      type="email"
                      value={fields.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      maxLength={100}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </Field>
                )}

                {fields.contactMethod === "phone" && (
                  <p className="text-xs text-muted-foreground italic">
                    {locale === "zh"
                      ? "我们将直接拨打您上面填写的电话号码。"
                      : "We will call you directly at the phone number provided above."}
                  </p>
                )}

                {/* DELIVERY CHOICE */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    {locale === "zh" ? "取货/配送方式" : "Fulfillment Method"}
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFields((prev) => ({ ...prev, deliveryMethod: "delivery" }))}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all",
                        fields.deliveryMethod === "delivery"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-accent text-muted-foreground",
                      )}
                    >
                      <MapPin className="h-4 w-4 shrink-0" />
                      {locale === "zh" ? "配送到家" : "Delivery"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFields((prev) => ({ ...prev, deliveryMethod: "pickup" }))}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all",
                        fields.deliveryMethod === "pickup"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-accent text-muted-foreground",
                      )}
                    >
                      <Store className="h-4 w-4 shrink-0" />
                      {locale === "zh" ? "Maitidevi 自提" : "Pickup from Maitidevi"}
                    </button>
                  </div>
                </div>

                {/* ADDRESS FIELD (SHOWN ONLY IF DELIVERY IS SELECTED) */}
                {fields.deliveryMethod === "delivery" && (
                  <Field label={f.address} error={errors.address}>
                    <textarea
                      value={fields.address}
                      onChange={set("address")}
                      placeholder={f.addressPh}
                      maxLength={300}
                      rows={2}
                      className={cn(inputClass, "resize-none")}
                    />
                  </Field>
                )}

                {/* NOTES */}
                <Field label={f.notes} error={errors.notes}>
                  <textarea
                    value={fields.notes}
                    onChange={set("notes")}
                    placeholder={f.notesPh}
                    maxLength={500}
                    rows={2}
                    className={cn(inputClass, "resize-none")}
                  />
                </Field>
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

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
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
