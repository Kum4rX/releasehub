import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/services/authService";
import { useReleaseStore } from "@/store/release-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ReleaseHub" },
      { name: "description", content: "Sign in to the ReleaseHub admin workspace demo." },
      { property: "og:title", content: "Sign in — ReleaseHub" },
      { property: "og:description", content: "Sign in to the ReleaseHub admin workspace demo." },
    ],
  }),
  component: LoginPage,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const { signIn: startSession } = useReleaseStore();
  const [email, setEmail] = useState("aria@releasehub.dev");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const sess = await signIn(email.trim(), password);
      await startSession(sess.user);
      toast.success("Signed in", { description: "Welcome back to ReleaseHub." });
      navigate({ to: "/admin" });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Sign in failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use any email with an 8+ character password. Type “wrongpassword” to see the error state."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="focus-ring rounded-sm font-medium text-accent underline-offset-4 hover:underline">
            Create one
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
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email ? (
            <p id="login-email-error" className="text-caption text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link
              to="/forgot-password"
              className="focus-ring rounded-sm text-caption text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password ? (
            <p id="login-password-error" className="text-caption text-destructive">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="login-remember"
            checked={remember}
            onCheckedChange={(value) => setRemember(value === true)}
          />
          <Label htmlFor="login-remember" className="text-sm font-normal text-muted-foreground">
            Remember me on this device
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
