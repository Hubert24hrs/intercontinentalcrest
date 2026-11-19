"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Bitcoin, Landmark, LifeBuoy, LineChart, Users, Wallet } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatMoney, formatRelative, TX_TYPE_LABEL } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/misc";
import { useSessionContext } from "@/components/app/SessionContext";

export default function AdminOverview() {
  const { user } = useSessionContext();
  const { data, loading, error } = useAsync(() => adminApi.getStats());
  const s = data?.stats;

  const queues = [
    { label: "Loan applications", value: s?.pendingLoans, href: "/admin/loans", icon: Landmark },
    { label: "Identity verifications", value: s?.pendingKyc, href: "/admin/kyc", icon: BadgeCheck },
    { label: "Open support chats", value: s?.openSupport, href: "/admin/support", icon: LifeBuoy },
  ];

  return (
    <div>
      <PageHeader eyebrow="Admin console" title={`Welcome back, ${user?.fullName?.split(" ")[0] || "admin"}`} description="Today's activity across the platform." />

      {error && <p className="mb-4 text-sm text-danger-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={loading ? "…" : s?.totalUsers?.toLocaleString()} sub={s ? `${s.activeUsers} active · ${s.suspendedUsers} suspended` : undefined} icon={<Users className="size-4" />} tone="ink" />
        <StatCard label="Deposits held" value={loading ? "…" : formatMoney(s?.totalDeposits, { compact: true })} sub="Sum of all account balances" icon={<Wallet className="size-4" />} tone="brand" />
        <StatCard label="Active loans" value={loading ? "…" : s?.activeLoans} sub={s ? `${s.pendingLoans} awaiting review` : undefined} icon={<Landmark className="size-4" />} tone="gold" />
        <StatCard label="Invested" value={loading ? "…" : formatMoney(s?.totalInvestments, { compact: true })} sub={s ? `${s.totalCryptoOrders} crypto orders` : undefined} icon={<LineChart className="size-4" />} tone="success" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {queues.map((q) => (
          <Link key={q.label} href={q.href} className="card card-hover flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-muted text-fg-muted">
              <q.icon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-fg-subtle">{q.label}</p>
              <p className="num text-xl font-semibold">{loading ? "…" : (q.value ?? 0)}</p>
            </div>
            <ArrowRight className="size-4 text-fg-faint" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader
            title="Newest customers"
            action={
              <Link href="/admin/customers" className="text-sm font-medium text-brand-700 hover:underline">
                All customers
              </Link>
            }
          />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {loading && [0, 1, 2].map((i) => <li key={i} className="px-6 py-4"><Skeleton className="h-6" /></li>)}
            {data?.recentUsers?.map((u: any) => (
              <li key={u.id}>
                <Link href={`/admin/customers?id=${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface sm:px-6">
                  <Avatar name={u.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.fullName}</p>
                    <p className="truncate text-xs text-fg-subtle">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={u.status} />
                    <p className="mt-1 text-xs text-fg-faint">{formatRelative(u.createdAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Latest transactions"
            action={
              <Link href="/admin/transactions" className="text-sm font-medium text-brand-700 hover:underline">
                Monitor
              </Link>
            }
          />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {loading && [0, 1, 2].map((i) => <li key={i} className="px-6 py-4"><Skeleton className="h-6" /></li>)}
            {!loading && !data?.recentTransactions?.length && <EmptyState icon={<Bitcoin className="size-5" />} title="No transactions yet" />}
            {data?.recentTransactions?.map((t: any) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description || TX_TYPE_LABEL[t.type] || t.type}</p>
                  <p className="truncate text-xs text-fg-subtle">
                    {t.senderAccount?.user?.fullName || "External"} → {t.receiverAccount?.user?.fullName || "External"} · {formatRelative(t.createdAt)}
                  </p>
                </div>
                <p className="num text-sm font-semibold">{formatMoney(t.amount)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
