"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";

const steps = ["Personal Info", "Contact & Security"];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "12+ characters", ok: password.length >= 12 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      {password && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Strength: <span className={`font-semibold text-${score >= 4 ? "green" : score >= 3 ? "blue" : "orange"}-500`}>{labels[score - 1] || "Very Weak"}</span>
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${c.ok ? "bg-green-500" : "bg-gray-200"}`} />
            <span className={`text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "",
    email: "", phone: "", password: "", confirmPassword: "",
    terms: false, emailCode: "", phoneCode: "",
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (step === 1) {
      if (form.password !== form.confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await authApi.register({
          fullName: `${form.firstName} ${form.lastName}`,
          email: form.email,
          password: form.password,
          phone: form.phone,
        });

        // Auto-login after successful registration
        await authApi.login({
          email: form.email,
          password: form.password,
        });

        window.location.href = "/dashboard";
      } catch (err: any) {
        setErrorMsg(err.message || "Registration failed. Please check your inputs.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left decorative panel */}
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
        <div className="relative z-10 space-y-4">
          {[
            "No monthly fees for your first year",
            "Earn 4.5% APY on savings accounts",
            "Free international transfers",
            "24/7 customer support",
            "FDIC insured up to $250,000",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
              <span className="text-white text-sm">{benefit}</span>
            </div>
          ))}
        </div>
        <div className="relative z-10 flex items-center gap-2 text-gray-400 text-xs">
          <Shield className="w-4 h-4 text-brand-primary" />
          Your information is encrypted & secure
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-brand-secondary text-sm">Intercontinental Crest</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step ? "bg-brand-primary text-white" :
                  i === step ? "bg-brand-primary text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-brand-secondary" : "text-gray-400"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? "bg-brand-primary" : "bg-gray-200"}`} style={{ width: 20 }} />}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="font-display font-bold text-brand-secondary text-2xl mb-1">
              {step === 0 ? "Create your account" : "Contact & Security"}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 0 ? "Join millions of customers worldwide." : "Secure your account with a strong password."}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-fname">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input id="reg-fname" type="text" className="form-input pl-10" placeholder="John" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-lname">Last Name</label>
                    <input id="reg-lname" type="text" className="form-input" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-dob">Date of Birth</label>
                  <input id="reg-dob" type="date" className="form-input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-email">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="reg-email" type="email" className="form-input pl-10" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-phone">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="reg-phone" type="tel" className="form-input pl-10" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-pass">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="reg-pass" type={showPass ? "text" : "password"} className="form-input pl-10 pr-10" placeholder="Min. 12 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Toggle password">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reg-confirm">Confirm Password</label>
                  <input id="reg-confirm" type="password" className={`form-input ${form.confirmPassword && form.password !== form.confirmPassword ? "border-red-400" : ""}`} placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required autoComplete="new-password" />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <input id="reg-terms" type="checkbox" className="mt-0.5 w-4 h-4 rounded" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} required />
                  <label htmlFor="reg-terms" className="text-xs text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="text-brand-primary hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</Link>
                  </label>
                </div>
              </>
            )}


            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === steps.length - 1 ? "Create Account" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="w-full text-center text-xs text-gray-500 hover:text-brand-primary transition-colors mt-3">
              ← Back
            </button>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
