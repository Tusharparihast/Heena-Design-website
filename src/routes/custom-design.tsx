import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Mail, MessageCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { MehndiPattern } from "@/components/site/MehndiPattern";
import { Section } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { logWebsiteBooking } from "@/lib/bookings-db";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const title = "Custom Mehndi Design Requests — Weddings & Events | Nagma Designs";
const description =
  "Request a custom henna design for weddings, festivals and private events in Kathmandu. Share references and we will shape the design with you.";

export const Route = createFileRoute("/custom-design")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomDesignPage,
});

type StyleKey = "traditional" | "modern" | "both";

/** Uploads reference photos to Storage and returns their public URLs (best-effort). */
async function uploadReferenceImages(items: { file: File }[]): Promise<string[]> {
  const urls: string[] = [];
  for (const { file } of items) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("custom-design-refs").upload(path, file);
    if (error) continue;
    const { data } = supabase.storage.from("custom-design-refs").getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}

function CustomDesignPage() {
  const { t, locale } = useLanguage();
  const b = t.booking;

  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<StyleKey | null>(null);
  // Store option indexes (not the translated text) so switching languages
  // re-translates the summary instead of keeping the old-language string.
  const [occasionIdx, setOccasionIdx] = useState(0);
  const [files, setFiles] = useState<{ name: string; url: string; file: File }[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("1");
  const [placementIdx, setPlacementIdx] = useState(0);
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [budgetCustom, setBudgetCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const occasion = b.occasion.options[occasionIdx] ?? b.occasion.options[0] ?? "";
  const placement = b.details.placementOptions[placementIdx] ?? b.details.placementOptions[0] ?? "";

  // Object URLs are only for local previews — revoke them on unmount.
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  // "Custom amount" (the option after the last preset) swaps the preset for
  // whatever the visitor types in.
  const isCustomBudget = budgetIdx >= b.details.budgetOptions.length;
  const budget = isCustomBudget
    ? budgetCustom.trim()
    : (b.details.budgetOptions[budgetIdx] ?? b.details.budgetOptions[0] ?? "");

  // Today's date in local time — used to block past dates in the picker.
  const today = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Label/value pairs power both the styled summary box and the plain-text message.
  const rows = useMemo(() => {
    const clean = (s: string) => s.replace(/[?？]\s*$/, "");
    const list = [
      { label: clean(b.style.title), value: style ? b.style[style].name : "" },
      { label: clean(b.occasion.title), value: occasion },
      { label: clean(b.details.placement), value: placement },
      { label: clean(b.details.budget), value: budget },
      { label: clean(b.details.people), value: people },
      { label: clean(b.details.date), value: date },
      { label: clean(b.details.name), value: name },
      { label: clean(b.details.notes), value: notes },
      { label: b.upload.title, value: files.length ? String(files.length) : "" },
    ];
    return list.filter((r) => r.value.trim() !== "");
  }, [b, style, occasion, placement, budget, people, date, name, notes, files.length]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list)
      .slice(0, 4 - files.length)
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }));
    setFiles((prev) => [...prev, ...next]);
  }

  const zh = locale === "zh";
  const [sending, setSending] = useState(false);

  /** Saves the request to the studio dashboard, then hands off to the channel. */
  async function submitRequest(channel: "whatsapp" | "wechat" | "email"): Promise<string | null> {
    if (!name.trim()) {
      toast.error(zh ? "请填写您的姓名。" : "Please enter your name.");
      return null;
    }
    setSending(true);
    const referenceUrls = files.length > 0 ? await uploadReferenceImages(files) : [];
    if (files.length > 0 && referenceUrls.length === 0) {
      toast.error(
        zh
          ? "参考图片上传失败，其余信息仍会发送。"
          : "Reference photos failed to upload — the rest of your request will still be sent.",
      );
    }
    const outgoingMessage = [
      b.hero.title,
      ...rows.filter((r) => r.label !== b.upload.title).map((r) => `${r.label}: ${r.value}`),
      referenceUrls.length > 0 ? `${b.upload.title}: ${referenceUrls.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const ok = await logWebsiteBooking({
      kind: "custom-design",
      name,
      service: [style ? b.style[style].name : "", occasion].filter(Boolean).join(" · "),
      date,
      people: Number(people) || 1,
      notes: [
        notes,
        placement && `Placement: ${placement}`,
        budget && `Budget: ${budget}`,
        referenceUrls.length > 0 ? `Reference photos:\n${referenceUrls.join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      locale,
      channel,
    });
    setSending(false);
    if (ok) {
      toast.success(zh ? "设计请求已发送，我们会尽快联系您。" : "Request sent — we'll get back to you shortly.");
    } else {
      toast.error(
        zh
          ? "保存失败，请直接通过微信或 WhatsApp 联系我们。"
          : "Couldn't save the request — please message us directly.",
      );
    }
    return outgoingMessage;
  }

  async function copyMessage() {
    const outgoing = await submitRequest("wechat");
    if (!outgoing) return;
    try {
      await navigator.clipboard.writeText(outgoing);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const styleKeys: StyleKey[] = ["traditional", "modern", "both"];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 px-4 py-16 sm:py-20">
        <MehndiPattern className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{b.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{b.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{b.hero.body}</p>
        </div>
      </section>

      <Section>
        <ol className="flex flex-wrap gap-2">
          {b.steps.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => (i === 0 || style ? setStep(i) : null)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  i === step ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                )}
              >
                <span className="mr-2 text-xs opacity-70">{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col rounded-2xl border border-border bg-card">
            <div className="flex-1 p-6 sm:p-8">
              <div className="min-h-[16rem] sm:min-h-[18rem]">
                {step === 0 && (
                  <div>
                    <h2 className="text-xl font-semibold">{b.style.title}</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      {styleKeys.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStyle(key)}
                          className={cn(
                            "rounded-xl border p-4 text-left transition-colors",
                            style === key ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50",
                          )}
                        >
                          <span className="block font-medium">{b.style[key].name}</span>
                          <span className="mt-2 block text-sm text-muted-foreground">{b.style[key].body}</span>
                        </button>
                      ))}
                    </div>

                    <h2 className="mt-8 text-xl font-semibold">{b.occasion.title}</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {b.occasion.options.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setOccasionIdx(idx)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm transition-colors",
                            occasionIdx === idx
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-accent",
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {!style && <p className="mt-6 text-sm text-muted-foreground">{b.required}</p>}
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-semibold">{b.upload.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{b.upload.body}</p>

                    <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center transition-colors hover:bg-accent/40">
                      <Upload className="h-6 w-6 text-primary" aria-hidden />
                      <span className="mt-3 text-sm font-medium">{b.upload.button}</span>
                      <span className="mt-1 text-xs text-muted-foreground">{b.upload.hint}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    {files.length > 0 && (
                      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {files.map((f, i) => (
                          <li key={f.url} className="relative overflow-hidden rounded-xl border border-border">
                            <img
                              src={f.url}
                              alt={f.name}
                              loading="lazy"
                              decoding="async"
                              className="aspect-square w-full object-cover"
                            />
                            <button
                              type="button"
                              aria-label={b.upload.remove}
                              onClick={() => {
                                URL.revokeObjectURL(f.url);
                                setFiles((prev) => prev.filter((_, idx) => idx !== i));
                              }}
                              className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1.5 text-foreground shadow-sm"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-semibold">{b.details.title}</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label={b.details.name}>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={b.details.namePh}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </Field>
                      <Field label={b.details.date}>
                        <input
                          type="date"
                          min={today}
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid items-start gap-4 sm:grid-cols-3">
                      <Field label={b.details.people}>
                        <input
                          type="number"
                          min={1}
                          value={people}
                          onChange={(e) => setPeople(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </Field>
                      <Field label={b.details.placement}>
                        <select
                          value={placementIdx}
                          onChange={(e) => setPlacementIdx(Number(e.target.value))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          {b.details.placementOptions.map((opt, idx) => (
                            <option key={opt} value={idx}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={b.details.budget}>
                        <select
                          value={budgetIdx}
                          onChange={(e) => setBudgetIdx(Number(e.target.value))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          {b.details.budgetOptions.map((opt, idx) => (
                            <option key={opt} value={idx}>
                              {opt}
                            </option>
                          ))}
                          <option value={b.details.budgetOptions.length}>{b.details.budgetCustom}</option>
                        </select>
                        {isCustomBudget && (
                          <input
                            value={budgetCustom}
                            onChange={(e) => setBudgetCustom(e.target.value)}
                            placeholder={b.details.budgetCustomPh}
                            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                        )}
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Field label={b.details.notes}>
                        <textarea
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={b.details.notesPh}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border px-6 py-5 sm:px-8">
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
                >
                  {b.back}
                </button>
                {step < 2 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(2, s + 1))}
                    disabled={step === 0 && !style}
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    {b.next}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-secondary/50 p-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-lg font-semibold">{b.summary.title}</h2>
            <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-border bg-background p-4 text-sm">
              <p className="font-semibold">{b.hero.title}</p>
              <dl className="mt-2 space-y-1.5">
                {rows.map((r) => (
                  <div key={r.label} className="flex flex-wrap gap-x-2">
                    <dt className="shrink-0 font-semibold text-foreground">{r.label}:</dt>
                    <dd className="min-w-0 break-words text-muted-foreground">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={sending}
                onClick={async () => {
                  const outgoing = await submitRequest("whatsapp");
                  if (!outgoing) return;
                  window.open(
                    `https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(outgoing)}`,
                    "_blank",
                    "noreferrer",
                  );
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {b.summary.send}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={copyMessage}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? b.summary.copied : `${b.summary.wechat} · ${site.wechatId}`}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={async () => {
                  const outgoing = await submitRequest("email");
                  if (!outgoing) return;
                  window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(b.hero.title)}&body=${encodeURIComponent(outgoing)}`;
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {b.summary.email}
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground italic">{b.summary.note}</p>
          </aside>
        </div>
      </Section>

      <Section className="border-t border-border pt-12 sm:pt-16">
        <div className="flex items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="text-3xl font-semibold tracking-[0.35em] text-primary sm:text-4xl">{t.appointment.or}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{t.appointment.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.appointment.title}</h2>
          <p className="mt-4 text-muted-foreground">{t.appointment.body}</p>
          <ul className="mt-6 inline-flex flex-col items-start gap-2 text-left text-sm text-muted-foreground">
            {t.appointment.points.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to="/appointment"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.appointment.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}
