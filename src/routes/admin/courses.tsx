import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Eye, EyeOff, GraduationCap, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BilingualField } from "@/components/admin/BilingualField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { en } from "@/i18n/en";
import {
  adminCourses,
  emptyCoursesOverrides,
  makeCourseId,
  useCoursesOverrides,
  writeCoursesOverrides,
  type CourseEdit,
  type CourseItem,
  type CoursesOverrides,
} from "@/lib/courses-overrides";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCoursesPage,
});

function AdminCoursesPage() {
  const overrides = useCoursesOverrides();
  const rows = adminCourses(overrides);

  function persist(next: CoursesOverrides) {
    writeCoursesOverrides(next);
  }

  function edit(id: string, patch: CourseEdit) {
    persist({ ...overrides, edits: { ...overrides.edits, [id]: { ...overrides.edits[id], ...patch } } });
  }

  function addCourse() {
    const taken = new Set(rows.map((r) => r.course.id));
    const id = makeCourseId("new course", taken);
    const blank: CourseItem = {
      id,
      nameEn: "New course",
      nameZh: "",
      bodyEn: "",
      bodyZh: "",
      levelEn: "",
      levelZh: "",
      durationEn: "",
      durationZh: "",
      scheduleEn: "",
      scheduleZh: "",
      batchEn: "",
      batchZh: "",
      priceEn: "",
      priceZh: "",
      learnEn: [],
      learnZh: [],
      includesEn: [],
      includesZh: [],
    };
    persist({
      ...overrides,
      added: [...overrides.added, blank],
      order: [...(overrides.order.length ? overrides.order : rows.map((r) => r.course.id)), id],
    });
    toast.success("Course added — edit the details below.");
  }

  function toggleHidden(id: string) {
    persist({
      ...overrides,
      hidden: overrides.hidden.includes(id)
        ? overrides.hidden.filter((x) => x !== id)
        : [...overrides.hidden, id],
    });
  }

  function removeCourse(id: string) {
    persist({
      ...overrides,
      deleted: [...overrides.deleted, id],
      hidden: overrides.hidden.filter((x) => x !== id),
    });
    toast.success("Course removed.");
  }

  function move(id: string, dir: -1 | 1) {
    const ids = rows.map((r) => r.course.id);
    const from = ids.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as string);
    persist({ ...overrides, order: next });
  }

  function reset() {
    persist(emptyCoursesOverrides);
    toast.success("Restored the default courses.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Course cards on the homepage and the Courses page. Changes save automatically in both
            languages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button onClick={addCourse}>
            <Plus className="mr-1.5 h-4 w-4" /> Add course
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section note</CardTitle>
          <CardDescription>Small italic line shown under the course list.</CardDescription>
        </CardHeader>
        <CardContent>
          <BilingualField
            label="Note"
            valueEn={overrides.noteEn ?? en.coursesPage.note}
            valueZh={overrides.noteZh ?? ""}
            onChange={(locale, value) =>
              persist({ ...overrides, [locale === "en" ? "noteEn" : "noteZh"]: value })
            }
            multiline
          />
        </CardContent>
      </Card>

      {rows.map(({ course, hidden, custom }, index) => (
        <Card key={course.id} className={cn(hidden && "opacity-70")}>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
                {course.nameEn || "Untitled course"}
                {hidden ? (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Hidden
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>{custom ? "Studio course" : "Built-in course"}</CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(course.id, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Move down"
                disabled={index === rows.length - 1}
                onClick={() => move(course.id, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={hidden ? "Show course" : "Hide course"}
                onClick={() => toggleHidden(course.id)}
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Remove course"
                onClick={() => removeCourse(course.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <BilingualField
              label="Course name"
              valueEn={course.nameEn}
              valueZh={course.nameZh}
              onChange={(l, v) => edit(course.id, l === "en" ? { nameEn: v } : { nameZh: v })}
            />
            <BilingualField
              label="Description"
              valueEn={course.bodyEn}
              valueZh={course.bodyZh}
              multiline
              onChange={(l, v) => edit(course.id, l === "en" ? { bodyEn: v } : { bodyZh: v })}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <BilingualField
                label="Level"
                valueEn={course.levelEn}
                valueZh={course.levelZh}
                onChange={(l, v) => edit(course.id, l === "en" ? { levelEn: v } : { levelZh: v })}
              />
              <BilingualField
                label="Duration"
                valueEn={course.durationEn}
                valueZh={course.durationZh}
                onChange={(l, v) => edit(course.id, l === "en" ? { durationEn: v } : { durationZh: v })}
              />
              <BilingualField
                label="Schedule"
                valueEn={course.scheduleEn}
                valueZh={course.scheduleZh}
                onChange={(l, v) => edit(course.id, l === "en" ? { scheduleEn: v } : { scheduleZh: v })}
              />
              <BilingualField
                label="Batch size"
                valueEn={course.batchEn}
                valueZh={course.batchZh}
                onChange={(l, v) => edit(course.id, l === "en" ? { batchEn: v } : { batchZh: v })}
              />
            </div>

            <BilingualField
              label="Price"
              valueEn={course.priceEn}
              valueZh={course.priceZh}
              onChange={(l, v) => edit(course.id, l === "en" ? { priceEn: v } : { priceZh: v })}
            />

            <BilingualField
              label="What you learn (one per line)"
              valueEn={course.learnEn.join("\n")}
              valueZh={course.learnZh.join("\n")}
              multiline
              onChange={(l, v) =>
                edit(course.id, l === "en" ? { learnEn: toLines(v) } : { learnZh: toLines(v) })
              }
            />
            <BilingualField
              label="What's included (one per line)"
              valueEn={course.includesEn.join("\n")}
              valueZh={course.includesZh.join("\n")}
              multiline
              onChange={(l, v) =>
                edit(course.id, l === "en" ? { includesEn: toLines(v) } : { includesZh: toLines(v) })
              }
            />
          </CardContent>
        </Card>
      ))}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No courses yet — add one to show the courses sections again.
        </p>
      ) : null}
    </div>
  );
}

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
