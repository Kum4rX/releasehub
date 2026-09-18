import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MailCheck, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyEmail } from "@/services/authService";

type VerifySearch = {
  token?: string;
};

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify email — ReleaseHub" },
      { name: "description", content: "Verify your email to activate your ReleaseHub account." },
      { property: "og:title", content: "Verify email — ReleaseHub" },
      { property: "og:description", content: "Verify your email to activate your ReleaseHub account." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [token, setToken] = useState(search.token || "");
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If token is present in URL search param, auto-trigger verification
  useEffect(() => {
    if (search.token && !verified && !pending && !error) {
      handleVerify(search.token);
    }
  }, [search.token]);

  async function handleVerify(tokenToVerify: string) {
    if (!tokenToVerify.trim()) {
      setError("Please provide a verification token.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await verifyEmail(tokenToVerify.trim());
      setVerified(true);
      toast.success("Email verified", {
        description: "Your account is active. You can now sign in.",
      });
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification token.");
    } finally {
      setPending(false);
    }
  }

  if (verified) {
    return (
      <AuthShell
        title="Email verified"
        description="Your email address has been verified successfully."
        footer={
          <p>
            Ready to proceed?{" "}
            <Link
              to="/login"
              className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
        }
      >
        <div className="panel flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-h3">Account activated</h2>
            <p className="text-sm text-muted-foreground">
              You can now log in with your credentials and manage your changelog workspace.
            </p>
          </div>
          <Button className="w-full" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      description="Enter the verification token sent to your email to activate your account."
      footer={
        <p>
          Already verified?{" "}
          <Link
            to="/login"
            className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify(token);
        }}
        noValidate
        className="space-y-4"
      >
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="verify-token">Verification token</Label>
          <Input
            id="verify-token"
            value={token}
            placeholder="Paste your 64-character verification token"
            onChange={(e) => setToken(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Verifying…" : "Verify email"}
        </Button>
      </form>
    </AuthShell>
  );
}
