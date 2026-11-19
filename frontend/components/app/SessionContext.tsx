"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/session";

type SessionValue = {
  user: SessionUser | null;
  ready: boolean;
  signOut: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
};

export const SessionContext = createContext<SessionValue>({
  user: null,
  ready: false,
  signOut: () => {},
  updateUser: () => {},
});

export function useSessionContext() {
  return useContext(SessionContext);
}
