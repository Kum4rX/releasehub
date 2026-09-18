import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";

import { CategoryBadge } from "@/components/changelog/category-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useReleaseStore } from "@/store/release-store";

export function NotificationCenter() {
  const { notifications, unreadCount, getById, markAllRead, markRead } = useReleaseStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(timer);
  }, [open]);

  const items = notifications
    .map((n) => ({ notification: n, update: getById(n.updateId) }))
    .filter((entry) => entry.update !== undefined);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`What's new — ${unreadCount} unread updates`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.625rem] leading-4 font-semibold text-accent-foreground">
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border px-5 py-4">
          <SheetTitle className="text-h3">What&apos;s new</SheetTitle>
          <SheetDescription>Latest product updates</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 p-5" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-h3">You&apos;re all caught up</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New product updates will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(({ notification, update }) => (
                <li key={notification.id}>
                  <Link
                    to="/updates/$slug"
                    params={{ slug: update!.slug }}
                    onClick={() => {
                      markRead(notification.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "focus-ring flex gap-3 px-5 py-4 transition-colors hover:bg-surface",
                      !notification.read && "bg-accent/[0.04]",
                    )}
                  >
                    <span className="pt-1.5">
                      <span
                        className={cn(
                          "block size-1.5 rounded-full",
                          notification.read ? "bg-transparent" : "bg-accent",
                        )}
                        aria-hidden="true"
                      />
                      <span className="sr-only">{notification.read ? "Read" : "Unread"}</span>
                    </span>
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <CategoryBadge category={update!.category} withDot={false} />
                      <span
                        className={cn(
                          "block text-sm",
                          notification.read
                            ? "text-muted-foreground"
                            : "font-medium text-foreground",
                        )}
                      >
                        {update!.title}
                      </span>
                      <span className="block text-caption text-muted-foreground">
                        {formatRelative(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-between border-t border-border px-5 py-3">
          <span className="text-caption text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "No unread updates"}
          </span>
          <Button size="sm" variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <Check className="size-3.5" /> Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
