import { api } from "./api/apiClient";
import { backendToFrontendUpdate } from "./changelogService";
import type { ChangelogUpdate, Notification } from "@/data/mock";

export interface WhatsNewData {
  unreadCount: number;
  lastViewedAt: string | null;
  notifications: Notification[];
  updates: ChangelogUpdate[];
}

export async function getNotifications(): Promise<WhatsNewData> {
  const res = await api.get<{
    unreadCount: number;
    lastViewedAt: string | null;
    updates: any[];
  }>("/notifications");

  const updates: ChangelogUpdate[] = (res.updates || []).map(backendToFrontendUpdate);
  const notifications: Notification[] = (res.updates || []).map((u: any) => ({
    id: `notif_${u.id || u._id}`,
    updateId: u.id || u._id,
    createdAt: u.publishedAt
      ? new Date(u.publishedAt).toISOString()
      : new Date().toISOString(),
    read: !u.isUnread,
  }));

  return {
    unreadCount: res.unreadCount ?? 0,
    lastViewedAt: res.lastViewedAt,
    notifications,
    updates,
  };
}

export async function markAllNotificationsRead(): Promise<{
  readAt: string;
  unreadCount: number;
}> {
  const res = await api.post<{
    readAt: string;
    unreadCount: number;
  }>("/notifications/read");

  return {
    readAt: res.readAt,
    unreadCount: res.unreadCount,
  };
}
