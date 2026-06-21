"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-brand-secondary text-xs">INTERCONTINENTAL</div>
            <div className="font-display font-bold text-brand-primary text-xs tracking-widest">CREST</div>
          </div>
        </Link>

        {!sent ? (
          <>
            <div className="mb-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-brand-primary" />
              </div>
              <h1 className="font-display font-bold text-brand-secondary text-2xl mb-2">Forgot Password?</h1>
              <p className="text-gray-500 text-sm">Enter your registered email and we&apos;ll send a secure reset link.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="fp-email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="fp-email"
                    type="email"
                    className="form-input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><span>Send Reset Link</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-6">
              Remembered it?{" "}
              <Link href="/login" className="text-brand-primary font-semibold hover:underline">Back to Login</Link>
            </p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-brand-secondary text-xl">Check Your Email</h2>
            <p className="text-gray-500 text-sm">
              If <strong className="text-brand-secondary">{email}</strong> is registered with us, you&apos;ll receive a password reset link within a few minutes.
            </p>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive it? Check spam or{" "}
              <button onClick={() => { setSent(false); setError(null); }} className="text-brand-primary hover:underline">try again</button>.
            </p>
            <Link href="/login" className="btn-primary inline-flex">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
