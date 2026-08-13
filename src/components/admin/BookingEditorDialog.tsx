import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  bookingSources,
  bookingStatuses,
  effectiveServices,
  effectiveTimeSlots,
  makeBookingId,
  useAppointmentSettings,
  type Booking,
  type BookingSource,
  type BookingStatus,
} from "@/lib/appointments";
import {
  preferredContactLabels,
  preferredContactOptions,
  type PreferredContact,
} from "@/components/site/PreferredContactPicker";
import { cn } from "@/lib/utils";

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const sourceLabels: Record<BookingSource, string> = {
  whatsapp: "WhatsApp",
  wechat: "WeChat",
  phone: "Phone",
  "walk-in": "Walk-in",
  email: "Email",
  other: "Other",
};

export { statusLabels, sourceLabels };

interface BookingEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing booking when editing, undefined when logging a new one. */
  booking?: Booking | undefined;
  onSave: (booking: Booking) => void;
}

/** Add/edit form for one booking. Name, contact and date are required. */
export function BookingEditorDialog({ open, onOpenChange, booking, onSave }: BookingEditorDialogProps) {
  const settings = useAppointmentSettings();
  const services = effectiveServices(settings);
  const timeSlots = effectiveTimeSlots(settings);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState("1");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<BookingSource>("whatsapp");
  const [status, setStatus] = useState<BookingStatus>("pending");
  const [preferred, setPreferred] = useState<PreferredContact[]>([]);

  // Reset the form whenever the dialog opens for a different booking.
  useEffect(() => {
    if (!open) return;
    setName(booking?.name ?? "");
    setContact(booking?.contact ?? "");
    setService(booking?.service ?? "");
    setDate(booking?.date ?? "");
    setTime(booking?.time ?? "");
    setPeople(String(booking?.people ?? 1));
    setNotes(booking?.notes ?? "");
    setSource(booking?.source ?? "whatsapp");
    setStatus(booking?.status ?? "pending");
    setPreferred(
      ((booking?.preferredContacts ?? []) as string[]).filter((v): v is PreferredContact =>
        (preferredContactOptions as readonly string[]).includes(v),
      ),
    );
  }, [open, booking]);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Client name is required.");
      return;
    }
    if (!contact.trim()) {
      toast.error("Contact (WeChat / phone) is required.");
      return;
    }
    if (!date) {
      toast.error("Please pick a date.");
      return;
    }
    const peopleNum = Math.min(50, Math.max(1, Math.round(Number(people) || 1)));
    onSave({
      id: booking?.id ?? makeBookingId(),
      name: name.trim(),
      contact: contact.trim(),
      service: service.trim(),
      date,
      time: time.trim(),
      people: peopleNum,
      notes: notes.trim(),
      source,
      status,
      preferredContacts: preferred,
      createdAt: booking?.createdAt ?? new Date().toISOString(),
    });
    onOpenChange(false);
  }

  const inputCls = "w-full";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{booking ? "Edit booking" : "Log a booking"}</DialogTitle>
          <DialogDescription>Record an appointment the client sent on WhatsApp, WeChat or by phone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bk-name">Client name *</Label>
              <Input
                id="bk-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aisha K."
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-contact">WeChat / phone *</Label>
              <Input
                id="bk-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="WeChat ID or phone number"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bk-service">Service</Label>
              <Input
                id="bk-service"
                list="bk-service-options"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Pick or type"
                className={inputCls}
              />
              <datalist id="bk-service-options">
                {services.map((s) => (
                  <option key={s.id} value={s.en} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-people">People</Label>
              <Input
                id="bk-people"
                type="number"
                min={1}
                max={50}
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bk-date">Date *</Label>
              <Input
                id="bk-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-time">Time slot</Label>
              <Input
                id="bk-time"
                list="bk-time-options"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Pick or type"
                className={inputCls}
              />
              <datalist id="bk-time-options">
                {timeSlots.map((s) => (
                  <option key={s.id} value={s.en} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Preferred contact options</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {preferredContactOptions.map((id) => {
                const active = preferred.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setPreferred((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                    }
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {preferredContactLabels[id].en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Came via</Label>
              <Select value={source} onValueChange={(v) => setSource(v as BookingSource)}>
                <SelectTrigger className={cn(inputCls)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bookingSources.map((s) => (
                    <SelectItem key={s} value={s}>
                      {sourceLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger className={cn(inputCls)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bookingStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-notes">Notes</Label>
            <Textarea
              id="bk-notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Occasion, design ideas, special requests…"
              className="min-h-[120px] resize-y sm:min-h-[140px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{booking ? "Save changes" : "Add booking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
