import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CalendarDays, CheckCircle2, Clock, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BookingEditorDialog, sourceLabels, statusLabels } from "@/components/admin/BookingEditorDialog";
import { BilingualField, LangBadge } from "@/components/admin/BilingualField";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dictionaries } from "@/i18n/dictionaries";
import {
  bookingStatuses,
  effectiveServices,
  effectiveTimeSlots,
  makeOptionId,
  todayStr,
  useAppointmentSettings,
  writeAppointmentSettings,
  type AppointmentSettings,
  type BilingualOption,
  type Booking,
  type BookingStatus,
} from "@/lib/appointments";
import {
  deleteDbBooking,
  insertDbBooking,
  setDbBookingTrashed,
  updateDbBooking,
  useDbBookings,
} from "@/lib/bookings-db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/appointments")({
  component: AdminAppointmentsPage,
});

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusVariant(status: BookingStatus) {
  if (status === "confirmed") return "default" as const;
  if (status === "completed") return "secondary" as const;
  if (status === "cancelled") return "destructive" as const;
  return "outline" as const;
}

function fmtDate(date: string) {
  if (!date) return "No date";
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function extractImageUrls(notes: string): string[] {
  const matches = notes.match(/https?:\/\/\S+/g) ?? [];
  return matches.filter((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u) || u.includes("/storage/v1/object/"));
}

function AdminAppointmentsPage() {
  const { bookings: dbBookings, loading: bookingsLoading, refresh: refreshBookings } = useDbBookings();
  const store = useMemo(
    () => ({
      active: dbBookings.filter((b) => !b.trashed),
      trashed: dbBookings.filter((b) => b.trashed),
    }),
    [dbBookings],
  );
  const settings = useAppointmentSettings();
  const patch = (p: Partial<AppointmentSettings>) => writeAppointmentSettings({ ...settings, ...p });

  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | undefined>(undefined);
  const [blockedInput, setBlockedInput] = useState("");
  const [photos, setPhotos] = useState<{ name: string; urls: string[] } | null>(null);

  const today = todayStr();

  const weekEnd = useMemo(() => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + 7);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, [today]);

  /** Upcoming first (soonest on top), then past bookings newest-first. */
  const sorted = useMemo(() => {
    const upcoming = store.active.filter((b) => b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = store.active.filter((b) => b.date < today).sort((a, b) => b.date.localeCompare(a.date));
    return [...upcoming, ...past];
  }, [store.active, today]);

  const filtered = filter === "all" ? sorted : sorted.filter((b) => b.status === filter);

  const upcomingCount = store.active.filter(
    (b) => b.date >= today && (b.status === "pending" || b.status === "confirmed"),
  ).length;
  const pendingCount = store.active.filter((b) => b.status === "pending").length;
  const weekCount = store.active.filter((b) => b.date >= today && b.date <= weekEnd && b.status !== "cancelled").length;
  const completedCount = store.active.filter((b) => b.status === "completed").length;

  async function saveBooking(b: Booking) {
    const exists = store.active.some((x) => x.id === b.id);
    const ok = exists ? await updateDbBooking(b) : await insertDbBooking(b);
    if (!ok) {
      toast.error("Couldn't save the booking. Please try again.");
      return;
    }
    await refreshBookings();
    toast.success(exists ? "Booking updated." : "Booking added.");
  }

  async function trashBooking(id: string) {
    if (!(await setDbBookingTrashed(id, true))) {
      toast.error("Couldn't move the booking to trash.");
      return;
    }
    await refreshBookings();
    toast.success("Moved to trash.");
  }

  async function restoreBooking(id: string) {
    if (!(await setDbBookingTrashed(id, false))) {
      toast.error("Couldn't restore the booking.");
      return;
    }
    await refreshBookings();
    toast.success("Booking restored.");
  }

  async function purgeBooking(id: string) {
    if (!(await deleteDbBooking(id))) {
      toast.error("Couldn't delete the booking.");
      return;
    }
    await refreshBookings();
    toast.success("Deleted permanently.");
  }

  function toggleDay(d: number) {
    const open = settings.openDays.includes(d);
    const next = open ? settings.openDays.filter((x) => x !== d) : [...settings.openDays, d].sort();
    patch({ openDays: next });
  }

  function addBlockedDate() {
    if (!blockedInput) return;
    if (settings.blockedDates.includes(blockedInput)) {
      toast.error("That date is already blocked.");
      return;
    }
    patch({ blockedDates: [...settings.blockedDates, blockedInput].sort() });
    setBlockedInput("");
    toast.success("Date blocked.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Appointments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Log bookings from WhatsApp, WeChat and phone — and control the public booking page.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setEditorOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Log a booking
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming" value={String(upcomingCount)} delta="pending + confirmed" icon={CalendarCheck} />
        <StatCard label="Pending" value={String(pendingCount)} delta="awaiting confirmation" icon={Clock} />
        <StatCard label="This week" value={String(weekCount)} delta="next 7 days" icon={CalendarDays} />
        <StatCard label="Completed" value={String(completedCount)} delta="all time" icon={CheckCircle2} />
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="content">Page content</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Bookings */}
        <TabsContent value="bookings" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {(["all", ...bookingStatuses] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  filter === s
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border hover:bg-accent",
                )}
              >
                {s === "all" ? "All" : statusLabels[s]}
              </button>
            ))}
          </div>

          {bookingsLoading ? (
            <Card className="shadow-none">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading bookings…</CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="shadow-none">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <CalendarCheck className="h-10 w-10 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No bookings yet</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Clients book through WhatsApp, WeChat or email — log each request here to keep track of
                    confirmations.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(undefined);
                    setEditorOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Log the first booking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-none">
              <CardContent className="overflow-x-auto p-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>People</TableHead>
                      <TableHead>Via</TableHead>
                      <TableHead>Photos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="pl-6 font-medium whitespace-nowrap">{fmtDate(b.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{b.name}</div>
                          <div className="text-xs text-muted-foreground">{b.contact}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{b.service || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{b.time || "—"}</TableCell>
                        <TableCell>{b.people}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {sourceLabels[b.source]}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const urls = extractImageUrls(b.notes);
                            if (urls.length === 0) return <span className="text-muted-foreground">—</span>;
                            return (
                              <button
                                type="button"
                                className="flex items-center gap-1"
                                aria-label={`View ${urls.length} photo(s) from ${b.name}`}
                                onClick={() => setPhotos({ name: b.name, urls })}
                              >
                                <span className="flex -space-x-2">
                                  {urls.slice(0, 3).map((url, i) => (
                                    <span
                                      key={url}
                                      className="block h-8 w-8 overflow-hidden rounded-full border-2 border-background ring-1 ring-border"
                                      style={{ zIndex: 3 - i }}
                                    >
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                    </span>
                                  ))}
                                </span>
                                <span className="ml-1 text-xs font-medium text-primary">
                                  {urls.length > 3 ? `+${urls.length - 3} · View all` : "View"}
                                </span>
                              </button>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(b.status)}>{statusLabels[b.status]}</Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit booking for ${b.name}`}
                              onClick={() => {
                                setEditing(b);
                                setEditorOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Move booking for ${b.name} to trash`}
                              onClick={() => trashBooking(b.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {store.trashed.length > 0 && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Trash</CardTitle>
                <CardDescription>Restore a booking or delete it permanently.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {store.trashed.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {b.name} · {fmtDate(b.date)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.service || "Appointment"} · {statusLabels[b.status]}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => restoreBooking(b.id)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => purgeBooking(b.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete permanently
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* --------------------------------------------- Availability */}
        <TabsContent value="availability" className="space-y-4 pt-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-lg">Weekly schedule</CardTitle>
              <CardDescription>
                Days the studio accepts bookings. Closed days show a warning on the public booking form.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {dayNames.map((name, d) => {
                const open = settings.openDays.includes(d);
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={open}
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      open
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-lg">Blocked dates</CardTitle>
              <CardDescription>Holidays, fully-booked days or personal time off.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  className="w-auto"
                  value={blockedInput}
                  onChange={(e) => setBlockedInput(e.target.value)}
                />
                <Button variant="outline" onClick={addBlockedDate} disabled={!blockedInput}>
                  <Plus className="mr-1.5 h-4 w-4" /> Block date
                </Button>
              </div>
              {settings.blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.blockedDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm"
                    >
                      {fmtDate(d)}
                      <button
                        type="button"
                        aria-label={`Unblock ${d}`}
                        onClick={() =>
                          patch({
                            blockedDates: settings.blockedDates.filter((x) => x !== d),
                          })
                        }
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No blocked dates.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-lg">Group size</CardTitle>
              <CardDescription>Maximum number of people per booking on the public form.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={50}
                className="w-24"
                value={settings.maxPeople}
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value));
                  if (v >= 1 && v <= 50) patch({ maxPeople: v });
                }}
              />
              <span className="text-sm text-muted-foreground">people max</span>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Changes save automatically and apply to the public booking page right away.
          </p>
        </TabsContent>

        {/* -------------------------------------------- Page content */}
        <TabsContent value="content" className="space-y-4 pt-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-lg">Page text</CardTitle>
              <CardDescription>
                The heading, intro and confirmation note on the public /appointment page. Leave a field empty to use the
                built-in default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <BilingualField
                label="Page title"
                valueEn={settings.titleEn}
                valueZh={settings.titleZh}
                placeholder={dictionaries.en.appointment.page.title}
                onChange={(locale, v) =>
                  patch(locale === "en" ? { titleEn: v || undefined } : { titleZh: v || undefined })
                }
              />
              <BilingualField
                label="Intro text"
                multiline
                valueEn={settings.bodyEn}
                valueZh={settings.bodyZh}
                placeholder={dictionaries.en.appointment.page.body}
                onChange={(locale, v) =>
                  patch(locale === "en" ? { bodyEn: v || undefined } : { bodyZh: v || undefined })
                }
              />
              <BilingualField
                label="Confirmation note"
                valueEn={settings.noteEn}
                valueZh={settings.noteZh}
                placeholder={dictionaries.en.appointment.page.summary.note}
                onChange={(locale, v) =>
                  patch(locale === "en" ? { noteEn: v || undefined } : { noteZh: v || undefined })
                }
              />
            </CardContent>
          </Card>

          <OptionListEditor
            title="Service options"
            description="Choices shown for “What is it for?” on the public form."
            options={effectiveServices(settings)}
            prefix="svc"
            onChange={(next) => patch({ services: next })}
          />
          <OptionListEditor
            title="Time slots"
            description="Choices shown for “Preferred time” on the public form."
            options={effectiveTimeSlots(settings)}
            prefix="slot"
            onChange={(next) => patch({ timeSlots: next })}
          />
        </TabsContent>
      </Tabs>

      <BookingEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        booking={editing}
        onSave={(b) => void saveBooking(b)}
      />

      <Dialog open={photos !== null} onOpenChange={(o) => !o && setPhotos(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Reference photos</DialogTitle>
            <DialogDescription>
              {photos ? `${photos.urls.length} photo(s) sent by ${photos.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {photos?.urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-border"
              >
                <img src={url} alt="" className="h-56 w-full bg-muted object-contain" loading="lazy" />
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Bilingual list editor for service / time-slot options. */
function OptionListEditor({
  title,
  description,
  options,
  prefix,
  onChange,
}: {
  title: string;
  description: string;
  options: BilingualOption[];
  prefix: string;
  onChange: (next: BilingualOption[]) => void;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((opt) => (
          <div key={opt.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <LangBadge>EN</LangBadge>
              <Input
                value={opt.en}
                placeholder="English"
                onChange={(e) => onChange(options.map((o) => (o.id === opt.id ? { ...o, en: e.target.value } : o)))}
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <LangBadge>中文</LangBadge>
              <Input
                value={opt.zh}
                placeholder="中文 (optional)"
                onChange={(e) => onChange(options.map((o) => (o.id === opt.id ? { ...o, zh: e.target.value } : o)))}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove option"
              disabled={options.length <= 1}
              onClick={() => onChange(options.filter((o) => o.id !== opt.id))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...options,
              {
                id: makeOptionId(prefix, new Set(options.map((o) => o.id))),
                en: "New option",
                zh: "",
              },
            ])
          }
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add option
        </Button>
      </CardContent>
    </Card>
  );
}
