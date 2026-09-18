export type Category = "new" | "improved" | "fixed";
export type UpdateStatus = "published" | "draft";
export type ReactionKey = "heart" | "party" | "rocket";

export type Author = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarHue: number;
};

export type ChangelogUpdate = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  status: UpdateStatus;
  publishedAt: string | null;
  updatedAt: string;
  authorId: string;
  coverImage: string | null;
  version: string;
  content: string;
  reactions: Record<ReactionKey, number>;
};

export type Notification = {
  id: string;
  updateId: string;
  createdAt: string;
  read: boolean;
};

export const authors: Author[] = [
  { id: "u_1", name: "Aria Fontaine", role: "Head of Product", initials: "AF", avatarHue: 48 },
  { id: "u_2", name: "Milo Berger", role: "Staff Engineer", initials: "MB", avatarHue: 250 },
  { id: "u_3", name: "Neha Rao", role: "Product Designer", initials: "NR", avatarHue: 155 },
];

export const currentAdmin: Author = {
  id: "u_1",
  name: "Aria Fontaine",
  role: "Head of Product",
  initials: "AF",
  avatarHue: 48,
};

export const categoryMeta: Record<
  Category,
  { label: string; hint: string; tone: string; dot: string }
> = {
  new: {
    label: "New",
    hint: "Brand new capability",
    tone: "border-accent/35 bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  improved: {
    label: "Improved",
    hint: "Existing feature made better",
    tone: "border-info/35 bg-info/10 text-info",
    dot: "bg-info",
  },
  fixed: {
    label: "Fixed",
    hint: "Bug fix or stability work",
    tone: "border-success/35 bg-success/10 text-success",
    dot: "bg-success",
  },
};

export const reactionMeta: Record<ReactionKey, { emoji: string; label: string }> = {
  heart: { emoji: "❤️", label: "Love this" },
  party: { emoji: "🎉", label: "Great news" },
  rocket: { emoji: "🚀", label: "Ship it" },
};

const body = (title: string, intro: string, bullets: string[], outro: string) => `# ${title}

${intro}

## What's new

${bullets.map((b) => `- ${b}`).join("\n")}

## How it works

Enable it from **Settings → Workspace**, or call the feed directly:

\`\`\`bash
curl https://api.releasehub.dev/v1/updates?limit=10
\`\`\`

> ${outro}

Questions or feedback? Reply to this update and it lands straight in our team inbox.
`;

export const updates: ChangelogUpdate[] = [
  {
    id: "up_01",
    slug: "ai-agent-builder",
    title: "AI Agent Builder",
    excerpt:
      "Build intelligent workflows with our new visual agent builder — no scripting required.",
    category: "new",
    status: "published",
    publishedAt: "2026-09-16T09:00:00.000Z",
    updatedAt: "2026-09-16T09:00:00.000Z",
    authorId: "u_1",
    coverImage: null,
    version: "3.14.0",
    content: body(
      "AI Agent Builder",
      "Agents are the fastest way to turn a repetitive process into something that runs itself. Drag steps onto the canvas, describe the outcome in plain language, and ship.",
      [
        "Visual agent builder with branching and retries",
        "Plain-language step descriptions compiled into tool calls",
        "Step-by-step run inspector for debugging",
        "Reusable agent templates across workspaces",
      ],
      "Agents run on the same permissions as the workspace member who created them.",
    ),
    reactions: { heart: 24, party: 18, rocket: 32 },
  },
  {
    id: "up_02",
    slug: "faster-workflow-execution",
    title: "Faster Workflow Execution",
    excerpt: "Median workflow runs are 3.1× faster after a full rewrite of the execution engine.",
    category: "improved",
    status: "published",
    publishedAt: "2026-09-09T10:30:00.000Z",
    updatedAt: "2026-09-09T10:30:00.000Z",
    authorId: "u_2",
    coverImage: null,
    version: "3.13.2",
    content: body(
      "Faster Workflow Execution",
      "We rebuilt the scheduler around a work-stealing queue. Long workflows no longer block short ones, and cold starts dropped to near zero.",
      [
        "3.1× faster median run time",
        "Parallel step execution by default",
        "Cold starts down from 900ms to 40ms",
      ],
      "No migration needed — every workspace is already on the new engine.",
    ),
    reactions: { heart: 41, party: 12, rocket: 58 },
  },
  {
    id: "up_03",
    slug: "improved-analytics-dashboard",
    title: "Improved Analytics Dashboard",
    excerpt: "A rebuilt analytics surface with comparisons, saved views and CSV export.",
    category: "improved",
    status: "published",
    publishedAt: "2026-08-28T08:00:00.000Z",
    updatedAt: "2026-08-28T08:00:00.000Z",
    authorId: "u_3",
    coverImage: null,
    version: "3.12.0",
    content: body(
      "Improved Analytics Dashboard",
      "Analytics now answers the question you actually have: what changed, and when. Every metric supports period comparison.",
      [
        "Period-over-period comparison on every metric",
        "Saved views shared with your team",
        "CSV export for any table",
      ],
      "Saved views respect the viewer's data permissions.",
    ),
    reactions: { heart: 19, party: 7, rocket: 14 },
  },
  {
    id: "up_04",
    slug: "new-whatsapp-integration",
    title: "New WhatsApp Integration",
    excerpt: "Send and receive WhatsApp messages from the shared team inbox.",
    category: "new",
    status: "published",
    publishedAt: "2026-08-19T12:15:00.000Z",
    updatedAt: "2026-08-19T12:15:00.000Z",
    authorId: "u_1",
    coverImage: null,
    version: "3.11.0",
    content: body(
      "New WhatsApp Integration",
      "Conversations from WhatsApp now arrive in the same inbox as email and chat, with full history and assignment.",
      [
        "Two-way messaging with media support",
        "Template message library",
        "Automatic contact matching",
      ],
      "Connect a number from Settings → Channels; approval usually takes a few minutes.",
    ),
    reactions: { heart: 33, party: 26, rocket: 21 },
  },
  {
    id: "up_05",
    slug: "redesigned-automation-builder",
    title: "Redesigned Automation Builder",
    excerpt: "A calmer canvas, inline validation and keyboard-first editing.",
    category: "improved",
    status: "published",
    publishedAt: "2026-08-06T09:45:00.000Z",
    updatedAt: "2026-08-06T09:45:00.000Z",
    authorId: "u_3",
    coverImage: null,
    version: "3.10.1",
    content: body(
      "Redesigned Automation Builder",
      "The builder got quieter. Fewer panels, clearer state, and every action reachable from the keyboard.",
      ["Inline validation before you save", "Command palette inside the canvas", "Undo and redo"],
      "Existing automations open unchanged in the new builder.",
    ),
    reactions: { heart: 28, party: 15, rocket: 19 },
  },
  {
    id: "up_06",
    slug: "improved-search",
    title: "Improved Search",
    excerpt: "Typo-tolerant search across records, conversations and documents.",
    category: "improved",
    status: "published",
    publishedAt: "2026-07-24T11:00:00.000Z",
    updatedAt: "2026-07-24T11:00:00.000Z",
    authorId: "u_2",
    coverImage: null,
    version: "3.9.4",
    content: body(
      "Improved Search",
      "Search now indexes every object type in one place, ranks by recency and relevance, and forgives typos.",
      ["Typo tolerance", "Unified results across objects", "Filters that persist per workspace"],
      "Results are permission-filtered before they leave the server.",
    ),
    reactions: { heart: 22, party: 6, rocket: 11 },
  },
  {
    id: "up_07",
    slug: "better-notification-reliability",
    title: "Better Notification Reliability",
    excerpt: "Fixed duplicate and delayed notifications during high-volume bursts.",
    category: "fixed",
    status: "published",
    publishedAt: "2026-07-13T15:20:00.000Z",
    updatedAt: "2026-07-13T15:20:00.000Z",
    authorId: "u_2",
    coverImage: null,
    version: "3.9.1",
    content: body(
      "Better Notification Reliability",
      "A race in the delivery worker could send the same notification twice, or hold it back for minutes. Both are resolved.",
      [
        "Idempotent delivery keys",
        "Ordered fan-out per recipient",
        "Retry backoff with dead-letter visibility",
      ],
      "Delivery success is now above 99.98% over a rolling 30-day window.",
    ),
    reactions: { heart: 17, party: 4, rocket: 9 },
  },
  {
    id: "up_08",
    slug: "new-team-inbox-filters",
    title: "New Team Inbox Filters",
    excerpt: "Filter the shared inbox by assignee, channel, SLA risk and sentiment.",
    category: "new",
    status: "published",
    publishedAt: "2026-06-30T09:10:00.000Z",
    updatedAt: "2026-06-30T09:10:00.000Z",
    authorId: "u_1",
    coverImage: null,
    version: "3.8.0",
    content: body(
      "New Team Inbox Filters",
      "Large inboxes need sharper tools. Stack filters, save them as views, and pin the ones you live in.",
      ["Stackable filters", "Saved and pinned views", "SLA risk as a first-class filter"],
      "Views are per-member unless you explicitly share them.",
    ),
    reactions: { heart: 14, party: 9, rocket: 12 },
  },
  {
    id: "up_09",
    slug: "faster-contact-import",
    title: "Faster Contact Import",
    excerpt: "Imports of 100k+ contacts now finish in under two minutes.",
    category: "improved",
    status: "published",
    publishedAt: "2026-06-17T13:40:00.000Z",
    updatedAt: "2026-06-17T13:40:00.000Z",
    authorId: "u_2",
    coverImage: null,
    version: "3.7.3",
    content: body(
      "Faster Contact Import",
      "Import runs stream and deduplicate in one pass instead of two, with a live progress report.",
      ["Streaming CSV parser", "Live progress and row-level errors", "Resumable failed imports"],
      "Column mapping is remembered per file shape.",
    ),
    reactions: { heart: 11, party: 3, rocket: 8 },
  },
  {
    id: "up_10",
    slug: "improved-mobile-experience",
    title: "Improved Mobile Experience",
    excerpt: "Rebuilt navigation, larger touch targets and offline-tolerant drafts on mobile.",
    category: "improved",
    status: "published",
    publishedAt: "2026-06-02T08:25:00.000Z",
    updatedAt: "2026-06-02T08:25:00.000Z",
    authorId: "u_3",
    coverImage: null,
    version: "3.7.0",
    content: body(
      "Improved Mobile Experience",
      "Mobile is no longer a compressed desktop. Navigation moved into a drawer, and every primary action sits within thumb reach.",
      ["Drawer navigation", "Comfortable touch targets", "Drafts survive a lost connection"],
      "Tested down to 390px viewports.",
    ),
    reactions: { heart: 26, party: 11, rocket: 15 },
  },
  {
    id: "up_11",
    slug: "new-crm-automation",
    title: "New CRM Automation",
    excerpt: "Trigger multi-step sequences from any record change in the CRM.",
    category: "new",
    status: "published",
    publishedAt: "2026-05-21T10:05:00.000Z",
    updatedAt: "2026-05-21T10:05:00.000Z",
    authorId: "u_1",
    coverImage: null,
    version: "3.6.0",
    content: body(
      "New CRM Automation",
      "Record changes are now first-class triggers, so pipeline hygiene can run without anyone remembering to do it.",
      ["Field-level triggers", "Delay and branch steps", "Dry-run preview before activating"],
      "Dry runs never write data or send messages.",
    ),
    reactions: { heart: 20, party: 13, rocket: 24 },
  },
  {
    id: "up_12",
    slug: "bug-fixes-and-stability",
    title: "Bug Fixes & Stability Improvements",
    excerpt: "Thirty-one fixes across the editor, billing and export pipeline.",
    category: "fixed",
    status: "published",
    publishedAt: "2026-05-08T16:00:00.000Z",
    updatedAt: "2026-05-08T16:00:00.000Z",
    authorId: "u_2",
    coverImage: null,
    version: "3.5.6",
    content: body(
      "Bug Fixes & Stability Improvements",
      "A maintenance release focused on the rough edges you told us about.",
      [
        "Editor no longer loses cursor position on autosave",
        "Invoice PDFs render correct tax lines",
        "Scheduled exports respect workspace timezone",
      ],
      "Full technical notes are available in the public feed.",
    ),
    reactions: { heart: 9, party: 2, rocket: 6 },
  },
  {
    id: "up_13",
    slug: "workspace-audit-log",
    title: "Workspace Audit Log",
    excerpt: "A searchable record of every administrative action in your workspace.",
    category: "new",
    status: "draft",
    publishedAt: null,
    updatedAt: "2026-09-15T14:30:00.000Z",
    authorId: "u_1",
    coverImage: null,
    version: "3.15.0",
    content: body(
      "Workspace Audit Log",
      "Every permission change, export and integration connection, in one filterable log.",
      ["90-day retention on all plans", "CSV and JSON export", "Filter by actor, object or action"],
      "Still in internal review — copy is not final.",
    ),
    reactions: { heart: 0, party: 0, rocket: 0 },
  },
  {
    id: "up_14",
    slug: "scheduled-digest-emails",
    title: "Scheduled Digest Emails",
    excerpt: "Let customers subscribe to a weekly roundup of your product updates.",
    category: "new",
    status: "draft",
    publishedAt: null,
    updatedAt: "2026-09-12T11:10:00.000Z",
    authorId: "u_3",
    coverImage: null,
    version: "3.15.0",
    content: body(
      "Scheduled Digest Emails",
      "Not everyone checks a changelog. Digests bring the highlights to their inbox on a cadence they choose.",
      ["Weekly or monthly cadence", "Category-level subscriptions", "Branded email template"],
      "Draft — waiting on final template review.",
    ),
    reactions: { heart: 0, party: 0, rocket: 0 },
  },
  {
    id: "up_15",
    slug: "export-pipeline-timeouts",
    title: "Export Pipeline Timeouts",
    excerpt: "Investigating rare timeouts on very large scheduled exports.",
    category: "fixed",
    status: "draft",
    publishedAt: null,
    updatedAt: "2026-09-04T07:55:00.000Z",
    authorId: "u_2",
    coverImage: null,
    version: "3.14.1",
    content: body(
      "Export Pipeline Timeouts",
      "Exports above roughly two million rows could time out at the storage boundary.",
      ["Chunked upload with resume", "Clearer failure messaging", "Alerting on partial writes"],
      "Draft — pending verification in staging.",
    ),
    reactions: { heart: 0, party: 0, rocket: 0 },
  },
];

export const notifications: Notification[] = [
  { id: "n_1", updateId: "up_01", createdAt: "2026-09-16T09:00:00.000Z", read: false },
  { id: "n_2", updateId: "up_02", createdAt: "2026-09-09T10:30:00.000Z", read: false },
  { id: "n_3", updateId: "up_07", createdAt: "2026-07-13T15:20:00.000Z", read: false },
  { id: "n_4", updateId: "up_03", createdAt: "2026-08-28T08:00:00.000Z", read: true },
  { id: "n_5", updateId: "up_04", createdAt: "2026-08-19T12:15:00.000Z", read: true },
];
