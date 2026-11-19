"use client";

import { useState } from "react";
import { ArrowLeftRight, CheckCircle2, Globe2, Info, Trash2, UserPlus, Users } from "lucide-react";
import { accountsApi, beneficiariesApi, transactionsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatDateTime, formatMoney, maskAccount, toNumber } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";
import { refreshNotifications } from "@/components/app/NotificationsMenu";
import { pickAccount, queryParam } from "@/lib/url";

type Mode = "own" | "person" | "international";
const WIRE_FEE = 3;

export default function TransferPage() {
  const { data, loading, error: loadError, reload } = useAsync(async () => {
    const [accounts, payees] = await Promise.all([accountsApi.getAccounts(), beneficiariesApi.getBeneficiaries()]);
    return { accounts: accounts as any[], payees: payees as any[] };
  });

  const [mode, setMode] = useState<Mode>("person");
  const [fromId, setFromId] = useState("");
  const [toOwnId, setToOwnId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [bankName, setBankName] = useState("");
  const [swift, setSwift] = useState("");
  const [savePayee, setSavePayee] = useState(false);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"details" | "review" | "done">("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const accounts = data?.accounts ?? [];
  const payees = data?.payees ?? [];

  // Defaults are derived during render (no state syncing in effects).
  const from = pickAccount(accounts, fromId || queryParam("from"));
  const fromAccountId = from?.id || "";
  const ownTargets = accounts.filter((a) => a.id !== fromAccountId);
  const toOwnAccountId = ownTargets.find((a) => a.id === toOwnId)?.id || ownTargets[0]?.id || "";
  const amt = toNumber(amount);
  const fee = mode === "international" ? WIRE_FEE : 0;
  const total = amt + fee;
  const available = toNumber(from?.availableBalance);
  const selectedPayee = payees.find((p) => p.id === payeeId);

  const destination = (() => {
    if (mode === "own") {
      const acct = accounts.find((a) => a.id === toOwnAccountId);
      return acct ? { number: acct.accountNumber, label: `${accountLabel(acct)} ${maskAccount(acct.accountNumber)}` } : null;
    }
    if (payeeId && selectedPayee) return { number: selectedPayee.accountNumber, label: `${selectedPayee.beneficiaryName} · ${selectedPayee.accountNumber}` };
    const n = recipientNumber.trim().toUpperCase();
    if (!n) return null;
    return { number: n, label: recipientName.trim() ? `${recipientName.trim()} · ${n}` : n };
  })();

  const validationError = (() => {
    if (!from) return "Choose the account to send from";
    if (from.isFrozen) return "This account is frozen";
    if (!destination) return mode === "own" ? "Choose the account to send to" : "Enter the recipient's account number";
    if (destination.number === from.accountNumber) return "You can't send money to the same account";
    if (!/^[A-Za-z0-9-]{4,34}$/.test(destination.number)) return "That account number doesn't look right";
    if (!(amt > 0)) return "Enter an amount";
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) return "Use at most 2 decimal places";
    if (total > available) return `You have ${formatMoney(available)} available`;
    return null;
  })();

  function reset() {
    setAmount("");
    setMemo("");
    setRecipientNumber("");
    setRecipientName("");
    setBankName("");
    setSwift("");
    setSavePayee(false);
    setPayeeId("");
    setStep("details");
    setReceipt(null);
    setError(null);
  }

  async function send() {
    if (!from || !destination) return;
    setSubmitting(true);
    setError(null);
    try {
      const tx = await transactionsApi.initiateTransfer({
        fromAccountId: from.id,
        toAccountNumber: destination.number,
        amount: amt,
        description: memo.trim() || undefined,
        type: mode === "international" ? "international_transfer" : "transfer",
      });
      if (savePayee && mode !== "own" && !payeeId && recipientName.trim()) {
        await beneficiariesApi
          .createBeneficiary({
            beneficiaryName: recipientName.trim(),
            accountNumber: destination.number,
            bankName: bankName.trim() || undefined,
            swiftCode: swift.trim() || undefined,
            isInternational: mode === "international",
          })
          .catch(() => null);
      }
      setReceipt(tx);
      setStep("done");
      refreshNotifications();
      reload({ silent: true });
    } catch (err: any) {
      setError(err.message);
      setStep("details");
    } finally {
      setSubmitting(false);
    }
  }

  async function removePayee(id: string) {
    if (!confirm("Remove this payee?")) return;
    await beneficiariesApi.deleteBeneficiary(id).catch(() => null);
    if (payeeId === id) setPayeeId("");
    reload({ silent: true });
  }

  return (
    <div>
      <PageHeader title="Transfers" description="Move money between your accounts, to other customers, or abroad." />

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : loadError ? (
            <div className="p-6">
              <Alert tone="danger">{loadError}</Alert>
            </div>
          ) : step === "done" && receipt ? (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">Money sent</h2>
                <p className="num mt-1 text-3xl font-semibold tracking-tight">{formatMoney(receipt.amount)}</p>
                <p className="mt-1 text-sm text-fg-subtle">to {destination?.label}</p>
              </div>
              <dl className="mt-8 divide-y divide-line rounded-2xl border border-line px-5">
                {[
                  ["Reference", <span key="r" className="font-mono text-[13px]">{receipt.transactionReference}</span>],
                  ["From", `${accountLabel(from)} ${maskAccount(from?.accountNumber)}`],
                  ["Fee", formatMoney(receipt.fee)],
                  ["Date", formatDateTime(receipt.createdAt)],
                  ["Status", "Completed"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-fg-subtle">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={reset}>Make another transfer</Button>
                <ButtonLink href="/dashboard/transactions" variant="secondary">
                  View transactions
                </ButtonLink>
              </div>
            </div>
          ) : step === "review" ? (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Review your transfer</h2>
              <p className="mt-1 text-sm text-fg-subtle">Check the details. Transfers can&apos;t be cancelled once sent.</p>
              <dl className="mt-6 divide-y divide-line rounded-2xl border border-line px-5">
                {[
                  ["From", `${accountLabel(from)} ${maskAccount(from?.accountNumber)}`],
                  ["To", destination?.label],
                  ["Amount", formatMoney(amt)],
                  ["Fee", formatMoney(fee)],
                  ["Total", <strong key="t">{formatMoney(total)}</strong>],
                  ["Arrives", mode === "international" ? "Recorded immediately" : "Instantly"],
                  ...(memo.trim() ? [["Note", memo.trim()]] : []),
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-fg-subtle">{k}</dt>
                    <dd className="num text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="accent" size="lg" loading={submitting} onClick={send}>
                  Confirm and send {formatMoney(total)}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setStep("details")} disabled={submitting}>
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-5 p-6 sm:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (!validationError) setStep("review");
              }}
            >
              <Segmented
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  setPayeeId("");
                  setError(null);
                }}
                className="w-full"
                options={[
                  { value: "person", label: "To someone", icon: <Users className="size-4" /> },
                  { value: "own", label: "My accounts", icon: <ArrowLeftRight className="size-4" /> },
                  { value: "international", label: "International", icon: <Globe2 className="size-4" /> },
                ]}
              />

              {error && <Alert tone="danger">{error}</Alert>}

              <Select label="From" value={fromAccountId} onChange={(e) => setFromId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.isFrozen}>
                    {accountLabel(a)} {maskAccount(a.accountNumber)} · {formatMoney(a.availableBalance)}
                    {a.isFrozen ? " (frozen)" : ""}
                  </option>
                ))}
              </Select>

              {mode === "own" ? (
                <Select label="To" value={toOwnAccountId} onChange={(e) => setToOwnId(e.target.value)}>
                  {ownTargets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {accountLabel(a)} {maskAccount(a.accountNumber)}
                      </option>
                    ))}
                </Select>
              ) : (
                <div className="space-y-4">
                  {payees.length > 0 && (
                    <Select label="Recipient" value={payeeId} onChange={(e) => setPayeeId(e.target.value)}>
                      <option value="">New recipient</option>
                      {payees
                        .filter((p) => (mode === "international" ? p.isInternational : true))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.beneficiaryName} · {p.accountNumber}
                          </option>
                        ))}
                    </Select>
                  )}
                  {!payeeId && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Recipient name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full name" optional={!savePayee} />
                        <Input
                          label={mode === "international" ? "IBAN or account number" : "Account number"}
                          value={recipientNumber}
                          onChange={(e) => setRecipientNumber(e.target.value.replace(/\s/g, ""))}
                          placeholder={mode === "international" ? "GB29NWBK60161331926819" : "IC0000000000"}
                          className="font-mono"
                          required
                        />
                      </div>
                      {mode === "international" && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input label="Bank name" optional value={bankName} onChange={(e) => setBankName(e.target.value)} />
                          <Input label="SWIFT / BIC" optional value={swift} onChange={(e) => setSwift(e.target.value.toUpperCase())} className="font-mono" maxLength={11} />
                        </div>
                      )}
                      <label className="flex items-center gap-2.5 text-sm text-fg-muted">
                        <input type="checkbox" checked={savePayee} onChange={(e) => setSavePayee(e.target.checked)} className="size-4 accent-brand-600" />
                        Save as a payee for next time
                      </label>
                    </>
                  )}
                </div>
              )}

              <div>
                <Input
                  label="Amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  leading={<span className="text-sm font-medium">$</span>}
                  className="num text-lg font-semibold"
                />
                <div className="mt-1.5 flex items-center justify-between text-xs text-fg-subtle">
                  <span>
                    Available: <span className="num font-medium text-fg">{formatMoney(available)}</span>
                    {fee > 0 && <> · Wire fee {formatMoney(fee)}</>}
                  </span>
                  <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => setAmount(Math.max(0, available - fee).toFixed(2))}>
                    Send max
                  </button>
                </div>
              </div>

              <Input label="Note" optional value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={140} placeholder="What's it for?" />

              {amount && validationError && <p className="text-sm text-danger-600">{validationError}</p>}
              <Button type="submit" size="lg" block disabled={!!validationError || (mode !== "own" && savePayee && !payeeId && !recipientName.trim())}>
                Continue
              </Button>
            </form>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="Payees" description="People and businesses you've saved" icon={<UserPlus className="size-4" />} />
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {loading && <li className="px-6 py-4"><Skeleton className="h-6" /></li>}
              {!loading && payees.length === 0 && (
                <EmptyState title="No payees yet" description="Tick “Save as a payee” when you send money to someone new." className="py-8" />
              )}
              {payees.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {p.beneficiaryName.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.beneficiaryName}</p>
                    <p className="truncate font-mono text-xs text-fg-subtle">
                      {p.accountNumber}
                      {p.isInternational ? " · international" : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMode(p.isInternational ? "international" : "person");
                      setPayeeId(p.id);
                      setStep("details");
                    }}
                  >
                    Pay
                  </Button>
                  <button onClick={() => removePayee(p.id)} className="rounded-lg p-1.5 text-fg-faint hover:bg-danger-50 hover:text-danger-600" aria-label={`Remove ${p.beneficiaryName}`}>
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <div className="space-y-2 text-sm text-fg-muted">
                <p className="font-semibold text-fg">Good to know</p>
                <p>Transfers to Intercontinental Crest customers arrive instantly and are free.</p>
                <p>International wires cost {formatMoney(WIRE_FEE)}. Single transfers are limited to $1,000,000.</p>
                <p>Demo platform: transfers to external accounts are recorded but no real money moves.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
