import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/authService";

type ResetSearch = {
  token?: string;
};

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set a new password — ReleaseHub" },
      { name: "description", content: "Choose a new password for your ReleaseHub account." },
      { property: "og:title", content: "Set a new password — ReleaseHub" },
      {
        property: "og:description",
        content: "Choose a new password for your ReleaseHub account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [token, setToken] = useState(search.token || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ token?: string; password?: string; confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!token.trim()) next.token = "A reset token is required.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      await resetPassword(token.trim(), password);
      toast.success("Password updated", { description: "Sign in with your new password." });
      navigate({ to: "/login" });
    } catch (err: any) {
      setErrors({ form: err?.message || "Password reset failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password you don't use anywhere else."
      footer={
        <p>
          Changed your mind?{" "}
          <Link to="/login" className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.form ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive"
          >
            {errors.form}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="reset-token">Reset token</Label>
          <Input
            id="reset-token"
            value={token}
            placeholder="Paste your password reset token"
            aria-invalid={!!errors.token}
            onChange={(e) => setToken(e.target.value)}
          />
          {errors.token ? (
            <p className="text-caption text-destructive">{errors.token}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            aria-invalid={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password ? (
            <p className="text-caption text-destructive">{errors.password}</p>
          ) : (
            <p className="text-caption text-muted-foreground">At least 8 characters.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-confirm">Confirm new password</Label>
          <Input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            aria-invalid={!!errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {errors.confirm ? <p className="text-caption text-destructive">{errors.confirm}</p> : null}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
