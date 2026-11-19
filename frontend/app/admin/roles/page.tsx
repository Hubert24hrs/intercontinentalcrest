"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, UserCog } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Avatar, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { useSessionContext } from "@/components/app/SessionContext";

const ROLE_INFO = [
  { role: "super_admin", title: "Super admin", body: "Everything an admin can do, plus managing other administrators and their roles. Set through the ADMIN_EMAIL / ADMIN_PASSWORD deployment settings." },
  { role: "admin", title: "Admin", body: "Customer management, balance adjustments, account freezes, loan and verification decisions, investment valuations and the support inbox." },
  { role: "customer", title: "Customer", body: "Their own accounts, payments, loans, investments, crypto and support chat. Nothing else." },
];

export default function RolesPage() {
  const { user: me } = useSessionContext();
  const isSuper = me?.role === "super_admin";
  const staff = useAsync(async () => {
    const [admins, supers] = await Promise.all([adminApi.getUsers({ role: "admin", limit: 100 }), adminApi.getUsers({ role: "super_admin", limit: 100 })]);
    return [...supers.users, ...admins.users] as any[];
  });

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const results = useAsync(() => (q.length >= 2 ? adminApi.getUsers({ search: q, role: "customer", limit: 8 }) : Promise.resolve({ users: [] })), [q]);

  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function setRole(u: any, role: "admin" | "customer") {
    const verb = role === "admin" ? `Give ${u.fullName} admin access?` : `Remove admin access from ${u.fullName}?`;
    if (!confirm(verb)) return;
    setBusy(u.id);
    setMsg(null);
    try {
      await adminApi.updateUserRole(u.id, role);
      setMsg({ tone: "success", text: role === "admin" ? `${u.fullName} is now an admin.` : `${u.fullName} is now a customer.` });
      staff.reload({ silent: true });
      results.reload({ silent: true });
    } catch (e: any) {
      setMsg({ tone: "danger", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Team & roles" description="Who can access the admin console, and what each role can do." />
      {msg && <Alert tone={msg.tone} className="mb-4">{msg.text}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="Administrators" icon={<ShieldCheck className="size-4" />} description={isSuper ? "You can grant and remove admin access." : "Only a super admin can change roles."} />
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {staff.loading && <li className="px-6 py-4"><Skeleton className="h-6" /></li>}
              {staff.data?.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Avatar name={u.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.fullName} {u.id === me?.id && <span className="text-fg-subtle">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-fg-subtle">
                      {u.email} · since {formatDate(u.createdAt)}
                    </p>
                  </div>
                  <Badge tone={u.role === "super_admin" ? "dark" : "brand"}>{u.role === "super_admin" ? "Super admin" : "Admin"}</Badge>
                  {isSuper && u.role === "admin" && (
                    <Button size="sm" variant="ghost" loading={busy === u.id} onClick={() => setRole(u, "customer")}>
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {isSuper && (
            <Card>
              <CardHeader title="Grant admin access" description="Search for an existing customer." icon={<UserCog className="size-4" />} />
              <div className="p-6">
                <Input placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} leading={<Search className="size-4" />} aria-label="Search customers" />
                <ul className="mt-3 divide-y divide-line">
                  {q.length >= 2 && !results.loading && results.data?.users.length === 0 && <EmptyState title="No customers found" className="py-6" />}
                  {results.data?.users.map((u: any) => (
                    <li key={u.id} className="flex items-center gap-3 py-3">
                      <Avatar name={u.fullName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.fullName}</p>
                        <p className="truncate text-xs text-fg-subtle">{u.email}</p>
                      </div>
                      <Button size="sm" variant="secondary" loading={busy === u.id} onClick={() => setRole(u, "admin")}>
                        Make admin
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="What each role can do" />
          <div className="space-y-5 p-6">
            {ROLE_INFO.map((r) => (
              <div key={r.role}>
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{r.body}</p>
              </div>
            ))}
            <p className="rounded-xl bg-surface p-4 text-xs leading-relaxed text-fg-subtle">
              Roles are checked by the server on every request, not just hidden in the menu. Role changes take effect immediately and are recorded in the audit log.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
