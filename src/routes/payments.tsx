import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { qrFileToDataUrl } from "@/lib/image-upload";
import {
  deletePaymentMethod,
  insertPaymentMethod,
  updatePaymentMethod,
  useAdminPaymentMethods,
  type PaymentMethod,
} from "@/lib/payments-db";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payment QR Codes — Nagma Designs Admin" }] }),
  component: AdminPaymentsPage,
});

interface FormState {
  label: string;
  qrImage: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  active: boolean;
}

const emptyForm: FormState = {
  label: "",
  qrImage: "",
  accountName: "",
  accountNumber: "",
  instructions: "",
  active: true,
};

function AdminPaymentsPage() {
  const { methods, loading, refresh } = useAdminPaymentMethods();
  const [editing, setEditing] = useState<PaymentMethod | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openNew() {
    setForm(emptyForm);
    setEditing("new");
  }

  function openEdit(m: PaymentMethod) {
    setForm({
      label: m.label,
      qrImage: m.qrImage,
      accountName: m.accountName,
      accountNumber: m.accountNumber,
      instructions: m.instructions,
      active: m.active,
    });
    setEditing(m);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await qrFileToDataUrl(file);
      setForm((prev) => ({ ...prev, qrImage: dataUrl }));
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  async function save() {
    if (!form.label.trim()) {
      toast.error("Give this payment method a name (e.g. eSewa, Bank Transfer).");
      return;
    }
    if (!form.qrImage) {
      toast.error("Upload a QR code image.");
      return;
    }
    setSaving(true);
    const ok =
      editing === "new"
        ? await insertPaymentMethod({
            label: form.label.trim(),
            qrImage: form.qrImage,
            accountName: form.accountName.trim(),
            accountNumber: form.accountNumber.trim(),
            instructions: form.instructions.trim(),
            active: form.active,
            sortOrder: methods.length,
          })
        : await updatePaymentMethod((editing as PaymentMethod).id, {
            label: form.label.trim(),
            qrImage: form.qrImage,
            accountName: form.accountName.trim(),
            accountNumber: form.accountNumber.trim(),
            instructions: form.instructions.trim(),
            active: form.active,
          });
    setSaving(false);
    if (!ok) {
      toast.error("Couldn't save — please try again.");
      return;
    }
    await refresh();
    toast.success(editing === "new" ? "Payment method added." : "Payment method updated.");
    setEditing(null);
  }

  async function toggleActive(m: PaymentMethod, active: boolean) {
    const ok = await updatePaymentMethod(m.id, { active });
    if (!ok) {
      toast.error("Couldn't update.");
      return;
    }
    await refresh();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const ok = await deletePaymentMethod(deleteId);
    setDeleteId(null);
    if (!ok) {
      toast.error("Couldn't delete.");
      return;
    }
    await refresh();
    toast.success("Payment method deleted.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Payment QR Codes</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            These show to customers right after they place a shop order, so they know how to pay
            you. Only active methods are shown.
          </p>
        </div>
        <Button size="sm" onClick={openNew} disabled={loading}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add payment method
        </Button>
      </div>

      {loading ? (
        <Card className="shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : methods.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <QrCode className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No payment methods yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Add your eSewa, Khalti, bank transfer, or any other QR code customers can scan to
                pay you.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m) => (
            <Card key={m.id} className="shadow-none">
              <CardContent className="flex gap-4 p-4">
                <img
                  src={m.qrImage}
                  alt={m.label}
                  width={88}
                  height={88}
                  className="h-22 w-22 shrink-0 rounded-lg border border-border bg-white object-contain p-1.5"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{m.label}</p>
                    <Switch
                      checked={m.active}
                      onCheckedChange={(v) => void toggleActive(m, v)}
                      aria-label={`Show ${m.label} to customers`}
                    />
                  </div>
                  {m.accountName ? <p className="truncate text-xs text-muted-foreground">{m.accountName}</p> : null}
                  {m.accountNumber ? <p className="truncate text-xs text-muted-foreground">{m.accountNumber}</p> : null}
                  {m.instructions ? <p className="line-clamp-2 text-xs text-muted-foreground">{m.instructions}</p> : null}
                  <div className="flex gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add payment method" : "Edit payment method"}</DialogTitle>
            <DialogDescription>
              Upload a clear, high-resolution QR code — it's shown as-is to customers, uncompressed,
              so it always scans cleanly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. eSewa, Khalti, Bank Transfer"
                maxLength={60}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>QR code image</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {form.qrImage ? (
                  <img
                    src={form.qrImage}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-lg border border-border bg-white object-contain p-1"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                    <QrCode className="h-6 w-6" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                  className="max-w-[220px]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Account name (optional)</Label>
                <Input
                  value={form.accountName}
                  onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))}
                  placeholder="Nagma Designs"
                  maxLength={100}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Account / ID number (optional)</Label>
                <Input
                  value={form.accountNumber}
                  onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                  placeholder="98XXXXXXXX"
                  maxLength={60}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Instructions shown to customers (optional)</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                placeholder="Send the exact order total and share a screenshot on WhatsApp to confirm."
                maxLength={300}
                rows={2}
                className="mt-1.5"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Show to customers</p>
                <p className="text-xs text-muted-foreground">Off hides this method without deleting it.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — it'll stop showing to customers immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
