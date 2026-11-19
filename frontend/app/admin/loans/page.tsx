"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { loansApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { loanProduct } from "@/lib/products";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar, EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";

function destinationLabel(l: any) {
  if (!l.disbursementType || l.disbursementType === "bank") return "Customer's account";
  if (l.disbursementType === "crypto_wallet") return `Crypto wallet ${String(l.disbursementDestination || "").slice(0, 12)}…`;
  return l.disbursementDestination || "External bank";
}

export default function AdminLoansPage() {
  const [status, setStatus] = useState<string>("pending");
  const { data, loading, error, reload } = useAsync(() => loansApi.getAllLoans({ status: status || undefined, limit: 100 }), [status]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function decide(loan: any, approve: boolean) {
    const verb = approve ? "approve" : "reject";
    if (!confirm(`${approve ? "Approve" : "Reject"} ${formatMoney(loan.principalAmount)} ${loanProduct(loan.loanType).label.toLowerCase()} for ${loan.user?.fullName}?${approve && (!loan.disbursementType || loan.disbursementType === "bank") ? " The funds will be paid into their account." : ""}`)) return;
    setBusy(loan.id + verb);
    setMsg(null);
    try {
      await (approve ? loansApi.approveLoan(loan.id) : loansApi.rejectLoan(loan.id));
      setMsg({ tone: "success", text: `Loan ${approve ? "approved" : "rejected"}.` });
      reload({ silent: true });
    } catch (e: any) {
      setMsg({ tone: "danger", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Loans" description="Review applications. Approving a loan pays it out immediately." />
      <Segmented
        value={status}
        onChange={setStatus}
        className="mb-6"
        options={[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "", label: "All" },
        ]}
      />
      {msg && <Alert tone={msg.tone} className="mb-4">{msg.text}</Alert>}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-[980px]">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Product</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Monthly</th>
                <th>Pay to</th>
                <th>SSN</th>
                <th>Applied</th>
                <th>Status</th>
                <th className="text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2].map((i) => <tr key={i}><td colSpan={9}><Skeleton className="h-6" /></td></tr>)}
              {!loading &&
                data?.loans.map((l: any) => (
                  <tr key={l.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={l.user?.fullName} />
                        <div>
                          <p className="font-medium">{l.user?.fullName}</p>
                          <p className="text-xs text-fg-subtle">{l.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p>{loanProduct(l.loanType).label}</p>
                      <p className="text-xs text-fg-subtle">
                        {l.termMonths} mo · {toNumber(l.interestRate).toFixed(2)}%{l.selectedCrypto ? ` · ${l.selectedCrypto}` : ""}
                      </p>
                    </td>
                    <td className="num text-right font-semibold">{formatMoney(l.principalAmount)}</td>
                    <td className="num text-right text-fg-muted">{formatMoney(l.monthlyPayment)}</td>
                    <td className="max-w-[200px] truncate text-fg-muted" title={destinationLabel(l)}>
                      {destinationLabel(l)}
                    </td>
                    <td className="font-mono text-xs">{l.ssn || "N/A"}</td>
                    <td className="text-fg-muted">{formatDate(l.createdAt)}</td>
                    <td>
                      <StatusBadge status={l.status} />
                      {l.approver && <p className="mt-1 text-xs text-fg-subtle">by {l.approver.fullName}</p>}
                    </td>
                    <td className="text-right">
                      {l.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" loading={busy === l.id + "reject"} disabled={!!busy} onClick={() => decide(l, false)}>
                            Reject
                          </Button>
                          <Button size="sm" variant="accent" loading={busy === l.id + "approve"} disabled={!!busy} onClick={() => decide(l, true)}>
                            Approve
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && error && <p className="px-6 py-4 text-sm text-danger-600">{error}</p>}
        {!loading && data?.loans.length === 0 && <EmptyState icon={<Landmark className="size-5" />} title="No loans here" description="Nothing matches this filter." />}
      </Card>
    </div>
  );
}
