import { api } from "./api/apiClient";

export interface AdminInsightsData {
  changelogs: {
    total: number;
    published: number;
    draft: number;
  };
  reactions: {
    total: number;
    byType: {
      heart: number;
      celebrate: number;
      rocket: number;
    };
  };
  users: {
    total: number;
    verified: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    publishedAt: string | null;
    reactions: {
      heart: number;
      celebrate: number;
      rocket: number;
      total: number;
    };
  }>;
}

export async function getAdminInsights(): Promise<AdminInsightsData> {
  const res = await api.get<AdminInsightsData>("/admin/insights");
  return res;
}
