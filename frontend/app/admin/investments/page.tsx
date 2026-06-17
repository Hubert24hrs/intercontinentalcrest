"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, ShieldAlert, ShieldCheck, DollarSign, Users, Award, Search, Plus } from "lucide-react";

interface InvestmentPlan {
  id: string;
  name: string;
  category: "Fixed Income" | "Mutual Fund" | "Crypto/Digital" | "Real Estate";
  apy: number;
  minInvestment: number;
  totalAum: number;
  subscribersCount: number;
  risk: "Low" | "Medium" | "High";
}

const initialPlans: InvestmentPlan[] = [
  { id: "INV-P1", name: "High-Yield Fixed Deposit", category: "Fixed Income", apy: 5.25, minInvestment: 5000, totalAum: 42500000, subscribersCount: 1420, risk: "Low" },
  { id: "INV-P2", name: "Global Equity Index Fund", category: "Mutual Fund", apy: 8.90, minInvestment: 1000, totalAum: 89600000, subscribersCount: 3840, risk: "Medium" },
  { id: "INV-P3", name: "Digital Assets Capital growth", category: "Crypto/Digital", apy: 14.50, minInvestment: 10000, totalAum: 12400000, subscribersCount: 650, risk: "High" },
  { id: "INV-P4", name: "Prime Real Estate REIT", category: "Real Estate", apy: 7.10, minInvestment: 25000, totalAum: 68100000, subscribersCount: 1120, risk: "Low" }
];

export default function AdminInvestmentsPage() {
  const [plans, setPlans] = useState<InvestmentPlan[]>(initialPlans);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", category: "Fixed Income", apy: 5, minInvestment: 1000, risk: "Low" });

  const totalAum = plans.reduce((sum, p) => sum + p.totalAum, 0);
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscribersCount, 0);

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const planToAdd: InvestmentPlan = {
      id: `INV-P${plans.length + 1}`,
      name: newPlan.name,
      category: newPlan.category as any,
      apy: Number(newPlan.apy),
      minInvestment: Number(newPlan.minInvestment),
      totalAum: 0,
      subscribersCount: 0,
      risk: newPlan.risk as any
    };
    setPlans(prev => [...prev, planToAdd]);
    setShowAddPlan(false);
    setNewPlan({ name: "", category: "Fixed Income", apy: 5, minInvestment: 1000, risk: "Low" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Investment Solutions Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage mutual funds, real estate trusts, fixed yields and APY rates.</p>
        </div>
        <button
          onClick={() => setShowAddPlan(true)}
          className="btn-primary text-sm px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Create Investment Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Assets Under Management (AUM)</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              ${(totalAum / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Active Subscriptions</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              {totalSubscribers.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Weighted Yield Rate (APY)</div>
            <div className="font-display font-bold text-2xl text-emerald-600 mt-1">
              8.35%
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Platform Performance Tier</div>
            <div className="font-display font-bold text-lg text-brand-secondary mt-1">
              AAA Standard
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Grid: Add Plan Overlay Form + Table */}
      {showAddPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="font-display font-bold text-brand-secondary text-lg mb-4">Create Investment Plan</h2>
            <form onSubmit={handleAddPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Sustainable Energy Fund"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    className="form-input text-sm"
                    value={newPlan.category}
                    onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value })}
                  >
                    <option value="Fixed Income">Fixed Income</option>
                    <option value="Mutual Fund">Mutual Fund</option>
                    <option value="Crypto/Digital">Crypto/Digital</option>
                    <option value="Real Estate">Real Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Risk Level</label>
                  <select
                    className="form-input text-sm"
                    value={newPlan.risk}
                    onChange={(e) => setNewPlan({ ...newPlan, risk: e.target.value })}
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target APY (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="form-input"
                    value={newPlan.apy}
                    onChange={(e) => setNewPlan({ ...newPlan, apy: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Investment ($)</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={newPlan.minInvestment}
                    onChange={(e) => setNewPlan({ ...newPlan, minInvestment: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary text-sm py-2.5"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List Table */}
      <div className="dashboard-card">
        <h2 className="font-display font-bold text-brand-secondary text-base mb-4">Active Lending & Asset Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Plan Code</th>
                <th className="text-left py-3 pr-4 font-medium">Investment Plan</th>
                <th className="text-left py-3 pr-4 font-medium">Category</th>
                <th className="text-left py-3 pr-4 font-medium">APY / Return</th>
                <th className="text-left py-3 pr-4 font-medium">AUM (Managed)</th>
                <th className="text-left py-3 pr-4 font-medium">Risk Grade</th>
                <th className="text-right py-3 font-medium">Subscribers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                  <td className="py-4 pr-4 font-mono font-semibold text-brand-secondary">{plan.id}</td>
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-brand-secondary">{plan.name}</div>
                    <div className="text-xs text-gray-400">Min: ${plan.minInvestment.toLocaleString()}</div>
                  </td>
                  <td className="py-4 pr-4 font-medium text-gray-600">{plan.category}</td>
                  <td className="py-4 pr-4 text-emerald-600 font-bold">{plan.apy.toFixed(2)}%</td>
                  <td className="py-4 pr-4 font-semibold text-brand-secondary">${plan.totalAum.toLocaleString()}</td>
                  <td className="py-4 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                      plan.risk === "Low" ? "bg-green-50 text-green-700" :
                      plan.risk === "Medium" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {plan.risk === "Low" ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      {plan.risk}
                    </span>
                  </td>
                  <td className="py-4 text-right font-bold text-brand-secondary">{plan.subscribersCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
