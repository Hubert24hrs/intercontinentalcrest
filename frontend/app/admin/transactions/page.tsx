"use client";

import { useEffect, useState } from "react";
import { ListOrdered, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatDateTime, formatMoney, toNumber, TX_TYPE_LABEL } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";

const LIMIT = 25;

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error } = useAsync(() => adminApi.getTransactions({ page, limit: LIMIT, status: status || undefined, search: q || undefined }), [page, status, q]);

  return (
    <div>
      <PageHeader title="Transactions" description={data ? `${data.total.toLocaleString()} ledger entries` : "Monitor money moving across the platform."} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:p-5">
          <Input wrapperClassName="flex-1" placeholder="Search reference, description or account number" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} leading={<Search className="size-4" />} aria-label="Search transactions" />
          <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} wrapperClassName="sm:w-48" aria-label="Status">
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="table min-w-[900px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={7}><Skeleton className="h-6" /></td></tr>)}
              {!loading &&
                data?.transactions.map((t: any) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap text-fg-muted">{formatDateTime(t.createdAt)}</td>
                    <td className="font-mono text-xs">{t.transactionReference}</td>
                    <td>
                      <p>{TX_TYPE_LABEL[t.type] || t.type}</p>
                      {t.performedByAdmin && <p className="text-xs text-fg-subtle">by {t.performedByAdmin.fullName}</p>}
                    </td>
                    <td>
                      {t.senderAccount ? (
                        <>
                          <p className="text-sm">{t.senderAccount.user?.fullName}</p>
                          <p className="font-mono text-xs text-fg-subtle">{t.senderAccount.accountNumber}</p>
                        </>
                      ) : (
                        <span className="text-fg-faint">External / system</span>
                      )}
                    </td>
                    <td>
                      {t.receiverAccount ? (
                        <>
                          <p className="text-sm">{t.receiverAccount.user?.fullName}</p>
                          <p className="font-mono text-xs text-fg-subtle">{t.receiverAccount.accountNumber}</p>
                        </>
                      ) : (
                        <span className="text-fg-faint">External</span>
                      )}
                    </td>
                    <td className="num text-right font-semibold">
                      {formatMoney(t.amount)}
                      {toNumber(t.fee) > 0 && <span className="block text-xs font-normal text-fg-subtle">fee {formatMoney(t.fee)}</span>}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && error && <p className="px-6 py-4 text-sm text-danger-600">{error}</p>}
        {!loading && data?.transactions.length === 0 && <EmptyState icon={<ListOrdered className="size-5" />} title="No transactions found" />}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-fg-subtle">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
