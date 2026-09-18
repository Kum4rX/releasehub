import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/services/authService";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — ReleaseHub" },
      { name: "description", content: "Request a password reset link for your ReleaseHub account." },
      { property: "og:title", content: "Reset your password — ReleaseHub" },
      {
        property: "og:description",
        content: "Request a password reset link for your ReleaseHub account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setSentTo(result.email);
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
      toast.success("Reset link sent", { description: "Follow the link to choose a new password." });
    } catch (err: any) {
      setError(err?.message || "Failed to process request.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email on your account and we'll send a reset link."
      footer={
        <p>
          Remembered it?{" "}
          <Link to="/login" className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sentTo ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-10 place-items-center rounded-full border border-border bg-surface text-accent">
            <MailCheck className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-h3">Reset link ready</h2>
            <p className="text-sm text-muted-foreground">
              In this environment, password reset is simulated. Click below to enter your new password.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link to="/reset-password" search={resetToken ? { token: resetToken } : undefined}>
              Open reset screen
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={!!error}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error ? <p className="text-caption text-destructive">{error}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending link…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
