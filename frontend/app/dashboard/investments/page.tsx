"use client";

import { useState } from "react";
import { Bitcoin, Briefcase, Info, Landmark, LineChart, PiggyBank, TrendingUp } from "lucide-react";
import { accountsApi, cryptoApi, investmentsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatCrypto, formatDate, formatMoney, formatPercent, maskAccount, toNumber } from "@/lib/format";
import { INVESTMENT_CATEGORIES, INVESTMENT_PLANS, type InvestmentPlan } from "@/lib/products";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, PageHeader, Segmented, Skeleton, StatCard } from "@/components/ui/misc";
import { refreshNotifications } from "@/components/app/NotificationsMenu";
import { cn } from "@/lib/cn";
import { pickAccount } from "@/lib/url";

const RISK_TONE = { Low: "success", Moderate: "info", High: "warning", "Very high": "danger" } as const;
const SELL_FEE = 0.005;

export default function InvestmentsPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [investments, accounts, portfolio, markets] = await Promise.all([
      investmentsApi.getMyInvestments(),
      accountsApi.getAccounts(),
      cryptoApi.getPortfolio(),
      cryptoApi.getMarkets(),
    ]);
    return { investments: investments as any[], accounts: accounts as any[], holdings: (portfolio as any).holdings as any[], markets: markets as any[] };
  });

  const [category, setCategory] = useState<string>("All");
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"cash" | "crypto">("cash");
  const [accountId, setAccountId] = useState("");
  const [coinId, setCoinId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];
  const holdings = data?.holdings ?? [];
  const investments = data?.investments ?? [];

  const open = investments.filter((i) => i.status !== "closed");
  const investedTotal = open.reduce((s, i) => s + toNumber(i.principalAmount), 0);
  const valueTotal = open.reduce((s, i) => s + toNumber(i.currentValue ?? i.principalAmount), 0);
  const stats = { invested: investedTotal, value: valueTotal, gain: valueTotal - investedTotal };

  const amt = toNumber(amount);
  const account = pickAccount(accounts, accountId, "savings");
  const holding = holdings.find((h) => h.coinId === coinId) || holdings[0];
  const price = toNumber(data?.markets.find((m) => m.id === holding?.coinId)?.current_price);
  const coinsNeeded = source === "crypto" && price ? Math.ceil(((amt / (1 - SELL_FEE)) * 1.002 / price) * 1e8) / 1e8 : 0;

  const problem = (() => {
    if (!plan) return "Choose a plan";
    if (!(amt > 0)) return "Enter an amount";
    if (amt < plan.minInvestment) return `The minimum for this plan is ${formatMoney(plan.minInvestment)}`;
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) return "Use at most 2 decimal places";
    if (!account) return "Choose an account";
    if (source === "cash" && amt > toNumber(account.availableBalance)) return `You have ${formatMoney(account.availableBalance)} available`;
    if (source === "crypto") {
      if (!holding) return "You don't hold any crypto";
      if (!price) return "Live price unavailable";
      if (coinsNeeded > toNumber(holding.quantity)) return `You need ${formatCrypto(coinsNeeded, holding.coinSymbol)}`;
    }
    return null;
  })();

  async function invest() {
    if (!plan || problem || !account) return;
    setBusy(true);
    setError(null);
    try {
      if (source === "crypto" && holding) {
        await cryptoApi.sellCrypto({ coinId: holding.coinId, quantity: coinsNeeded, toAccountId: account.id });
      }
      await investmentsApi.createInvestment({
        planName: plan.name,
        principalAmount: amt,
        interestRate: plan.maxReturn,
        termMonths: plan.termMonths,
        accountId: account.id,
      });
      setNotice(`You invested ${formatMoney(amt)} in ${plan.name}.`);
      setPlan(null);
      setAmount("");
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setError(err.message);
      reload({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  async function close(inv: any) {
    if (!confirm(`Close "${inv.planName}" and move ${formatMoney(inv.currentValue ?? inv.principalAmount)} to your account?`)) return;
    setClosing(inv.id);
    try {
      await investmentsApi.closeInvestment(inv.id);
      setNotice(`"${inv.planName}" was closed and the proceeds were paid into your account.`);
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setNotice(null);
      alert(err.message);
    } finally {
      setClosing(null);
    }
  }

  const plans = category === "All" ? INVESTMENT_PLANS : INVESTMENT_PLANS.filter((p) => p.category === category);

  return (
    <div>
      <PageHeader title="Investments" description="Put money to work across asset classes and track how it's doing." />

      {notice && (
        <Alert tone="success" className="mb-6">
          {notice}
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Portfolio value" value={formatMoney(stats.value)} icon={<Briefcase className="size-4" />} tone="ink" />
        <StatCard label="Amount invested" value={formatMoney(stats.invested)} icon={<PiggyBank className="size-4" />} tone="brand" />
        <StatCard
          label="Gain / loss"
          value={<span className={stats.gain >= 0 ? "text-success-600" : "text-danger-600"}>{formatMoney(stats.gain, { sign: true })}</span>}
          sub={stats.invested > 0 ? formatPercent((stats.gain / stats.invested) * 100) : undefined}
          icon={<TrendingUp className="size-4" />}
          tone="gold"
        />
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader title="Your positions" description={`${open.length} open`} />
        <div className="mt-4 overflow-x-auto border-t border-line">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : investments.length === 0 ? (
            <EmptyState icon={<LineChart className="size-5" />} title="No investments yet" description="Choose a plan below to make your first investment." />
          ) : (
            <table className="table min-w-[760px]">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th className="text-right">Invested</th>
                  <th className="text-right">Current value</th>
                  <th className="text-right">Gain / loss</th>
                  <th>Matures</th>
                  <th>Status</th>
                  <th className="text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {investments.map((i) => {
                  const principal = toNumber(i.principalAmount);
                  const value = toNumber(i.currentValue ?? i.principalAmount);
                  const gain = value - principal;
                  return (
                    <tr key={i.id}>
                      <td>
                        <p className="font-medium">{i.planName}</p>
                        <p className="text-xs text-fg-subtle">Opened {formatDate(i.startDate || i.createdAt)}</p>
                      </td>
                      <td className="num text-right">{formatMoney(principal)}</td>
                      <td className="num text-right font-medium">{formatMoney(value)}</td>
                      <td className={cn("num text-right font-medium", gain >= 0 ? "text-success-600" : "text-danger-600")}>
                        {formatMoney(gain, { sign: true })}
                        <span className="block text-xs font-normal">{principal ? formatPercent((gain / principal) * 100) : ""}</span>
                      </td>
                      <td className="text-fg-muted">{formatDate(i.maturityDate)}</td>
                      <td>
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="text-right">
                        {i.status !== "closed" && (
                          <Button variant="secondary" size="sm" loading={closing === i.id} onClick={() => close(i)}>
                            Close
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Investment plans</h2>
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
          <Segmented
            size="sm"
            value={category}
            onChange={setCategory}
            options={[{ value: "All", label: "All" }, ...INVESTMENT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-fg-subtle">{p.category}</p>
                <h3 className="mt-0.5 font-semibold">{p.name}</h3>
              </div>
              <Badge tone={RISK_TONE[p.risk]}>{p.risk} risk</Badge>
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">{p.description}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-fg-subtle">Est. return</dt>
                <dd className="num font-semibold">
                  {p.minReturn} to {p.maxReturn}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-subtle">Horizon</dt>
                <dd className="num font-semibold">{p.termMonths} mo</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-subtle">Minimum</dt>
                <dd className="num font-semibold">{formatMoney(p.minInvestment)}</dd>
              </div>
            </dl>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                setPlan(p);
                setAmount(String(p.minInvestment));
                setError(null);
                setNotice(null);
              }}
            >
              Invest
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-fg-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Return ranges are illustrative and not guaranteed. Values can fall as well as rise. Positions are valued by our team and can be closed back to cash at any time.
      </p>

      <Modal
        open={!!plan}
        onOpenChange={(o) => !o && setPlan(null)}
        title={plan ? `Invest in ${plan.name}` : "Invest"}
        description={plan ? `${plan.category} · est. ${plan.minReturn} to ${plan.maxReturn}% a year · ${plan.risk.toLowerCase()} risk` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlan(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="accent" onClick={invest} loading={busy} disabled={!!problem}>
              Invest {amt > 0 ? formatMoney(amt) : ""}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}
          <Input
            label="Amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            leading={<span className="text-sm font-medium">$</span>}
            className="num text-lg font-semibold"
            hint={plan ? `Minimum ${formatMoney(plan.minInvestment)}` : undefined}
          />
          <div>
            <p className="label">Fund with</p>
            <Segmented
              value={source}
              onChange={setSource}
              options={[
                { value: "cash", label: "Cash", icon: <Landmark className="size-4" /> },
                { value: "crypto", label: "Crypto", icon: <Bitcoin className="size-4" /> },
              ]}
            />
          </div>
          <Select label={source === "crypto" ? "Account (crypto is sold into it first)" : "From account"} value={account?.id || ""} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} disabled={a.isFrozen}>
                {accountLabel(a)} {maskAccount(a.accountNumber)} · {formatMoney(a.availableBalance)}
              </option>
            ))}
          </Select>
          {source === "crypto" &&
            (holdings.length ? (
              <Select label="Asset to sell" value={holding?.coinId || ""} onChange={(e) => setCoinId(e.target.value)} hint={amt > 0 && holding ? `Sells about ${formatCrypto(coinsNeeded, holding.coinSymbol)} (incl. 0.5% fee)` : undefined}>
                {holdings.map((h) => (
                  <option key={h.coinId} value={h.coinId}>
                    {h.coinName} · {formatCrypto(h.quantity, h.coinSymbol)}
                  </option>
                ))}
              </Select>
            ) : (
              <Alert tone="info">You don&apos;t hold any crypto yet.</Alert>
            ))}
          {amount && problem && <p className="text-sm text-danger-600">{problem}</p>}
        </div>
      </Modal>
    </div>
  );
}
