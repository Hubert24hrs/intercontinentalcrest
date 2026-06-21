"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Lock, Bell, Shield, CheckCircle2, Loader2,
  AlertCircle, Eye, EyeOff, Save, Key, Smartphone, ToggleLeft,
  ToggleRight, Camera, BadgeCheck
} from "lucide-react";
import { authApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [show2FaSetup, setShow2FaSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const [notifPrefs, setNotifPrefs] = useState({ txEmail: true, txPush: true, secEmail: true, secPush: true, stmtEmail: true, stmtPush: false });
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
    try {
      const saved = localStorage.getItem("notif_prefs");
      if (saved) setNotifPrefs(JSON.parse(saved));
    } catch {}
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await authApi.updateProfile({ fullName: fullName.trim() || undefined, phone: phone.trim() || undefined });
      setUser((prev: any) => ({ ...prev, ...updated }));
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "err", text: err.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMsg({ type: "err", text: "New passwords do not match." }); return; }
    if (newPassword.length < 12) { setPwMsg({ type: "err", text: "Password must be at least 12 characters." }); return; }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwMsg({ type: "ok", text: "Password changed successfully." });
    } catch (err: any) {
      setPwMsg({ type: "err", text: err.message || "Failed to change password." });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 4000);
    }
  };

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
      setTwoFactorCode(""); setShow2FaSetup(false);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A2342] to-brand-primary flex items-center justify-center shadow-lg animate-pulse">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />Loading account settings...
        </div>
      </div>
    );
  }

  const Msg = ({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) =>
    msg ? (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={`flex items-start gap-2 p-3.5 rounded-xl text-sm border ${msg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
        {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
        {msg.text}
      </motion.div>
    ) : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-[#0078B3] flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your profile, password, 2FA, and notifications</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? "bg-white text-brand-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && user && (
          <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {/* Profile hero card */}
            <div className="relative overflow-hidden rounded-3xl mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0A2342] to-[#0d3060]" />
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand-primary/10 blur-3xl -translate-y-12 translate-x-12" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
              <div className="relative text-white p-6 flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-violet-500 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg">
                    {user.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0A2342] flex items-center justify-center">
                    <BadgeCheck className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-xl text-white">{user.fullName}</div>
                  <div className="text-white/50 text-sm capitalize mt-0.5">{user.role} Account</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Active</span>
                    {user.twoFactorEnabled && <span className="text-[10px] bg-brand-primary/20 border border-brand-primary/30 text-brand-primary px-2 py-0.5 rounded-full font-bold">2FA Enabled</span>}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" className="form-input pl-10" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" className="form-input pl-10 bg-gray-50 cursor-not-allowed text-gray-400" value={user.email} readOnly />
                  </div>
                  <p className="text-[11px] text-gray-400">Email cannot be changed for security reasons.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" className="form-input pl-10" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Account ID</label>
                  <input type="text" className="form-input font-mono bg-gray-50 text-xs cursor-not-allowed text-gray-400" value={user.id} readOnly />
                </div>
              </div>
              <Msg msg={profileMsg} />
              <button type="submit" disabled={profileSaving} className="btn-primary disabled:opacity-60">
                {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === "security" && (
          <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-5">
            {/* Security status bar */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Password", status: "Protected", icon: Key, ok: true },
                { label: "Two-Factor Auth", status: user?.twoFactorEnabled ? "Enabled" : "Disabled", icon: Smartphone, ok: user?.twoFactorEnabled },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${s.ok ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.ok ? "bg-emerald-100" : "bg-amber-100"}`}>
                    <s.icon className={`w-4 h-4 ${s.ok ? "text-emerald-600" : "text-amber-600"}`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-700">{s.label}</div>
                    <div className={`text-[10px] font-semibold ${s.ok ? "text-emerald-600" : "text-amber-600"}`}>{s.status}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-5">
              <h2 className="font-display font-bold text-brand-secondary text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-primary" />Change Password
              </h2>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? "text" : "password"} className="form-input pl-10 pr-10" placeholder="••••••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? "text" : "password"} className="form-input pl-10" placeholder="Minimum 12 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={12} />
                </div>
                {newPassword && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className={`h-1.5 flex-1 rounded-full transition-colors origin-left ${i <= pwStrength ? pwStrengthColor : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold ${["", "text-red-500", "text-orange-400", "text-yellow-600", "text-green-600"][pwStrength]}`}>{pwStrengthLabel}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? "text" : "password"} className="form-input pl-10" placeholder="Re-enter new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                {confirmPassword && confirmPassword !== newPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              </div>
              <Msg msg={pwMsg} />
              <button type="submit" disabled={pwSaving} className="btn-primary disabled:opacity-60">
                {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : <><Lock className="w-4 h-4" />Update Password</>}
              </button>
            </form>

            {/* 2FA */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
              <h2 className="font-display font-bold text-brand-secondary text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-brand-primary" />Two-Factor Authentication
              </h2>
              {twoFactorError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{twoFactorError}
                </div>
              )}
              {user?.twoFactorEnabled ? (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-800 text-sm">2FA is Active</div>
                      <div className="text-emerald-600 text-xs">Protected with Google Authenticator</div>
                    </div>
                  </div>
                  <button onClick={handleDisable2FA} disabled={twoFactorLoading} className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline disabled:opacity-50">
                    {twoFactorLoading ? "Disabling..." : "Disable 2FA"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-600">
                    Add an extra layer of security by requiring a 6-digit code from your authenticator app along with your password.
                  </div>
                  {!show2FaSetup ? (
                    <button onClick={handleSetup2FA} disabled={twoFactorLoading} className="btn-primary text-xs">
                      {twoFactorLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : "Set Up Two-Factor Authentication"}
                    </button>
                  ) : (
                    <form onSubmit={handleConfirm2FA} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                      <h3 className="font-bold text-sm text-brand-secondary">Configure Authenticator App</h3>
                      <p className="text-xs text-gray-500">Scan the QR code with Google or Microsoft Authenticator.</p>
                      {twoFactorQr && (
                        <div className="flex justify-center p-3 bg-white border border-gray-200 rounded-2xl w-40 h-40 mx-auto">
                          <img src={twoFactorQr} alt="2FA QR Code" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="text-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Manual Entry Key</span>
                        <div className="font-mono text-xs font-bold bg-white border border-gray-200 rounded-lg py-2 px-3 tracking-widest text-brand-secondary select-all mt-1">{twoFactorSecret}</div>
                      </div>
                      <div className="space-y-2 max-w-xs mx-auto">
                        <label className="block text-center text-xs font-semibold text-gray-600">Enter 6-digit confirmation code</label>
                        <input type="text" maxLength={6} className="form-input text-center tracking-widest font-bold font-mono text-xl" placeholder="000000" value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ""))} required />
                      </div>
                      <div className="flex gap-2 max-w-xs mx-auto">
                        <button type="submit" disabled={twoFactorLoading} className="flex-1 btn-primary text-xs py-2 justify-center">
                          {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Enable"}
                        </button>
                        <button type="button" onClick={() => setShow2FaSetup(false)} className="px-4 py-2 border border-gray-200 text-xs rounded-full font-semibold hover:bg-white">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-1">
              <h2 className="font-display font-bold text-brand-secondary text-base flex items-center gap-2 mb-5">
                <Bell className="w-4 h-4 text-brand-primary" />Notification Preferences
              </h2>
              {[
                { key: "tx",   label: "Transaction Alerts",  desc: "Real-time alerts for deposits, transfers, and payments",  email: "txEmail",   push: "txPush" },
                { key: "sec",  label: "Security Warnings",   desc: "Alerts for new logins, password changes, and 2FA events", email: "secEmail",  push: "secPush" },
                { key: "stmt", label: "Monthly Statements",  desc: "Digital account statement notifications",                  email: "stmtEmail", push: "stmtPush" },
              ].map((n) => (
                <div key={n.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-3">
                  <div>
                    <div className="font-semibold text-brand-secondary text-sm">{n.label}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{n.desc}</div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    {([["Email", n.email], ["Push", n.push]] as [string, string][]).map(([ch, key]) => (
                      <label key={ch} className="flex items-center gap-2 cursor-pointer select-none group">
                        <button
                          type="button"
                          onClick={() => setNotifPrefs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                          className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                          style={{ backgroundColor: notifPrefs[key as keyof typeof notifPrefs] ? "#00B7F1" : "#e5e7eb" }}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifPrefs[key as keyof typeof notifPrefs] ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                        <span className="text-xs font-semibold text-gray-500">{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-3">
                <button onClick={handleSaveNotifications} className={`btn-primary transition-colors ${notifSaved ? "!from-emerald-500 !to-emerald-600" : ""}`}>
                  {notifSaved ? <><CheckCircle2 className="w-4 h-4" />Preferences Saved!</> : <><Save className="w-4 h-4" />Save Preferences</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
