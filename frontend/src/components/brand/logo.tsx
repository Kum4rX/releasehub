import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-[7px] border border-border-strong bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor">
        <path d="M3 11.5 8 4l5 7.5" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5.6 11.5h4.8" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {withWordmark ? (
        <span className="text-[0.9375rem] font-semibold tracking-[-0.02em]">
          Release<span className="text-accent">Hub</span>
        </span>
      ) : null}
    </span>
  );
}
