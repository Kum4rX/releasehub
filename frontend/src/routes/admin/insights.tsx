import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Users, Heart, Sparkles, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatsCard } from "@/components/admin/stats-card";
import { CategoryBadge } from "@/components/changelog/category-badge";
import { EmptyState, PageHeader } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { categoryMeta, reactionMeta, type Category, type ReactionKey } from "@/data/mock";
import { compactNumber } from "@/lib/format";
import { useReleaseStore } from "@/store/release-store";
import { getAdminInsights, type AdminInsightsData } from "@/services/adminService";

export const Route = createFileRoute("/admin/insights")({
  head: () => ({
    meta: [
      { title: "Insights — ReleaseHub admin" },
      { name: "description", content: "Reaction and category breakdown across your changelog." },
      { property: "og:title", content: "Insights — ReleaseHub admin" },
      { property: "og:description", content: "How customers respond to your updates." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { updates } = useReleaseStore();
  const [insights, setInsights] = useState<AdminInsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAdminInsights();
        if (mounted && res) {
          setInsights(res);
        }
      } catch {
        // Fallback to local store data
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const localData = useMemo(() => {
    const published = updates.filter((u) => u.status === "published");
    const byReaction = (key: ReactionKey) => published.reduce((sum, u) => sum + u.reactions[key], 0);
    const total = byReaction("heart") + byReaction("party") + byReaction("rocket");
    const byCategory = (Object.keys(categoryMeta) as Category[]).map((key) => ({
      key,
      count: published.filter((u) => u.category === key).length,
    }));
    const top = [...published]
      .sort(
        (a, b) =>
          b.reactions.heart +
          b.reactions.party +
          b.reactions.rocket -
          (a.reactions.heart + a.reactions.party + a.reactions.rocket),
      )
      .slice(0, 5);
    return { published, byReaction, total, byCategory, top };
  }, [updates]);

  const maxCategory = Math.max(1, ...localData.byCategory.map((c) => c.count));

  // Prefer live backend insights if available, otherwise local store
  const publishedCount = insights ? insights.changelogs.published : localData.published.length;
  const draftCount = insights ? insights.changelogs.draft : updates.filter((u) => u.status === "draft").length;
  const heartCount = insights ? insights.reactions.byType.heart : localData.byReaction("heart");
  const celebrateCount = insights ? insights.reactions.byType.celebrate : localData.byReaction("party");
  const rocketCount = insights ? insights.reactions.byType.rocket : localData.byReaction("rocket");
  const userCount = insights ? insights.users.total : 1;
  const verifiedCount = insights ? insights.users.verified : 1;

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Insights"
          title="Reactions & reach"
          description="Live aggregated product updates, reader engagement, and community reactions."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatsCard
            label="Published"
            value={String(publishedCount)}
            hint={`${draftCount} drafts`}
            icon={BarChart3}
          />
          <StatsCard
            label="Community"
            value={String(userCount)}
            hint={`${verifiedCount} verified users`}
            icon={Users}
          />
          <StatsCard
            label={reactionMeta.heart.label}
            value={compactNumber(heartCount)}
            hint={`${reactionMeta.heart.emoji} reactions`}
            icon={Heart}
          />
          <StatsCard
            label={reactionMeta.party.label}
            value={compactNumber(celebrateCount)}
            hint={`${reactionMeta.party.emoji} reactions`}
            icon={Sparkles}
          />
          <StatsCard
            label={reactionMeta.rocket.label}
            value={compactNumber(rocketCount)}
            hint={`${reactionMeta.rocket.emoji} reactions`}
            icon={Rocket}
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel space-y-4 p-5">
            <h2 className="text-h3">Updates by category</h2>
            <ul className="space-y-3">
              {localData.byCategory.map(({ key, count }) => (
                <li key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <CategoryBadge category={key} withDot={false} />
                    <span className="text-mono-meta text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-accent/70"
                      style={{ width: `${(count / maxCategory) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel space-y-4 p-5">
            <h2 className="text-h3">
              {insights?.recentActivity?.length ? "Recent published activity" : "Most loved updates"}
            </h2>
            {insights?.recentActivity && insights.recentActivity.length > 0 ? (
              <ol className="divide-y divide-border">
                {insights.recentActivity.map((activity, index) => (
                  <li key={activity.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-mono-meta text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{activity.title}</span>
                    <CategoryBadge category={activity.category as Category} withDot={false} />
                    <span className="text-mono-meta text-muted-foreground">
                      {compactNumber(activity.reactions.total)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : localData.top.length === 0 ? (
              <EmptyState
                title="No published updates yet"
                description="Publish an update to start collecting reactions."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ol className="divide-y divide-border">
                {localData.top.map((update, index) => (
                  <li key={update.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-mono-meta text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{update.title}</span>
                    <span className="text-mono-meta text-muted-foreground">
                      {compactNumber(
                        update.reactions.heart + update.reactions.party + update.reactions.rocket,
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}
