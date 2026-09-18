import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AuthorChip } from "@/components/changelog/author-chip";
import { CategoryBadge } from "@/components/changelog/category-badge";
import { ReactionBar } from "@/components/changelog/reaction-bar";
import { categoryMeta, type ChangelogUpdate } from "@/data/mock";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useReleaseStore } from "@/store/release-store";

function UpdateRow({ update }: { update: ChangelogUpdate }) {
  const { authorById } = useReleaseStore();
  const author = authorById(update.authorId);

  return (
    <article className="group relative grid gap-4 pb-12 sm:grid-cols-[10.5rem_1fr] sm:gap-8">
      <div className="flex items-center gap-3 sm:block sm:pt-1">
        <time
          dateTime={update.publishedAt ?? undefined}
          className="text-mono-meta text-muted-foreground"
        >
          {formatDate(update.publishedAt)}
        </time>
        <p className="text-mono-meta text-muted-foreground/70 sm:mt-1">v{update.version}</p>
      </div>

      <div className="relative sm:pl-8">
        <span
          className="absolute top-2 left-0 hidden h-full w-px bg-border sm:block"
          aria-hidden="true"
        />
        <span
          className={cn(
            "absolute top-1.5 left-0 hidden size-2 -translate-x-[3.5px] rounded-full ring-4 ring-background sm:block",
            categoryMeta[update.category].dot,
          )}
          aria-hidden="true"
        />

        <div className="space-y-3">
          <CategoryBadge category={update.category} />
          <h2 className="text-h2">
            <Link
              to="/updates/$slug"
              params={{ slug: update.slug }}
              className="focus-ring rounded-sm decoration-border decoration-1 underline-offset-[6px] transition-colors hover:underline"
            >
              {update.title}
            </Link>
          </h2>
          <p className="max-w-2xl text-body text-muted-foreground">{update.excerpt}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
            <AuthorChip author={author} />
            <ReactionBar update={update} />
            <Link
              to="/updates/$slug"
              params={{ slug: update.slug }}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground transition-colors hover:text-accent"
            >
              Read update
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function UpdateTimeline({
  updates,
  className,
}: {
  updates: ChangelogUpdate[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {updates.map((update, index) => (
        <div key={update.id} className={index === 0 ? "" : "pt-12"}>
          <UpdateRow update={update} />
        </div>
      ))}
    </div>
  );
}

export function UpdateCard({ update }: { update: ChangelogUpdate }) {
  return (
    <Link
      to="/updates/$slug"
      params={{ slug: update.slug }}
      className="focus-ring panel group flex flex-col gap-3 p-4 transition-all duration-200 hover:border-border-strong hover:shadow-raised"
    >
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge category={update.category} />
        <span className="text-mono-meta text-muted-foreground">
          {formatDate(update.publishedAt)}
        </span>
      </div>
      <h3 className="text-h3 group-hover:text-accent">{update.title}</h3>
      <p className="line-clamp-2 text-sm text-muted-foreground">{update.excerpt}</p>
    </Link>
  );
}
