"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

type Notification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };

const ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  success: { icon: CircleCheck, cls: "text-success-600 bg-success-50" },
  warning: { icon: CircleAlert, cls: "text-warning-600 bg-warning-50" },
  error: { icon: CircleAlert, cls: "text-danger-600 bg-danger-50" },
  info: { icon: Info, cls: "text-info-600 bg-info-50" },
};

/** Bell with unread badge. Polls every 30s (works on serverless hosts) and toasts new arrivals. */
export function NotificationsMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(() => {
    notificationsApi.getMyNotifications().then(
      (list: Notification[]) => {
        setItems(list);
        if (seen.current) {
          const fresh = list.find((n) => !n.isRead && !seen.current!.has(n.id));
          if (fresh) setToast(fresh);
        }
        seen.current = new Set(list.map((n) => n.id));
      },
      () => {
        /* transient — try again on the next tick */
      },
    );
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("ic:refresh-notifications", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("ic:refresh-notifications", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const unread = items.filter((n) => !n.isRead).length;

  async function markAll() {
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      load();
    }
  }

  async function markOne(id: string) {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      load();
    }
  }

  return (
    <>
      <Popover.Root>
        <Popover.Trigger
          className={cn(
            "relative rounded-xl p-2.5 transition-colors",
            tone === "dark" ? "text-white/80 hover:bg-white/10" : "text-fg-muted hover:bg-surface-muted hover:text-fg",
          )}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="num absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="end" sideOffset={8} className="z-[70] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-white shadow-xl outline-none">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              )}
            </div>
            <ul className="scrollbar-thin max-h-[420px] divide-y divide-line overflow-y-auto">
              {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-fg-subtle">You&apos;re all caught up.</li>}
              {items.slice(0, 30).map((n) => {
                const { icon: Icon, cls } = ICON[n.type] || ICON.info;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => !n.isRead && markOne(n.id)}
                      className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface", !n.isRead && "bg-brand-50/40")}
                    >
                      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", cls)}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-fg">{n.title}</span>
                          {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 line-clamp-3 block text-[13px] leading-snug text-fg-muted">{n.message}</span>
                        <span className="mt-1 block text-xs text-fg-faint">{formatRelative(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {toast && (
        <div role="status" className="fixed bottom-24 right-4 z-[95] w-[min(92vw,360px)] animate-fade-up rounded-2xl bg-ink-900 p-4 text-white shadow-2xl lg:bottom-6">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 size-4 shrink-0 text-brand-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-0.5 line-clamp-3 text-[13px] text-white/75">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="rounded-md p-1 text-white/60 hover:text-white" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Ask the notifications bell to refresh now (e.g. right after a transfer). */
export function refreshNotifications() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ic:refresh-notifications"));
}
