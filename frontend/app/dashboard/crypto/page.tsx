"use client";

import { useState } from "react";
import Image from "next/image";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Bitcoin, Search } from "lucide-react";
import { accountsApi, cryptoApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatCrypto, formatDateTime, formatMoney, formatPercent, formatPrice, maskAccount, toNumber } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHeader, Segmented, Skeleton, StatCard } from "@/components/ui/misc";
import { refreshNotifications } from "@/components/app/NotificationsMenu";
import { cn } from "@/lib/cn";
import { pickAccount } from "@/lib/url";

const FEE = 0.005;
const RANGES = [
  { value: "1", label: "24H" },
  { value: "7", label: "7D" },
  { value: "30", label: "1M" },
  { value: "90", label: "3M" },
];

export default function CryptoPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [markets, portfolio, accounts] = await Promise.all([cryptoApi.getMarkets(), cryptoApi.getPortfolio(), accountsApi.getAccounts()]);
    return { markets: markets as any[], holdings: (portfolio as any).holdings as any[], orders: (portfolio as any).orders as any[], accounts: accounts as any[] };
  });

  const [coinId, setCoinId] = useState("bitcoin");
  const [range, setRange] = useState("7");
  const [search, setSearch] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [usd, setUsd] = useState("");
  const [qty, setQty] = useState("");
  const [accountId, setAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const markets = data?.markets ?? [];
  const holdings = data?.holdings ?? [];
  const accounts = data?.accounts ?? [];
  const coin = markets.find((m) => m.id === coinId) || markets[0];
  const holding = holdings.find((h) => h.coinId === coin?.id);
  const account = pickAccount(accounts, accountId);

  const chart = useAsync(
    async () => {
      if (!coin?.id) return [];
      const res: any = await cryptoApi.getHistoricalChart(coin.id, Number(range));
      const prices: [number, number][] = res?.prices || [];
      const step = Math.max(1, Math.floor(prices.length / 120));
      return prices.filter((_, i) => i % step === 0).map(([t, p]) => ({ t, p }));
    },
    [coin?.id, range],
  );

  let pValue = 0;
  let pCost = 0;
  for (const h of holdings) {
    const m = markets.find((x) => x.id === h.coinId);
    pValue += toNumber(h.quantity) * toNumber(m?.current_price);
    pCost += toNumber(h.quantity) * toNumber(h.avgBuyPrice);
  }
  const portfolio = { value: pValue, cost: pCost, pnl: pValue - pCost };

  const filtered = markets.filter((m) => !search || `${m.name} ${m.symbol}`.toLowerCase().includes(search.toLowerCase()));
  const price = toNumber(coin?.current_price);
  const buyAmt = toNumber(usd);
  const sellQty = toNumber(qty);
  const buyQtyEst = price ? (buyAmt * (1 - FEE)) / price : 0;
  const sellNetEst = sellQty * price * (1 - FEE);

  const problem = (() => {
    if (!coin || !account) return "Choose an account";
    if (side === "buy") {
      if (!(buyAmt >= 1)) return "The minimum purchase is $1";
      if (buyAmt > toNumber(account.availableBalance)) return `You have ${formatMoney(account.availableBalance)} available`;
    } else {
      if (!holding) return `You don't hold any ${coin.symbol.toUpperCase()}`;
      if (!(sellQty > 0)) return "Enter a quantity";
      if (sellQty > toNumber(holding.quantity)) return `You hold ${formatCrypto(holding.quantity, coin.symbol)}`;
    }
    return null;
  })();

  async function trade(e: React.FormEvent) {
    e.preventDefault();
    if (problem || !coin || !account) return;
    setBusy(true);
    setMsg(null);
    try {
      const res: any =
        side === "buy"
          ? await cryptoApi.buyCrypto({ coinId: coin.id, usdAmount: Math.round(buyAmt * 100) / 100, fromAccountId: account.id })
          : await cryptoApi.sellCrypto({ coinId: coin.id, quantity: Math.floor(sellQty * 1e8) / 1e8, toAccountId: account.id });
      setMsg({ tone: "success", text: res.message || "Order completed" });
      setUsd("");
      setQty("");
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const pct = toNumber(coin?.price_change_percentage_24h);

  return (
    <div>
      <PageHeader title="Crypto" description="Trade major assets at live prices. A 0.5% fee applies to each trade." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Crypto holdings" value={formatMoney(portfolio.value)} icon={<Bitcoin className="size-4" />} tone="gold" />
        <StatCard label="Cost basis" value={formatMoney(portfolio.cost)} tone="ink" />
        <StatCard
          label="Unrealised gain / loss"
          value={<span className={portfolio.pnl >= 0 ? "text-success-600" : "text-danger-600"}>{formatMoney(portfolio.pnl, { sign: true })}</span>}
          sub={portfolio.cost > 0 ? formatPercent((portfolio.pnl / portfolio.cost) * 100) : undefined}
          tone="brand"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            {loading || !coin ? (
              <div className="p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-6 h-56" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Image src={coin.image} alt="" width={40} height={40} className="rounded-full" />
                    <div>
                      <p className="font-semibold">
                        {coin.name} <span className="text-fg-subtle">· {coin.symbol.toUpperCase()}</span>
                      </p>
                      <p className="num text-2xl font-semibold tracking-tight">
                        {formatPrice(price)}{" "}
                        <span className={cn("text-sm font-medium", pct >= 0 ? "text-success-600" : "text-danger-600")}>
                          {pct >= 0 ? <ArrowUpRight className="inline size-4" /> : <ArrowDownRight className="inline size-4" />}
                          {formatPercent(pct)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Segmented size="sm" value={range} onChange={setRange} options={RANGES} />
                </div>
                <div className="h-[260px] px-2 pb-4">
                  {chart.loading ? (
                    <Skeleton className="mx-4 h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart.data ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1e998e" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#1e998e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="t"
                          tickLine={false}
                          axisLine={false}
                          minTickGap={48}
                          tick={{ fill: "#667085", fontSize: 11 }}
                          tickFormatter={(t) => new Date(t).toLocaleDateString("en-US", range === "1" ? { hour: "numeric" } : { month: "short", day: "numeric" })}
                        />
                        <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={72} tick={{ fill: "#667085", fontSize: 11 }} tickFormatter={(v) => formatPrice(v)} />
                        <Tooltip
                          labelFormatter={(t) => formatDateTime(new Date(Number(t)))}
                          formatter={(v: any) => [formatPrice(v), "Price"]}
                          contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 13 }}
                        />
                        <Area type="monotone" dataKey="p" stroke="#0e7c74" strokeWidth={2} fill="url(#px)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <h2 className="text-base font-semibold">Markets</h2>
              <Input wrapperClassName="sm:w-64" placeholder="Search assets" value={search} onChange={(e) => setSearch(e.target.value)} leading={<Search className="size-4" />} aria-label="Search assets" />
            </div>
            <div className="max-h-[440px] overflow-auto border-t border-line scrollbar-thin">
              <table className="table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Asset</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">24h</th>
                    <th className="hidden text-right sm:table-cell">Holding</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={4}><Skeleton className="h-6" /></td></tr>)}
                  {filtered.map((m) => {
                    const h = holdings.find((x) => x.coinId === m.id);
                    const p = toNumber(m.price_change_percentage_24h);
                    return (
                      <tr key={m.id} onClick={() => setCoinId(m.id)} className={cn("cursor-pointer", m.id === coin?.id && "bg-brand-50/50")}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Image src={m.image} alt="" width={26} height={26} className="rounded-full" />
                            <div>
                              <p className="font-medium">{m.name}</p>
                              <p className="text-xs uppercase text-fg-subtle">{m.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="num text-right font-medium">{formatPrice(m.current_price)}</td>
                        <td className={cn("num text-right font-medium", p >= 0 ? "text-success-600" : "text-danger-600")}>{formatPercent(p)}</td>
                        <td className="num hidden text-right text-fg-muted sm:table-cell">{h ? formatCrypto(h.quantity) : "None"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden xl:sticky xl:top-24">
            <form onSubmit={trade} className="space-y-5 p-5 sm:p-6">
              <Segmented
                value={side}
                onChange={(s) => {
                  setSide(s);
                  setMsg(null);
                }}
                className="w-full"
                options={[
                  { value: "buy", label: `Buy ${coin?.symbol?.toUpperCase() || ""}` },
                  { value: "sell", label: `Sell ${coin?.symbol?.toUpperCase() || ""}` },
                ]}
              />
              {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
              <Select label={side === "buy" ? "Pay from" : "Pay proceeds into"} value={account?.id || ""} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.isFrozen}>
                    {accountLabel(a)} {maskAccount(a.accountNumber)} · {formatMoney(a.availableBalance)}
                  </option>
                ))}
              </Select>
              {side === "buy" ? (
                <Input
                  label="Amount (USD)"
                  inputMode="decimal"
                  placeholder="100.00"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value.replace(/[^0-9.]/g, ""))}
                  leading={<span className="text-sm font-medium">$</span>}
                  className="num text-lg font-semibold"
                />
              ) : (
                <div>
                  <Input
                    label={`Quantity (${coin?.symbol?.toUpperCase() || ""})`}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={qty}
                    onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="num text-lg font-semibold"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-fg-subtle">
                    <span>You hold {holding ? formatCrypto(holding.quantity, coin.symbol) : "none"}</span>
                    {holding && (
                      <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => setQty(String(toNumber(holding.quantity)))}>
                        Sell all
                      </button>
                    )}
                  </div>
                </div>
              )}
              <dl className="space-y-2 rounded-2xl bg-surface p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-fg-subtle">Price</dt>
                  <dd className="num font-medium">{formatPrice(price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-subtle">Fee (0.5%)</dt>
                  <dd className="num font-medium">{formatMoney(side === "buy" ? buyAmt * FEE : sellQty * price * FEE)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2">
                  <dt className="text-fg-subtle">{side === "buy" ? "You receive (est.)" : "You receive (est.)"}</dt>
                  <dd className="num font-semibold">{side === "buy" ? formatCrypto(buyQtyEst, coin?.symbol) : formatMoney(sellNetEst)}</dd>
                </div>
              </dl>
              {(usd || qty) && problem && <p className="text-sm text-danger-600">{problem}</p>}
              <Button type="submit" variant={side === "buy" ? "accent" : "primary"} size="lg" block loading={busy} disabled={!!problem}>
                {side === "buy" ? "Buy" : "Sell"} {coin?.symbol?.toUpperCase()}
              </Button>
              <p className="text-center text-xs text-fg-subtle">Demo trading. Prices are live and orders are simulated.</p>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Holdings" />
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {!loading && holdings.length === 0 && <EmptyState title="No holdings yet" description="Assets you buy will appear here." className="py-8" />}
              {holdings.map((h) => {
                const m = markets.find((x) => x.id === h.coinId);
                const value = toNumber(h.quantity) * toNumber(m?.current_price);
                const pnl = value - toNumber(h.quantity) * toNumber(h.avgBuyPrice);
                return (
                  <li key={h.coinId}>
                    <button onClick={() => setCoinId(h.coinId)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface sm:px-6">
                      {m?.image ? <Image src={m.image} alt="" width={28} height={28} className="rounded-full" /> : <Bitcoin className="size-7" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{h.coinName}</p>
                        <p className="num text-xs text-fg-subtle">{formatCrypto(h.quantity, h.coinSymbol)}</p>
                      </div>
                      <div className="text-right">
                        <p className="num text-sm font-semibold">{formatMoney(value)}</p>
                        <p className={cn("num text-xs", pnl >= 0 ? "text-success-600" : "text-danger-600")}>{formatMoney(pnl, { sign: true })}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Recent orders" />
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {!loading && (data?.orders.length ?? 0) === 0 && <EmptyState title="No orders yet" className="py-8" />}
              {data?.orders.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3 text-sm sm:px-6">
                  <Badge tone={o.type === "buy" || o.type === "deposit" ? "success" : "neutral"} className="w-[78px] justify-center capitalize">
                    {o.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="num truncate font-medium">{formatCrypto(o.quantity, o.coinSymbol)}</p>
                    <p className="text-xs text-fg-subtle">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <p className="num font-medium">{formatMoney(o.totalUsd)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
