"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { kycApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatDateTime, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Avatar, EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/misc";

export default function KycPage() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "">("pending");
  const { data, loading, error, reload } = useAsync(() => kycApi.getAllKyc({ status: status || undefined, limit: 100 }), [status]);
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected") {
    if (!reviewing) return;
    setBusy(decision);
    setErr(null);
    try {
      await kycApi.reviewKyc(reviewing.id, { status: decision, reviewerNotes: notes.trim() || undefined });
      setReviewing(null);
      setNotes("");
      reload({ silent: true });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Identity verification" description="Review customer verification submissions." />
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
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-[720px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Document</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Reviewer</th>
                <th className="text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2].map((i) => <tr key={i}><td colSpan={6}><Skeleton className="h-6" /></td></tr>)}
              {!loading &&
                data?.kycs.map((k: any) => (
                  <tr key={k.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={k.user?.fullName} />
                        <div>
                          <p className="font-medium">{k.user?.fullName}</p>
                          <p className="text-xs text-fg-subtle">{k.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{titleCase(k.documentType)}</td>
                    <td className="text-fg-muted">{formatDateTime(k.submittedAt)}</td>
                    <td>
                      <StatusBadge status={k.status} />
                    </td>
                    <td className="text-fg-muted">{k.reviewer?.fullName || "N/A"}</td>
                    <td className="text-right">
                      {k.status === "pending" && (
                        <Button size="sm" variant="secondary" onClick={() => setReviewing(k)}>
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && error && <p className="px-6 py-4 text-sm text-danger-600">{error}</p>}
        {!loading && data?.kycs.length === 0 && <EmptyState icon={<BadgeCheck className="size-5" />} title="Nothing here" description="No submissions match this filter." />}
      </Card>

      <Modal
        open={!!reviewing}
        onOpenChange={(o) => !o && setReviewing(null)}
        title="Review verification"
        description={reviewing ? `${reviewing.user?.fullName} · ${titleCase(reviewing.documentType)}` : undefined}
        footer={
          <>
            <Button variant="danger" loading={busy === "rejected"} disabled={!!busy} onClick={() => decide("rejected")}>
              Reject
            </Button>
            <Button variant="accent" loading={busy === "approved"} disabled={!!busy} onClick={() => decide("approved")}>
              Approve
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {err && <Alert tone="danger">{err}</Alert>}
          {reviewing && (
            <dl className="divide-y divide-line rounded-2xl border border-line px-4 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-fg-subtle">Email</dt>
                <dd>{reviewing.user?.email}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-fg-subtle">Phone</dt>
                <dd>{reviewing.user?.phone || "N/A"}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-fg-subtle">Documents</dt>
                <dd>{reviewing.documentFrontUrl ? "Provided" : "None attached (demo)"}</dd>
              </div>
            </dl>
          )}
          <Textarea label="Notes to the customer" optional rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Shown to the customer if you reject." />
        </div>
      </Modal>
    </div>
  );
}
