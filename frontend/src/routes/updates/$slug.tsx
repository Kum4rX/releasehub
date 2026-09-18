import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthorChip } from "@/components/changelog/author-chip";
import { CategoryBadge } from "@/components/changelog/category-badge";
import { Markdown } from "@/components/changelog/markdown";
import { ReactionBar } from "@/components/changelog/reaction-bar";
import { UpdateCard } from "@/components/changelog/update-timeline";
import { DetailSkeleton, EmptyState } from "@/components/common/states";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import {
  getChangelogBySlug,
  getRelatedChangelogs,
  seedChangelog,
  type ChangelogUpdate,
} from "@/services/changelogService";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/updates/$slug")({
  head: ({ params }) => {
    const update = (seedChangelog as ChangelogUpdate[]).find((u) => u.slug === params.slug);
    const title = update ? `${update.title} — ReleaseHub` : "Update not found — ReleaseHub";
    const description =
      update?.excerpt ?? "This product update doesn't exist or hasn't been published yet.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(update ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: UpdateDetailPage,
});

function UpdateDetailPage() {
  const { slug } = Route.useParams();
  const { getBySlug, authorById, updates } = useReleaseStore();
  const [detailUpdate, setDetailUpdate] = useState<ChangelogUpdate | null>(null);
  const [relatedItems, setRelatedItems] = useState<ChangelogUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await getChangelogBySlug(slug);
        if (mounted && res?.update) {
          setDetailUpdate(res.update);
        }
        const rel = await getRelatedChangelogs(slug, 3);
        if (mounted && rel && rel.length > 0) {
          setRelatedItems(rel);
        }
      } catch {
        if (mounted) {
          const fromStore = getBySlug(slug);
          if (fromStore) setDetailUpdate(fromStore);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug, getBySlug]);

  const update = detailUpdate || getBySlug(slug);

  if (loading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <DetailSkeleton />
        </div>
      </PublicShell>
    );
  }

  if (!update) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <EmptyState
            icon={FileQuestion}
            title="Update not found"
            description="This update may have been unpublished, renamed or deleted."
            action={
              <Button asChild>
                <Link to="/updates">Back to all updates</Link>
              </Button>
            }
          />
        </div>
      </PublicShell>
    );
  }

  const author = authorById(update.authorId);
  const related =
    relatedItems.length > 0
      ? relatedItems
      : updates
          .filter((u) => u.status === "published" && u.id !== update.id)
          .slice(0, 3);

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <Link
          to="/updates"
          className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All updates
        </Link>

        <header className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <CategoryBadge category={update.category} />
            <span className="text-mono-meta text-muted-foreground">v{update.version}</span>
          </div>
          <h1 className="text-h1">{update.title}</h1>
          <p className="text-body text-muted-foreground">{update.excerpt}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <AuthorChip author={author} withRole />
            <span className="text-mono-meta text-muted-foreground">
              {formatDate(update.publishedAt ?? update.updatedAt)}
            </span>
          </div>
        </header>

        {update.coverImage ? (
          <img
            src={update.coverImage}
            alt=""
            className="mt-8 aspect-[16/7] w-full rounded-lg border border-border object-cover"
          />
        ) : (
          <div
            className="mt-8 grid aspect-[16/6] w-full place-items-center rounded-lg border border-border bg-surface"
            aria-hidden
          >
            <span className="hairline-grid size-full rounded-lg opacity-70" />
          </div>
        )}

        <div className="mt-10">
          <Markdown source={update.content} />
        </div>

        <Separator className="my-10" />

        <section className="space-y-3">
          <h2 className="text-h3">Was this useful?</h2>
          <ReactionBar update={update} size="lg" />
        </section>

        <Separator className="my-10" />

        <section className="space-y-4">
          <h2 className="text-h2">More updates</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <UpdateCard key={item.id} update={item} />
            ))}
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
