"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-success-50 text-success-600">
          <MailCheck className="size-6" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Check your email</h1>
          <p className="mt-1.5 text-fg-subtle">
            If an account exists for <span className="font-medium text-fg">{email}</span>, we&apos;ve sent a link to reset your password. It
            expires in one hour.
          </p>
        </div>
        <Button variant="secondary" block onClick={() => setSent(false)}>
          Use a different email
        </Button>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle hover:text-fg">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-fg-subtle">Enter the email you signed up with and we&apos;ll send you a reset link.</p>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leading={<Mail className="size-4" />}
        required
      />
      <Button type="submit" size="lg" block loading={loading} disabled={!/\S+@\S+\.\S+/.test(email)}>
        Send reset link
      </Button>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle hover:text-fg">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </form>
  );
}
