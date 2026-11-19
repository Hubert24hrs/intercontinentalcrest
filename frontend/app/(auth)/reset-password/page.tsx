"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { PasswordChecklist, passwordOk } from "@/components/auth/PasswordChecklist";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "We couldn't reset your password. Request a new link and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-6">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-success-50 text-success-600">
          <CheckCircle2 className="size-6" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Password updated</h1>
          <p className="mt-1.5 text-fg-subtle">You can now sign in with your new password.</p>
        </div>
        <ButtonLink href="/login" size="lg" block>
          Sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-1.5 text-fg-subtle">Make it something you haven&apos;t used here before.</p>
      </div>
      {token === "" && (
        <Alert tone="danger" title="This link is incomplete">
          Request a new reset link from the{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>{" "}
          page.
        </Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <div>
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordChecklist password={password} />
      </div>
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={confirm && confirm !== password ? "Passwords don't match" : null}
        required
      />
      <Button type="submit" size="lg" block loading={loading} disabled={!token || !passwordOk(password) || password !== confirm}>
        Update password
      </Button>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle hover:text-fg">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
