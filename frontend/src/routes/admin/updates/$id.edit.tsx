import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import { toast } from "sonner";

import { UpdateForm } from "@/components/admin/update-form";
import { EmptyState, PageHeader } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { Button } from "@/components/ui/button";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/admin/updates/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit update — ReleaseHub admin" },
      { name: "description", content: "Revise a changelog entry and republish it." },
      { property: "og:title", content: "Edit update — ReleaseHub admin" },
      { property: "og:description", content: "Revise and republish a product update." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditUpdatePage,
});

function EditUpdatePage() {
  const { id } = Route.useParams();
  const { getById, saveUpdate } = useReleaseStore();
  const navigate = useNavigate();
  const update = getById(id);

  if (!update) {
    return (
      <AdminGuard>
        <EmptyState
          icon={FileQuestion}
          title="Update not found"
          description="This update may have been deleted in this demo session."
          action={
            <Button asChild>
              <Link to="/admin/updates">Back to updates</Link>
            </Button>
          }
        />
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Editing"
          title={update.title}
          description="Changes apply to the public changelog as soon as you publish."
        />
        <UpdateForm
          mode="edit"
          initial={update}
          onSubmit={(draft, action) => {
            saveUpdate(update.id, draft);
            if (action === "publish") {
              toast.success("Update published successfully");
              navigate({ to: "/admin/published" });
            } else {
              toast.success("Draft saved");
              navigate({ to: "/admin/updates" });
            }
          }}
        />
      </div>
    </AdminGuard>
  );
}
