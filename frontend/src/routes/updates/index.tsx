import { createFileRoute, Link } from "@tanstack/react-router";
import { PenLine, Rss, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UpdateTimeline } from "@/components/changelog/update-timeline";
import { EmptyState, PageHeader, TimelineSkeleton } from "@/components/common/states";
import { PublicShell } from "@/components/layout/public-shell";
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
import type { Category } from "@/data/mock";
import { filterUpdates } from "@/services/changelogService";
import { useReleaseStore } from "@/store/release-store";

type SortKey = "newest" | "oldest" | "reactions";

export const Route = createFileRoute("/updates/")({
  validateSearch: (search: Record<string, unknown>): { category?: Category | "all" } => {
    const value = search["category"];
    return value === "new" || value === "improved" || value === "fixed" || value === "all"
      ? { category: value }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Product updates — ReleaseHub" },
      {
        name: "description",
        content: "Stay up to date with everything we're building: new features, improvements and fixes.",
      },
      { property: "og:title", content: "Product updates — ReleaseHub" },
      {
        property: "og:description",
        content: "Stay up to date with everything we're building.",
      },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const { category: initialCategory } = Route.useSearch();
  const { updates } = useReleaseStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">(initialCategory ?? "all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 560);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(
    () => filterUpdates(updates, { search, category, status: "published", sort }),
    [updates, search, category, sort],
  );

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <PageHeader
          eyebrow="Changelog"
          title="Product updates"
          description="Stay up to date with everything we're building."
          actions={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Rss className="size-3.5" /> Public feed
            </Button>
          }
        />

        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Label htmlFor="update-search" className="sr-only">
                Search updates
              </Label>
              <Input
                id="update-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search updates…"
              />
            </div>
            <div className="sm:w-44">
              <Label htmlFor="update-sort" className="sr-only">
                Sort updates
              </Label>
              <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                <SelectTrigger id="update-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="reactions">Most reactions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={category} onValueChange={(value) => setCategory(value as Category | "all")}>
            <TabsList aria-label="Filter by category">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="improved">Improved</TabsTrigger>
              <TabsTrigger value="fixed">Fixed</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-caption text-muted-foreground" aria-live="polite">
            {loading
              ? "Loading updates…"
              : `${results.length} update${results.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="mt-10">
          {loading ? (
            <TimelineSkeleton />
          ) : results.length === 0 ? (
            search || category !== "all" ? (
              <EmptyState
                icon={SearchX}
                title="No updates match your filters"
                description="Try a different search term, or clear the category filter to see everything."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={PenLine}
                title="No product updates yet"
                description="Create your first update to keep customers informed."
                action={
                  <Button asChild>
                    <Link to="/admin/updates/new">Create update</Link>
                  </Button>
                }
              />
            )
          ) : (
            <UpdateTimeline updates={results} />
          )}
        </div>
      </div>
    </PublicShell>
  );
}
