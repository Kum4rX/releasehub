import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  authors as seedAuthors,
  currentAdmin,
  type Author,
  type ChangelogUpdate,
  type Notification,
  type ReactionKey,
} from "@/data/mock";
import {
  getPublicChangelogs,
  getAdminChangelogs,
  createAdminChangelog,
  updateAdminChangelog,
  deleteAdminChangelog,
  publishAdminChangelog,
  unpublishAdminChangelog,
  addReaction,
  removeReaction,
  type UpdateDraft,
} from "@/services/changelogService";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/services/notificationService";
import { getMe, signOut as authSignOut } from "@/services/authService";

export type AuthUserSession = {
  user: Author & { roleRaw?: "user" | "admin" };
};

type ReleaseStore = {
  updates: ChangelogUpdate[];
  notifications: Notification[];
  authors: Author[];
  unreadCount: number;
  reacted: Record<string, ReactionKey[]>;
  session: AuthUserSession | null;
  loading: boolean;
  authorById: (id: string) => Author;
  getById: (id: string) => ChangelogUpdate | undefined;
  getBySlug: (slug: string) => ChangelogUpdate | undefined;
  createUpdate: (draft: UpdateDraft) => Promise<ChangelogUpdate>;
  saveUpdate: (id: string, patch: Partial<UpdateDraft>) => Promise<void>;
  publish: (id: string) => Promise<void>;
  unpublish: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  toggleReaction: (id: string, reaction: ReactionKey) => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => void;
  signIn: (user?: Author) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUpdates: () => Promise<void>;
};

const StoreContext = createContext<ReleaseStore | null>(null);

export function ReleaseStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [updates, setUpdates] = useState<ChangelogUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [reacted, setReacted] = useState<Record<string, ReactionKey[]>>({});
  const [session, setSession] = useState<AuthUserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check current session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const currentSession = await getMe();
        if (mounted && currentSession) {
          const roleRaw =
            currentSession.user.role === "Administrator" ? "admin" : "user";
          setSession({
            user: { ...currentSession.user, roleRaw },
          });
        }
      } catch {
        // Not authenticated
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch updates (admin vs public)
  const refreshUpdates = useCallback(async () => {
    try {
      if (session?.user?.roleRaw === "admin") {
        const res = await getAdminChangelogs({ limit: 50 });
        setUpdates(res.items);
      } else {
        const res = await getPublicChangelogs({ limit: 50 });
        setUpdates(res.items);
      }
    } catch {
      // If error or unauthenticated, fallback to public feed
      try {
        const res = await getPublicChangelogs({ limit: 50 });
        setUpdates(res.items);
      } catch {
        // Network or initial offline state
      }
    }
  }, [session]);

  useEffect(() => {
    refreshUpdates();
  }, [refreshUpdates]);

  // Fetch notifications for authenticated users
  useEffect(() => {
    if (!session) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await getNotifications();
        if (mounted) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // Notifications unavailable
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  const authorById = useCallback(
    (id: string) => {
      if (session?.user && (session.user.id === id || id === "admin")) {
        return session.user;
      }
      return (
        seedAuthors.find((a) => a.id === id) ?? {
          id,
          name: "ReleaseHub Team",
          role: "Product Team",
          initials: "RH",
          avatarHue: 48,
        }
      );
    },
    [session]
  );

  const getById = useCallback(
    (id: string) => updates.find((u) => u.id === id),
    [updates]
  );

  const getBySlug = useCallback(
    (slug: string) => updates.find((u) => u.slug === slug),
    [updates]
  );

  const createUpdate = useCallback(
    async (draft: UpdateDraft) => {
      const record = await createAdminChangelog(draft);
      if (draft.status === "published") {
        const publishedRecord = await publishAdminChangelog(record.id);
        setUpdates((prev) => [publishedRecord, ...prev]);
        return publishedRecord;
      }
      setUpdates((prev) => [record, ...prev]);
      return record;
    },
    []
  );

  const saveUpdate = useCallback(
    async (id: string, patch: Partial<UpdateDraft>) => {
      const updated = await updateAdminChangelog(id, patch);
      if (patch.status === "published" && updated.status !== "published") {
        const published = await publishAdminChangelog(id);
        setUpdates((prev) => prev.map((u) => (u.id === id ? published : u)));
        return;
      }
      setUpdates((prev) => prev.map((u) => (u.id === id ? updated : u)));
    },
    []
  );

  const publish = useCallback(async (id: string) => {
    const published = await publishAdminChangelog(id);
    setUpdates((prev) => prev.map((u) => (u.id === id ? published : u)));
  }, []);

  const unpublish = useCallback(async (id: string) => {
    const unpublished = await unpublishAdminChangelog(id);
    setUpdates((prev) => prev.map((u) => (u.id === id ? unpublished : u)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAdminChangelog(id);
    setUpdates((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const duplicate = useCallback(
    async (id: string) => {
      const source = updates.find((u) => u.id === id);
      if (!source) return;
      const copy = await createAdminChangelog({
        title: `${source.title} (Copy)`,
        content: source.content,
        category: source.category,
        coverImage: source.coverImage,
      });
      setUpdates((prev) => [copy, ...prev]);
    },
    [updates]
  );

  const toggleReaction = useCallback(
    async (id: string, reaction: ReactionKey) => {
      if (!session) {
        toast.error("Sign in required", {
          description: "Please sign in to react to product updates.",
        });
        return;
      }

      const mine = reacted[id] ?? [];
      const hasReacted = mine.includes(reaction);

      try {
        if (hasReacted) {
          const res = await removeReaction(id, reaction);
          setReacted((prev) => ({
            ...prev,
            [id]: (prev[id] ?? []).filter((r) => r !== reaction),
          }));
          setUpdates((prev) =>
            prev.map((u) =>
              u.id === id
                ? {
                    ...u,
                    reactions: {
                      ...u.reactions,
                      [reaction]: res.reactions[reaction],
                    },
                  }
                : u
            )
          );
        } else {
          const res = await addReaction(id, reaction);
          setReacted((prev) => ({
            ...prev,
            [id]: [...(prev[id] ?? []), reaction],
          }));
          setUpdates((prev) =>
            prev.map((u) =>
              u.id === id
                ? {
                    ...u,
                    reactions: {
                      ...u.reactions,
                      [reaction]: res.reactions[reaction],
                    },
                  }
                : u
            )
          );
        }
      } catch (err: any) {
        toast.error("Could not update reaction", {
          description: err.message || "Please try again later.",
        });
      }
    },
    [session, reacted]
  );

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Error marking read
    }
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const signIn = useCallback(
    async (user?: Author) => {
      try {
        const me = await getMe();
        if (me) {
          const roleRaw = me.user.role === "Administrator" ? "admin" : "user";
          setSession({ user: { ...me.user, roleRaw } });
          refreshUpdates();
          return;
        }
      } catch {
        // Fallback to passed user
      }
      const author = user ?? currentAdmin;
      const roleRaw = author.role === "Administrator" ? "admin" : "user";
      setSession({ user: { ...author, roleRaw } });
      refreshUpdates();
    },
    [refreshUpdates]
  );

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setNotifications([]);
    setUnreadCount(0);
    refreshUpdates();
  }, [refreshUpdates]);

  const value = useMemo<ReleaseStore>(
    () => ({
      updates,
      notifications,
      authors: seedAuthors,
      unreadCount,
      reacted,
      session,
      loading,
      authorById,
      getById,
      getBySlug,
      createUpdate,
      saveUpdate,
      publish,
      unpublish,
      remove,
      duplicate,
      toggleReaction,
      markAllRead,
      markRead,
      signIn,
      signOut,
      refreshUpdates,
    }),
    [
      updates,
      notifications,
      unreadCount,
      reacted,
      session,
      loading,
      authorById,
      getById,
      getBySlug,
      createUpdate,
      saveUpdate,
      publish,
      unpublish,
      remove,
      duplicate,
      toggleReaction,
      markAllRead,
      markRead,
      signIn,
      signOut,
      refreshUpdates,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useReleaseStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error(
      "useReleaseStore must be used inside ReleaseStoreProvider"
    );
  }
  return ctx;
}
