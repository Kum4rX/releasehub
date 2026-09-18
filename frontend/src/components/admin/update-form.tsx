import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Loader2, Save, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUploader } from "@/components/admin/image-uploader";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { CategoryBadge } from "@/components/changelog/category-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categoryMeta, type Category, type ChangelogUpdate, type UpdateStatus } from "@/data/mock";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UpdateDraft } from "@/services/changelogService";

const emptyDraft: UpdateDraft = {
  title: "",
  slug: "",
  excerpt: "",
  category: "new",
  status: "draft",
  version: "",
  coverImage: null,
  content: "",
};

type Errors = Partial<Record<keyof UpdateDraft, string>>;

function validate(draft: UpdateDraft): Errors {
  const errors: Errors = {};
  if (draft.title.trim().length < 4) errors.title = "Give this update a title of at least 4 characters.";
  const slug = draft.slug ?? "";
  if (!slug.trim()) errors.slug = "A slug is required — it becomes the public URL.";
  else if (!/^[a-z0-9-]+$/.test(slug)) errors.slug = "Use lowercase letters, numbers and hyphens only.";
  const excerpt = draft.excerpt ?? "";
  if (excerpt.trim().length < 10) errors.excerpt = "Write a short summary (at least 10 characters).";
  const version = draft.version ?? "";
  if (!version.trim()) errors.version = "Add a version number, e.g. 3.14.0.";
  if (draft.content.trim().length < 20) errors.content = "Add some content before saving.";
  return errors;
}

function FieldRow({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {hint ? <span className="text-caption text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function UpdateForm({
  mode,
  initial,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: ChangelogUpdate;
  onSubmit: (draft: UpdateDraft, action: "draft" | "publish") => void;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<UpdateDraft>(
    initial
      ? {
          title: initial.title,
          slug: initial.slug,
          excerpt: initial.excerpt,
          category: initial.category,
          status: initial.status,
          version: initial.version,
          coverImage: initial.coverImage,
          content: initial.content,
        }
      : emptyDraft,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [publishOpen, setPublishOpen] = useState(false);
  const [pending, setPending] = useState<null | "draft" | "publish">(null);
  const [slugLocked, setSlugLocked] = useState(Boolean(initial));

  const set = <K extends keyof UpdateDraft>(key: K, value: UpdateDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const run = async (action: "draft" | "publish") => {
    const found = validate(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      toast.error("Check the highlighted fields", {
        description: "A few required details are missing.",
      });
      return;
    }
    setPending(action);
    await new Promise((resolve) => setTimeout(resolve, 520));
    setPending(null);
    onSubmit({ ...draft, status: action === "publish" ? "published" : "draft" }, action);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/updates" })}>
          <ArrowLeft className="size-3.5" /> Back to updates
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              draft.slug
                ? navigate({ to: "/updates/$slug", params: { slug: draft.slug } })
                : toast.info("Add a slug first to preview the public page.")
            }
          >
            <Eye className="size-3.5" /> Preview
          </Button>
          <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => run("draft")}>
            {pending === "draft" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={pending !== null}
            onClick={() => {
              const found = validate(draft);
              if (Object.keys(found).length > 0) {
                setErrors(found);
                toast.error("Check the highlighted fields");
                return;
              }
              setPublishOpen(true);
            }}
          >
            <Send className="size-3.5" /> {mode === "create" ? "Publish update" : "Publish changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="panel space-y-5 p-5">
          <FieldRow id="title" label="Title" error={errors.title}>
            <Input
              id="title"
              value={draft.title}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              placeholder="AI Agent Builder"
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugLocked) set("slug", slugify(e.target.value));
              }}
            />
          </FieldRow>

          <FieldRow
            id="slug"
            label="Slug"
            hint={`releasehub.dev/updates/${draft.slug || "…"}`}
            error={errors.slug}
          >
            <Input
              id="slug"
              value={draft.slug}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "slug-error" : undefined}
              placeholder="ai-agent-builder"
              className="font-mono text-[0.8125rem]"
              onChange={(e) => {
                setSlugLocked(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </FieldRow>

          <FieldRow id="excerpt" label="Summary" hint="Shown in the timeline" error={errors.excerpt}>
            <Textarea
              id="excerpt"
              value={draft.excerpt}
              aria-invalid={Boolean(errors.excerpt)}
              aria-describedby={errors.excerpt ? "excerpt-error" : undefined}
              placeholder="Build intelligent workflows with our new visual agent builder."
              className="min-h-20"
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </FieldRow>
        </div>

        <div className="panel space-y-5 p-5">
          <FieldRow id="category" label="Category">
            <Select
              value={draft.category}
              onValueChange={(value) => set("category", value as Category)}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(categoryMeta) as Category[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    #{categoryMeta[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow id="status" label="Status">
            <Select
              value={draft.status}
              onValueChange={(value) => set("status", value as UpdateStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow id="version" label="Version" error={errors.version}>
            <Input
              id="version"
              value={draft.version}
              aria-invalid={Boolean(errors.version)}
              aria-describedby={errors.version ? "version-error" : undefined}
              placeholder="3.14.0"
              className="font-mono text-[0.8125rem]"
              onChange={(e) => set("version", e.target.value)}
            />
          </FieldRow>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-label text-muted-foreground">Preview</p>
            <div className="space-y-2">
              <CategoryBadge category={draft.category} />
              <p className={cn("text-sm font-medium", !draft.title && "text-muted-foreground")}>
                {draft.title || "Untitled update"}
              </p>
              <p className="line-clamp-3 text-caption text-muted-foreground">
                {draft.excerpt || "Your summary appears here."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-h3">Cover image</h2>
        <ImageUploader value={draft.coverImage || null} onChange={(url) => set("coverImage", url)} />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h3">Content</h2>
          <span className="text-caption text-muted-foreground">Markdown supported</span>
        </div>
        <MarkdownEditor
          value={draft.content}
          onChange={(next) => set("content", next)}
          error={errors.content}
        />
      </section>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish this update?</DialogTitle>
            <DialogDescription>
              “{draft.title}” becomes visible on your public changelog and appears in the
              What&apos;s new panel for every customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending !== null}
              onClick={async () => {
                setPublishOpen(false);
                await run("publish");
              }}
            >
              {pending === "publish" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Publish update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
