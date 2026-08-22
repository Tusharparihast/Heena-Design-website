import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, CircleHelp, Eye, EyeOff, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BilingualField } from "@/components/admin/BilingualField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminFaqItems,
  allFaqIds,
  builtinFaqItems,
  emptyFaqOverrides,
  faqSectionHeading,
  makeFaqId,
  useFaqOverrides,
  writeFaqOverrides,
  type FaqItem,
  type FaqOverrides,
} from "@/lib/faq-overrides";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/faq")({
  component: AdminFaqPage,
});

const builtinIds = new Set(builtinFaqItems.map((f) => f.id));

function AdminFaqPage() {
  const stored = useFaqOverrides();
  const [overrides, setOverrides] = useState<FaqOverrides>(emptyFaqOverrides);

  // Adopt the database document whenever it (re)loads or changes elsewhere.
  useEffect(() => {
    setOverrides(stored);
  }, [stored]);

  const items = adminFaqItems(overrides);
  const heading = faqSectionHeading(overrides);

  function persist(next: FaqOverrides) {
    setOverrides(next);
    writeFaqOverrides(next);
  }

  function editItem(item: FaqItem, key: keyof Omit<FaqItem, "id">, value: string) {
    if (builtinIds.has(item.id)) {
      persist({
        ...overrides,
        edits: { ...overrides.edits, [item.id]: { ...overrides.edits[item.id], [key]: value } },
      });
    } else {
      persist({
        ...overrides,
        added: overrides.added.map((a) => (a.id === item.id ? { ...a, [key]: value } : a)),
      });
    }
  }

  function addQuestion() {
    const id = makeFaqId(allFaqIds(overrides));
    const next: FaqOverrides = {
      ...overrides,
      added: [
        ...overrides.added,
        { id, questionEn: "New question", questionZh: "", answerEn: "Answer", answerZh: "" },
      ],
      order: [...(overrides.order.length ? overrides.order : items.map((i) => i.id)), id],
    };
    persist(next);
    toast.success("Question added — edit the text below.");
  }

  function toggleHidden(id: string) {
    const hidden = overrides.hidden.includes(id)
      ? overrides.hidden.filter((x) => x !== id)
      : [...overrides.hidden, id];
    persist({ ...overrides, hidden });
  }

  function removeQuestion(id: string) {
    persist({
      ...overrides,
      deleted: [...overrides.deleted, id],
      hidden: overrides.hidden.filter((x) => x !== id),
    });
    toast.success("Question removed.");
  }

  function restoreAll() {
    persist(emptyFaqOverrides);
    toast.success("Restored the default FAQ.");
  }

  function move(id: string, dir: -1 | 1) {
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as string);
    persist({ ...overrides, order: next });
  }

  function setHeading(key: "labelEn" | "labelZh" | "titleEn" | "titleZh", value: string) {
    persist({ ...overrides, [key]: value });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">FAQ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Questions shown on the homepage. Changes save automatically in both languages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={restoreAll}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button onClick={addQuestion}>
            <Plus className="mr-1.5 h-4 w-4" /> Add question
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">Section heading</CardTitle>
          <CardDescription>The small label and title above the questions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BilingualField
            label="Label"
            valueEn={heading.labelEn}
            valueZh={heading.labelZh}
            onChange={(loc, v) => setHeading(loc === "en" ? "labelEn" : "labelZh", v)}
          />
          <BilingualField
            label="Title"
            valueEn={heading.titleEn}
            valueZh={heading.titleZh}
            onChange={(loc, v) => setHeading(loc === "en" ? "titleEn" : "titleZh", v)}
          />
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CircleHelp className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No questions yet</p>
            <Button variant="outline" onClick={addQuestion}>
              <Plus className="mr-1.5 h-4 w-4" /> Add the first question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => {
            const hidden = overrides.hidden.includes(item.id);
            return (
              <Card key={item.id} className={cn("shadow-none", hidden && "opacity-60")}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="truncate font-display text-base">
                      {i + 1}. {item.questionEn || "Untitled question"}
                    </CardTitle>
                    <CardDescription>
                      {hidden ? "Hidden from the website" : "Live on the website"}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => move(item.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move down"
                      disabled={i === items.length - 1}
                      onClick={() => move(item.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={hidden ? "Show question" : "Hide question"}
                      onClick={() => toggleHidden(item.id)}
                    >
                      {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete question"
                      onClick={() => removeQuestion(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BilingualField
                    label="Question"
                    valueEn={item.questionEn}
                    valueZh={item.questionZh}
                    onChange={(loc, v) => editItem(item, loc === "en" ? "questionEn" : "questionZh", v)}
                  />
                  <BilingualField
                    label="Answer"
                    multiline
                    valueEn={item.answerEn}
                    valueZh={item.answerZh}
                    onChange={(loc, v) => editItem(item, loc === "en" ? "answerEn" : "answerZh", v)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Save className="h-3.5 w-3.5" /> Every change is saved as you type.
      </p>
    </div>
  );
}
