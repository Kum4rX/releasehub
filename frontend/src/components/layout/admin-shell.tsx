import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  FileEdit,
  HelpCircle,
  LayoutDashboard,
  List,
  Menu,
  PenLine,
  Send,
  Settings,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { SearchTrigger } from "@/components/search/command-palette";
import { AuthorAvatar } from "@/components/changelog/author-chip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { currentAdmin } from "@/data/mock";
import { useReleaseStore } from "@/store/release-store";

const navItems = [
  { label: "Overview", to: "/admin" as const, icon: LayoutDashboard, exact: true },
  { label: "Updates", to: "/admin/updates" as const, icon: List, exact: true },
  { label: "Create update", to: "/admin/updates/new" as const, icon: PenLine, exact: true },
  { label: "Drafts", to: "/admin/drafts" as const, icon: FileEdit, exact: true },
  { label: "Published", to: "/admin/published" as const, icon: Send, exact: true },
  { label: "Insights", to: "/admin/insights" as const, icon: BarChart3, exact: true },
  { label: "Settings", to: "/admin/settings" as const, icon: Settings, exact: true },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {navItems.map(({ label, to, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          }}
          className="focus-ring flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { session, signOut } = useReleaseStore();
  const navigate = useNavigate();
  const user = session?.user ?? currentAdmin;

  return (
    <div className="space-y-2 border-t border-sidebar-border pt-3">
      <Link
        to="/updates"
        className="focus-ring flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
      >
        <HelpCircle className="size-4" aria-hidden="true" />
        Help &amp; public page
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus-ring flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent/70"
          >
            <AuthorAvatar author={user} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-caption text-muted-foreground">{user.role}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="font-normal text-caption text-muted-foreground">
            Demo account
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/admin/settings">Profile &amp; settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              signOut();
              navigate({ to: "/login" });
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        <div className="space-y-6">
          <Link to="/" className="focus-ring block rounded-sm px-1.5" aria-label="ReleaseHub home">
            <Logo />
          </Link>
          <SidebarNav />
        </div>
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col justify-between p-4">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription>Admin workspace</SheetDescription>
              </SheetHeader>
              <div className="flex-1 pt-4">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </div>
              <SidebarFooter />
            </SheetContent>
          </Sheet>

          <span className="text-sm font-medium lg:hidden">
            <Logo withWordmark={false} />
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <SearchTrigger />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild aria-label="View public changelog">
                  <Link to="/updates">
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Public changelog</TooltipContent>
            </Tooltip>
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
