import { Link, useNavigate } from "@tanstack/react-router";
import { Copy, Eye, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/changelog/category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ChangelogUpdate } from "@/data/mock";
import { compactNumber, formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useReleaseStore } from "@/store/release-store";

export function StatusBadge({ status }: { status: ChangelogUpdate["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full text-label",
        status === "published"
          ? "border-success/35 bg-success/10 text-success"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", status === "published" ? "bg-success" : "bg-warning")}
      />
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  );
}

function RowActions({ update }: { update: ChangelogUpdate }) {
  const { remove, duplicate, publish } = useReleaseStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${update.title}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/admin/updates/$id/edit", params: { id: update.id } })}
          >
            <Pencil className="size-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/updates/$slug", params: { slug: update.slug } })}
          >
            <Eye className="size-3.5" /> Preview
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              duplicate(update.id);
              toast.success("Update duplicated", { description: "Saved as a new draft." });
            }}
          >
            <Copy className="size-3.5" /> Duplicate
          </DropdownMenuItem>
          {update.status === "draft" ? (
            <DropdownMenuItem
              onSelect={() => {
                publish(update.id);
                toast.success("Update published successfully");
              }}
            >
              <Send className="size-3.5" /> Publish
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this update?</DialogTitle>
            <DialogDescription>
              “{update.title}” will be removed from the changelog. This can&apos;t be undone in the
              demo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                remove(update.id);
                setConfirmOpen(false);
                toast.success("Update deleted");
              }}
            >
              Delete update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function UpdateTable({
  updates,
  showReactions = true,
}: {
  updates: ChangelogUpdate[];
  showReactions?: boolean;
}) {
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="panel hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface/60 hover:bg-surface/60">
              <TableHead className="w-[38%]">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Published</TableHead>
              {showReactions ? <TableHead className="text-right">Reactions</TableHead> : null}
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => (
              <TableRow key={update.id}>
                <TableCell>
                  <Link
                    to="/admin/updates/$id/edit"
                    params={{ id: update.id }}
                    className="focus-ring rounded-sm font-medium hover:text-accent"
                  >
                    {update.title}
                  </Link>
                  <p className="mt-0.5 text-mono-meta text-muted-foreground">v{update.version}</p>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={update.category} withDot={false} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={update.status} />
                </TableCell>
                <TableCell className="text-mono-meta text-muted-foreground">
                  {formatRelative(update.updatedAt)}
                </TableCell>
                <TableCell className="text-mono-meta text-muted-foreground">
                  {formatDate(update.publishedAt)}
                </TableCell>
                {showReactions ? (
                  <TableCell className="text-right text-mono-meta text-muted-foreground">
                    {compactNumber(
                      update.reactions.heart + update.reactions.party + update.reactions.rocket,
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="text-right">
                  <RowActions update={update} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="space-y-2.5 md:hidden">
        {updates.map((update) => (
          <li key={update.id} className="panel p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <CategoryBadge category={update.category} withDot={false} />
                  <StatusBadge status={update.status} />
                </div>
                <Link
                  to="/admin/updates/$id/edit"
                  params={{ id: update.id }}
                  className="focus-ring block rounded-sm text-sm font-medium"
                >
                  {update.title}
                </Link>
                <p className="text-mono-meta text-muted-foreground">
                  Updated {formatRelative(update.updatedAt)}
                </p>
              </div>
              <RowActions update={update} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
