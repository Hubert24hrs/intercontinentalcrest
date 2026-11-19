"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeftRight,
  ArrowRight,
  Bitcoin,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  LineChart,
  Receipt,
  Snowflake,
  Users,
  Wallet,
} from "lucide-react";
import { accountsApi, cryptoApi, investmentsApi, transactionsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatMoney, formatPercent, formatPrice, toNumber, TX_TYPE_LABEL } from "@/lib/format";
import { useSessionContext } from "@/components/app/SessionContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { TxRow, type Tx } from "@/components/app/TxRow";
import { cn } from "@/lib/cn";

const PIE_COLORS = ["#0e7c74", "#0b1f33", "#c79a45", "#45b5aa", "#2a5680", "#98a2b3", "#7bd0c6"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="rounded-md p-1 text-fg-faint hover:bg-surface-muted hover:text-fg"
      aria-label="Copy account number"
    >
      {done ? <Check className="size-3.5 text-success-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export default function OverviewPage() {
  const { user } = useSessionContext();
  const [hidden, setHidden] = useState(false);

  const { data, loading } = useAsync(async () => {
    const [accounts, txs, investments, portfolio, markets] = await Promise.allSettled([
      accountsApi.getAccounts(),
      transactionsApi.getTransactions({ limit: 200 }),
      investmentsApi.getMyInvestments(),
      cryptoApi.getPortfolio(),
      cryptoApi.getMarkets(),
    ]);
    return {
      accounts: accounts.status === "fulfilled" ? (accounts.value as any[]) : [],
      txs: txs.status === "fulfilled" ? ((txs.value as any).transactions as Tx[]) : [],
      investments: investments.status === "fulfilled" ? (investments.value as any[]) : [],
      holdings: portfolio.status === "fulfilled" ? ((portfolio.value as any).holdings as any[]) : [],
      markets: markets.status === "fulfilled" ? (markets.value as any[]) : [],
    };
  });

  const totals = useMemo(() => {
    if (!data) return null;
    const cash = data.accounts.reduce((s, a) => s + toNumber(a.balance), 0);
    const invested = data.investments.filter((i) => i.status !== "closed").reduce((s, i) => s + toNumber(i.currentValue ?? i.principalAmount), 0);
    const crypto = data.holdings.reduce((s, h) => {
      const m = data.markets.find((x) => x.id === h.coinId);
      return s + toNumber(h.quantity) * toNumber(m?.current_price);
    }, 0);
    return { cash, invested, crypto, total: cash + invested + crypto };
  }, [data]);

  const flow = useMemo(() => {
    if (!data) return [];
    const months: { key: string; label: string; in: number; out: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-US", { month: "short" }), in: 0, out: 0 });
    }
    for (const tx of data.txs) {
      if (tx.status !== "completed" || tx.flow === "internal") continue;
      const d = new Date(tx.createdAt);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (!m) continue;
      if (tx.flow === "credit") m.in += toNumber(tx.amount);
      else m.out += toNumber(tx.amount) + toNumber(tx.fee);
    }
    return months.map((m) => ({ ...m, in: Math.round(m.in * 100) / 100, out: Math.round(m.out * 100) / 100 }));
  }, [data]);

  const spending = useMemo(() => {
    if (!data) return [];
    const byType = new Map<string, number>();
    for (const tx of data.txs) {
      if (tx.flow !== "debit" || tx.status !== "completed") continue;
      const label = TX_TYPE_LABEL[tx.type] || "Other";
      byType.set(label, (byType.get(label) || 0) + toNumber(tx.amount) + toNumber(tx.fee));
    }
    return [...byType.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value);
  }, [data]);

  const money = (n: number) => (hidden ? "••••••" : formatMoney(n));
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const isNew = !!data && totals?.total === 0 && data.txs.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-fg-subtle">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">
            {greeting()}, {firstName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/dashboard/transfer" variant="primary">
            <ArrowLeftRight className="size-4" /> Send money
          </ButtonLink>
          <ButtonLink href="/dashboard/bills" variant="secondary">
            <Receipt className="size-4" /> Pay a bill
          </ButtonLink>
        </div>
      </div>

      {/* Net worth */}
      <section className="panel-dark relative overflow-hidden p-6 sm:p-8">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/65">
              Total net worth
              <button onClick={() => setHidden((h) => !h)} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label={hidden ? "Show balances" : "Hide balances"}>
                {hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            {loading || !totals ? (
              <div className="mt-3 h-12 w-64 animate-pulse rounded-xl bg-white/10" />
            ) : (
              <p className="num mt-2 text-[40px] font-semibold leading-none tracking-tight sm:text-5xl">{money(totals.total)}</p>
            )}
            <p className="mt-3 text-sm text-white/55">Cash, investments and crypto at today&apos;s prices.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Cash", icon: Wallet, value: totals?.cash ?? 0, href: "/dashboard/transactions" },
              { label: "Investments", icon: LineChart, value: totals?.invested ?? 0, href: "/dashboard/investments" },
              { label: "Crypto", icon: Bitcoin, value: totals?.crypto ?? 0, href: "/dashboard/crypto" },
            ].map((b) => (
              <Link key={b.label} href={b.href} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 transition-colors hover:bg-white/[0.1] sm:p-4">
                <b.icon className="size-4 text-brand-300" />
                <p className="mt-3 text-xs text-white/55">{b.label}</p>
                <p className="num mt-0.5 truncate text-[15px] font-semibold sm:text-base">{loading ? "…" : money(b.value)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isNew && (
        <Card className="overflow-hidden">
          <CardHeader title="Get started" description="A few things to try in your new demo account." />
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            {[
              { icon: Wallet, title: "Add demo funds", body: "Credit a crypto wallet with a simulated deposit.", href: "/dashboard/wallets" },
              { icon: Landmark, title: "Apply for a loan", body: "Approved loans are paid into your account.", href: "/dashboard/loans" },
              { icon: KeyRound, title: "Turn on 2FA", body: "Protect your sign in with an authenticator app.", href: "/dashboard/settings" },
              { icon: Users, title: "Save a payee", body: "Pay people you know in one tap.", href: "/dashboard/transfer" },
            ].map((s) => (
              <Link key={s.title} href={s.href} className="group rounded-2xl border border-line p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                <s.icon className="size-5 text-brand-600" />
                <p className="mt-3 text-sm font-semibold">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{s.body}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Accounts */}
      <section className="grid gap-4 md:grid-cols-2">
        {loading &&
          [0, 1].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-4 h-8 w-48" />
              <Skeleton className="mt-6 h-4 w-24" />
            </Card>
          ))}
        {data?.accounts.map((a) => (
          <Card key={a.id} className="card-hover p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">{accountLabel(a)}</p>
                <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-fg-subtle">
                  {a.accountNumber} <CopyButton value={a.accountNumber} />
                </p>
              </div>
              {a.isFrozen ? (
                <span className="badge bg-info-50 text-info-600">
                  <Snowflake className="size-3" /> Frozen
                </span>
              ) : (
                <span className="badge bg-surface-muted text-fg-muted">{a.currency}</span>
              )}
            </div>
            <p className="num mt-5 text-3xl font-semibold tracking-tight">{money(toNumber(a.balance))}</p>
            <p className="mt-1 text-xs text-fg-subtle">Available {money(toNumber(a.availableBalance))}</p>
            <div className="mt-5 flex gap-2">
              <ButtonLink href={`/dashboard/transfer?from=${a.id}`} variant="secondary" size="sm">
                Transfer
              </ButtonLink>
              <ButtonLink href={`/dashboard/transactions?account=${a.id}`} variant="ghost" size="sm">
                History
              </ButtonLink>
              <ButtonLink href={`/dashboard/statements?account=${a.id}`} variant="ghost" size="sm">
                Statements
              </ButtonLink>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Cash flow" description="Money in and out over the last six months" />
          <div className="h-[260px] px-2 pb-4 pt-2 sm:px-4">
            {loading ? (
              <Skeleton className="mx-4 h-full" />
            ) : flow.every((m) => m.in === 0 && m.out === 0) ? (
              <EmptyState title="No activity yet" description="Transfers, payments and credits will appear here." className="h-full py-0" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flow} barGap={4} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef1f4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={64} tick={{ fill: "#667085", fontSize: 12 }} tickFormatter={(v) => formatMoney(v, { compact: true }).replace(".00", "")} />
                  <Tooltip
                    cursor={{ fill: "rgba(11,31,51,0.04)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", boxShadow: "0 8px 24px rgba(16,24,40,0.08)", fontSize: 13 }}
                    formatter={(v: any, name: any) => [formatMoney(v), name === "in" ? "Money in" : "Money out"]}
                  />
                  <Bar dataKey="in" fill="#1e998e" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="out" fill="#0b1f33" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Spending" description="Where your money went" />
          <div className="p-5 sm:p-6">
            {loading ? (
              <Skeleton className="h-40" />
            ) : spending.length === 0 ? (
              <EmptyState title="Nothing spent yet" description="Payments and purchases are grouped here." className="py-8" />
            ) : (
              <div className="flex items-center gap-5">
                <div className="size-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={spending} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={2} stroke="none">
                        {spending.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatMoney(v)} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-2.5">
                  {spending.slice(0, 6).map((s, i) => (
                    <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate text-fg-muted">{s.name}</span>
                      </span>
                      <span className="num font-medium">{money(s.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Recent activity"
            action={
              <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                View all <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="mt-3 divide-y divide-line border-t border-line">
            {loading && [0, 1, 2, 3].map((i) => <div key={i} className="px-6 py-4"><Skeleton className="h-6" /></div>)}
            {!loading && data?.txs.length === 0 && (
              <EmptyState icon={<ArrowLeftRight className="size-5" />} title="No transactions yet" description="Your transfers, payments and credits will show up here." />
            )}
            {data?.txs.slice(0, 7).map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Markets"
            description="Live crypto prices"
            action={
              <Link href="/dashboard/crypto" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Trade <ArrowRight className="size-4" />
              </Link>
            }
          />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {loading && [0, 1, 2, 3, 4].map((i) => <li key={i} className="px-6 py-4"><Skeleton className="h-6" /></li>)}
            {data?.markets.slice(0, 6).map((m) => {
              const pct = toNumber(m.price_change_percentage_24h);
              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Image src={m.image} alt="" width={28} height={28} className="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-xs uppercase text-fg-subtle">{m.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">{formatPrice(m.current_price)}</p>
                    <p className={cn("num text-xs font-medium", pct >= 0 ? "text-success-600" : "text-danger-600")}>{formatPercent(pct)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
