"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Phone, User } from "lucide-react";
import { authApi } from "@/lib/api";
import { cacheUser } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { PasswordChecklist, passwordOk } from "@/components/auth/PasswordChecklist";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "", terms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;
  const valid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    passwordOk(form.password) &&
    form.password === form.confirm &&
    form.terms;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const email = form.email.trim();
      await authApi.register({
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email,
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      const session = await authApi.login({ email, password: form.password });
      cacheUser(session.user);
      router.replace("/dashboard?welcome=1");
    } catch (err: any) {
      setError(err.message || "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Open your account</h1>
        <p className="mt-1.5 text-fg-subtle">It takes about two minutes. No paperwork.</p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} leading={<User className="size-4" />} required error={touched && !form.firstName.trim() ? "Required" : null} />
        <Input label="Last name" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} required error={touched && !form.lastName.trim() ? "Required" : null} />
      </div>
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={set("email")}
        leading={<Mail className="size-4" />}
        required
        error={touched && !/\S+@\S+\.\S+/.test(form.email) ? "Enter a valid email address" : null}
      />
      <Input label="Phone" optional type="tel" autoComplete="tel" placeholder="+1 555 010 2030" value={form.phone} onChange={set("phone")} leading={<Phone className="size-4" />} />
      <div>
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required />
        <PasswordChecklist password={form.password} />
      </div>
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={form.confirm}
        onChange={set("confirm")}
        required
        error={mismatch ? "Passwords don't match" : null}
      />

      <label className="flex items-start gap-3 text-sm text-fg-muted">
        <input type="checkbox" checked={form.terms} onChange={set("terms")} className="mt-0.5 size-4 rounded border-line-strong accent-brand-600" />
        <span>
          I understand this is a demo platform with simulated balances, and I agree to the{" "}
          <Link href="/terms" className="font-medium text-brand-700 hover:underline" target="_blank">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-brand-700 hover:underline" target="_blank">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {touched && !form.terms && <p className="field-error -mt-3">Please accept the terms to continue.</p>}

      <Button type="submit" size="lg" block loading={loading}>
        Create account
      </Button>

      <ul className="space-y-1.5 text-xs text-fg-subtle">
        {["Checking and savings accounts created instantly", "Crypto wallets for 7 assets", "Two factor authentication in Settings"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-brand-600" /> {t}
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-fg-subtle">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
