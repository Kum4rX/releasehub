import { Link } from "@tanstack/react-router";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="text-label text-accent">{eyebrow}</p> : null}
        <h1 className="text-h1">{title}</h1>
        {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel flex flex-col items-center gap-3 px-6 py-14 text-center",
        "border-dashed",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="text-h3">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "panel flex flex-col items-center gap-3 px-6 py-14 text-center",
        "border-destructive/25 bg-destructive/[0.04]",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="text-h3">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw className="size-3.5" /> Try again
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" asChild>
          <Link to="/updates">Back to updates</Link>
        </Button>
      </div>
    </div>
  );
}

export function TimelineSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-10" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="panel divide-y divide-border overflow-hidden" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="aspect-[16/7] w-full rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="panel space-y-3 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
