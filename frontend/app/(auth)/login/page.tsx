"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { cacheUser, landingFor } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

function nextParam(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  return p.get("next") || p.get("redirect");
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Already signed in? Skip the form.
  useEffect(() => {
    authApi
      .me({ redirectOn401: false })
      .then((r) => {
        if (r?.user) {
          cacheUser(r.user);
          router.replace(landingFor(r.user, nextParam()));
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (step === "2fa") codeRef.current?.focus();
  }, [step]);

  function finish(user: any) {
    cacheUser(user);
    router.replace(landingFor(user, nextParam()));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      if (res.require2Fa) {
        setTempToken(res.tempToken);
        setStep("2fa");
      } else {
        finish(res.user);
      }
    } catch (err: any) {
      setError(err.message || "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.authenticate2Fa(tempToken, code.trim());
      finish(res.user);
    } catch (err: any) {
      setError(err.message || "That code didn't work. Try again.");
      if (/expired/i.test(err.message || "")) {
        setStep("credentials");
        setCode("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === "2fa") {
    return (
      <form onSubmit={onVerify} className="space-y-6" noValidate>
        <div>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-5 text-[28px] font-semibold tracking-tight">Two factor verification</h1>
          <p className="mt-1.5 text-fg-subtle">Enter the 6 digit code from your authenticator app.</p>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <Input
          ref={codeRef}
          label="Authentication code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\d{6}"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="num text-center text-2xl tracking-[0.5em]"
          required
        />
        <Button type="submit" size="lg" block loading={loading} disabled={code.length !== 6}>
          Verify and sign in
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setCode("");
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle hover:text-fg"
        >
          <ArrowLeft className="size-4" /> Use a different account
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-fg-subtle">Sign in to your Intercontinental Crest account.</p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="space-y-4">
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
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" block loading={loading} disabled={!email || !password}>
        Sign in
      </Button>

      <p className="text-center text-sm text-fg-subtle">
        New to Intercontinental Crest?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Open an account
        </Link>
      </p>
    </form>
  );
}
