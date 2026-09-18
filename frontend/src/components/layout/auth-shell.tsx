import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_28rem]">
      {/* Editorial side panel */}
      <aside className="relative hidden flex-col justify-between border-r border-border bg-surface px-10 py-8 lg:flex">
        <div className="hairline-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <Link to="/" className="focus-ring relative rounded-sm" aria-label="ReleaseHub home">
          <Logo />
        </Link>
        <div className="relative max-w-md space-y-5">
          <p className="text-label text-accent">Changelog platform</p>
          <p className="text-h1">Ship updates. Keep customers in the loop.</p>
          <p className="text-body text-muted-foreground">
            ReleaseHub gives every release a home: a public timeline, a What&apos;s new panel and a
            feed your product can read.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["Markdown-native editor", "Draft and publish workflow", "Reactions and unread counts"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <p className="relative text-caption text-muted-foreground">
          Interactive demo — no real accounts are created.
        </p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="focus-ring rounded-sm" aria-label="ReleaseHub home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="hidden justify-end lg:flex">
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="space-y-1.5">
            <h1 className="text-h2">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
