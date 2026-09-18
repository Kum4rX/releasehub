import { api } from "./api/apiClient";
import type {
  Category,
  ChangelogUpdate,
  ReactionKey,
  UpdateStatus,
} from "@/data/mock";

export type { Category, ChangelogUpdate, ReactionKey, UpdateStatus };
export { updates as seedChangelog } from "@/data/mock";

export type UpdateDraft = {
  title: string;
  slug?: string;
  excerpt?: string;
  category: Category;
  status?: UpdateStatus;
  version?: string;
  coverImage?: string | null;
  content: string;
};

export type UpdateQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: Category | "all";
  status?: UpdateStatus | "all";
  sort?: "newest" | "oldest" | "reactions";
};

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function extractExcerpt(markdown: string): string {
  if (!markdown) return "";
  const plain = markdown
    .replace(/^#+\s+/gm, "")
    .replace(/[*_`~[\]]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > 140 ? `${plain.slice(0, 137)}...` : plain;
}

/**
 * Normalizes a backend changelog document to the frontend ChangelogUpdate model.
 */
export function backendToFrontendUpdate(item: any): ChangelogUpdate {
  const content = item.contentMarkdown || item.content || "";
  const reactions = item.reactions || {};

  return {
    id: item._id || item.id,
    slug: item.slug || "",
    title: item.title,
    excerpt: extractExcerpt(content),
    category: item.category as Category,
    status: (item.status || "published") as UpdateStatus,
    publishedAt: item.publishedAt
      ? new Date(item.publishedAt).toISOString()
      : null,
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString()
      : new Date().toISOString(),
    authorId:
      typeof item.author === "object" && item.author !== null
        ? item.author._id || item.author.id || "admin"
        : item.author || "admin",
    coverImage: item.coverImage || null,
    version: item.version || "v1.0",
    content,
    reactions: {
      heart: reactions.heart || 0,
      party: reactions.celebrate ?? reactions.party ?? 0,
      rocket: reactions.rocket || 0,
    },
  };
}

export function filterUpdates(
  list: ChangelogUpdate[],
  query: UpdateQuery = {}
): ChangelogUpdate[] {
  const { search = "", category = "all", status = "all", sort = "newest" } = query;
  const needle = search.trim().toLowerCase();

  const filtered = list.filter((u) => {
    if (category !== "all" && u.category !== category) return false;
    if (status !== "all" && u.status !== status) return false;
    if (!needle) return true;
    return (
      u.title.toLowerCase().includes(needle) ||
      u.excerpt.toLowerCase().includes(needle) ||
      u.content.toLowerCase().includes(needle)
    );
  });

  const stamp = (u: ChangelogUpdate) =>
    new Date(u.publishedAt ?? u.updatedAt).getTime();
  const reactionTotal = (u: ChangelogUpdate) =>
    u.reactions.heart + u.reactions.party + u.reactions.rocket;

  return [...filtered].sort((a, b) => {
    if (sort === "oldest") return stamp(a) - stamp(b);
    if (sort === "reactions") return reactionTotal(b) - reactionTotal(a);
    return stamp(b) - stamp(a);
  });
}

// ----------------------------------------------------------------------
// Public API Endpoints
// ----------------------------------------------------------------------

export async function getPublicChangelogs(
  query: UpdateQuery = {}
): Promise<PaginatedResult<ChangelogUpdate>> {
  const params = new URLSearchParams();
  if (query.page) params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));
  if (query.category && query.category !== "all") {
    params.append("category", query.category);
  }
  if (query.search) params.append("search", query.search);

  const qs = params.toString();
  const endpoint = `/changelog${qs ? `?${qs}` : ""}`;

  const res = await api.get<{
    items: any[];
    pagination: any;
  }>(endpoint);

  return {
    items: (res.items || []).map(backendToFrontendUpdate),
    pagination: res.pagination,
  };
}

export async function getPublicChangelogBySlug(
  slug: string
): Promise<{ update: ChangelogUpdate; userReactions?: Record<string, boolean> }> {
  const res = await api.get<{
    changelog: any;
    userReactions?: { heart: boolean; celebrate: boolean; rocket: boolean };
  }>(`/changelog/${slug}`);

  return {
    update: backendToFrontendUpdate(res.changelog),
    userReactions: res.userReactions
      ? {
          heart: res.userReactions.heart,
          party: res.userReactions.celebrate,
          rocket: res.userReactions.rocket,
        }
      : undefined,
  };
}

export const getChangelogBySlug = getPublicChangelogBySlug;

export async function getRelatedChangelogs(
  slug: string,
  limit = 2
): Promise<ChangelogUpdate[]> {
  try {
    const res = await api.get<{ related: any[] }>(
      `/changelog/${slug}/related?limit=${limit}`
    );
    return (res.related || []).map(backendToFrontendUpdate);
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------------
// Reactions API Endpoints
// ----------------------------------------------------------------------

export async function addReaction(
  changelogId: string,
  reaction: ReactionKey
): Promise<{ reactions: Record<ReactionKey, number> }> {
  const backendType = reaction === "party" ? "celebrate" : reaction;
  const res = await api.post<{
    reactions: { heart: number; celebrate: number; rocket: number };
  }>(`/changelog/${changelogId}/reactions`, {
    type: backendType,
  });

  return {
    reactions: {
      heart: res.reactions.heart,
      party: res.reactions.celebrate,
      rocket: res.reactions.rocket,
    },
  };
}

export async function removeReaction(
  changelogId: string,
  reaction: ReactionKey
): Promise<{ reactions: Record<ReactionKey, number> }> {
  const backendType = reaction === "party" ? "celebrate" : reaction;
  const res = await api.delete<{
    reactions: { heart: number; celebrate: number; rocket: number };
  }>(`/changelog/${changelogId}/reactions/${backendType}`);

  return {
    reactions: {
      heart: res.reactions.heart,
      party: res.reactions.celebrate,
      rocket: res.reactions.rocket,
    },
  };
}

// ----------------------------------------------------------------------
// Admin Changelog API Endpoints
// ----------------------------------------------------------------------

export async function getAdminChangelogs(
  query: UpdateQuery = {}
): Promise<PaginatedResult<ChangelogUpdate>> {
  const params = new URLSearchParams();
  if (query.page) params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));
  if (query.category && query.category !== "all") {
    params.append("category", query.category);
  }
  if (query.status && query.status !== "all") {
    params.append("status", query.status);
  }
  if (query.search) params.append("search", query.search);

  const qs = params.toString();
  const endpoint = `/changelog/admin${qs ? `?${qs}` : ""}`;

  const res = await api.get<{
    items: any[];
    pagination: any;
  }>(endpoint);

  return {
    items: (res.items || []).map(backendToFrontendUpdate),
    pagination: res.pagination,
  };
}

export async function getAdminChangelogById(
  id: string
): Promise<ChangelogUpdate> {
  const res = await api.get<{ changelog: any }>(`/changelog/admin/${id}`);
  return backendToFrontendUpdate(res.changelog);
}

export async function createAdminChangelog(
  draft: UpdateDraft
): Promise<ChangelogUpdate> {
  const res = await api.post<{ changelog: any }>("/changelog/admin", {
    title: draft.title,
    contentMarkdown: draft.content,
    category: draft.category,
    coverImage: draft.coverImage || undefined,
  });
  return backendToFrontendUpdate(res.changelog);
}

export async function updateAdminChangelog(
  id: string,
  patch: Partial<UpdateDraft>
): Promise<ChangelogUpdate> {
  const payload: any = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.content !== undefined) payload.contentMarkdown = patch.content;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.coverImage !== undefined) payload.coverImage = patch.coverImage;

  const res = await api.put<{ changelog: any }>(`/changelog/admin/${id}`, payload);
  return backendToFrontendUpdate(res.changelog);
}

export async function deleteAdminChangelog(id: string): Promise<void> {
  await api.delete(`/changelog/admin/${id}`);
}

export async function publishAdminChangelog(
  id: string
): Promise<ChangelogUpdate> {
  const res = await api.post<{ changelog: any }>(`/changelog/admin/${id}/publish`);
  return backendToFrontendUpdate(res.changelog);
}

export async function unpublishAdminChangelog(
  id: string
): Promise<ChangelogUpdate> {
  const res = await api.post<{ changelog: any }>(`/changelog/admin/${id}/unpublish`);
  return backendToFrontendUpdate(res.changelog);
}
