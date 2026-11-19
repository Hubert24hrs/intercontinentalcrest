"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDownLeft, ArrowUpRight, Check, Copy, FlaskConical, History, Wallet } from "lucide-react";
import { cryptoApi, walletsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatCrypto, formatDateTime, formatMoney, toNumber } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";
import { refreshNotifications } from "@/components/app/NotificationsMenu";
import { cn } from "@/lib/cn";

export default function WalletsPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [wallets, markets, history] = await Promise.all([walletsApi.getWallets(), cryptoApi.getMarkets(), walletsApi.getHistory()]);
    return { wallets: wallets as any[], markets: markets as any[], history: history as any[] };
  });

  const [walletId, setWalletId] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const wallets = data?.wallets ?? [];

  const priceOf = (coinId: string) => {
    const m = data?.markets.find((x) => x.id === coinId);
    if (m) return toNumber(m.current_price);
    return coinId === "tether" || coinId === "usd-coin" ? 1 : 0;
  };
  const imageOf = (coinId: string) => data?.markets.find((x) => x.id === coinId)?.image as string | undefined;

  const wallet = wallets.find((w) => w.id === walletId) || wallets[0];
  const total = wallets.reduce((s, w) => s + toNumber(w.balance) * priceOf(w.coinId), 0);
  const history = (data?.history ?? []).filter((h) => !wallet || h.coinId === wallet.coinId || h.coinSymbol === wallet.coinSymbol);

  async function run(kind: "deposit" | "withdraw") {
    if (!wallet) return;
    setBusy(true);
    setMsg(null);
    try {
      if (kind === "deposit") {
        await walletsApi.depositCrypto({ coinId: wallet.coinId, amount: toNumber(depositAmt) });
        setMsg({ tone: "success", text: `${depositAmt} ${wallet.coinSymbol} credited (simulated deposit).` });
        setDepositAmt("");
      } else {
        await walletsApi.withdrawCrypto({ coinId: wallet.coinId, amount: toNumber(withdrawAmt), destinationAddress: destination.trim() });
        setMsg({ tone: "success", text: `${withdrawAmt} ${wallet.coinSymbol} withdrawal recorded (simulated).` });
        setWithdrawAmt("");
        setDestination("");
      }
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const depositProblem = !(toNumber(depositAmt) > 0) ? "Enter an amount" : null;
  const withdrawProblem = (() => {
    const a = toNumber(withdrawAmt);
    if (!(a > 0)) return "Enter an amount";
    if (wallet && a > toNumber(wallet.balance)) return `You have ${formatCrypto(wallet.balance, wallet.coinSymbol)}`;
    if (!/^[A-Za-z0-9:_-]{20,120}$/.test(destination.trim())) return "Enter a valid destination address";
    return null;
  })();

  return (
    <div>
      <PageHeader title="Wallets" description="Custody wallets for each supported asset." />

      <Alert tone="warning" className="mb-6" title="Simulated custody">
        Deposits and withdrawals here are simulated. Nothing is sent to or from a blockchain. Your deposit reference is a demo identifier, not a real address.
        Never send real crypto to it.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
        <div className="space-y-4">
          <section className="panel-dark p-6">
            <p className="text-sm text-white/60">Total in wallets</p>
            <p className="num mt-1 text-3xl font-semibold tracking-tight">{loading ? "…" : formatMoney(total)}</p>
            <p className="mt-1 text-xs text-white/50">{wallets.length} assets · valued at live prices</p>
          </section>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {loading && [0, 1, 2, 3].map((i) => <li key={i} className="px-5 py-4"><Skeleton className="h-7" /></li>)}
              {wallets.map((w) => {
                const usd = toNumber(w.balance) * priceOf(w.coinId);
                const img = imageOf(w.coinId);
                return (
                  <li key={w.id}>
                    <button
                      onClick={() => {
                        setWalletId(w.id);
                        setMsg(null);
                      }}
                      aria-current={w.id === wallet?.id}
                      className={cn("flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors", w.id === wallet?.id ? "bg-brand-50/60" : "hover:bg-surface")}
                    >
                      {img ? <Image src={img} alt="" width={32} height={32} className="rounded-full" /> : <span className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold">{w.coinSymbol.slice(0, 3)}</span>}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{w.coinName}</p>
                        <p className="num text-xs text-fg-subtle">{formatCrypto(w.balance, w.coinSymbol)}</p>
                      </div>
                      <p className="num text-sm font-semibold">{formatMoney(usd)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card className="overflow-hidden">
          {!wallet ? (
            <div className="p-6">
              <Skeleton className="h-40" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  {imageOf(wallet.coinId) ? <Image src={imageOf(wallet.coinId)!} alt="" width={40} height={40} className="rounded-full" /> : <Wallet className="size-8" />}
                  <div>
                    <p className="font-semibold">{wallet.coinName} wallet</p>
                    <p className="num text-sm text-fg-subtle">
                      {formatCrypto(wallet.balance, wallet.coinSymbol)} · {formatMoney(toNumber(wallet.balance) * priceOf(wallet.coinId))}
                    </p>
                  </div>
                </div>
                <Segmented
                  size="sm"
                  value={tab}
                  onChange={(t) => {
                    setTab(t);
                    setMsg(null);
                  }}
                  options={[
                    { value: "deposit", label: "Deposit", icon: <ArrowDownLeft className="size-3.5" /> },
                    { value: "withdraw", label: "Withdraw", icon: <ArrowUpRight className="size-3.5" /> },
                    { value: "history", label: "History", icon: <History className="size-3.5" /> },
                  ]}
                />
              </div>

              <div className="p-5 sm:p-6">
                {msg && <Alert tone={msg.tone} className="mb-5">{msg.text}</Alert>}

                {tab === "deposit" && (
                  <div className="space-y-6">
                    <div>
                      <p className="label">Your demo deposit reference</p>
                      <div className="flex items-stretch gap-2">
                        <code className="flex-1 break-all rounded-xl border border-line bg-surface px-4 py-3 font-mono text-[13px] text-fg">{wallet.address}</code>
                        <Button
                          variant="secondary"
                          className="h-auto"
                          onClick={() => {
                            navigator.clipboard?.writeText(wallet.address).then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            });
                          }}
                          aria-label="Copy reference"
                        >
                          {copied ? <Check className="size-4 text-success-600" /> : <Copy className="size-4" />}
                        </Button>
                      </div>
                      <p className="hint">Unique to your account. It identifies your wallet inside this demo and is not accepted by real blockchains.</p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!depositProblem) run("deposit");
                      }}
                      className="space-y-4 rounded-2xl border border-dashed border-line-strong p-5"
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="size-4 text-gold-500" />
                        <p className="text-sm font-semibold">Simulate a deposit</p>
                      </div>
                      <Input
                        label={`Amount (${wallet.coinSymbol})`}
                        inputMode="decimal"
                        placeholder="0.00"
                        value={depositAmt}
                        onChange={(e) => setDepositAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                        className="num"
                        hint={toNumber(depositAmt) > 0 ? `≈ ${formatMoney(toNumber(depositAmt) * priceOf(wallet.coinId))} · limit $250,000 per deposit` : "Limit $250,000 per deposit"}
                      />
                      <Button type="submit" variant="accent" block loading={busy} disabled={!!depositProblem}>
                        Credit {wallet.coinSymbol} (simulated)
                      </Button>
                    </form>
                  </div>
                )}

                {tab === "withdraw" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!withdrawProblem) run("withdraw");
                    }}
                    className="space-y-4"
                  >
                    <Input label="Destination address" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={`${wallet.coinSymbol} address`} className="font-mono text-sm" />
                    <div>
                      <Input
                        label={`Amount (${wallet.coinSymbol})`}
                        inputMode="decimal"
                        placeholder="0.00"
                        value={withdrawAmt}
                        onChange={(e) => setWithdrawAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                        className="num"
                      />
                      <div className="mt-1.5 flex justify-between text-xs text-fg-subtle">
                        <span>Available {formatCrypto(wallet.balance, wallet.coinSymbol)}</span>
                        <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => setWithdrawAmt(String(toNumber(wallet.balance)))}>
                          Max
                        </button>
                      </div>
                    </div>
                    {withdrawAmt && withdrawProblem && <p className="text-sm text-danger-600">{withdrawProblem}</p>}
                    <Button type="submit" block loading={busy} disabled={!!withdrawProblem}>
                      Withdraw (simulated)
                    </Button>
                    <p className="text-xs text-fg-subtle">Nothing is sent to a blockchain. The withdrawal is only recorded in your wallet history.</p>
                  </form>
                )}

                {tab === "history" &&
                  (history.length === 0 ? (
                    <EmptyState icon={<History className="size-5" />} title="No wallet activity yet" description="Deposits and withdrawals for this asset appear here." />
                  ) : (
                    <ul className="-mx-5 divide-y divide-line sm:-mx-6">
                      {history.map((h) => (
                        <li key={h.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                          <span className={cn("flex size-9 items-center justify-center rounded-xl", h.type === "deposit" ? "bg-success-50 text-success-600" : "bg-surface-muted text-fg-muted")}>
                            {h.type === "deposit" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium capitalize">
                              {h.type} {h.quantity ? <span className="num">{formatCrypto(h.quantity, h.coinSymbol)}</span> : null}
                            </p>
                            <p className="truncate text-xs text-fg-subtle">
                              {formatDateTime(h.createdAt)}
                              {h.networkAddress ? ` · to ${h.networkAddress.slice(0, 10)}…${h.networkAddress.slice(-6)}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="num text-sm font-medium">{formatMoney(h.totalUsd)}</p>
                            <Badge tone="success">{h.status}</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
