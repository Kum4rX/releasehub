import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("panel p-4 transition-colors hover:border-border-strong", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-label text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" /> : null}
      </div>
      <p className="mt-3 font-mono text-3xl tracking-[-0.03em] tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
