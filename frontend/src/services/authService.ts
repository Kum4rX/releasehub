import { api } from "./api/apiClient";
import type { Author } from "@/data/mock";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  lastViewedChangelogDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Session = { user: Author; email: string };

/**
 * Transforms a backend user object into an Author representation
 * ensuring full visual compatibility with Coss UI author avatars and chips.
 */
export function userToAuthor(user: AuthUser): Author {
  const parts = user.name.trim().split(/\s+/);
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : user.name.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < user.id.length; i++) {
    hash = (hash << 5) - hash + user.id.charCodeAt(i);
    hash |= 0;
  }
  const avatarHue = Math.abs(hash) % 360;

  return {
    id: user.id,
    name: user.name,
    role: user.role === "admin" ? "Administrator" : "Member",
    initials,
    avatarHue,
  };
}

export async function signIn(email: string, password: string): Promise<Session> {
  const data = await api.post<{ user: AuthUser }>("/auth/login", {
    email: email.trim(),
    password,
  });

  const author = userToAuthor(data.user);
  return { user: author, email: data.user.email };
}

export async function signUp(
  name: string,
  email: string,
  password?: string
): Promise<{ email: string; verificationToken?: string }> {
  const data = await api.post<{
    user: AuthUser;
    verificationToken?: string;
  }>("/auth/signup", {
    name: name.trim(),
    email: email.trim(),
    password: password || "StrongPassword123!",
  });

  return {
    email: data.user.email,
    verificationToken: data.verificationToken,
  };
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post("/auth/verify-email", { token });
}

export async function getMe(): Promise<Session | null> {
  try {
    const data = await api.get<{ user: AuthUser }>("/auth/me");
    if (!data || !data.user) return null;
    return {
      user: userToAuthor(data.user),
      email: data.user.email,
    };
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Silently proceed with client session cleanup
  }
}

export async function requestPasswordReset(
  email: string
): Promise<{ email: string; resetToken?: string }> {
  const res = await api.post<{ message: string; resetToken?: string }>(
    "/auth/forgot-password",
    { email: email.trim() }
  );
  return { email, resetToken: res?.resetToken };
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ ok: true }> {
  await api.post("/auth/reset-password", {
    token: token.trim(),
    password,
  });
  return { ok: true };
}
