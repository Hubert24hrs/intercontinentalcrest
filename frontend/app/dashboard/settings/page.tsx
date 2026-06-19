"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Bell, Shield, Camera, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 2FA Setup state
  const [show2FaSetup, setShow2FaSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "notifications", icon: Bell, label: "Notifications" },
  ];

  async function loadUser() {
    try {
      const res = await authApi.me();
      setUser(res.user);
    } catch (err) {
      console.error("Failed to load user settings", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await authApi.generate2Fa();
      // Expecting { secret, qrCodeUrl }
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
      // reload user details
      await loadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setTwoFactorError(err.message || "Invalid authentication code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt("Please enter the 6-digit 2FA code from your Google Authenticator app to disable 2FA:");
    if (!code) return;

    setTwoFactorLoading(true);
    try {
      await authApi.disable2Fa(code);
      await loadUser();
      alert("Two-factor authentication disabled successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to disable two-factor authentication. Invalid code.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading security configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your personal settings, password, and two-factor authentication.</p>
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

      {activeTab === "profile" && user && (
        <div className="dashboard-card space-y-6 bg-white border border-gray-100 p-6 rounded-2xl">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center text-white text-2xl font-bold uppercase">
                {user.fullName.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-brand-secondary rounded-full flex items-center justify-center border-2 border-white hover:bg-brand-primary transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div>
              <div className="font-display font-bold text-brand-secondary text-lg">{user.fullName}</div>
              <div className="text-gray-500 text-sm">{user.role.toUpperCase()} Account</div>
              <div className="flex items-center gap-1 text-green-600 text-xs mt-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account Verified
              </div>
            </div>
          </div>
          <div className="divider border-b border-gray-100 my-4" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" className="form-input pl-10" defaultValue={user.fullName} readOnly />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="form-input pl-10" defaultValue={user.email} readOnly />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" className="form-input pl-10" defaultValue={user.phone || "Not set"} readOnly />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">User Identifier</label>
              <input type="text" className="form-input font-mono bg-gray-50" defaultValue={user.id} readOnly />
            </div>
          </div>

          <button onClick={handleSaveProfile} className={`btn-primary ${saved ? "!bg-green-600" : ""} transition-colors`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Profile Updated!</> : "Save Preferences"}
          </button>
        </div>
      )}

      {activeTab === "security" && user && (
        <div className="space-y-6">
          <div className="dashboard-card space-y-5 bg-white border border-gray-100 p-6 rounded-2xl">
            <h2 className="font-display font-bold text-brand-secondary text-base">Change Password</h2>
            {[
              { id: "s-curpass", label: "Current Password" },
              { id: "s-newpass", label: "New Password" },
              { id: "s-conpass", label: "Confirm New Password" },
            ].map(({ id, label }) => (
              <div key={id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor={id}>{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id={id} type="password" className="form-input pl-10" placeholder="••••••••••••" />
                </div>
              </div>
            ))}
            <button onClick={handleSaveProfile} className="btn-primary">Update Password</button>
          </div>

          {/* Two-Factor Authentication Console */}
          <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl space-y-4">
            <h2 className="font-display font-bold text-brand-secondary text-base">Two-Factor Authentication</h2>
            
            {twoFactorError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{twoFactorError}</span>
              </div>
            )}

            {user.twoFactorEnabled ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800 text-sm">2FA Security is Active</div>
                    <div className="text-green-600 text-xs">Protects logins and transfers via Google Authenticator app</div>
                  </div>
                </div>
                <button 
                  onClick={handleDisable2FA}
                  disabled={twoFactorLoading}
                  className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline disabled:opacity-50"
                >
                  {twoFactorLoading ? "Disabling..." : "Disable 2FA"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600">
                  Two-factor authentication adds an extra layer of security to your account by requiring a 6-digit verification code from your authenticator app in addition to your password.
                </div>
                
                {!show2FaSetup ? (
                  <button 
                    onClick={handleSetup2FA} 
                    disabled={twoFactorLoading}
                    className="btn-primary text-xs"
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Generating Key...
                      </>
                    ) : (
                      "Set Up Two-Factor Authentication"
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleConfirm2FA} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <h3 className="font-bold text-sm text-brand-secondary">Configure Authenticator App</h3>
                    <p className="text-xs text-gray-500">
                      Scan the QR code or manually enter the key below into Google Authenticator or Microsoft Authenticator.
                    </p>

                    {twoFactorQr && (
                      <div className="flex justify-center p-3 bg-white border border-gray-200 rounded-2xl w-40 h-40 mx-auto">
                        <img src={twoFactorQr} alt="2FA QR Code" className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div className="text-center">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Security Key</span>
                      <div className="font-mono text-xs font-bold bg-white border border-gray-200 rounded-lg py-2 px-3 tracking-widest text-brand-secondary select-all">
                        {twoFactorSecret}
                      </div>
                    </div>

                    <div className="space-y-2 max-w-xs mx-auto">
                      <label className="block text-center text-xs font-semibold text-gray-600">
                        Enter 6-digit confirmation code
                      </label>
                      <input 
                        type="text" 
                        maxLength={6} 
                        className="form-input text-center tracking-widest font-bold font-mono"
                        placeholder="000000"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-2 max-w-xs mx-auto">
                      <button 
                        type="submit" 
                        disabled={twoFactorLoading}
                        className="flex-1 btn-primary text-xs py-2 justify-center"
                      >
                        {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Enable"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShow2FaSetup(false)} 
                        className="px-4 py-2 border border-gray-200 text-xs rounded-full font-semibold hover:bg-white"
                      >
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

      {activeTab === "notifications" && (
        <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl space-y-4">
          <h2 className="font-display font-bold text-brand-secondary mb-2">Notification Preferences</h2>
          {[
            { label: "Transaction Alerts", desc: "Receive real-time alerts for deposits and transfers", email: true, push: true },
            { label: "Security Warnings", desc: "Alerts for login attempts from new devices or passwords changes", email: true, push: true },
            { label: "Monthly Statements", desc: "Digital bank account statement updates", email: true, push: false },
          ].map((n) => (
            <div key={n.label} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-3">
              <div>
                <div className="font-semibold text-brand-secondary text-sm">{n.label}</div>
                <div className="text-gray-500 text-xs">{n.desc}</div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {(["email", "push"] as const).map((ch) => (
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input type="checkbox" defaultChecked={n[ch]} className="w-3.5 h-3.5 rounded text-brand-primary" />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSaveProfile} className={`btn-primary ${saved ? "!bg-green-600" : ""} transition-colors`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Preferences Saved!</> : "Save Preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
