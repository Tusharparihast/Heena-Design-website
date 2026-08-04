import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Upload, X } from "lucide-react";
import { MehndiPattern } from "@/components/site/MehndiPattern";
import { Section } from "@/components/site/Section";
import { useLanguage } from "@/i18n/LanguageProvider";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

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

function CustomDesignPage() {
  const { t } = useLanguage();
  const b = t.booking;

  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [occasion, setOccasion] = useState<string>(b.occasion.options[0] ?? "");
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("1");
  const [placement, setPlacement] = useState<string>(b.details.placementOptions[0] ?? "");
  const [budgetChoice, setBudgetChoice] = useState<string>(b.details.budgetOptions[0] ?? "");
  const [budgetCustom, setBudgetCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  // Object URLs are only for local previews — revoke them on unmount.
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  // "Custom amount" swaps the preset for whatever the visitor types in.
  const isCustomBudget = budgetChoice === b.details.budgetCustom;
  const budget = isCustomBudget ? budgetCustom.trim() : budgetChoice;

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

  const message = useMemo(
    () => [b.hero.title, ...rows.map((r) => `${r.label}: ${r.value}`)].join("\n"),
    [b.hero.title, rows],
  );

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list)
      .slice(0, 4 - files.length)
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFiles((prev) => [...prev, ...next]);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
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
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {b.hero.eyebrow}
          </p>
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
                  i === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                <span className="mr-2 text-xs opacity-70">{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
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
                        style === key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent/50",
                      )}
                    >
                      <span className="block font-medium">{b.style[key].name}</span>
                      <span className="mt-2 block text-sm text-muted-foreground">
                        {b.style[key].body}
                      </span>
                    </button>
                  ))}
                </div>

                <h2 className="mt-8 text-xl font-semibold">{b.occasion.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {b.occasion.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setOccasion(opt)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        occasion === opt
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
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </Field>
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
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {b.details.placementOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={b.details.budget}>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {b.details.budgetOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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

            <div className="mt-8 flex justify-between gap-3">
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

          <aside className="rounded-2xl border border-border bg-secondary/50 p-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-lg font-semibold">{b.summary.title}</h2>
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-border bg-background p-4 font-sans text-sm whitespace-pre-wrap text-muted-foreground">
              {message}
            </pre>

            <div className="mt-5 space-y-2">
              <a
                href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {b.summary.send}
              </a>
              <button
                type="button"
                onClick={copyMessage}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? b.summary.copied : `${b.summary.wechat} · ${site.wechatId}`}
              </button>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(b.hero.title)}&body=${encodeURIComponent(message)}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {b.summary.email}
              </a>
            </div>

            <p className="mt-4 text-xs text-muted-foreground italic">{b.summary.note}</p>
          </aside>
        </div>
      </Section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
