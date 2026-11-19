"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Clock3, Landmark, Wallet } from "lucide-react";
import { accountsApi, loansApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatDate, formatMoney, maskAccount, toNumber } from "@/lib/format";
import { LOAN_MAX, LOAN_MIN, LOAN_PRODUCTS, LOAN_TERMS, loanProduct, monthlyPayment } from "@/lib/products";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState, PageHeader, Segmented, Skeleton, StatCard } from "@/components/ui/misc";
import { refreshNotifications } from "@/components/app/NotificationsMenu";
import { pickAccount } from "@/lib/url";

const CRYPTO_CHOICES = ["Bitcoin (BTC)", "Ethereum (ETH)", "Tether (USDT)", "USD Coin (USDC)", "Solana (SOL)", "XRP"];

export default function LoansPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [loans, accounts] = await Promise.all([loansApi.getMyLoans(), accountsApi.getAccounts()]);
    return { loans: loans as any[], accounts: accounts as any[] };
  });

  const [type, setType] = useState<string>("personal");
  const [amount, setAmount] = useState("5000");
  const [term, setTerm] = useState(12);
  const [ssn, setSsn] = useState("");
  const [coin, setCoin] = useState(CRYPTO_CHOICES[0]);
  const [dest, setDest] = useState<"bank" | "crypto_wallet" | "external_bank">("bank");
  const [accountId, setAccountId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [extBank, setExtBank] = useState({ bankName: "", accountNumber: "", routing: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];
  const loans = data?.loans ?? [];
  const targetAccountId = pickAccount(accounts, accountId)?.id || "";

  const product = loanProduct(type);
  const principal = toNumber(amount);
  const payment = monthlyPayment(principal, product.rate, term);
  const totalCost = payment * term - principal;

  const activeLoans = loans.filter((l) => l.status === "approved" || l.status === "active");
  const stats = {
    outstanding: activeLoans.reduce((s, l) => s + toNumber(l.outstandingBalance ?? l.principalAmount), 0),
    monthly: activeLoans.reduce((s, l) => s + toNumber(l.monthlyPayment), 0),
    pending: loans.filter((l) => l.status === "pending").length,
  };

  const problem = (() => {
    if (!(principal >= LOAN_MIN)) return `The minimum is ${formatMoney(LOAN_MIN)}`;
    if (principal > LOAN_MAX) return `The maximum is ${formatMoney(LOAN_MAX)}`;
    if (!/^\d{4}$/.test(ssn)) return "Enter the last 4 digits of your SSN";
    if (dest === "bank" && !targetAccountId) return "Choose an account";
    if (dest === "crypto_wallet" && walletAddress.trim().length < 20) return "Enter a valid wallet address";
    if (dest === "external_bank" && (!extBank.bankName.trim() || extBank.accountNumber.trim().length < 4)) return "Enter the bank name and account number";
    return null;
  })();

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (problem) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await loansApi.applyLoan({
        loanType: type,
        principalAmount: Math.round(principal * 100) / 100,
        termMonths: term,
        ssnLast4: ssn,
        selectedCrypto: type === "crypto" ? coin : undefined,
        disbursementType: dest,
        accountId: dest === "bank" ? targetAccountId : undefined,
        disbursementDestination:
          dest === "crypto_wallet"
            ? walletAddress.trim()
            : dest === "external_bank"
              ? `${extBank.bankName.trim()} · acct ${extBank.accountNumber.trim()}${extBank.routing.trim() ? ` · routing ${extBank.routing.trim()}` : ""}`
              : undefined,
      });
      setSuccess("Application submitted. We'll notify you as soon as there's a decision, usually within 72 hours.");
      setSsn("");
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Loans" description="Apply for financing and keep track of your applications and repayments." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding balance" value={formatMoney(stats.outstanding)} icon={<Landmark className="size-4" />} tone="ink" />
        <StatCard label="Monthly repayments" value={formatMoney(stats.monthly)} icon={<CheckCircle2 className="size-4" />} tone="brand" />
        <StatCard label="Applications in review" value={stats.pending} icon={<Clock3 className="size-4" />} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <Card className="overflow-hidden">
          <CardHeader title="Apply for a loan" description="Rates are fixed for each product." />
          <form onSubmit={apply} className="space-y-5 p-6">
            {success && <Alert tone="success">{success}</Alert>}
            {error && <Alert tone="danger">{error}</Alert>}

            <Select label="Loan type" value={type} onChange={(e) => setType(e.target.value)}>
              {LOAN_PRODUCTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} · {p.rate.toFixed(2)}% APR
                </option>
              ))}
            </Select>
            {type === "crypto" && (
              <Select label="Asset" value={coin} onChange={(e) => setCoin(e.target.value)} hint="Crypto backed loans may require collateral after review.">
                {CRYPTO_CHOICES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                leading={<span className="text-sm font-medium">$</span>}
                className="num"
                hint={`${formatMoney(LOAN_MIN)} to ${formatMoney(LOAN_MAX)}`}
              />
              <Select label="Term" value={term} onChange={(e) => setTerm(Number(e.target.value))}>
                {LOAN_TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t} months
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Last 4 digits of your SSN"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="1234"
              value={ssn}
              onChange={(e) => setSsn(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="num w-32 tracking-[0.3em]"
              hint="We only store these four digits, never a full SSN."
            />

            <div className="space-y-3">
              <p className="label mb-0">Where should the money go?</p>
              <Segmented
                value={dest}
                onChange={setDest}
                className="w-full"
                size="sm"
                options={[
                  { value: "bank", label: "My account", icon: <Landmark className="size-3.5" /> },
                  { value: "crypto_wallet", label: "Crypto wallet", icon: <Wallet className="size-3.5" /> },
                  { value: "external_bank", label: "Other bank", icon: <Building2 className="size-3.5" /> },
                ]}
              />
              {dest === "bank" && (
                <Select value={targetAccountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Account" hint="Paid in automatically once approved.">
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {accountLabel(a)} {maskAccount(a.accountNumber)}
                    </option>
                  ))}
                </Select>
              )}
              {dest === "crypto_wallet" && (
                <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="Wallet address" className="font-mono text-sm" aria-label="Wallet address" />
              )}
              {dest === "external_bank" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input placeholder="Bank name" value={extBank.bankName} onChange={(e) => setExtBank({ ...extBank, bankName: e.target.value })} aria-label="Bank name" />
                  <Input placeholder="Account no." inputMode="numeric" value={extBank.accountNumber} onChange={(e) => setExtBank({ ...extBank, accountNumber: e.target.value.replace(/\D/g, "") })} aria-label="Account number" />
                  <Input placeholder="Routing (opt.)" inputMode="numeric" value={extBank.routing} onChange={(e) => setExtBank({ ...extBank, routing: e.target.value.replace(/\D/g, "") })} aria-label="Routing number" />
                </div>
              )}
            </div>

            <dl className="space-y-2 rounded-2xl bg-surface p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Monthly payment</dt>
                <dd className="num text-base font-semibold">{formatMoney(payment)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">APR</dt>
                <dd className="num font-medium">{product.rate.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Total interest</dt>
                <dd className="num font-medium">{formatMoney(Math.max(0, totalCost))}</dd>
              </div>
            </dl>

            {problem && amount && <p className="text-sm text-fg-subtle">{problem}</p>}
            <Button type="submit" size="lg" block loading={submitting} disabled={!!problem}>
              Submit application
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Your applications" description={`${loans.length} total`} />
          <div className="mt-4 overflow-x-auto border-t border-line">
            {loading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
              </div>
            ) : loans.length === 0 ? (
              <EmptyState icon={<Landmark className="size-5" />} title="No applications yet" description="Your loan applications and their status will appear here." />
            ) : (
              <table className="table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Loan</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Monthly</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <p className="font-medium">{loanProduct(l.loanType).label}</p>
                        <p className="text-xs text-fg-subtle">
                          {l.termMonths} months · {toNumber(l.interestRate).toFixed(2)}% · {formatDate(l.createdAt)}
                        </p>
                      </td>
                      <td className="num text-right font-medium">{formatMoney(l.principalAmount)}</td>
                      <td className="num text-right text-fg-muted">{formatMoney(l.monthlyPayment)}</td>
                      <td>
                        <StatusBadge status={l.status} label={l.status === "pending" ? "In review" : undefined} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="border-t border-line px-6 py-4 text-xs text-fg-subtle">
            Demo platform: approvals and disbursements are simulated and don&apos;t create a real credit agreement.
          </p>
        </Card>
      </div>
    </div>
  );
}
