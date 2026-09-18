import { Link } from "@tanstack/react-router";
import { Menu, Rss } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { SearchTrigger } from "@/components/search/command-palette";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReleaseStore } from "@/store/release-store";

const nav = [
  { label: "Updates", to: "/updates" as const },
  { label: "Categories", to: "/updates" as const, search: { category: "new" as const } },
] as const;

function ProfileMenu() {
  const { session } = useReleaseStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Profile menu">
          <Avatar className="size-6 border border-border">
            <AvatarFallback className="text-[0.625rem] font-semibold">
              {session?.user.initials ?? "GU"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{session?.user.name ?? "Guest"}</span>
          <span className="block text-caption text-muted-foreground">
            {session ? "Signed in (demo)" : "Not signed in"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin">Admin dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/admin/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login">Sign in</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="focus-ring rounded-sm" aria-label="ReleaseHub home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="focus-ring rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchTrigger className="hidden sm:inline-flex" />
          <NotificationCenter />
          <ThemeToggle />
          <div className="hidden sm:block">
            <ProfileMenu />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription>Product updates for ReleaseHub</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col p-3">
                {[
                  { label: "Updates", to: "/updates" as const },
                  { label: "Admin dashboard", to: "/admin" as const },
                  { label: "Sign in", to: "/login" as const },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="focus-ring rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-caption text-muted-foreground">
            ReleaseHub is a product changelog platform. This is an interactive frontend demo with
            sample data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/updates" className="focus-ring rounded-sm hover:text-foreground">
            Product updates
          </Link>
          <Link to="/admin" className="focus-ring rounded-sm hover:text-foreground">
            Admin demo
          </Link>
          <Link to="/login" className="focus-ring rounded-sm hover:text-foreground">
            Sign in
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <Rss className="size-3.5" /> Public feed
          </span>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
