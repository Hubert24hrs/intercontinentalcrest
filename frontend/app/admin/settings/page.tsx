"use client";

import { Server } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { request } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { PageHeader, Skeleton } from "@/components/ui/misc";
import { PasswordCard, ProfileCard, TwoFactorCard } from "@/components/app/AccountCards";

export default function AdminSettingsPage() {
  const health = useAsync(() => request<{ status: string; timestamp: string }>("", { redirectOn401: false }));

  return (
    <div>
      <PageHeader title="Settings" description="Your administrator profile and security." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <ProfileCard />
          <PasswordCard />
          <TwoFactorCard />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Platform status" icon={<Server className="size-4" />} />
            <div className="space-y-3 p-6 text-sm">
              {health.loading ? (
                <Skeleton className="h-6" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-fg-subtle">API</span>
                  <StatusBadge status={health.data?.status === "ok" ? "active" : "failed"} label={health.data?.status === "ok" ? "Operational" : "Unreachable"} />
                </div>
              )}
              {health.data?.timestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-fg-subtle">Server time</span>
                  <span>{formatDateTime(health.data.timestamp)}</span>
                </div>
              )}
            </div>
          </Card>
          <Card className="p-6 text-sm leading-relaxed text-fg-muted">
            <p className="font-semibold text-fg">Super admin login</p>
            <p className="mt-2">
              The super admin email and password are managed by the <code className="rounded bg-surface px-1 font-mono text-xs">ADMIN_EMAIL</code> and{" "}
              <code className="rounded bg-surface px-1 font-mono text-xs">ADMIN_PASSWORD</code> settings of the backend deployment and are applied again every time the server starts. Change them there to change the
              super admin password. A password changed on this page is replaced at the next restart.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
