import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/services/authService";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — ReleaseHub" },
      { name: "description", content: "Create a ReleaseHub demo account to publish product updates." },
      { property: "og:title", content: "Create account — ReleaseHub" },
      {
        property: "og:description",
        content: "Create a ReleaseHub demo account to publish product updates.",
      },
    ],
  }),
  component: SignupPage,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { name?: string; email?: string; password?: string; confirm?: string; form?: string };

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const result = await signUp(name.trim(), email.trim(), password);
      setSentTo(result.email);
      if (result.verificationToken) {
        setVerificationToken(result.verificationToken);
      }
      toast.success("Account created", { description: "Verify your account to continue." });
    } catch (err: any) {
      setErrors({ form: err?.message || "Failed to create account." });
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Check your email"
        description={`We created an account for ${sentTo}. Follow the link to activate your workspace.`}
        footer={
          <p>
            Already verified?{" "}
            <Link to="/login" className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <div className="panel flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="grid size-10 place-items-center rounded-full border border-border bg-surface text-accent">
            <MailCheck className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Verification link generated</p>
            <p className="text-caption text-muted-foreground">
              In this environment, email delivery is simulated. Click below to verify your account immediately.
            </p>
          </div>
          {verificationToken ? (
            <Button size="sm" asChild>
              <Link to="/verify-email" search={{ token: verificationToken }}>
                Verify account now
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your workspace"
      description="Sign up to publish updates and manage your product changelog."
      footer={
        <p>
          Already have an account?{" "}
          <Link to="/login" className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline">
            Sign in
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
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            autoComplete="name"
            value={name}
            aria-invalid={!!errors.name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name ? <p className="text-caption text-destructive">{errors.name}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Work email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={!!errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email ? <p className="text-caption text-destructive">{errors.email}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
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
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            aria-invalid={!!errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {errors.confirm ? <p className="text-caption text-destructive">{errors.confirm}</p> : null}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
