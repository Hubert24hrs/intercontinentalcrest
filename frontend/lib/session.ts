"use client";

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string;
};

const KEY = "ic.user";

export const ADMIN_ROLES = ["admin", "super_admin"];
export const isAdmin = (u?: { role?: string } | null) => !!u && ADMIN_ROLES.includes(u.role || "");

/** Non-sensitive profile cache so the shell can paint instantly; the session itself lives in httpOnly cookies. */
export function cacheUser(user: SessionUser | null) {
  try {
    if (user) sessionStorage.setItem(KEY, JSON.stringify(user));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function cachedUser(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}

export function landingFor(user: { role?: string } | null | undefined, next?: string | null): string {
  const target = safeNext(next);
  if (isAdmin(user)) return target && target.startsWith("/admin") ? target : "/admin";
  if (target && !target.startsWith("/admin")) return target;
  return "/dashboard";
}
