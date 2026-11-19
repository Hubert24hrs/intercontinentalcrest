"use client";

import { Fragment, useState } from "react";
import { ChevronDown, FileClock } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatDateTime, titleCase } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

function pretty(raw: string | null) {
  if (!raw) return "None";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function tone(action: string) {
  if (/DELETE|DEBIT|FREEZE|REJECT|SUSPEND/.test(action)) return "danger" as const;
  if (/CREDIT|APPROVE/.test(action)) return "success" as const;
  return "info" as const;
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const { data, loading, error } = useAsync(() => adminApi.getAuditLogs(page, 50), [page]);

  return (
    <div>
      <PageHeader title="Audit log" description="A permanent record of every administrative action." />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={6}><Skeleton className="h-6" /></td></tr>)}
              {!loading &&
                data?.logs.map((l: any) => (
                  <Fragment key={l.id}>
                    <tr className="cursor-pointer" onClick={() => setOpen(open === l.id ? null : l.id)}>
                      <td className="whitespace-nowrap text-fg-muted">{formatDateTime(l.createdAt)}</td>
                      <td>
                        <p className="font-medium">{l.user?.fullName || "Deleted user"}</p>
                        <p className="text-xs text-fg-subtle">{l.user?.email}</p>
                      </td>
                      <td>
                        <Badge tone={tone(l.action)}>{titleCase(l.action.toLowerCase())}</Badge>
                      </td>
                      <td>
                        <p>{l.entityType || "N/A"}</p>
                        <p className="font-mono text-xs text-fg-subtle">{l.entityId?.slice(0, 8)}</p>
                      </td>
                      <td className="font-mono text-xs text-fg-muted">{l.ipAddress || "N/A"}</td>
                      <td className="text-right">
                        <ChevronDown className={cn("ml-auto size-4 text-fg-subtle transition-transform", open === l.id && "rotate-180")} />
                      </td>
                    </tr>
                    {open === l.id && (
                      <tr className="hover:bg-transparent">
                        <td colSpan={6} className="bg-surface">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold text-fg-subtle">Before</p>
                              <pre className="overflow-x-auto rounded-xl border border-line bg-white p-3 font-mono text-xs">{pretty(l.oldValues)}</pre>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold text-fg-subtle">After</p>
                              <pre className="overflow-x-auto rounded-xl border border-line bg-white p-3 font-mono text-xs">{pretty(l.newValues)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && error && <p className="px-6 py-4 text-sm text-danger-600">{error}</p>}
        {!loading && data?.logs.length === 0 && <EmptyState icon={<FileClock className="size-5" />} title="No audit entries yet" />}
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
