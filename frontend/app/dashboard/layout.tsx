"use client";

import {
  ArrowLeftRight,
  Bitcoin,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  ListOrdered,
  Receipt,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { AppShell, ShellLoading, type NavGroup, type NavItem } from "@/components/app/AppShell";
import { useSession } from "@/components/app/useSession";
import { isAdmin } from "@/lib/session";
import { SessionContext } from "@/components/app/SessionContext";

const GROUPS: NavGroup[] = [
  { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true }] },
  {
    label: "Money",
    items: [
      { label: "Transfers", href: "/dashboard/transfer", icon: ArrowLeftRight },
      { label: "Bill payments", href: "/dashboard/bills", icon: Receipt },
      { label: "Transactions", href: "/dashboard/transactions", icon: ListOrdered },
      { label: "Statements", href: "/dashboard/statements", icon: FileText },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "Investments", href: "/dashboard/investments", icon: LineChart },
      { label: "Crypto", href: "/dashboard/crypto", icon: Bitcoin },
      { label: "Wallets", href: "/dashboard/wallets", icon: Wallet },
      { label: "Loans", href: "/dashboard/loans", icon: Landmark },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const MOBILE: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home, exact: true },
  { label: "Transfer", href: "/dashboard/transfer", icon: ArrowLeftRight },
  { label: "Activity", href: "/dashboard/transactions", icon: ListOrdered },
  { label: "Crypto", href: "/dashboard/crypto", icon: Bitcoin },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (!session.ready || !session.user) return <ShellLoading />;

  const groups = isAdmin(session.user)
    ? [...GROUPS, { label: "Staff", items: [{ label: "Admin console", href: "/admin", icon: ShieldCheck }] }]
    : GROUPS;

  return (
    <SessionContext.Provider value={session}>
      <AppShell
        user={session.user}
        groups={groups}
        mobileNav={MOBILE}
        homeHref="/dashboard"
        footerNote="Demo platform. Balances and transactions are simulated."
        extraMenuItems={isAdmin(session.user) ? [{ label: "Admin console", href: "/admin", icon: ShieldCheck }] : undefined}
        onSignOut={session.signOut}
      >
        {children}
      </AppShell>
    </SessionContext.Provider>
  );
}
