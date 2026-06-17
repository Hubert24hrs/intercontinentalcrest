"use client";

import { useState } from "react";
import { Settings, Shield, Server, Landmark, RefreshCw, AlertTriangle, ShieldCheck, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [successMsg, setSuccessMsg] = useState(false);
  const [loading, setLoading] = useState(false);

  // General Settings State
  const [maintenance, setMaintenance] = useState(false);
  const [lockoutAttempts, setLockoutAttempts] = useState(5);
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(10000);

  // Security Settings State
  const [mfaRequirement, setMfaRequirement] = useState("admin_only");
  const [passMinLength, setPassMinLength] = useState(12);
  const [sessionExpiry, setSessionExpiry] = useState(15); // minutes

  // Rates & Thresholds State
  const [savingsApy, setSavingsApy] = useState(4.50);
  const [loanInterestFloor, setLoanInterestFloor] = useState(3.50);
  const [dailyDomesticLimit, setDailyDomesticLimit] = useState(25000);
  const [dailyIntLimit, setDailyIntLimit] = useState(100000);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">System Settings & Controls</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure platform interest rates, daily transaction limits, and security protocols.</p>
        </div>
        
        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200 text-sm font-semibold animate-fade-in">
            <ShieldCheck className="w-4 h-4" />
            System parameters updated successfully!
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "general", label: "General Settings", icon: Server },
          { key: "security", label: "Security & MFA", icon: Shield },
          { key: "rates", label: "Rates & Limits", icon: Landmark }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key 
                ? "border-brand-primary text-brand-primary" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="dashboard-card">
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base mb-1">Global System Parameters</h2>
              <p className="text-gray-500 text-xs">Configure environment behavior and maintenance states.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maintenance toggle */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="space-y-0.5 max-w-sm">
                  <div className="text-sm font-semibold text-brand-secondary">Maintenance Mode</div>
                  <div className="text-xs text-gray-500">Temporarily suspend customer transfers and dashboard logins for upgrades. Admins can still authenticate.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenance(!maintenance)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${maintenance ? "bg-red-500" : "bg-gray-200"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute shadow ${maintenance ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {/* Auto flag threshold */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Auto-Flag Transaction Limit ($)</label>
                <p className="text-[11px] text-gray-500 mb-1">Mark payments exceeding this sum for compliance team review.</p>
                <input
                  type="number"
                  className="form-input"
                  value={autoFlagThreshold}
                  onChange={(e) => setAutoFlagThreshold(Number(e.target.value))}
                />
              </div>

              {/* Password lockout */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Max Failed Logins</label>
                <p className="text-[11px] text-gray-500 mb-1">Number of failed password attempts before locking account (10m).</p>
                <input
                  type="number"
                  className="form-input"
                  value={lockoutAttempts}
                  onChange={(e) => setLockoutAttempts(Number(e.target.value))}
                />
              </div>
            </div>

            {maintenance && (
              <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-bold">Warning: System Maintenance is Pending Activation</div>
                  <p className="mt-1 leading-relaxed">
                    Once settings are saved, the main bank portal will show a Maintenance notice. This logs off all client sessions and rejects new transaction requests automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base mb-1">Security Standards & Compliance</h2>
              <p className="text-gray-500 text-xs">Manage encryption, authentication standards, and multi-factor requirements.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MFA requirement */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Enforce Multi-Factor Authentication (2FA)</label>
                <p className="text-[11px] text-gray-500 mb-1">Define mandatory 2FA constraints across different user roles.</p>
                <select
                  className="form-input text-sm"
                  value={mfaRequirement}
                  onChange={(e) => setMfaRequirement(e.target.value)}
                >
                  <option value="none">Optional for All Users</option>
                  <option value="admin_only">Mandatory for Admins & Support</option>
                  <option value="all_users">Mandatory for All Users</option>
                </select>
              </div>

              {/* Password strength */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Minimum Password Length</label>
                <p className="text-[11px] text-gray-500 mb-1">Length must satisfy standard banking regulations (minimum 12 character standard).</p>
                <input
                  type="number"
                  min={8}
                  max={32}
                  className="form-input"
                  value={passMinLength}
                  onChange={(e) => setPassMinLength(Number(e.target.value))}
                />
              </div>

              {/* Session expiry */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Auto-Logout Timer (Minutes)</label>
                <p className="text-[11px] text-gray-500 mb-1">Log out idle operators and users automatically after inactivity.</p>
                <input
                  type="number"
                  className="form-input"
                  value={sessionExpiry}
                  onChange={(e) => setSessionExpiry(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "rates" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base mb-1">Lending Rates & Transaction Limits</h2>
              <p className="text-gray-500 text-xs">Set daily transfer allowances and savings/lending interest floor guidelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Domestic Limit */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Daily Domestic Transfer Limit ($)</label>
                <p className="text-[11px] text-gray-500 mb-1">Maximum domestic fund movement allowed per customer per day.</p>
                <input
                  type="number"
                  className="form-input"
                  value={dailyDomesticLimit}
                  onChange={(e) => setDailyDomesticLimit(Number(e.target.value))}
                />
              </div>

              {/* Daily Int Limit */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Daily International / SWIFT Limit ($)</label>
                <p className="text-[11px] text-gray-500 mb-1">Maximum overseas transfer permitted per client per day.</p>
                <input
                  type="number"
                  className="form-input"
                  value={dailyIntLimit}
                  onChange={(e) => setDailyIntLimit(Number(e.target.value))}
                />
              </div>

              {/* Savings APY */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Base Savings Interest Rate APY (%)</label>
                <p className="text-[11px] text-gray-500 mb-1">Standard annual percentage yield paid on customer savings accounts.</p>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={savingsApy}
                  onChange={(e) => setSavingsApy(Number(e.target.value))}
                />
              </div>

              {/* Loan interest Floor */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Lending Interest Rate Floor (%)</label>
                <p className="text-[11px] text-gray-500 mb-1">Minimum permissible lending APR interest for mortgage/personal loans.</p>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={loanInterestFloor}
                  onChange={(e) => setLoanInterestFloor(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="border-t border-gray-100 pt-6 mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-6 py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save System Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
