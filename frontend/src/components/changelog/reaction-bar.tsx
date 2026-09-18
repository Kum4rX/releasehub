import { reactionMeta, type ChangelogUpdate, type ReactionKey } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useReleaseStore } from "@/store/release-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const keys: ReactionKey[] = ["heart", "party", "rocket"];

export function ReactionBar({
  update,
  size = "sm",
  className,
}: {
  update: ChangelogUpdate;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { reacted, toggleReaction } = useReleaseStore();
  const mine = reacted[update.id] ?? [];

  return (
    <div className={cn("flex items-center gap-1.5", className)} role="group" aria-label="Reactions">
      {keys.map((key) => {
        const active = mine.includes(key);
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${reactionMeta[key].label} — ${update.reactions[key]} reactions`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleReaction(update.id, key);
                }}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 rounded-full border transition-all duration-150 active:scale-[0.94]",
                  size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-caption",
                  active
                    ? "border-accent/45 bg-accent/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                <span className={cn("leading-none", size === "lg" ? "text-base" : "text-[0.8rem]")}>
                  {reactionMeta[key].emoji}
                </span>
                <span className="text-mono-meta">{update.reactions[key]}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{reactionMeta[key].label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
