import { TrendingUp, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, delta, icon: Icon }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            <TrendingUp className="h-3 w-3" />
            {delta}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
