import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Banknote, Clock, Mail, MapPin, Package, PackageCheck, Phone, RotateCcw, Sparkles, Trash2 } from "lucide-react";
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
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNpr } from "@/lib/shop";
import {
  deleteOrder,
  orderStatuses,
  setOrderStatus,
  setOrderTrashed,
  useDbOrders,
  type AdminOrder,
  type OrderStatus,
  type DeliveryMethod,
} from "@/lib/orders-db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Nagma Designs Admin" }] }),
  component: AdminOrdersPage,
});

const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const deliveryLabels: Record<DeliveryMethod, string> = {
  pickup: "Pickup",
  delivery: "Delivery",
};

function statusVariant(status: OrderStatus) {
  if (status === "confirmed" || status === "shipped") return "default" as const;
  if (status === "completed") return "secondary" as const;
  if (status === "cancelled") return "destructive" as const;
  return "outline" as const; // new
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The contact value matching the customer's chosen contact method, with a sensible fallback. */
function primaryContact(o: AdminOrder): { label: string; value: string } {
  const byMethod: Record<string, string> = {
    wechat: o.wechat,
    whatsapp: o.whatsapp,
    phone: o.phone,
    email: o.email,
  };
  const chosen = byMethod[o.contactMethod];
  if (chosen) return { label: o.contactMethod, value: chosen };
  const first = ["wechat", "whatsapp", "phone", "email"].find((k) => byMethod[k]);
  const firstValue = first ? byMethod[first] : undefined;
  return first && firstValue ? { label: first, value: firstValue } : { label: "", value: "—" };
}

function itemsSummary(items: AdminOrder["items"]) {
  const head = items[0];
  if (!head) return "—";
  const first = `${head.qty}× ${head.name}`;
  return items.length > 1 ? `${first} +${items.length - 1} more` : first;
}

function AdminOrdersPage() {
  const { orders, loading, refresh } = useDbOrders();
  const active = useMemo(() => orders.filter((o) => !o.trashed), [orders]);
  const trashed = useMemo(() => orders.filter((o) => o.trashed), [orders]);

  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryMethod | "all">("all");
  const [viewing, setViewing] = useState<AdminOrder | null>(null);
  const [purgeId, setPurgeId] = useState<string | null>(null);

  const filtered = active
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => deliveryFilter === "all" || o.deliveryMethod === deliveryFilter);

  const newCount = active.filter((o) => o.status === "new").length;
  const pendingRevenue = active
    .filter((o) => o.status !== "cancelled" && o.status !== "completed")
    .reduce((sum, o) => sum + o.totalNpr, 0);
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);
  const weekCount = active.filter((o) => o.createdAt >= weekStart).length;
  const completedCount = active.filter((o) => o.status === "completed").length;

  async function changeStatus(order: AdminOrder, status: OrderStatus) {
    const ok = await setOrderStatus(order.id, status);
    if (!ok) {
      toast.error("Couldn't update the order status.");
      return;
    }
    await refresh();
  }

  async function trashOrderRow(id: string) {
    const ok = await setOrderTrashed(id, true);
    if (!ok) {
      toast.error("Couldn't move the order to trash.");
      return;
    }
    await refresh();
    toast.success("Moved to trash.");
  }

  async function restoreOrderRow(id: string) {
    const ok = await setOrderTrashed(id, false);
    if (!ok) {
      toast.error("Couldn't restore the order.");
      return;
    }
    await refresh();
    toast.success("Order restored.");
  }

  async function confirmPurge() {
    if (!purgeId) return;
    const ok = await deleteOrder(purgeId);
    setPurgeId(null);
    if (!ok) {
      toast.error("Couldn't delete the order.");
      return;
    }
    await refresh();
    toast.success("Deleted permanently.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shop order requests submitted from the public site — confirm, track and fulfill them here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New" value={String(newCount)} delta="awaiting review" icon={Sparkles} />
        <StatCard label="Pending value" value={formatNpr(pendingRevenue)} delta="not yet completed" icon={Banknote} />
        <StatCard label="This week" value={String(weekCount)} delta="last 7 days" icon={Clock} />
        <StatCard label="Completed" value={String(completedCount)} delta="all time" icon={PackageCheck} />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(["all", ...orderStatuses] as const).map((s) => (
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

        <div className="flex flex-wrap gap-2">
          {(["all", "pickup", "delivery"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDeliveryFilter(d)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                deliveryFilter === d
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              {d === "all" ? "All" : deliveryLabels[d]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading orders…</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No orders yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Orders placed from the shop will show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-none">
          <CardContent className="overflow-x-auto p-0 pb-2">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const contact = primaryContact(o);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-6 whitespace-nowrap">{fmtDateTime(o.createdAt)}</TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setViewing(o)} className="text-left hover:underline">
                          <div className="font-medium">{o.customerName}</div>
                          <div className="text-xs text-muted-foreground">{contact.value}</div>
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {itemsSummary(o.items)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.deliveryMethod === "delivery" ? "default" : "outline"}>
                          {deliveryLabels[o.deliveryMethod]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatNpr(o.totalNpr)}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={(v) => void changeStatus(o, v as OrderStatus)}>
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue>
                              <Badge variant={statusVariant(o.status)}>{statusLabels[o.status]}</Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {statusLabels[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`View order from ${o.customerName}`}
                            onClick={() => setViewing(o)}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Move order from ${o.customerName} to trash`}
                            onClick={() => void trashOrderRow(o.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {trashed.length > 0 ? (
        <Card className="shadow-none">
          <CardContent className="p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              Trash
            </h3>
            <ul className="mt-3 space-y-2">
              {trashed.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm">
                      {o.customerName} · {formatNpr(o.totalNpr)}
                    </span>
                    <span className="block text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void restoreOrderRow(o.id)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setPurgeId(o.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete permanently
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Order detail dialog */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.customerName}</DialogTitle>
                <DialogDescription>
                  Submitted {fmtDateTime(viewing.createdAt)} · {viewing.locale === "zh" ? "Chinese" : "English"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="space-y-1.5 rounded-lg border border-border p-3">
                  {viewing.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {viewing.phone}
                    </p>
                  ) : null}
                  {viewing.wechat ? (
                    <p className="flex items-center gap-2">
                      <span className="w-3.5 text-center text-xs text-muted-foreground">微</span> {viewing.wechat}
                    </p>
                  ) : null}
                  {viewing.whatsapp ? (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {viewing.whatsapp} (WhatsApp)
                    </p>
                  ) : null}
                  {viewing.email ? (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {viewing.email}
                    </p>
                  ) : null}
                  {viewing.address ? (
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {viewing.address}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {deliveryLabels[viewing.deliveryMethod]}
                    {viewing.deliveryMethod === "delivery" && viewing.address ? ` — ${viewing.address}` : ""}
                  </p>
                  <p className="pt-1 text-xs text-muted-foreground">
                    Prefers: <span className="font-medium">{viewing.contactMethod}</span>
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Items</h4>
                  <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                    {viewing.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between px-3 py-2">
                        <span>
                          {item.qty}× {item.name}
                        </span>
                        <span className="text-muted-foreground">{formatNpr(item.unitPriceNpr * item.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center justify-between px-1 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatNpr(viewing.totalNpr)}</span>
                  </div>
                </div>

                {viewing.notes ? (
                  <div>
                    <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Notes</h4>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{viewing.notes}</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={purgeId !== null} onOpenChange={(open) => !open && setPurgeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — the order and its customer details will be gone for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmPurge()}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
