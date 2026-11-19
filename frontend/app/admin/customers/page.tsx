"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Snowflake, Trash2, Users } from "lucide-react";
import { adminApi, cryptoApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { accountLabel, formatCrypto, formatDate, formatDateTime, formatMoney, formatRelative, toNumber } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Avatar, EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";
import { useSessionContext } from "@/components/app/SessionContext";
import { queryParam } from "@/lib/url";

const LIMIT = 20;

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function CustomerDetail({ id, onChanged, onClose }: { id: string; onChanged: () => void; onClose: () => void }) {
  const { user: me } = useSessionContext();
  const { data: u, loading, error, reload } = useAsync(() => adminApi.getUserDetail(id), [id]);
  const markets = useAsync(() => cryptoApi.getMarkets() as Promise<any[]>);
  const [tab, setTab] = useState<"accounts" | "crypto" | "lending" | "kyc">("accounts");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [adj, setAdj] = useState({ accountId: "", type: "credit" as "credit" | "debit", amount: "", reason: "", reference: "" });
  const [credit, setCredit] = useState({ coinId: "bitcoin", quantity: "", reason: "" });


  const act = useCallback(
    async (key: string, fn: () => Promise<any>, ok: string) => {
      setBusy(key);
      setMsg(null);
      try {
        await fn();
        setMsg({ tone: "success", text: ok });
        await reload({ silent: true });
        onChanged();
      } catch (err: any) {
        setMsg({ tone: "danger", text: err.message });
      } finally {
        setBusy(null);
      }
    },
    [reload, onChanged],
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error || !u) return <Alert tone="danger">{error || "Customer not found"}</Alert>;

  const adjAccountId = u.accounts.find((a: any) => a.id === adj.accountId)?.id || u.accounts[0]?.id || "";
  const isSelf = me?.id === u.id;
  const privileged = u.role === "admin" || u.role === "super_admin";
  const canManage = !isSelf && u.role !== "super_admin" && (!privileged || me?.role === "super_admin");
  const totalCash = u.accounts.reduce((s: number, a: any) => s + toNumber(a.balance), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={u.fullName} className="size-12 text-sm" />
          <div>
            <p className="text-lg font-semibold">{u.fullName}</p>
            <p className="text-sm text-fg-subtle">
              {u.email}
              {u.phone ? ` · ${u.phone}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <StatusBadge status={u.status} />
              <Badge tone={privileged ? "dark" : "neutral"}>{u.role.replace("_", " ")}</Badge>
              {u.twoFactorEnabled && <Badge tone="brand">2FA on</Badge>}
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-fg-subtle">Total cash</p>
          <p className="num text-xl font-semibold">{formatMoney(totalCash)}</p>
          <p className="text-xs text-fg-faint">Joined {formatDate(u.createdAt)} · last sign in {u.lastLogin ? formatRelative(u.lastLogin) : "never"}</p>
        </div>
      </div>

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {canManage && (
        <div className="flex flex-wrap gap-2 rounded-2xl bg-surface p-3">
          {u.status === "active" ? (
            <Button variant="secondary" size="sm" loading={busy === "status"} onClick={() => act("status", () => adminApi.updateUserStatus(u.id, "suspended"), "Customer suspended. They are signed out immediately.")}>
              Suspend
            </Button>
          ) : (
            <Button variant="secondary" size="sm" loading={busy === "status"} onClick={() => act("status", () => adminApi.updateUserStatus(u.id, "active"), "Customer reactivated.")}>
              Reactivate
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
            loading={busy === "delete"}
            onClick={() => {
              if (!confirm(`Permanently delete ${u.fullName} and all of their accounts? This cannot be undone.`)) return;
              setBusy("delete");
              adminApi
                .deleteUser(u.id)
                .then(() => {
                  onChanged();
                  onClose();
                })
                .catch((err) => setMsg({ tone: "danger", text: err.message }))
                .finally(() => setBusy(null));
            }}
          >
            <Trash2 className="size-3.5" /> Delete customer
          </Button>
        </div>
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        size="sm"
        options={[
          { value: "accounts", label: `Accounts (${u.accounts.length})` },
          { value: "crypto", label: `Crypto (${u.cryptoHoldings.length})` },
          { value: "lending", label: `Loans & investments` },
          { value: "kyc", label: "Verification" },
        ]}
      />

      {tab === "accounts" && (
        <div className="space-y-5">
          <div className="divide-y divide-line rounded-2xl border border-line">
            {u.accounts.map((a: any) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{accountLabel(a)}</p>
                  <p className="font-mono text-xs text-fg-subtle">{a.accountNumber}</p>
                </div>
                <p className="num text-sm font-semibold">{formatMoney(a.balance)}</p>
                {a.isFrozen && <Badge tone="info"><Snowflake className="size-3" /> Frozen</Badge>}
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busy === `freeze-${a.id}`}
                  onClick={() => act(`freeze-${a.id}`, () => adminApi.toggleAccountFreeze(a.id, !a.isFrozen), a.isFrozen ? "Account unfrozen." : "Account frozen.")}
                >
                  {a.isFrozen ? "Unfreeze" : "Freeze"}
                </Button>
              </div>
            ))}
            {u.accounts.length === 0 && <p className="px-4 py-6 text-center text-sm text-fg-subtle">No accounts.</p>}
          </div>

          {u.accounts.length > 0 && (
            <form
              className="space-y-4 rounded-2xl border border-line p-4"
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  "adjust",
                  () =>
                    adminApi.adjustBalance(u.id, {
                      accountId: adjAccountId,
                      type: adj.type,
                      amount: toNumber(adj.amount),
                      reason: adj.reason.trim(),
                      reference: adj.reference.trim() || undefined,
                    }),
                  `${adj.type === "credit" ? "Credited" : "Debited"} ${formatMoney(adj.amount)}.`,
                ).then(() => setAdj((a) => ({ ...a, amount: "", reason: "", reference: "" })));
              }}
            >
              <div>
                <p className="text-sm font-semibold">Balance adjustment</p>
                <p className="text-xs text-fg-subtle">Recorded on the customer&apos;s ledger, notified to them, and written to the audit log. Max $500,000 per adjustment.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select value={adjAccountId} onChange={(e) => setAdj({ ...adj, accountId: e.target.value })} aria-label="Account">
                  {u.accounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {accountLabel(a)} · {a.accountNumber}
                    </option>
                  ))}
                </Select>
                <Select value={adj.type} onChange={(e) => setAdj({ ...adj, type: e.target.value as any })} aria-label="Type">
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </Select>
                <Input placeholder="Amount" inputMode="decimal" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value.replace(/[^0-9.]/g, "") })} leading={<span className="text-sm">$</span>} aria-label="Amount" />
              </div>
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <Input placeholder="Reason (shown to the customer)" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} maxLength={500} aria-label="Reason" />
                <Input placeholder="Internal reference (optional)" value={adj.reference} onChange={(e) => setAdj({ ...adj, reference: e.target.value })} maxLength={100} aria-label="Reference" />
              </div>
              <Button type="submit" size="sm" loading={busy === "adjust"} disabled={!(toNumber(adj.amount) > 0) || adj.reason.trim().length < 5}>
                Apply adjustment
              </Button>
            </form>
          )}
        </div>
      )}

      {tab === "crypto" && (
        <div className="space-y-5">
          <div className="divide-y divide-line rounded-2xl border border-line">
            {u.cryptoHoldings.length === 0 && <p className="px-4 py-6 text-center text-sm text-fg-subtle">No crypto holdings.</p>}
            {u.cryptoHoldings.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{h.coinName}</span>
                <span className="num">{formatCrypto(h.quantity, h.coinSymbol)}</span>
              </div>
            ))}
          </div>
          <form
            className="space-y-3 rounded-2xl border border-line p-4"
            onSubmit={(e) => {
              e.preventDefault();
              act("crypto", () => adminApi.creditCrypto(u.id, { coinId: credit.coinId, quantity: toNumber(credit.quantity), reason: credit.reason.trim() || undefined }), "Crypto credited.").then(() =>
                setCredit((c) => ({ ...c, quantity: "", reason: "" })),
              );
            }}
          >
            <p className="text-sm font-semibold">Credit crypto</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={credit.coinId} onChange={(e) => setCredit({ ...credit, coinId: e.target.value })} aria-label="Asset">
                {(markets.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Input placeholder="Quantity" inputMode="decimal" value={credit.quantity} onChange={(e) => setCredit({ ...credit, quantity: e.target.value.replace(/[^0-9.]/g, "") })} aria-label="Quantity" />
              <Input placeholder="Reason" value={credit.reason} onChange={(e) => setCredit({ ...credit, reason: e.target.value })} aria-label="Reason" />
            </div>
            <Button type="submit" size="sm" loading={busy === "crypto"} disabled={!(toNumber(credit.quantity) > 0)}>
              Credit
            </Button>
          </form>
        </div>
      )}

      {tab === "lending" && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">Loans</p>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {u.loans.length === 0 && <p className="px-4 py-4 text-sm text-fg-subtle">No loans.</p>}
              {u.loans.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium capitalize">{l.loanType}</span> · {l.termMonths} mo · SSN {l.ssn || "N/A"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num font-medium">{formatMoney(l.principalAmount)}</span>
                    <StatusBadge status={l.status} />
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Investments</p>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {u.investments.length === 0 && <p className="px-4 py-4 text-sm text-fg-subtle">No investments.</p>}
              {u.investments.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">{i.planName}</span>
                  <span className="flex items-center gap-2">
                    <span className="num">{formatMoney(i.currentValue ?? i.principalAmount)}</span>
                    <StatusBadge status={i.status} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "kyc" && (
        <div className="divide-y divide-line rounded-2xl border border-line">
          {u.kycDocuments.length === 0 && <p className="px-4 py-6 text-center text-sm text-fg-subtle">No verification submitted.</p>}
          {u.kycDocuments.map((k: any) => (
            <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-medium capitalize">{k.documentType.replace(/_/g, " ")}</span> · submitted {formatDateTime(k.submittedAt)}
              </span>
              <StatusBadge status={k.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(() => queryParam("id"));
  const q = useDebounced(search);

  const { data, loading, error, reload } = useAsync(() => adminApi.getUsers({ page, limit: LIMIT, search: q || undefined, status: status || undefined }), [page, q, status]);

  return (
    <div>
      <PageHeader title="Customers" description={data ? `${data.total.toLocaleString()} people` : "Search, review and manage customer accounts."} />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:p-5">
          <Input wrapperClassName="flex-1" placeholder="Search by name, email, phone or account number" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} leading={<Search className="size-4" />} aria-label="Search customers" />
          <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} wrapperClassName="sm:w-48" aria-label="Status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Accounts</th>
                <th className="text-right">Loans</th>
                <th>Joined</th>
                <th>Last sign in</th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={7}><Skeleton className="h-6" /></td></tr>)}
              {!loading &&
                data?.users.map((u: any) => (
                  <tr key={u.id} className="cursor-pointer" onClick={() => setOpenId(u.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.fullName}</p>
                          <p className="truncate text-xs text-fg-subtle">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize text-fg-muted">{u.role.replace("_", " ")}</td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="num text-right">{u._count.accounts}</td>
                    <td className="num text-right">{u._count.loans}</td>
                    <td className="text-fg-muted">{formatDate(u.createdAt)}</td>
                    <td className="text-fg-muted">{u.lastLogin ? formatRelative(u.lastLogin) : "Never"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && error && <p className="px-6 py-4 text-sm text-danger-600">{error}</p>}
        {!loading && data?.users.length === 0 && <EmptyState icon={<Users className="size-5" />} title="No customers found" description="Try a different search." />}
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

      <Modal open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} title="Customer details" size="xl">
        {openId && <CustomerDetail id={openId} onChanged={() => reload({ silent: true })} onClose={() => setOpenId(null)} />}
      </Modal>
    </div>
  );
}
