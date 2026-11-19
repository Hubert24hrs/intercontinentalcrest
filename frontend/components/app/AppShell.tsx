"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Menu, Settings, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DemoPill } from "@/components/brand/DemoNotice";
import { Avatar } from "@/components/ui/misc";
import { NotificationsMenu } from "./NotificationsMenu";
import { cn } from "@/lib/cn";
import type { SessionUser } from "@/lib/session";

export type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean; badge?: React.ReactNode };
export type NavGroup = { label?: string; items: NavItem[] };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

function SidebarNav({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-6" aria-label="Primary">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                      active ? "bg-white/[0.09] text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand-400" aria-hidden />}
                    <item.icon className={cn("size-[18px] shrink-0", active ? "text-brand-300" : "text-white/45 group-hover:text-white/80")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  user,
  groups,
  mobileNav,
  homeHref,
  areaLabel,
  footerNote,
  extraMenuItems,
  onSignOut,
  children,
}: {
  user: SessionUser | null;
  groups: NavGroup[];
  mobileNav: NavItem[];
  homeHref: string;
  areaLabel?: string;
  footerNote?: React.ReactNode;
  extraMenuItems?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pb-6 pt-6">
        <Logo tone="light" href={homeHref} />
      </div>
      <div className="flex items-center gap-2 px-5 pb-5">
        <DemoPill />
        {areaLabel && <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{areaLabel}</span>}
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6">
        <SidebarNav groups={groups} pathname={pathname} onNavigate={() => setDrawer(false)} />
      </div>
      {footerNote && <div className="border-t border-white/10 px-5 py-4 text-[11.5px] leading-relaxed text-white/45">{footerNote}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] bg-ink-900 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] animate-fade-up bg-ink-900 shadow-2xl">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-5 rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)} className="-ml-2 rounded-lg p-2 text-fg lg:hidden" aria-label="Open menu">
                <Menu className="size-6" />
              </button>
              <span className="lg:hidden">
                <Logo href={homeHref} compact />
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationsMenu />
              <DropdownMenu.Root>
                <DropdownMenu.Trigger className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-surface-muted" aria-label="Account menu">
                  <Avatar name={user?.fullName} />
                  <span className="hidden max-w-[160px] truncate text-sm font-medium text-fg sm:block">{user?.fullName || "…"}</span>
                  <ChevronDown className="hidden size-4 text-fg-subtle sm:block" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={8} className="z-[70] w-64 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-semibold">{user?.fullName}</p>
                      <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
                    </div>
                    <DropdownMenu.Separator className="my-1 h-px bg-line" />
                    {extraMenuItems?.map((m) => (
                      <DropdownMenu.Item key={m.href} asChild>
                        <Link href={m.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface">
                          <m.icon className="size-4 text-fg-subtle" /> {m.label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Item asChild>
                      <Link href={homeHref === "/admin" ? "/admin/settings" : "/dashboard/settings"} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface">
                        <Settings className="size-4 text-fg-subtle" /> Settings
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-line" />
                    <DropdownMenu.Item
                      onSelect={onSignOut}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger-600 outline-none data-[highlighted]:bg-danger-50"
                    >
                      <LogOut className="size-4" /> Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </header>

        <main id="main" className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-[1240px]">{children}</div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Quick">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${mobileNav.length + 1}, minmax(0, 1fr))` }}>
          {mobileNav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDrawer(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-brand-700" : "text-fg-subtle")}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setDrawer(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-fg-subtle">
              <Menu className="size-5" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export function ShellLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-pulse rounded-2xl bg-ink-900" />
        <p className="text-sm text-fg-subtle">Loading your account…</p>
      </div>
    </div>
  );
}
