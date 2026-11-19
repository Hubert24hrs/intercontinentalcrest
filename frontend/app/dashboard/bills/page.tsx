"use client";

import { useMemo, useState } from "react";
import { Bitcoin, CheckCircle2, CreditCard, Droplets, Flame, Landmark, Phone, Shield, Tv, Wallet, Wifi, Zap } from "lucide-react";
import { accountsApi, cryptoApi, transactionsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatCrypto, formatDateTime, formatMoney, maskAccount, toNumber } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";
import { TxRow, type Tx } from "@/components/app/TxRow";
import { refreshNotifications } from "@/components/app/NotificationsMenu";
import { cn } from "@/lib/cn";
import { pickAccount } from "@/lib/url";

const BILLERS = [
  { id: "electricity", label: "Electricity", icon: Zap, providers: ["City Power & Light", "Metro Energy Cooperative", "Summit Electric"] },
  { id: "internet", label: "Internet", icon: Wifi, providers: ["FiberNet", "Skyline Broadband", "Harbor Cable"] },
  { id: "mobile", label: "Mobile", icon: Phone, providers: ["Nova Mobile", "Crest Wireless", "Pulse Telecom"] },
  { id: "water", label: "Water", icon: Droplets, providers: ["Municipal Water Board", "Clearwater Utilities"] },
  { id: "gas", label: "Gas", icon: Flame, providers: ["Northern Gas", "Bluefire Energy"] },
  { id: "tv", label: "TV & streaming", icon: Tv, providers: ["StreamBox", "Vista TV", "Orbit Media"] },
  { id: "insurance", label: "Insurance", icon: Shield, providers: ["Harborview Insurance", "Keystone Mutual"] },
  { id: "card", label: "Credit card", icon: CreditCard, providers: ["Crest Card Services", "Meridian Card"] },
];

const SELL_FEE = 0.005;
const PRICE_BUFFER = 1.002; // small cushion so sale proceeds still cover the bill if the price ticks down

export default function BillsPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [accounts, portfolio, markets, history] = await Promise.all([
      accountsApi.getAccounts(),
      cryptoApi.getPortfolio(),
      cryptoApi.getMarkets(),
      transactionsApi.getTransactions({ type: "bill_payment", limit: 10 }),
    ]);
    return { accounts: accounts as any[], holdings: (portfolio as any).holdings as any[], markets: markets as any[], history: (history as any).transactions as Tx[] };
  });

  const [billerId, setBillerId] = useState(BILLERS[0].id);
  const [provider, setProvider] = useState(BILLERS[0].providers[0]);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"cash" | "crypto">("cash");
  const [accountId, setAccountId] = useState("");
  const [coinId, setCoinId] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const biller = BILLERS.find((b) => b.id === billerId)!;
  const providerName = biller.providers.includes(provider) ? provider : biller.providers[0];

  const accounts = data?.accounts ?? [];
  const holdings = data?.holdings ?? [];
  const account = pickAccount(accounts, accountId);
  const holding = holdings.find((h) => h.coinId === coinId) || holdings[0];
  const price = toNumber(data?.markets.find((m) => m.id === holding?.coinId)?.current_price);
  const amt = toNumber(amount);
  const coinsNeeded = source === "crypto" && price > 0 ? Math.ceil(((amt / (1 - SELL_FEE)) * PRICE_BUFFER / price) * 1e8) / 1e8 : 0;

  const problem = useMemo(() => {
    if (!reference.trim()) return "Enter your account or reference number with the biller";
    if (!(amt > 0)) return "Enter an amount";
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) return "Use at most 2 decimal places";
    if (!account) return "Choose an account";
    if (source === "cash" && amt > toNumber(account.availableBalance)) return `You have ${formatMoney(account.availableBalance)} available`;
    if (source === "crypto") {
      if (!holding) return "You don't hold any crypto yet";
      if (!price) return "Live price unavailable. Try again shortly.";
      if (coinsNeeded > toNumber(holding.quantity)) return `You need ${formatCrypto(coinsNeeded, holding.coinSymbol)}`;
    }
    return null;
  }, [reference, amt, amount, account, source, holding, price, coinsNeeded]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (problem || !account) return;
    setPaying(true);
    setError(null);
    try {
      if (source === "crypto" && holding) {
        await cryptoApi.sellCrypto({ coinId: holding.coinId, quantity: coinsNeeded, toAccountId: account.id });
      }
      const tx = await transactionsApi.initiateTransfer({
        fromAccountId: account.id,
        toAccountNumber: `BILL-${biller.id.toUpperCase()}-${reference.trim().replace(/[^A-Za-z0-9]/g, "").slice(0, 24) || "REF"}`,
        amount: amt,
        type: "bill_payment",
        description: `${biller.label} bill, ${providerName}`,
      });
      setReceipt({ ...tx, provider: providerName, biller: biller.label, reference: reference.trim(), viaCrypto: source === "crypto" ? formatCrypto(coinsNeeded, holding?.coinSymbol) : null });
      setReference("");
      setAmount("");
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setError(err.message);
      reload({ silent: true });
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <PageHeader title="Bill payments" description="Pay utilities, subscriptions and cards from cash or crypto." />

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden">
          {receipt ? (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">Bill paid</h2>
                <p className="num mt-1 text-3xl font-semibold">{formatMoney(receipt.amount)}</p>
                <p className="mt-1 text-sm text-fg-subtle">
                  {receipt.biller} · {receipt.provider}
                </p>
              </div>
              <dl className="mt-8 divide-y divide-line rounded-2xl border border-line px-5 text-sm">
                {[
                  ["Reference", <span key="r" className="font-mono text-[13px]">{receipt.transactionReference}</span>],
                  ["Biller account", receipt.reference],
                  ...(receipt.viaCrypto ? [["Funded by selling", receipt.viaCrypto]] : []),
                  ["Date", formatDateTime(receipt.createdAt)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-4 py-3">
                    <dt className="text-fg-subtle">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button className="mt-6" onClick={() => setReceipt(null)}>
                Pay another bill
              </Button>
            </div>
          ) : (
            <form onSubmit={pay} className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="label">Category</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BILLERS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBillerId(b.id);
                        setProvider(b.providers[0]);
                      }}
                      aria-pressed={b.id === billerId}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition-colors",
                        b.id === billerId ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      <b.icon className="size-5" />
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <Alert tone="danger">{error}</Alert>}

              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Provider" value={providerName} onChange={(e) => setProvider(e.target.value)}>
                  {biller.providers.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
                <Input label="Account / reference number" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="As shown on your bill" maxLength={40} />
              </div>

              <Input
                label="Amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                leading={<span className="text-sm font-medium">$</span>}
                className="num text-lg font-semibold"
              />

              <div className="space-y-4">
                <div>
                  <p className="label">Pay with</p>
                  <Segmented
                    value={source}
                    onChange={setSource}
                    options={[
                      { value: "cash", label: "Cash", icon: <Landmark className="size-4" /> },
                      { value: "crypto", label: "Crypto", icon: <Bitcoin className="size-4" /> },
                    ]}
                  />
                </div>
                <Select
                  label={source === "crypto" ? "Account the payment is made from" : "From account"}
                  value={account?.id || ""}
                  onChange={(e) => setAccountId(e.target.value)}
                  hint={source === "crypto" ? "Your crypto is sold into this account first, then the bill is paid from it." : undefined}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.isFrozen}>
                      {accountLabel(a)} {maskAccount(a.accountNumber)} · {formatMoney(a.availableBalance)}
                    </option>
                  ))}
                </Select>
                {source === "crypto" &&
                  (holdings.length === 0 ? (
                    <Alert tone="info">You don&apos;t hold any crypto yet. Buy some on the Crypto page or add a simulated deposit in Wallets.</Alert>
                  ) : (
                    <Select label="Asset to sell" value={holding?.coinId || ""} onChange={(e) => setCoinId(e.target.value)}>
                      {holdings.map((h) => (
                        <option key={h.coinId} value={h.coinId}>
                          {h.coinName} · {formatCrypto(h.quantity, h.coinSymbol)}
                        </option>
                      ))}
                    </Select>
                  ))}
                {source === "crypto" && amt > 0 && holding && price > 0 && (
                  <p className="rounded-xl bg-surface px-4 py-3 text-sm text-fg-muted">
                    Sells about <span className="num font-semibold text-fg">{formatCrypto(coinsNeeded, holding.coinSymbol)}</span> at{" "}
                    {formatMoney(price)} (incl. 0.5% trading fee).
                  </p>
                )}
              </div>

              {amount && problem && <p className="text-sm text-danger-600">{problem}</p>}
              <Button type="submit" variant="accent" size="lg" block loading={paying} disabled={!!problem}>
                Pay {amt > 0 ? formatMoney(amt) : "bill"}
              </Button>
            </form>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Recent bill payments" icon={<Wallet className="size-4" />} />
          <div className="mt-3 divide-y divide-line border-t border-line">
            {loading && <div className="px-6 py-4"><Skeleton className="h-6" /></div>}
            {!loading && (data?.history.length ?? 0) === 0 && <EmptyState title="No bills paid yet" description="Your payments will be listed here." className="py-10" />}
            {data?.history.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}
