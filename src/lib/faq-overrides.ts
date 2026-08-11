import { useEffect, useState } from "react";

import { dictionaries, type Locale } from "@/i18n/dictionaries";

/**
 * Studio-managed FAQ.
 *
 * The built-in questions live in the dictionaries; the admin FAQ page
 * (/admin/faq) stores overrides so the studio can edit, reorder, hide,
 * add and delete questions bilingually. Persisted in localStorage, like the
 * other admin managers in this project.
 */

const STORAGE_KEY = "nd-faq-overrides";
const CHANGE_EVENT = "nd:faq-overrides";

export interface FaqItem {
  id: string;
  questionEn: string;
  questionZh: string;
  answerEn: string;
  answerZh: string;
}

export interface FaqOverrides {
  /** Per-field edits for built-in questions, keyed by id. */
  edits: Record<string, Partial<Omit<FaqItem, "id">>>;
  /** Questions added in the dashboard. */
  added: FaqItem[];
  /** Ids hidden from the public FAQ. */
  hidden: string[];
  /** Ids removed (built-ins are only hidden from the admin list too). */
  deleted: string[];
  /** Display order (ids). Ids missing from the list fall back to natural order. */
  order: string[];
  labelEn?: string | undefined;
  labelZh?: string | undefined;
  titleEn?: string | undefined;
  titleZh?: string | undefined;
}

export const emptyFaqOverrides: FaqOverrides = {
  edits: {},
  added: [],
  hidden: [],
  deleted: [],
  order: [],
};

export const builtinFaqItems: FaqItem[] = dictionaries.en.faq.items.map((item, i) => {
  const zh = dictionaries.zh.faq.items[i];
  return {
    id: `faq-${i}`,
    questionEn: item.q,
    questionZh: zh?.q ?? item.q,
    answerEn: item.a,
    answerZh: zh?.a ?? item.a,
  };
});

const builtinIds = new Set(builtinFaqItems.map((f) => f.id));

function cleanText(value: unknown, max = 800): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanEdit(raw: unknown): Partial<Omit<FaqItem, "id">> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: Partial<Omit<FaqItem, "id">> = {};
  const qEn = cleanText(o["questionEn"], 200);
  const qZh = cleanText(o["questionZh"], 200);
  const aEn = cleanText(o["answerEn"]);
  const aZh = cleanText(o["answerZh"]);
  if (qEn) out.questionEn = qEn;
  if (qZh) out.questionZh = qZh;
  if (aEn) out.answerEn = aEn;
  if (aZh) out.answerZh = aZh;
  return Object.keys(out).length ? out : undefined;
}

function cleanItem(raw: unknown): FaqItem | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const id = cleanText(o["id"], 60);
  const questionEn = cleanText(o["questionEn"], 200);
  const answerEn = cleanText(o["answerEn"]);
  if (!id || !questionEn || !answerEn || builtinIds.has(id)) return undefined;
  return {
    id,
    questionEn,
    questionZh: cleanText(o["questionZh"], 200) ?? "",
    answerEn,
    answerZh: cleanText(o["answerZh"]) ?? "",
  };
}

function sanitize(raw: unknown): FaqOverrides {
  if (!raw || typeof raw !== "object") return emptyFaqOverrides;
  const o = raw as Record<string, unknown>;

  const edits: Record<string, Partial<Omit<FaqItem, "id">>> = {};
  const rawEdits = o["edits"];
  if (rawEdits && typeof rawEdits === "object") {
    for (const [id, edit] of Object.entries(rawEdits as Record<string, unknown>)) {
      if (!builtinIds.has(id)) continue;
      const cleaned = cleanEdit(edit);
      if (cleaned) edits[id] = cleaned;
    }
  }

  const seen = new Set<string>();
  const added = (Array.isArray(o["added"]) ? (o["added"] as unknown[]) : [])
    .map(cleanItem)
    .filter((c): c is FaqItem => {
      if (!c || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

  const known = new Set<string>([...builtinIds, ...added.map((a) => a.id)]);
  const idList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && known.has(id)) : [];

  return {
    edits,
    added,
    hidden: idList(o["hidden"]),
    deleted: idList(o["deleted"]),
    order: idList(o["order"]),
    labelEn: cleanText(o["labelEn"], 60),
    labelZh: cleanText(o["labelZh"], 60),
    titleEn: cleanText(o["titleEn"], 120),
    titleZh: cleanText(o["titleZh"], 120),
  };
}

export function readFaqOverrides(): FaqOverrides {
  if (typeof window === "undefined") return emptyFaqOverrides;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFaqOverrides;
    return sanitize(JSON.parse(raw));
  } catch {
    return emptyFaqOverrides;
  }
}

export function writeFaqOverrides(overrides: FaqOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(overrides)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function sortByOrder(items: FaqItem[], order: string[]): FaqItem[] {
  if (order.length === 0) return items;
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/** All questions with edits applied, excluding deleted ones (admin list). */
export function adminFaqItems(overrides: FaqOverrides): FaqItem[] {
  const base = builtinFaqItems
    .filter((f) => !overrides.deleted.includes(f.id))
    .map((f) => ({ ...f, ...(overrides.edits[f.id] ?? {}) }));
  const custom = overrides.added.filter((c) => !overrides.deleted.includes(c.id));
  return sortByOrder([...base, ...custom], overrides.order);
}

/** Public list: admin list minus hidden questions. */
export function effectiveFaqItems(overrides: FaqOverrides): FaqItem[] {
  return adminFaqItems(overrides).filter((f) => !overrides.hidden.includes(f.id));
}

export function faqSectionHeading(overrides: FaqOverrides) {
  return {
    labelEn: overrides.labelEn ?? dictionaries.en.faq.label,
    labelZh: overrides.labelZh ?? dictionaries.zh.faq.label,
    titleEn: overrides.titleEn ?? dictionaries.en.faq.title,
    titleZh: overrides.titleZh ?? dictionaries.zh.faq.title,
  };
}

/** Pick the right locale text, falling back to English when 中文 is blank. */
export function faqText(item: FaqItem, locale: Locale) {
  return {
    q: locale === "zh" ? item.questionZh || item.questionEn : item.questionEn,
    a: locale === "zh" ? item.answerZh || item.answerEn : item.answerEn,
  };
}

export function makeFaqId(taken: ReadonlySet<string>): string {
  let n = 1;
  let candidate = `custom-faq-${n}`;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `custom-faq-${n}`;
  }
  return candidate;
}

export function allFaqIds(overrides: FaqOverrides): Set<string> {
  return new Set<string>([...builtinIds, ...overrides.added.map((a) => a.id)]);
}

export function useFaqOverrides(): FaqOverrides {
  const [overrides, setOverrides] = useState<FaqOverrides>(emptyFaqOverrides);

  useEffect(() => {
    const sync = () => setOverrides(readFaqOverrides());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return overrides;
}
