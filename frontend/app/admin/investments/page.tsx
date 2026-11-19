"use client";

import { useState } from "react";
import { Bitcoin, LineChart } from "lucide-react";
import { cryptoApi, investmentsApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatCrypto, formatDate, formatDateTime, formatMoney, formatPercent, toNumber } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, PageHeader, Segmented, Skeleton, StatCard } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

function Investments() {
  const { data, loading, error, reload } = useAsync(() => investmentsApi.getAllInvestments({ limit: 200 }));
  const [editing, setEditing] = useState<any | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const list: any[] = data?.investments ?? [];
  const open = list.filter((i) => i.status !== "closed");
  const principal = open.reduce((s, i) => s + toNumber(i.principalAmount), 0);
  const current = open.reduce((s, i) => s + toNumber(i.currentValue ?? i.principalAmount), 0);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setErr(null);
    try {
      await investmentsApi.updateValue(editing.id, { currentValue: toNumber(value) });
      setEditing(null);
      reload({ silent: true });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open positions" value={open.length} icon={<LineChart className="size-4" />} tone="ink" />
        <StatCard label="Principal invested" value={formatMoney(principal)} tone="brand" />
        <StatCard label="Current value" value={formatMoney(current)} sub={principal ? formatPercent(((current - principal) / principal) * 100) : undefined} tone="gold" />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th className="text-right">Principal</th>
                <th className="text-right">Current value</th>
                <th>Matures</th>
                <th>Status</th>
                <th className="text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7}><Skeleton className="h-6" /></td></tr>)}
              {!loading &&
                list.map((i) => {
                  const gain = toNumber(i.currentValue ?? i.principalAmount) - toNumber(i.principalAmount);
                  return (
                    <tr key={i.id}>
                      <td>
                        <p className="font-medium">{i.user?.fullName}</p>
                        <p className="text-xs text-fg-subtle">{i.user?.email}</p>
                      </td>
                      <td>{i.planName}</td>
                      <td className="num text-right">{formatMoney(i.principalAmount)}</td>
                      <td className="num text-right font-medium">
                        {formatMoney(i.currentValue ?? i.principalAmount)}
                        <span className={cn("block text-xs", gain >= 0 ? "text-success-600" : "text-danger-600")}>{formatMoney(gain, { sign: true })}</span>
                      </td>
                      <td className="text-fg-muted">{formatDate(i.maturityDate)}</td>
                      <td>
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="text-right">
                        {i.status !== "closed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditing(i);
                              setValue(String(toNumber(i.currentValue ?? i.principalAmount)));
                              setErr(null);
                            }}
                          >
                            Revalue
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && error && <p className="px-6 py-4 text-sm text-danger-600">{error}</p>}
        {!loading && list.length === 0 && <EmptyState icon={<LineChart className="size-5" />} title="No investments yet" />}
      </Card>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Revalue position"
        description={editing ? `${editing.user?.fullName} · ${editing.planName}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="accent" loading={busy} onClick={save} disabled={!(toNumber(value) >= 0) || value === ""}>
              Save value
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {err && <Alert tone="danger">{err}</Alert>}
          <Input label="Current market value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))} leading={<span className="text-sm">$</span>} className="num" />
          <p className="text-xs text-fg-subtle">Revaluations are recorded in the audit log with the previous value.</p>
        </div>
      </Modal>
    </>
  );
}

function CryptoOrders() {
  const orders = useAsync(() => cryptoApi.getAllOrders(1, 200));
  const volume = useAsync(() => cryptoApi.getVolume());
  const list: any[] = orders.data?.orders ?? [];
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={volume.data?._count?.id ?? "…"} icon={<Bitcoin className="size-4" />} tone="ink" />
        <StatCard label="Volume" value={formatMoney(volume.data?._sum?.totalUsd)} tone="brand" />
        <StatCard label="Fees earned" value={formatMoney(volume.data?._sum?.fee)} tone="gold" />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
                <th className="text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              {orders.loading && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7}><Skeleton className="h-6" /></td></tr>)}
              {list.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap text-fg-muted">{formatDateTime(o.createdAt)}</td>
                  <td>
                    <p className="font-medium">{o.user?.fullName}</p>
                    <p className="text-xs text-fg-subtle">{o.user?.email}</p>
                  </td>
                  <td>
                    <Badge tone={o.type === "buy" || o.type === "deposit" ? "success" : "neutral"} className="capitalize">
                      {o.type}
                    </Badge>
                  </td>
                  <td className="num text-right">{formatCrypto(o.quantity, o.coinSymbol)}</td>
                  <td className="num text-right text-fg-muted">{formatMoney(o.priceAtTime)}</td>
                  <td className="num text-right font-medium">{formatMoney(o.totalUsd)}</td>
                  <td className="num text-right text-fg-muted">{formatMoney(o.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.loading && list.length === 0 && <EmptyState icon={<Bitcoin className="size-5" />} title="No crypto orders yet" />}
      </Card>
    </>
  );
}

export default function AdminInvestmentsPage() {
  const [tab, setTab] = useState<"investments" | "crypto">("investments");
  return (
    <div>
      <PageHeader title="Investments & crypto" description="Customer positions, valuations and trading activity." />
      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-6"
        options={[
          { value: "investments", label: "Investments", icon: <LineChart className="size-4" /> },
          { value: "crypto", label: "Crypto orders", icon: <Bitcoin className="size-4" /> },
        ]}
      />
      {tab === "investments" ? <Investments /> : <CryptoOrders />}
    </div>
  );
}
