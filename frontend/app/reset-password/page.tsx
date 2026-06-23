"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe, Lock, ArrowRight, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Missing or invalid reset token. Please request a new reset link.");
  }, [token]);

  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 12) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-display font-bold text-brand-secondary text-xl">Password Reset!</h2>
        <p className="text-gray-500 text-sm">Your password has been updated successfully. You can now log in with your new password.</p>
        <Link href="/login" className="btn-primary inline-flex">Go to Login <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-brand-primary" />
        </div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl mb-2">Set New Password</h1>
        <p className="text-gray-500 text-sm">Choose a strong password for your account.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPw ? "text" : "password"}
              className="form-input pl-10 pr-10"
              placeholder="Minimum 12 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={12}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-gray-200"}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${["", "text-red-500", "text-orange-400", "text-yellow-600", "text-green-600"][strength]}`}>
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPw ? "text" : "password"}
              className="form-input pl-10"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
            : <><span>Reset Password</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-6">
        <Link href="/forgot-password" className="text-brand-primary hover:underline">Request a new reset link</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div className="text-center text-gray-500 text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
