"use client";

import {
  BadgeCheck,
  Bitcoin,
  FileClock,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  LineChart,
  ListOrdered,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { AppShell, ShellLoading, type NavGroup, type NavItem } from "@/components/app/AppShell";
import { useSession } from "@/components/app/useSession";
import { SessionContext } from "@/components/app/SessionContext";

const GROUPS: NavGroup[] = [
  { items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true }] },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Verification", href: "/admin/kyc", icon: BadgeCheck },
      { label: "Support inbox", href: "/admin/support", icon: LifeBuoy },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Transactions", href: "/admin/transactions", icon: ListOrdered },
      { label: "Loans", href: "/admin/loans", icon: Landmark },
      { label: "Investments & crypto", href: "/admin/investments", icon: LineChart },
    ],
  },
  {
    label: "Controls",
    items: [
      { label: "Audit log", href: "/admin/audit", icon: FileClock },
      { label: "Team & roles", href: "/admin/roles", icon: UserCog },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const MOBILE: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutGrid, exact: true },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Loans", href: "/admin/loans", icon: Landmark },
  { label: "Inbox", href: "/admin/support", icon: LifeBuoy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = useSession({ requireAdmin: true });
  if (!session.ready || !session.user) return <ShellLoading />;

  return (
    <SessionContext.Provider value={session}>
      <AppShell
        user={session.user}
        groups={GROUPS}
        mobileNav={MOBILE}
        homeHref="/admin"
        areaLabel="Admin console"
        footerNote="Every administrative action is recorded in the audit log."
        extraMenuItems={[{ label: "Customer view", href: "/dashboard", icon: Bitcoin }]}
        onSignOut={session.signOut}
      >
        {children}
      </AppShell>
    </SessionContext.Provider>
  );
}
