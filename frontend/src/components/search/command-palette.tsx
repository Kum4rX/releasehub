import { useNavigate } from "@tanstack/react-router";
import { FileText, LayoutDashboard, PenLine, Search, Settings, Sparkles } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { categoryMeta } from "@/data/mock";
import { useReleaseStore } from "@/store/release-store";

type CommandContextValue = { open: () => void };
const CommandContext = createContext<CommandContextValue>({ open: () => {} });

export function useCommandPalette() {
  return useContext(CommandContext);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { updates } = useReleaseStore();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (typeof event.key === "string" && event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open: () => setOpen(true) }), []);

  const go = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    [],
  );

  const published = updates.filter((u) => u.status === "published").slice(0, 8);

  return (
    <CommandContext.Provider value={value}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search ReleaseHub"
        description="Search updates, pages and admin actions"
      >
        <CommandInput placeholder="Search updates, pages, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Product updates">
            {published.map((update) => (
              <CommandItem
                key={update.id}
                value={`${update.title} ${update.excerpt} ${update.category}`}
                onSelect={() =>
                  go(() => navigate({ to: "/updates/$slug", params: { slug: update.slug } }))
                }
              >
                <Sparkles className="size-4 text-muted-foreground" />
                <span className="truncate">{update.title}</span>
                <CommandShortcut>{categoryMeta[update.category].label}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Pages">
            <CommandItem value="product updates changelog" onSelect={() => go(() => navigate({ to: "/updates" }))}>
              <FileText className="size-4 text-muted-foreground" />
              Product updates
            </CommandItem>
            <CommandItem value="home landing" onSelect={() => go(() => navigate({ to: "/" }))}>
              <Search className="size-4 text-muted-foreground" />
              Home
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Admin actions">
            <CommandItem value="admin overview dashboard" onSelect={() => go(() => navigate({ to: "/admin" }))}>
              <LayoutDashboard className="size-4 text-muted-foreground" />
              Open admin overview
            </CommandItem>
            <CommandItem
              value="create new update"
              onSelect={() => go(() => navigate({ to: "/admin/updates/new" }))}
            >
              <PenLine className="size-4 text-muted-foreground" />
              Create product update
            </CommandItem>
            <CommandItem value="settings appearance" onSelect={() => go(() => navigate({ to: "/admin/settings" }))}>
              <Settings className="size-4 text-muted-foreground" />
              Workspace settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandContext.Provider>
  );
}

export function SearchTrigger({ className }: { className?: string }) {
  const { open } = useCommandPalette();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <button
      type="button"
      onClick={open}
      className={
        "focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground " +
        (className ?? "")
      }
      aria-label="Open search"
    >
      <Search className="size-3.5" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.625rem] sm:inline">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
