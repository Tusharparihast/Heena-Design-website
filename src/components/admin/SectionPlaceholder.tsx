import { Link } from "@tanstack/react-router";
import { ArrowLeft, Hammer, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SectionPlaceholderProps {
  label: string;
  icon: LucideIcon;
}

/** Placeholder body for admin sections whose managers arrive in a later phase. */
export function SectionPlaceholder({ label, icon: Icon }: SectionPlaceholderProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold">{label}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            The {label.toLowerCase()} manager will be built here in a later phase —
            with editing tools once the backend is connected.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Hammer className="h-3.5 w-3.5" /> UI structure preview
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
