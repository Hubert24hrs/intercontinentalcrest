"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { accountsApi, cryptoApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatMoney, maskAccount, toNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";
import { pickAccount, queryParam } from "@/lib/url";

type Statement = { period: string; year: number; month: number; txCount: number; credits: number; debits: number; opening: number; closing: number };

export default function StatementsPage() {
  const [tab, setTab] = useState<"bank" | "crypto">("bank");
  const [accountId, setAccountId] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accounts = useAsync(() => accountsApi.getAccounts() as Promise<any[]>);
  const account = pickAccount(accounts.data ?? [], accountId || queryParam("account"));
  const selectedId = account?.id || "";

  const statements = useAsync(
    () => (selectedId ? (accountsApi.getMonthlyStatements(selectedId) as Promise<Statement[]>) : Promise.resolve([] as Statement[])),
    [selectedId],
  );
  const orders = useAsync(() => cryptoApi.getMyOrders(1, 200) as Promise<{ orders: any[] }>);

  const cryptoMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; orders: any[] }>();
    for (const o of orders.data?.orders ?? []) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { key, label: d.toLocaleString("en-US", { month: "long", year: "numeric" }), orders: [] });
      map.get(key)!.orders.push(o);
    }
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [orders.data]);

  async function downloadPdf(s: Statement) {
    if (!account) return;
    const id = `${s.year}-${s.month}`;
    setDownloading(id);
    setError(null);
    try {
      await accountsApi.downloadStatementPdf(account.id, s.year, s.month, account.accountNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  function cryptoCsv(m: { key: string; orders: any[] }) {
    downloadCsv(
      `crypto-activity-${m.key}.csv`,
      ["Date", "Order", "Type", "Asset", "Quantity", "Price (USD)", "Total (USD)", "Fee (USD)", "Status"],
      m.orders.map((o) => [
        new Date(o.createdAt).toISOString(),
        o.id,
        o.type,
        o.coinSymbol,
        toNumber(o.quantity).toFixed(8),
        toNumber(o.priceAtTime).toFixed(2),
        toNumber(o.totalUsd).toFixed(2),
        toNumber(o.fee).toFixed(2),
        o.status,
      ]),
    );
  }

  return (
    <div>
      <PageHeader title="Statements" description="Monthly account statements and crypto activity reports." />

      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-6"
        options={[
          { value: "bank", label: "Account statements", icon: <FileText className="size-4" /> },
          { value: "crypto", label: "Crypto activity", icon: <FileSpreadsheet className="size-4" /> },
        ]}
      />

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {tab === "bank" ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <Select value={selectedId} onChange={(e) => setAccountId(e.target.value)} aria-label="Account" wrapperClassName="sm:w-80">
              {(accounts.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {accountLabel(a)} {maskAccount(a.accountNumber)}
                </option>
              ))}
            </Select>
            {account && (
              <p className="text-sm text-fg-subtle">
                Current balance <span className="num font-semibold text-fg">{formatMoney(account.balance)}</span>
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="text-right">Opening</th>
                  <th className="text-right">Money in</th>
                  <th className="text-right">Money out</th>
                  <th className="text-right">Closing</th>
                  <th className="text-right">Entries</th>
                  <th className="text-right">
                    <span className="sr-only">Download</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(statements.loading || accounts.loading) &&
                  [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td colSpan={7}>
                        <Skeleton className="h-6" />
                      </td>
                    </tr>
                  ))}
                {!statements.loading &&
                  (statements.data ?? []).map((s) => (
                    <tr key={`${s.year}-${s.month}`}>
                      <td className="font-medium">{s.period}</td>
                      <td className="num text-right text-fg-muted">{formatMoney(s.opening)}</td>
                      <td className="num text-right text-success-600">+{formatMoney(s.credits)}</td>
                      <td className="num text-right">−{formatMoney(s.debits)}</td>
                      <td className="num text-right font-semibold">{formatMoney(s.closing)}</td>
                      <td className="num text-right text-fg-muted">{s.txCount}</td>
                      <td className="text-right">
                        <Button variant="secondary" size="sm" loading={downloading === `${s.year}-${s.month}`} onClick={() => downloadPdf(s)}>
                          <Download className="size-3.5" /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!statements.loading && (statements.data ?? []).length === 0 && <EmptyState title="No statements yet" description="Statements appear from the month your account opened." />}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {orders.loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : cryptoMonths.length === 0 ? (
            <EmptyState icon={<FileSpreadsheet className="size-5" />} title="No crypto activity yet" description="Buys, sells, deposits and withdrawals are summarised here each month." />
          ) : (
            <ul className="divide-y divide-line">
              {cryptoMonths.map((m) => {
                const volume = m.orders.reduce((s, o) => s + toNumber(o.totalUsd), 0);
                return (
                  <li key={m.key} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{m.label}</p>
                      <p className="text-sm text-fg-subtle">
                        {m.orders.length} {m.orders.length === 1 ? "order" : "orders"} · {formatMoney(volume)} volume
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => cryptoCsv(m)}>
                      <Download className="size-3.5" /> CSV
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
