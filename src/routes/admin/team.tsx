import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, ShieldCheck, UserPlus, UserRoundCheck, UserRoundX, UsersRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { grantAdminRole, listTeamAdmins, revokeAdminRole } from "@/lib/admin-team.functions";
import type { AdminMember } from "@/lib/admin-team.server";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [{ title: "Team & Access — Admin — Nagma Designs" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminTeamPage,
});

function fmtSince(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminTeamPage() {
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    setLoadError("");
    listTeamAdmins()
      .then((list) => setMembers(list))
      .catch(() => setLoadError("Couldn't load the team list. Please refresh the page."));
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, [refresh]);

  async function handleGrant(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || adding) return;
    setAdding(true);
    try {
      const res = await grantAdminRole({
        data: { email: value, password, name: name.trim() },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.email} now has admin access.`);
      setEmail("");
      setPassword("");
      setName("");
      refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRevoke(member: AdminMember) {
    if (confirmId !== member.userId) {
      setConfirmId(member.userId);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 4000);
      return;
    }
    setConfirmId(null);
    setRemovingId(member.userId);
    try {
      const res = await revokeAdminRole({ data: { userId: member.userId } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Removed admin access for ${member.email}.`);
      refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  const self = members?.find((m) => m.isSelf);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Admins"
          value={members ? String(members.length) : "—"}
          delta="Full dashboard access"
          icon={ShieldCheck}
        />
        <StatCard label="Signed in as" value={self ? self.name : "—"} delta={self?.email ?? ""} icon={UserRoundCheck} />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Add an admin
          </CardTitle>
          <CardDescription>
            There's no public sign-up, so accounts are created here. Enter the person's email and a password for them —
            they can sign in at <code>/admin/login</code> straight away. If the email already has an account, the role
            is granted and the password field is ignored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGrant} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name (e.g. Nagma Sharma)"
                className="sm:max-w-sm"
              />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="sm:max-w-sm"
              />
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password for new accounts (min. 6 chars)"
                autoComplete="off"
                className="sm:max-w-sm"
              />
            </div>
            <Button type="submit" disabled={adding || !email.trim()}>
              {adding ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Grant admin access
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <UsersRound className="h-5 w-5 text-primary" />
            People with access
          </CardTitle>
          <CardDescription>
            Everyone below can open the admin dashboard, manage content and see bookings &amp; orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="py-6 text-center text-sm text-destructive">{loadError}</p>
          ) : !members ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Member since</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.userId}>
                      <TableCell className="font-medium">
                        <span className="flex flex-wrap items-center gap-2">
                          {m.name}
                          {m.isSelf && <Badge variant="secondary">You</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtSince(m.since)}</TableCell>
                      <TableCell>
                        <Badge>Admin</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.isSelf ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Button
                            variant={confirmId === m.userId ? "destructive" : "outline"}
                            size="sm"
                            disabled={removingId === m.userId}
                            onClick={() => void handleRevoke(m)}
                          >
                            {removingId === m.userId ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserRoundX className="h-3.5 w-3.5" />
                            )}
                            {confirmId === m.userId ? "Click again to confirm" : "Remove access"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Removing access only revokes the admin role — the person's sign-in account stays active. You can't remove
            yourself or the last remaining admin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
