import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Author } from "@/data/mock";
import { cn } from "@/lib/utils";

export function AuthorAvatar({ author, className }: { author: Author; className?: string }) {
  return (
    <Avatar className={cn("size-6 border border-border", className)}>
      <AvatarFallback
        className="text-[0.625rem] font-semibold"
        style={{
          backgroundColor: `oklch(0.9 0.05 ${author.avatarHue})`,
          color: `oklch(0.35 0.09 ${author.avatarHue})`,
        }}
      >
        {author.initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function AuthorChip({
  author,
  className,
  withRole = false,
}: {
  author: Author;
  className?: string;
  withRole?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <AuthorAvatar author={author} />
      <span className="text-sm text-muted-foreground">
        {author.name}
        {withRole ? <span className="text-muted-foreground/70"> · {author.role}</span> : null}
      </span>
    </span>
  );
}
