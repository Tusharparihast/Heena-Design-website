import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { MehndiPattern } from "@/components/site/MehndiPattern";
import { Section } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { dateAvailability, useAppointmentSettings, useEffectiveAppointmentPage } from "@/lib/appointments";
import { logWebsiteBooking } from "@/lib/bookings-db";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const title = "Book a Mehndi Appointment in Kathmandu | Nagma Designs";
const description =
  "Book a mehndi appointment at our Maitidevi studio in Kathmandu. Pick a date and time — no design details needed, we plan everything together.";

export const Route = createFileRoute("/appointment")({
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
  component: AppointmentPage,
});

function AppointmentPage() {
  const { t, locale } = useLanguage();
  const a = t.appointment.page;
  // Admin-managed page text, option lists and availability (/admin/appointments).
  const page = useEffectiveAppointmentPage(locale);
  const apptSettings = useAppointmentSettings();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  // Store option indexes (not the translated text) so switching languages
  // re-translates the summary instead of keeping the old-language string.
  const [serviceIdx, setServiceIdx] = useState(0);
  const [date, setDate] = useState("");
  const [timeIdx, setTimeIdx] = useState(0);
  const [people, setPeople] = useState("1");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const service = page.services[serviceIdx] ?? page.services[0] ?? "";
  const time = page.timeSlots[timeIdx] ?? page.timeSlots[0] ?? "";

  // Closed weekday / blocked date warning under the date picker.
  const availability = date ? dateAvailability(apptSettings, date) : "open";

  // Today's date in local time — blocks past dates in the picker.
  const today = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Label/value pairs power both the styled summary box and the plain-text message.
  const rows = useMemo(() => {
    const clean = (s: string) => s.replace(/[?？]\s*$/, "");
    const list = [
      { label: clean(a.form.name), value: name },
      { label: clean(a.form.contact), value: contact },
      { label: clean(a.form.service), value: service },
      { label: clean(a.form.date), value: date },
      { label: clean(a.form.time), value: time },
      { label: clean(a.form.people), value: people },
      { label: clean(a.form.notes), value: notes },
    ];
    return list.filter((r) => r.value.trim() !== "");
  }, [a, name, contact, service, date, time, people, notes]);

  const message = useMemo(
    () => [page.title, ...rows.map((r) => `${r.label}: ${r.value}`)].join("\n"),
    [page.title, rows],
  );

  const zh = locale === "zh";
  const [sending, setSending] = useState(false);

  /**
   * Saves the request to the studio dashboard, then hands off to the chosen
   * channel. Returns false when the form is incomplete or unavailable.
   */
  async function submitRequest(channel: "whatsapp" | "wechat" | "email") {
    if (!name.trim()) {
      toast.error(zh ? "请填写您的姓名。" : "Please enter your name.");
      return false;
    }
    if (!contact.trim()) {
      toast.error(zh ? "请填写微信号或电话，方便我们联系您。" : "Please add a WeChat ID or phone number.");
      return false;
    }
    if (!date) {
      toast.error(zh ? "请选择日期。" : "Please pick a date.");
      return false;
    }
    if (availability !== "open") {
      toast.error(zh ? "所选日期暂不可预约，请选择其他日期。" : "That date isn't available — please pick another.");
      return false;
    }
    setSending(true);
    const ok = await logWebsiteBooking({
      kind: "appointment",
      name,
      contact,
      service,
      date,
      time,
      people: Number(people) || 1,
      notes,
      locale,
      channel,
    });
    setSending(false);
    if (ok) {
      toast.success(zh ? "预约请求已发送，我们会尽快联系您。" : "Request sent — we'll confirm shortly.");
    } else {
      toast.error(
        zh
          ? "保存失败，请直接通过微信或 WhatsApp 联系我们。"
          : "Couldn't save the request — please message us directly.",
      );
    }
    return true;
  }

  async function copyMessage() {
    if (!(await submitRequest("wechat"))) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 px-4 py-16 sm:py-20">
        <MehndiPattern className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <Link
            to="/custom-design"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {a.back}
          </Link>
          <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-primary uppercase">{a.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{page.body}</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{a.form.title}</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={a.form.name}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={a.form.namePh}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label={a.form.contact}>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={a.form.contactPh}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>

            <div className="mt-5">
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {a.form.service}
              </span>
              <div className="flex flex-wrap gap-2">
                {page.services.map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setServiceIdx(idx)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      serviceIdx === idx
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid items-start gap-4 sm:grid-cols-3">
              <div>
                <Field label={a.form.date}>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                {availability !== "open" && (
                  <p className="mt-1.5 text-xs font-medium text-destructive">
                    {availability === "blocked" ? a.availability.blocked : a.availability.closedDay}
                  </p>
                )}
              </div>
              <Field label={a.form.time}>
                <select
                  value={timeIdx}
                  onChange={(e) => setTimeIdx(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {page.timeSlots.map((opt, idx) => (
                    <option key={opt} value={idx}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={a.form.people}>
                <input
                  type="number"
                  min={1}
                  max={page.maxPeople}
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label={a.form.notes}>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={a.form.notesPh}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-secondary/50 p-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-lg font-semibold">{a.summary.title}</h2>
            <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-border bg-background p-4 text-sm">
              <p className="font-semibold">{a.title}</p>
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
                  if (!(await submitRequest("whatsapp"))) return;
                  window.open(
                    `https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`,
                    "_blank",
                    "noreferrer",
                  );
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {a.summary.send}
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
                {copied ? a.summary.copied : `${a.summary.wechat} · ${site.wechatId}`}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={async () => {
                  if (!(await submitRequest("email"))) return;
                  window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(message)}`;
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {a.summary.email}
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground italic">{page.note}</p>
          </aside>
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
