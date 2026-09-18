import { api } from "./api/apiClient";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  lastViewedChangelogDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await api.get<{ profile: UserProfile }>("/users/me");
  return res.profile;
}

export async function updateUserProfile(data: {
  name: string;
}): Promise<UserProfile> {
  const res = await api.patch<{ profile: UserProfile }>("/users/me", data);
  return res.profile;
}
