"use client";

import { useState } from "react";
import Image from "next/image";
import { KeyRound, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import { authApi } from "@/lib/api";
import { useSessionContext } from "@/components/app/SessionContext";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { PasswordChecklist, passwordOk } from "@/components/auth/PasswordChecklist";

export function ProfileCard() {
  const { user, updateUser } = useSessionContext();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const updated = await authApi.updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      updateUser({ fullName: updated.fullName, phone: updated.phone });
      setMsg({ tone: "success", text: "Profile updated." });
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Personal details" description="How we address you and reach you." icon={<UserRound className="size-4" />} />
      <form onSubmit={save} className="space-y-4 p-6">
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={80} />
        <Input label="Email address" value={user?.email || ""} disabled hint="Contact support to change your email address." />
        <Input label="Phone" optional type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 010 2030" />
        {user?.createdAt && <p className="text-xs text-fg-subtle">Customer since {formatDate(user.createdAt, "long")}</p>}
        <Button type="submit" loading={busy} disabled={fullName.trim().length < 2}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

export function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: next });
      setMsg({ tone: "success", text: "Password changed." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Password" description="Use a long, unique password." icon={<KeyRound className="size-4" />} />
      <form onSubmit={save} className="space-y-4 p-6">
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <div>
          <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
          <PasswordChecklist password={next} />
        </div>
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirm && confirm !== next ? "Passwords don't match" : null}
          required
        />
        <Button type="submit" loading={busy} disabled={!current || !passwordOk(next) || next !== confirm}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

export function TwoFactorCard() {
  const { user, updateUser } = useSessionContext();
  const enabled = !!user?.twoFactorEnabled;
  const [setup, setSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function begin() {
    setBusy(true);
    setMsg(null);
    try {
      setSetup(await authApi.generate2Fa());
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (enabled) {
        await authApi.disable2Fa(code);
        updateUser({ twoFactorEnabled: false });
        setMsg({ tone: "success", text: "Two factor authentication is off." });
      } else {
        await authApi.verify2Fa(code);
        updateUser({ twoFactorEnabled: true });
        setSetup(null);
        setMsg({ tone: "success", text: "Two factor authentication is on. You'll be asked for a code each time you sign in." });
      }
      setCode("");
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Two factor authentication"
        description="Require a code from an authenticator app when you sign in."
        icon={enabled ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
        action={<StatusBadge status={enabled ? "active" : "inactive"} label={enabled ? "On" : "Off"} />}
      />
      <div className="space-y-4 p-6">
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        {!enabled && !setup && (
          <Button onClick={begin} loading={busy}>
            Turn on two factor authentication
          </Button>
        )}
        {!enabled && setup && (
          <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-start">
            <Image src={setup.qrCodeUrl} alt="QR code for your authenticator app" width={180} height={180} className="rounded-xl border border-line" unoptimized />
            <div className="space-y-3 text-sm text-fg-muted">
              <p>1. Scan the QR code with Google Authenticator, 1Password, Authy or a similar app.</p>
              <p>
                Can&apos;t scan? Enter this key: <code className="break-all rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] text-fg">{setup.secret}</code>
              </p>
              <p>2. Enter the 6 digit code it shows.</p>
            </div>
          </div>
        )}
        {(enabled || setup) && (
          <form onSubmit={confirmCode} className="flex flex-wrap items-end gap-3">
            <Input
              label={enabled ? "Code to turn off 2FA" : "6 digit code"}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="num w-40 tracking-[0.3em]"
            />
            <Button type="submit" variant={enabled ? "danger" : "accent"} loading={busy} disabled={code.length !== 6}>
              {enabled ? "Turn off" : "Verify and turn on"}
            </Button>
            {setup && (
              <Button variant="ghost" onClick={() => setSetup(null)} disabled={busy}>
                Cancel
              </Button>
            )}
          </form>
        )}
      </div>
    </Card>
  );
}
