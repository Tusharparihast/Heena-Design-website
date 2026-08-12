// ============= Studio-managed courses =============
// Built-in course content lives in the dictionaries; the admin Courses page
// (/admin/courses) stores overrides in the shared `site_content` document so
// every visitor and device sees the same, studio-approved course list.

import { useEffect, useMemo } from "react";

import { dictionaries, type Locale } from "@/i18n/dictionaries";
import { migrateLocalContent, saveSiteContent, useSiteContent } from "./site-content";

const CONTENT_KEY = "courses";
const LEGACY_STORAGE_KEY = "nd-courses-overrides";

/** A course, written in both languages. */
export interface CourseItem {
  id: string;
  nameEn: string;
  nameZh: string;
  bodyEn: string;
  bodyZh: string;
  levelEn: string;
  levelZh: string;
  durationEn: string;
  durationZh: string;
  scheduleEn: string;
  scheduleZh: string;
  batchEn: string;
  batchZh: string;
  priceEn: string;
  priceZh: string;
  learnEn: string[];
  learnZh: string[];
  includesEn: string[];
  includesZh: string[];
}

export type CourseEdit = Partial<Omit<CourseItem, "id">>;

export interface CoursesOverrides {
  /** Per-field edits for built-in courses, keyed by id. */
  edits: Record<string, CourseEdit>;
  /** Courses added in the dashboard. */
  added: CourseItem[];
  /** Ids hidden from the public site. */
  hidden: string[];
  /** Ids removed from the site (restorable by un-deleting in the dashboard). */
  deleted: string[];
  /** Display order (ids); anything missing keeps its natural position. */
  order: string[];
  /** Optional replacement for the "details are placeholders" note. */
  noteEn?: string | undefined;
  noteZh?: string | undefined;
}

export const emptyCoursesOverrides: CoursesOverrides = {
  edits: {},
  added: [],
  hidden: [],
  deleted: [],
  order: [],
};

/** Courses shipped with the site, merged from the EN + 中文 dictionaries. */
export const builtinCourses: CourseItem[] = dictionaries.en.coursesPage.items.map((item, i) => {
  const zh = dictionaries.zh.coursesPage.items[i];
  return {
    id: item.id,
    nameEn: item.name,
    nameZh: zh?.name ?? item.name,
    bodyEn: item.body,
    bodyZh: zh?.body ?? item.body,
    levelEn: item.level,
    levelZh: zh?.level ?? item.level,
    durationEn: item.duration,
    durationZh: zh?.duration ?? item.duration,
    scheduleEn: item.schedule,
    scheduleZh: zh?.schedule ?? item.schedule,
    batchEn: item.batch,
    batchZh: zh?.batch ?? item.batch,
    priceEn: item.price,
    priceZh: zh?.price ?? item.price,
    learnEn: [...item.learn],
    learnZh: [...(zh?.learn ?? item.learn)],
    includesEn: [...item.includes],
    includesZh: [...(zh?.includes ?? item.includes)],
  };
});

const builtinIds = new Set(builtinCourses.map((c) => c.id));

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

function cleanText(value: unknown, max = 600): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.trim()) return undefined;
  return value.slice(0, max);
}

function cleanList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((v) => cleanText(v, 200))
    .filter((v): v is string => Boolean(v))
    .slice(0, 20);
}

const TEXT_FIELDS = [
  "nameEn",
  "nameZh",
  "bodyEn",
  "bodyZh",
  "levelEn",
  "levelZh",
  "durationEn",
  "durationZh",
  "scheduleEn",
  "scheduleZh",
  "batchEn",
  "batchZh",
  "priceEn",
  "priceZh",
] as const;

const LIST_FIELDS = ["learnEn", "learnZh", "includesEn", "includesZh"] as const;

function cleanEdit(raw: unknown): CourseEdit | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: CourseEdit = {};
  for (const key of TEXT_FIELDS) {
    const value = cleanText(o[key]);
    if (value) out[key] = value;
  }
  for (const key of LIST_FIELDS) {
    const value = cleanList(o[key]);
    if (value) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function cleanAdded(raw: unknown): CourseItem | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const id = cleanText(o["id"], 60);
  const nameEn = cleanText(o["nameEn"], 120);
  if (!id || !nameEn || builtinIds.has(id)) return undefined;
  const edit = cleanEdit(raw) ?? {};
  return {
    id,
    nameEn,
    nameZh: edit.nameZh ?? "",
    bodyEn: edit.bodyEn ?? "",
    bodyZh: edit.bodyZh ?? "",
    levelEn: edit.levelEn ?? "",
    levelZh: edit.levelZh ?? "",
    durationEn: edit.durationEn ?? "",
    durationZh: edit.durationZh ?? "",
    scheduleEn: edit.scheduleEn ?? "",
    scheduleZh: edit.scheduleZh ?? "",
    batchEn: edit.batchEn ?? "",
    batchZh: edit.batchZh ?? "",
    priceEn: edit.priceEn ?? "",
    priceZh: edit.priceZh ?? "",
    learnEn: edit.learnEn ?? [],
    learnZh: edit.learnZh ?? [],
    includesEn: edit.includesEn ?? [],
    includesZh: edit.includesZh ?? [],
  };
}

export function sanitizeCourses(raw: unknown): CoursesOverrides {
  if (!raw || typeof raw !== "object") return emptyCoursesOverrides;
  const o = raw as Record<string, unknown>;

  const edits: Record<string, CourseEdit> = {};
  if (o["edits"] && typeof o["edits"] === "object") {
    for (const [id, value] of Object.entries(o["edits"] as Record<string, unknown>)) {
      const cleaned = cleanEdit(value);
      if (cleaned) edits[id] = cleaned;
    }
  }

  const added = (Array.isArray(o["added"]) ? o["added"] : [])
    .map(cleanAdded)
    .filter((c): c is CourseItem => Boolean(c));

  const known = new Set<string>([...builtinIds, ...added.map((c) => c.id)]);
  const idList = (value: unknown) =>
    (Array.isArray(value) ? value : []).filter((id): id is string => typeof id === "string" && known.has(id));

  return {
    edits,
    added,
    hidden: idList(o["hidden"]),
    deleted: idList(o["deleted"]),
    order: idList(o["order"]),
    noteEn: cleanText(o["noteEn"], 300),
    noteZh: cleanText(o["noteZh"], 300),
  };
}

export function isCoursesPristine(o: CoursesOverrides): boolean {
  return (
    Object.keys(o.edits).length === 0 &&
    o.added.length === 0 &&
    o.hidden.length === 0 &&
    o.deleted.length === 0 &&
    o.order.length === 0 &&
    !o.noteEn &&
    !o.noteZh
  );
}

export function writeCoursesOverrides(next: CoursesOverrides) {
  void saveSiteContent(CONTENT_KEY, sanitizeCourses(next));
}

/* ------------------------------------------------------------------ */
/* Merging                                                             */
/* ------------------------------------------------------------------ */

function applyEdit(course: CourseItem, edit: CourseEdit | undefined): CourseItem {
  return edit ? { ...course, ...edit } : course;
}

function ordered(list: CourseItem[], order: string[]): CourseItem[] {
  if (order.length === 0) return list;
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...list].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
}

/** Every non-deleted course (including hidden ones) for the dashboard list. */
export function adminCourses(o: CoursesOverrides): { course: CourseItem; hidden: boolean; custom: boolean }[] {
  const list = [
    ...builtinCourses.map((c) => ({ course: applyEdit(c, o.edits[c.id]), custom: false })),
    ...o.added.map((c) => ({ course: applyEdit(c, o.edits[c.id]), custom: true })),
  ].filter((row) => !o.deleted.includes(row.course.id));
  return ordered(
    list.map((r) => r.course),
    o.order,
  ).map((course) => ({
    course,
    hidden: o.hidden.includes(course.id),
    custom: list.find((r) => r.course.id === course.id)?.custom ?? false,
  }));
}

/** Public course list: visible courses only, in the studio's chosen order. */
export function effectiveCourses(o: CoursesOverrides): CourseItem[] {
  return adminCourses(o)
    .filter((row) => !row.hidden)
    .map((row) => row.course);
}

export interface LocalizedCourse {
  id: string;
  name: string;
  body: string;
  level: string;
  duration: string;
  schedule: string;
  batch: string;
  price: string;
  learn: string[];
  includes: string[];
}

/** Picks one language, falling back to English when a 中文 value is blank. */
export function localizeCourse(c: CourseItem, locale: Locale): LocalizedCourse {
  const pick = (en: string, zh: string) => (locale === "zh" && zh.trim() ? zh : en);
  const pickList = (en: string[], zh: string[]) => (locale === "zh" && zh.length > 0 ? zh : en);
  return {
    id: c.id,
    name: pick(c.nameEn, c.nameZh),
    body: pick(c.bodyEn, c.bodyZh),
    level: pick(c.levelEn, c.levelZh),
    duration: pick(c.durationEn, c.durationZh),
    schedule: pick(c.scheduleEn, c.scheduleZh),
    batch: pick(c.batchEn, c.batchZh),
    price: pick(c.priceEn, c.priceZh),
    learn: pickList(c.learnEn, c.learnZh),
    includes: pickList(c.includesEn, c.includesZh),
  };
}

/** URL-safe unique id for a studio-created course. */
export function makeCourseId(name: string, taken: ReadonlySet<string>): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "course";
  let candidate = `course-${slug}`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `course-${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

/* ------------------------------------------------------------------ */
/* React hooks                                                         */
/* ------------------------------------------------------------------ */

export function useCoursesOverrides(): CoursesOverrides {
  const { doc } = useSiteContent(CONTENT_KEY);

  useEffect(() => {
    migrateLocalContent(CONTENT_KEY, LEGACY_STORAGE_KEY, (value) => isCoursesPristine(sanitizeCourses(value)));
  }, []);

  return useMemo(() => sanitizeCourses(doc), [doc]);
}

/** Public, localized course list — reactive to dashboard edits. */
export function useEffectiveCourses(locale: Locale): LocalizedCourse[] {
  const overrides = useCoursesOverrides();
  return useMemo(() => effectiveCourses(overrides).map((c) => localizeCourse(c, locale)), [overrides, locale]);
}

/** Studio note shown under the course list ("", when the studio cleared it). */
export function useCoursesNote(locale: Locale, fallback: string): string {
  const overrides = useCoursesOverrides();
  const custom = locale === "zh" ? overrides.noteZh : overrides.noteEn;
  return custom ?? fallback;
}
