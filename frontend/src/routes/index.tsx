import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Code2,
  Filter,
  Heart,
  PenLine,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import { CategoryBadge } from "@/components/changelog/category-badge";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { seedChangelog, type ChangelogUpdate } from "@/services/changelogService";
import { formatDate, formatRelative } from "@/lib/format";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReleaseHub — Ship updates. Keep customers in the loop." },
      {
        name: "description",
        content:
          "ReleaseHub is a product changelog platform: publish updates, run a public timeline, and give users a What's new panel.",
      },
      { property: "og:title", content: "ReleaseHub — Product changelog platform" },
      {
        property: "og:description",
        content:
          "Create beautiful product changelogs, publish updates, and give your users a simple way to discover what's new.",
      },
    ],
  }),
  component: LandingPage,
});

function HeroPreview({ items }: { items: ChangelogUpdate[] }) {
  const displayItems =
    items.length > 0
      ? items
      : (seedChangelog as ChangelogUpdate[]).filter(
          (u: ChangelogUpdate) => u.status === "published"
        );
  return (
    <div className="panel overflow-hidden shadow-raised">
      <div className="flex items-center gap-2 border-b border-border bg-surface/70 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
        </span>
        <span className="mx-auto rounded border border-border bg-card px-2 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
          releasehub.dev/updates
        </span>
        <span className="relative" aria-hidden>
          <Bell className="size-3.5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-accent" />
        </span>
      </div>
      <div className="divide-y divide-border">
        {displayItems.slice(0, 3).map((update) => (
          <div key={update.id} className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <CategoryBadge category={update.category} />
              <span className="text-mono-meta text-muted-foreground">
                {formatDate(update.publishedAt)}
              </span>
            </div>
            <p className="text-h3">{update.title}</p>
            <p className="line-clamp-2 text-caption text-muted-foreground">{update.excerpt}</p>
            <div className="flex gap-1.5 pt-0.5">
              {["❤️", "🎉", "🚀"].map((emoji, i) => (
                <span
                  key={emoji}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[0.625rem] text-muted-foreground"
                >
                  {emoji}
                  <span className="font-mono">
                    {[update.reactions.heart, update.reactions.party, update.reactions.rocket][i]}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-16">
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <p className="text-label text-accent">{eyebrow}</p>
          <h2 className="text-h1">{title}</h2>
          <p className="text-body text-muted-foreground">{description}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function LandingPage() {
  const { updates } = useReleaseStore();
  const publishedUpdates = updates.filter((u) => u.status === "published");
  const published =
    publishedUpdates.length > 0
      ? publishedUpdates
      : (seedChangelog as ChangelogUpdate[]).filter(
          (u: ChangelogUpdate) => u.status === "published"
        );

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="hairline-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_26rem] lg:py-24">
          <div className="space-y-6">
            <Badge variant="outline" className="gap-1.5 rounded-full border-border bg-card">
              <Sparkles className="size-3 text-accent" />
              <span className="text-caption">Changelog platform for product teams</span>
            </Badge>
            <h1 className="text-display max-w-xl">Ship updates. Keep customers in the loop.</h1>
            <p className="max-w-xl text-body text-muted-foreground sm:text-base">
              Create beautiful product changelogs, publish updates, and give your users a simple way
              to discover what&apos;s new.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button size="lg" asChild>
                <Link to="/updates">
                  View product updates <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/admin">Open admin demo</Link>
              </Button>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-4">
              {[
                { label: "Updates published", value: `${published.length}` },
                { label: "Reactions", value: "1.2K" },
                { label: "Latest release", value: `v${published[0]?.version ?? "3.14.0"}` },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-label text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroPreview items={published} />
        </div>
      </section>

      {/* Timeline preview */}
      <Section
        eyebrow="Public changelog"
        title="A timeline your customers actually read"
        description="An editorial timeline instead of a wall of cards — dated, categorised and easy to scan."
      >
        <div className="panel divide-y divide-border">
          {published.slice(0, 4).map((update) => (
            <Link
              key={update.id}
              to="/updates/$slug"
              params={{ slug: update.slug }}
              className="focus-ring group grid gap-2 p-5 transition-colors hover:bg-surface/60 sm:grid-cols-[8rem_1fr] sm:gap-6"
            >
              <span className="text-mono-meta text-muted-foreground">
                {formatDate(update.publishedAt)}
              </span>
              <span className="space-y-2">
                <CategoryBadge category={update.category} />
                <span className="block text-h3 group-hover:text-accent">{update.title}</span>
                <span className="block text-sm text-muted-foreground">{update.excerpt}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Separator />

      {/* What's new */}
      <Section
        eyebrow="What's new"
        title="An unread badge that brings people back"
        description="Every published update lands in a notification panel with an unread count, so nothing important gets missed."
      >
        <div className="panel max-w-md overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-h3">What&apos;s new</p>
              <p className="text-caption text-muted-foreground">Latest product updates</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-caption font-semibold text-accent-foreground">
              <Bell className="size-3" /> 3
            </span>
          </div>
          <ul className="divide-y divide-border">
            {published.slice(0, 3).map((update, index) => (
              <li
                key={update.id}
                className={index < 2 ? "space-y-1.5 bg-accent/[0.04] px-4 py-3" : "space-y-1.5 px-4 py-3"}
              >
                <CategoryBadge category={update.category} withDot={false} />
                <p className={index < 2 ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                  {update.title}
                </p>
                <p className="text-caption text-muted-foreground">
                  {formatRelative(update.publishedAt ?? update.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Separator />

      {/* Admin workflow + search + reactions */}
      <Section
        eyebrow="Publishing workflow"
        title="Draft, review, publish"
        description="Write in markdown with a live preview, save drafts while you iterate, and publish when the release lands."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: PenLine,
              title: "Markdown editor",
              body: "Split-screen editing with a toolbar, live preview and word count.",
            },
            {
              icon: Send,
              title: "Draft & publish",
              body: "Confirm before publishing; drafts stay private until you're ready.",
            },
            {
              icon: Search,
              title: "Command search",
              body: "Press ⌘K to jump to any update, page or admin action.",
            },
            {
              icon: Filter,
              title: "Categories & sorting",
              body: "Filter by New, Improved or Fixed, and sort by date or reactions.",
            },
            {
              icon: Heart,
              title: "Reactions",
              body: "❤️ 🎉 🚀 let customers signal what they care about.",
            },
            {
              icon: Code2,
              title: "Public feed",
              body: "A JSON feed so your app can render What's new in-product.",
            },
          ].map((feature) => (
            <div key={feature.title} className="panel space-y-2 p-4">
              <feature.icon className="size-4 text-accent" aria-hidden />
              <p className="text-h3">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      {/* Feed / integration concept */}
      <Section
        eyebrow="Integration"
        title="Read your changelog anywhere"
        description="Point your in-product What's new widget at the public feed. The endpoint below is illustrative — this demo runs entirely in the browser."
      >
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface/70 px-4 py-2">
            <span className="text-mono-meta text-muted-foreground">GET /v1/updates</span>
            <Badge variant="outline" className="text-label">
              Concept
            </Badge>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[0.75rem] leading-relaxed text-muted-foreground">
            {`{
  "updates": [
    {
      "slug": "ai-agent-builder",
      "title": "AI Agent Builder",
      "category": "new",
      "published_at": "2026-09-16T09:00:00Z",
      "reactions": { "heart": 24, "party": 18, "rocket": 32 }
    }
  ],
  "unread_count": 3
}`}
          </pre>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="border-t border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-h1">Give every release a home.</h2>
            <p className="max-w-md text-body text-muted-foreground">
              Explore the public changelog, or step into the admin side and publish an update
              yourself.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button size="lg" asChild>
              <Link to="/updates">View product updates</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/admin/updates/new">Create an update</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
