import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UpdateTable } from "@/components/admin/update-table";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { Button } from "@/components/ui/button";
import { filterUpdates } from "@/services/changelogService";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/admin/published")({
  head: () => ({
    meta: [
      { title: "Published updates — ReleaseHub admin" },
      { name: "description", content: "Every changelog entry that is live for customers." },
      { property: "og:title", content: "Published updates — ReleaseHub admin" },
      { property: "og:description", content: "Everything live on your changelog." },
    ],
  }),
  component: PublishedPage,
});

function PublishedPage() {
  const { updates } = useReleaseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 460);
    return () => clearTimeout(timer);
  }, []);

  const published = useMemo(() => filterUpdates(updates, { status: "published" }), [updates]);

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Live"
          title="Published"
          description="These updates are visible on your public changelog."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/updates">
                <ExternalLink className="size-3.5" /> View public page
              </Link>
            </Button>
          }
        />

        {loading ? (
          <TableSkeleton rows={5} />
        ) : published.length === 0 ? (
          <EmptyState
            icon={Send}
            title="Nothing published yet"
            description="Publish a draft to make it visible on your changelog."
            action={
              <Button asChild>
                <Link to="/admin/drafts">Open drafts</Link>
              </Button>
            }
          />
        ) : (
          <UpdateTable updates={published} />
        )}
      </div>
    </AdminGuard>
  );
}
