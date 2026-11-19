"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { authApi, goToLogin } from "@/lib/api";
import { cacheUser, isAdmin, type SessionUser } from "@/lib/session";

const CACHE_KEY = "ic.user";
const listeners = new Set<() => void>();

function readCache(): string | null {
  try {
    return sessionStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function writeCache(user: SessionUser | null) {
  cacheUser(user);
  listeners.forEach((l) => l());
}

/**
 * The signed-in user. Paints instantly from the session cache, then confirms
 * with the API. Unauthenticated visitors are sent to /login; `requireAdmin`
 * pages send non-admins to the customer dashboard.
 */
export function useSession({ requireAdmin = false }: { requireAdmin?: boolean } = {}) {
  const raw = useSyncExternalStore(subscribe, readCache, () => null);
  const cached = useMemo<SessionUser | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }, [raw]);

  useEffect(() => {
    let alive = true;
    authApi.me().then(
      (res) => {
        if (!alive) return;
        const u = res.user as SessionUser;
        if (requireAdmin && !isAdmin(u)) {
          window.location.replace("/dashboard");
          return;
        }
        writeCache(u);
      },
      () => {
        if (alive) goToLogin();
      },
    );
    return () => {
      alive = false;
    };
  }, [requireAdmin]);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* cookies are cleared server-side even if this request fails */
    }
    writeCache(null);
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback(
    (patch: Partial<SessionUser>) => {
      if (cached) writeCache({ ...cached, ...patch });
    },
    [cached],
  );

  const allowed = !!cached && (!requireAdmin || isAdmin(cached));
  return { user: allowed ? cached : null, ready: allowed, signOut, updateUser };
}
