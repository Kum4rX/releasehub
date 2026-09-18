import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { UpdateForm } from "@/components/admin/update-form";
import { PageHeader } from "@/components/common/states";
import { AdminGuard } from "@/components/layout/admin-guard";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/admin/updates/new")({
  head: () => ({
    meta: [
      { title: "Create update — ReleaseHub admin" },
      {
        name: "description",
        content: "Write a changelog entry in Markdown, add a cover image, save it or publish it.",
      },
      { property: "og:title", content: "Create update — ReleaseHub admin" },
      { property: "og:description", content: "Write and publish a product update." },
    ],
  }),
  component: CreateUpdatePage,
});

function CreateUpdatePage() {
  const { createUpdate } = useReleaseStore();
  const navigate = useNavigate();

  return (
    <AdminGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="New"
          title="Create update"
          description="Draft it now, publish when you're ready."
        />
        <UpdateForm
          mode="create"
          onSubmit={(draft, action) => {
            createUpdate(draft);
            if (action === "publish") {
              toast.success("Update published successfully", {
                description: "It's live on your public changelog.",
              });
              navigate({ to: "/admin/published" });
            } else {
              toast.success("Draft saved");
              navigate({ to: "/admin/drafts" });
            }
          }}
        />
      </div>
    </AdminGuard>
  );
}
