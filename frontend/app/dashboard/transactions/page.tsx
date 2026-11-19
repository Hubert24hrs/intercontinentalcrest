"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, ListOrdered, Search } from "lucide-react";
import { accountsApi, transactionsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatDateTime, formatMoney, maskAccount, toNumber, TX_TYPE_LABEL } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState, PageHeader, Segmented, Skeleton, StatCard, DefinitionRow } from "@/components/ui/misc";
import { TxRow, signedAmount, type Tx } from "@/components/app/TxRow";
import { queryParam } from "@/lib/url";

const PAGE = 25;

export default function TransactionsPage() {
  const [accountId, setAccountIdRaw] = useState(() => queryParam("account") || "");
  const [flow, setFlowRaw] = useState<"all" | "credit" | "debit">("all");
  const [query, setQueryRaw] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Tx | null>(null);
  // Changing a filter always returns to the first page.
  const setAccountId = (v: string) => (setAccountIdRaw(v), setPage(1));
  const setFlow = (v: "all" | "credit" | "debit") => (setFlowRaw(v), setPage(1));
  const setQuery = (v: string) => (setQueryRaw(v), setPage(1));

  const accounts = useAsync(() => accountsApi.getAccounts() as Promise<any[]>);
  const { data, loading, error } = useAsync(
    () => transactionsApi.getTransactions({ limit: 200, accountId: accountId || undefined }) as Promise<{ transactions: Tx[]; total: number }>,
    [accountId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.transactions ?? []).filter((t) => {
      if (flow === "credit" && t.flow !== "credit") return false;
      if (flow === "debit" && t.flow !== "debit") return false;
      if (!q) return true;
      return [t.description, t.transactionReference, TX_TYPE_LABEL[t.type], t.senderAccount?.accountNumber, t.receiverAccount?.accountNumber]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [data, flow, query]);

  const summary = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const t of filtered) {
      if (t.flow === "credit") inflow += toNumber(t.amount);
      else if (t.flow === "debit") outflow += toNumber(t.amount) + toNumber(t.fee);
    }
    return { inflow, outflow };
  }, [filtered]);

  const pageItems = filtered.slice((page - 1) * PAGE, page * PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  function exportCsv() {
    downloadCsv(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Reference", "Description", "Type", "Direction", "Amount", "Fee", "Status"],
      filtered.map((t) => [
        new Date(t.createdAt).toISOString(),
        t.transactionReference,
        t.description || "",
        TX_TYPE_LABEL[t.type] || t.type,
        t.flow || "",
        toNumber(t.amount).toFixed(2),
        toNumber(t.fee).toFixed(2),
        t.status,
      ]),
    );
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Everything that has moved in or out of your accounts."
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Money in" value={formatMoney(summary.inflow)} icon={<ArrowDownLeft className="size-4" />} tone="success" />
        <StatCard label="Money out" value={formatMoney(summary.outflow)} icon={<ArrowUpRight className="size-4" />} tone="ink" />
        <StatCard label="Transactions" value={filtered.length.toLocaleString()} icon={<ListOrdered className="size-4" />} tone="brand" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 lg:flex-row lg:items-center">
          <Input
            wrapperClassName="flex-1"
            placeholder="Search description, reference or account"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="size-4" />}
            aria-label="Search transactions"
          />
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Account" wrapperClassName="lg:w-64">
            <option value="">All accounts</option>
            {(accounts.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)} {maskAccount(a.accountNumber)}
              </option>
            ))}
          </Select>
          <Segmented
            value={flow}
            onChange={setFlow}
            options={[
              { value: "all", label: "All" },
              { value: "credit", label: "In" },
              { value: "debit", label: "Out" },
            ]}
          />
        </div>

        <div className="divide-y divide-line">
          {loading && [0, 1, 2, 3, 4].map((i) => <div key={i} className="px-6 py-4"><Skeleton className="h-6" /></div>)}
          {!loading && error && <p className="px-6 py-6 text-sm text-danger-600">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState icon={<ListOrdered className="size-5" />} title="No matching transactions" description="Try a different search or filter." />
          )}
          {pageItems.map((t) => (
            <TxRow key={t.id} tx={t} onClick={() => setSelected(t)} />
          ))}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-fg-subtle">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title="Transaction details">
        {selected && (
          <div>
            <p className="num text-3xl font-semibold tracking-tight">{signedAmount(selected).text}</p>
            <p className="mt-1 text-sm text-fg-subtle">{selected.description || TX_TYPE_LABEL[selected.type]}</p>
            <dl className="mt-6 divide-y divide-line">
              <DefinitionRow label="Status" value={<StatusBadge status={selected.status} />} />
              <DefinitionRow label="Type" value={TX_TYPE_LABEL[selected.type] || selected.type} />
              <DefinitionRow label="Date" value={formatDateTime(selected.createdAt)} />
              <DefinitionRow label="Reference" value={selected.transactionReference} mono />
              {selected.senderAccount && <DefinitionRow label="From account" value={selected.senderAccount.accountNumber} mono />}
              {selected.receiverAccount && <DefinitionRow label="To account" value={selected.receiverAccount.accountNumber} mono />}
              {toNumber(selected.fee) > 0 && <DefinitionRow label="Fee" value={formatMoney(selected.fee)} />}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
