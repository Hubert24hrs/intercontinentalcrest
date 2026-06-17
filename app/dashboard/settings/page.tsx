"use client";

import { useState } from "react";
import { User, Mail, Phone, Lock, Bell, Shield, Camera, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "notifications", icon: Bell, label: "Notifications" },
  ];

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your personal information and preferences</p>
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

      {activeTab === "profile" && (
        <div className="dashboard-card space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center text-white text-2xl font-bold">J</div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-brand-secondary rounded-full flex items-center justify-center border-2 border-white hover:bg-brand-primary transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div>
              <div className="font-display font-bold text-brand-secondary text-lg">John Doe</div>
              <div className="text-gray-500 text-sm">Personal Account · IC-7842-0021</div>
              <div className="flex items-center gap-1 text-green-600 text-xs mt-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> KYC Verified
              </div>
            </div>
          </div>
          <div className="divider" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { id: "s-fname", label: "First Name", val: "John", icon: User },
              { id: "s-lname", label: "Last Name", val: "Doe", icon: User },
              { id: "s-email", label: "Email Address", val: "john.doe@gmail.com", icon: Mail, type: "email" },
              { id: "s-phone", label: "Phone Number", val: "+1 (555) 123-4567", icon: Phone, type: "tel" },
              { id: "s-dob", label: "Date of Birth", val: "1990-03-15", icon: null, type: "date" },
              { id: "s-country", label: "Country", val: "United States", icon: null },
            ].map(({ id, label, val, icon: Icon, type = "text" }) => (
              <div key={id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor={id}>{label}</label>
                <div className="relative">
                  {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                  <input id={id} type={type} className={`form-input ${Icon ? "pl-10" : ""}`} defaultValue={val} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSave} className={`btn-primary ${saved ? "!bg-green-600" : ""} transition-colors`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save Changes"}
          </button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="dashboard-card space-y-5">
            <h2 className="font-display font-bold text-brand-secondary">Change Password</h2>
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
            <button onClick={handleSave} className="btn-primary">Update Password</button>
          </div>
          <div className="dashboard-card">
            <h2 className="font-display font-bold text-brand-secondary mb-4">Two-Factor Authentication</h2>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-semibold text-green-800 text-sm">2FA is Enabled</div>
                  <div className="text-green-600 text-xs">Authenticator App (TOTP)</div>
                </div>
              </div>
              <button className="text-xs text-red-500 font-semibold hover:underline">Disable</button>
            </div>
          </div>
          <div className="dashboard-card">
            <h2 className="font-display font-bold text-brand-secondary mb-4">Active Sessions</h2>
            {[
              { device: "Chrome · Windows", ip: "192.168.1.1", location: "New York, USA", current: true },
              { device: "Safari · iPhone", ip: "192.168.1.45", location: "New York, USA", current: false },
            ].map((s) => (
              <div key={s.device} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-brand-secondary">{s.device}</div>
                  <div className="text-xs text-gray-500">{s.ip} · {s.location}</div>
                </div>
                {s.current ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Current</span>
                ) : (
                  <button className="text-xs text-red-500 font-semibold hover:underline">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="dashboard-card space-y-4">
          <h2 className="font-display font-bold text-brand-secondary mb-2">Notification Preferences</h2>
          {[
            { label: "Transaction Alerts", desc: "Receive alerts for all account transactions", email: true, sms: true, push: true },
            { label: "Security Alerts", desc: "Login attempts and security changes", email: true, sms: true, push: true },
            { label: "Promotional Emails", desc: "Product updates and special offers", email: false, sms: false, push: false },
            { label: "Monthly Statements", desc: "Monthly account statement notifications", email: true, sms: false, push: false },
            { label: "Loan Reminders", desc: "Upcoming loan payment reminders", email: true, sms: true, push: true },
          ].map((n) => (
            <div key={n.label} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-3">
              <div>
                <div className="font-medium text-brand-secondary text-sm">{n.label}</div>
                <div className="text-gray-500 text-xs">{n.desc}</div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {(["email", "sms", "push"] as const).map((ch) => (
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input type="checkbox" defaultChecked={n[ch]} className="w-3.5 h-3.5 rounded text-brand-primary" />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSave} className={`btn-primary ${saved ? "!bg-green-600" : ""} transition-colors`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save Preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
