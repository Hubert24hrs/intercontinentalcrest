"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { authApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [form, setForm] = useState({ email: "", password: "", remember: false, code: "" });
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Warm up the backend while the user is filling in the form so the
  // cold-start penalty is paid before — not after — they click Sign In.
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' }).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await authApi.login({
        email: form.email,
        password: form.password,
      });

      if (result.require2Fa) {
        setTempToken(result.tempToken);
        setStep("2fa");
      } else {
        // Cache user so the dashboard renders instantly without an extra /me round-trip
        if (result.user) {
          localStorage.setItem('cachedUser', JSON.stringify(result.user));
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await authApi.authenticate2Fa(tempToken, form.code);
      if (r?.user) localStorage.setItem('cachedUser', JSON.stringify(r.user));
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid 2FA verification code.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-brand-secondary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-accent blur-3xl" />
        </div>
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-xs">INTERCONTINENTAL</div>
            <div className="font-display font-bold text-brand-primary text-xs tracking-widest">CREST</div>
          </div>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-white">
            <p className="font-display font-bold text-3xl leading-tight mb-6">
              &ldquo;Banking that works for you, wherever you are in the world.&rdquo;
            </p>
          </blockquote>
          <div className="flex items-center gap-6">
            {[
              { value: "5M+", label: "Customers" },
              { value: "50+", label: "Countries" },
              { value: "$2.4B", label: "Managed" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display font-bold text-brand-primary text-2xl">{s.value}</div>
                <div className="text-gray-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-gray-400 text-xs">
          <Shield className="w-4 h-4 text-brand-primary" />
          256-bit encrypted & FDIC insured
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-md mx-auto w-full lg:max-w-none lg:w-auto">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-brand-secondary text-sm">Intercontinental Crest</span>
        </Link>

        <div className="w-full max-w-sm">
          {step === "login" ? (
            <>
              <div className="mb-8">
                <h1 className="font-display font-bold text-brand-secondary text-2xl mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-500 text-sm">
                  Sign in to your account to continue
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2" htmlFor="login-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="login-email"
                      type="email"
                      className="form-input pl-10"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-700" htmlFor="login-pass">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-brand-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="login-pass"
                      type={showPass ? "text" : "password"}
                      className="form-input pl-10 pr-10"
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  />
                  <label htmlFor="remember" className="text-xs text-gray-600">
                    Remember this device for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-brand-primary font-semibold hover:underline">
                  Sign up for free
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-brand-primary" />
                </div>
                <h1 className="font-display font-bold text-brand-secondary text-2xl mb-2">
                  Two-Factor Authentication
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter the 6-digit code from your authenticator app or sent to your phone.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handle2FA} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2" htmlFor="2fa-code">
                    Authentication Code
                  </label>
                  <input
                    id="2fa-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className="form-input text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("login")}
                  className="w-full text-center text-xs text-gray-500 hover:text-brand-primary transition-colors"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
