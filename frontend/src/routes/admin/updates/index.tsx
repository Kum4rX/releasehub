import { createFileRoute, Link } from "@tanstack/react-router";
import { PenLine, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UpdateTable } from "@/components/admin/update-table";
import { EmptyState, PageHeader, TableSkeleton } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category, UpdateStatus } from "@/data/mock";
import { filterUpdates } from "@/services/changelogService";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/admin/updates/")({
  head: () => ({
    meta: [
      { title: "Manage updates — ReleaseHub admin" },
      {
        name: "description",
        content: "Search, filter, edit, duplicate and publish every changelog update.",
      },
      { property: "og:title", content: "Manage updates — ReleaseHub admin" },
      { property: "og:description", content: "Your full changelog library in one table." },
    ],
  }),
  component: AdminUpdatesPage,
});

function AdminUpdatesPage() {
  const { updates } = useReleaseStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<UpdateStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(
    () => filterUpdates(updates, { search, category, status }),
    [updates, search, category, status],
  );

  const filtered = Boolean(search) || category !== "all" || status !== "all";

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Library"
          title="Updates"
          description="Everything you've written — drafts and published releases."
          actions={
            <Button asChild size="sm">
              <Link to="/admin/updates/new">
                <PenLine className="size-3.5" /> Create update
              </Link>
            </Button>
          }
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="admin-search" className="sr-only">
                Search updates
              </Label>
              <Input
                id="admin-search"
                type="search"
                value={search}
                placeholder="Search by title or content…"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="sm:w-40">
              <Label htmlFor="admin-category" className="sr-only">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as Category | "all")}
              >
                <SelectTrigger id="admin-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="improved">Improved</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs
            value={status}
            onValueChange={(value) => setStatus(value as UpdateStatus | "all")}
          >
            <TabsList aria-label="Filter by status">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-caption text-muted-foreground" aria-live="polite">
            {loading ? "Loading updates…" : `${results.length} update${results.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : results.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="No updates match your filters"
              description="Try another search term or reset the filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PenLine}
              title="No updates yet"
              description="Start your changelog with a first release note."
              action={
                <Button asChild>
                  <Link to="/admin/updates/new">Create update</Link>
                </Button>
              }
            />
          )
        ) : (
          <UpdateTable updates={results} />
        )}
      </div>
    </AdminGuard>
  );
}
