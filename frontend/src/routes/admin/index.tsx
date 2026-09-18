import { createFileRoute, Link } from "@tanstack/react-router";
import { FileEdit, Heart, PenLine, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatsCard } from "@/components/admin/stats-card";
import { UpdateTable } from "@/components/admin/update-table";
import { EmptyState, PageHeader, StatsSkeleton, TableSkeleton } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { Button } from "@/components/ui/button";
import { compactNumber } from "@/lib/format";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — ReleaseHub" },
      {
        name: "description",
        content: "Track published updates, drafts and reactions across your ReleaseHub changelog.",
      },
      { property: "og:title", content: "Admin overview — ReleaseHub" },
      { property: "og:description", content: "Your changelog workspace at a glance." },
    ],
  }),
  component: AdminOverview,
});

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function AdminOverview() {
  const { updates, session } = useReleaseStore();
  const [loading, setLoading] = useState(true);
  const [hello, setHello] = useState("Welcome back");

  useEffect(() => {
    setHello(greeting(new Date().getHours()));
    const timer = setTimeout(() => setLoading(false), 520);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const published = updates.filter((u) => u.status === "published");
    const drafts = updates.filter((u) => u.status === "draft");
    const reactions = updates.reduce(
      (sum, u) => sum + u.reactions.heart + u.reactions.party + u.reactions.rocket,
      0,
    );
    return { published, drafts, reactions };
  }, [updates]);

  const recent = useMemo(
    () =>
      [...updates]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6),
    [updates],
  );

  const firstName = (session?.user.name ?? "there").split(" ")[0];

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Overview"
          title={`${hello}, ${firstName}`}
          description="Here's how your changelog is doing today."
          actions={
            <Button asChild size="sm">
              <Link to="/admin/updates/new">
                <PenLine className="size-3.5" /> Create update
              </Link>
            </Button>
          }
        />

        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Total updates"
              value={String(updates.length)}
              hint="Across every category"
              icon={Sparkles}
            />
            <StatsCard
              label="Published"
              value={String(stats.published.length)}
              hint="Live on the public changelog"
              icon={Send}
            />
            <StatsCard
              label="Drafts"
              value={String(stats.drafts.length)}
              hint="Waiting to ship"
              icon={FileEdit}
            />
            <StatsCard
              label="Reactions"
              value={compactNumber(stats.reactions)}
              hint="Hearts, parties and rockets"
              icon={Heart}
            />
          </div>
        )}

        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-h3">Recent updates</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/updates">View all updates</Link>
            </Button>
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={PenLine}
              title="Nothing here yet"
              description="Write your first product update and publish it to the changelog."
              action={
                <Button asChild>
                  <Link to="/admin/updates/new">Create update</Link>
                </Button>
              }
            />
          ) : (
            <UpdateTable updates={recent} />
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
