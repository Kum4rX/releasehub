import { createFileRoute, Link } from "@tanstack/react-router";
import { FileEdit, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UpdateTable } from "@/components/admin/update-table";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { Button } from "@/components/ui/button";
import { filterUpdates } from "@/services/changelogService";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/admin/drafts")({
  head: () => ({
    meta: [
      { title: "Drafts — ReleaseHub admin" },
      { name: "description", content: "Unpublished changelog entries waiting to ship." },
      { property: "og:title", content: "Drafts — ReleaseHub admin" },
      { property: "og:description", content: "Unpublished changelog entries." },
    ],
  }),
  component: DraftsPage,
});

function DraftsPage() {
  const { updates } = useReleaseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 460);
    return () => clearTimeout(timer);
  }, []);

  const drafts = useMemo(() => filterUpdates(updates, { status: "draft" }), [updates]);

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Workflow"
          title="Drafts"
          description="Work in progress — nothing here is visible to customers yet."
          actions={
            <Button asChild size="sm">
              <Link to="/admin/updates/new">
                <PenLine className="size-3.5" /> Create update
              </Link>
            </Button>
          }
        />

        {loading ? (
          <TableSkeleton rows={4} />
        ) : drafts.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title="No drafts right now"
            description="Everything you've written is published. Start a new update whenever you ship."
            action={
              <Button asChild>
                <Link to="/admin/updates/new">Create update</Link>
              </Button>
            }
          />
        ) : (
          <UpdateTable updates={drafts} showReactions={false} />
        )}
      </div>
    </AdminGuard>
  );
}
