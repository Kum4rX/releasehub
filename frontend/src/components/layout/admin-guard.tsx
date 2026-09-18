import { Link } from "@tanstack/react-router";
import { Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useReleaseStore } from "@/store/release-store";

/**
 * Role-Based Access Control Gate for Admin Workspace.
 * Enforces authenticated admin session, rejecting unauthenticated users and standard members.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useReleaseStore();

  if (loading) {
    return (
      <AdminShell>
        <div className="flex h-64 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  if (!session) {
    return (
      <AdminShell>
        <EmptyState
          icon={Lock}
          title="Sign in to open the admin workspace"
          description="This area is restricted to ReleaseHub administrators. Please sign in with an admin account."
          action={
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          }
        />
      </AdminShell>
    );
  }

  if (session.user.roleRaw !== "admin") {
    return (
      <AdminShell>
        <EmptyState
          icon={ShieldAlert}
          title="Administrator access required"
          description="You are currently signed in as a standard user. You do not have permissions to access the admin workspace or manage product changelogs."
          action={
            <Button asChild>
              <Link to="/updates">View product updates</Link>
            </Button>
          }
        />
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
