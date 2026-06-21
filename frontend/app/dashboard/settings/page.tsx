"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Lock, Bell, Shield, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff, Save } from "lucide-react";
import { authApi } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile tab
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password tab
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // 2FA
  const [show2FaSetup, setShow2FaSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Notifications (local-only preferences, persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState({
    txEmail: true, txPush: true,
    secEmail: true, secPush: true,
    stmtEmail: true, stmtPush: false,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "notifications", icon: Bell, label: "Notifications" },
  ];

  async function loadUser() {
    try {
      const res = await authApi.me();
      const u = res.user;
      setUser(u);
      setFullName(u.fullName || "");
      setPhone(u.phone || "");
    } catch (err) {
      console.error("Failed to load user settings", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    // Load saved notification preferences
    try {
      const saved = localStorage.getItem("notif_prefs");
      if (saved) setNotifPrefs(JSON.parse(saved));
    } catch {}
  }, []);

  // ── Profile save ────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await authApi.updateProfile({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setUser((prev: any) => ({ ...prev, ...updated }));
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "err", text: err.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  // ── Password change ──────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 12) {
      setPwMsg({ type: "err", text: "Password must be at least 12 characters." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ type: "ok", text: "Password changed successfully." });
    } catch (err: any) {
      setPwMsg({ type: "err", text: err.message || "Failed to change password." });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 4000);
    }
  };

  // ── 2FA ─────────────────────────────────────────────────────────────────────
  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await authApi.generate2Fa();
      setTwoFactorSecret(res.secret);
      setTwoFactorQr(res.qrCodeUrl);
      setShow2FaSetup(true);
    } catch (err: any) {
      setTwoFactorError(err.message || "Failed to generate 2FA token");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      await authApi.verify2Fa(twoFactorCode);
      setTwoFactorCode("");
      setShow2FaSetup(false);
      await loadUser();
    } catch (err: any) {
      setTwoFactorError(err.message || "Invalid authentication code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt("Enter the 6-digit code from your authenticator app to disable 2FA:");
    if (!code) return;
    setTwoFactorLoading(true);
    try {
      await authApi.disable2Fa(code);
      await loadUser();
    } catch (err: any) {
      alert(err.message || "Failed to disable 2FA. Invalid code.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // ── Notification prefs ───────────────────────────────────────────────────────
  const handleSaveNotifications = () => {
    localStorage.setItem("notif_prefs", JSON.stringify(notifPrefs));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  };

  const pwStrength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 12) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();
  const pwStrengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const pwStrengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"][pwStrength];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading settings...</p>
      </div>
    );
  }

  const Msg = ({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) =>
    msg ? (
      <div className={`flex items-start gap-2 p-3 rounded-xl text-sm border ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
        {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
        {msg.text}
      </div>
    ) : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your profile, password, 2FA, and notification preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? "bg-white text-brand-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && user && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-card space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-2xl font-bold uppercase shrink-0">
              {user.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <div className="font-display font-bold text-brand-secondary text-lg">{user.fullName}</div>
              <div className="text-gray-500 text-sm capitalize">{user.role} Account</div>
              <div className="flex items-center gap-1 text-green-600 text-xs mt-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account Active
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" className="form-input pl-10" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="form-input pl-10 bg-gray-50 cursor-not-allowed" value={user.email} readOnly />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed for security reasons.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" className="form-input pl-10" value={phone}
                  onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account ID</label>
              <input type="text" className="form-input font-mono bg-gray-50 text-xs cursor-not-allowed" value={user.id} readOnly />
            </div>
          </div>

          <Msg msg={profileMsg} />

          <button type="submit" disabled={profileSaving} className="btn-primary disabled:opacity-60">
            {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </button>
        </form>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-card space-y-5">
            <h2 className="font-display font-bold text-brand-secondary text-base">Change Password</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? "text" : "password"} className="form-input pl-10 pr-10"
                  placeholder="••••••••••••" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? "text" : "password"} className="form-input pl-10"
                  placeholder="Minimum 12 characters" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required minLength={12} />
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength ? pwStrengthColor : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${["", "text-red-500", "text-orange-400", "text-yellow-600", "text-green-600"][pwStrength]}`}>
                    {pwStrengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? "text" : "password"} className="form-input pl-10"
                  placeholder="Re-enter new password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <Msg msg={pwMsg} />

            <button type="submit" disabled={pwSaving} className="btn-primary disabled:opacity-60">
              {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
            </button>
          </form>

          {/* 2FA */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-card space-y-4">
            <h2 className="font-display font-bold text-brand-secondary text-base">Two-Factor Authentication</h2>

            {twoFactorError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                {twoFactorError}
              </div>
            )}

            {user?.twoFactorEnabled ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800 text-sm">2FA is Active</div>
                    <div className="text-green-600 text-xs">Your account is protected with Google Authenticator</div>
                  </div>
                </div>
                <button onClick={handleDisable2FA} disabled={twoFactorLoading}
                  className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline disabled:opacity-50">
                  {twoFactorLoading ? "Disabling..." : "Disable 2FA"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600">
                  Two-factor authentication adds an extra security layer requiring a 6-digit code from your authenticator app in addition to your password.
                </div>
                {!show2FaSetup ? (
                  <button onClick={handleSetup2FA} disabled={twoFactorLoading} className="btn-primary text-xs">
                    {twoFactorLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Set Up Two-Factor Authentication"}
                  </button>
                ) : (
                  <form onSubmit={handleConfirm2FA} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <h3 className="font-bold text-sm text-brand-secondary">Configure Authenticator App</h3>
                    <p className="text-xs text-gray-500">Scan the QR code or manually enter the key into Google Authenticator or Microsoft Authenticator.</p>
                    {twoFactorQr && (
                      <div className="flex justify-center p-3 bg-white border border-gray-200 rounded-2xl w-40 h-40 mx-auto">
                        <img src={twoFactorQr} alt="2FA QR Code" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="text-center">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Manual Entry Key</span>
                      <div className="font-mono text-xs font-bold bg-white border border-gray-200 rounded-lg py-2 px-3 tracking-widest text-brand-secondary select-all mt-1">
                        {twoFactorSecret}
                      </div>
                    </div>
                    <div className="space-y-2 max-w-xs mx-auto">
                      <label className="block text-center text-xs font-semibold text-gray-600">Enter 6-digit confirmation code</label>
                      <input type="text" maxLength={6} className="form-input text-center tracking-widest font-bold font-mono"
                        placeholder="000000" value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))} required />
                    </div>
                    <div className="flex gap-2 max-w-xs mx-auto">
                      <button type="submit" disabled={twoFactorLoading} className="flex-1 btn-primary text-xs py-2 justify-center">
                        {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Enable"}
                      </button>
                      <button type="button" onClick={() => setShow2FaSetup(false)}
                        className="px-4 py-2 border border-gray-200 text-xs rounded-full font-semibold hover:bg-white">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-card space-y-2">
          <h2 className="font-display font-bold text-brand-secondary mb-4">Notification Preferences</h2>

          {[
            { key: "tx",   label: "Transaction Alerts",  desc: "Real-time alerts for deposits, transfers, and payments",       email: "txEmail",   push: "txPush" },
            { key: "sec",  label: "Security Warnings",   desc: "Alerts for new logins, password changes, and 2FA events",      email: "secEmail",  push: "secPush" },
            { key: "stmt", label: "Monthly Statements",  desc: "Digital account statement notifications",                       email: "stmtEmail", push: "stmtPush" },
          ].map((n) => (
            <div key={n.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-3">
              <div>
                <div className="font-semibold text-brand-secondary text-sm">{n.label}</div>
                <div className="text-gray-500 text-xs">{n.desc}</div>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-500 shrink-0">
                {([["Email", n.email], ["Push", n.push]] as [string, string][]).map(([ch, key]) => (
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifPrefs[key as keyof typeof notifPrefs]}
                      onChange={(e) => setNotifPrefs(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded text-brand-primary accent-brand-primary"
                    />
                    <span className="capitalize">{ch}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button onClick={handleSaveNotifications} className={`btn-primary transition-colors ${notifSaved ? "!bg-green-600" : ""}`}>
              {notifSaved ? <><CheckCircle2 className="w-4 h-4" /> Preferences Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
