"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, BarChart3, ShieldAlert, ShieldCheck, DollarSign, Users, Award, Search, Plus, Coins, Loader2, Calendar } from "lucide-react";
import { cryptoApi } from "@/lib/api";

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

  // Crypto platform statistics
  const [cryptoVolume, setCryptoVolume] = useState<any>(null);
  const [cryptoOrders, setCryptoOrders] = useState<any[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [loadingCrypto, setLoadingCrypto] = useState(true);

  async function loadCryptoStats() {
    setLoadingCrypto(true);
    try {
      const [vol, ords] = await Promise.all([
        cryptoApi.getVolume(),
        cryptoApi.getAllOrders(ordersPage, 10)
      ]);
      setCryptoVolume(vol);
      setCryptoOrders(ords.orders || []);
      setOrdersTotalPages(ords.totalPages || 1);
    } catch (err) {
      console.error("Failed to load platform crypto stats", err);
    } finally {
      setLoadingCrypto(false);
    }
  }

  useEffect(() => {
    loadCryptoStats();
  }, [ordersPage]);

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
          <h1 className="font-display font-bold text-brand-secondary text-2xl flex items-center gap-2">
            <Coins className="w-6 h-6 text-brand-primary" />
            Platform Asset Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage fixed yield savings plans, mutual funds, and monitor digital asset order logs.</p>
        </div>
        <button
          onClick={() => setShowAddPlan(true)}
          className="btn-primary text-sm px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Create Yield Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Static Assets (AUM)</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              ${(totalAum / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Crypto Volume Traded</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              ${parseFloat(cryptoVolume?._sum?.totalUsd || "0").toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <Coins className="w-5 h-5 text-purple-600" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Acrrued Crypto Fees (0.5%)</div>
            <div className="font-display font-bold text-2xl text-emerald-600 mt-1">
              ${parseFloat(cryptoVolume?._sum?.fee || "0").toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Crypto Trades</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              {cryptoVolume?._count?.id || 0}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in text-xs text-brand-secondary">
            <h2 className="font-display font-bold text-brand-secondary text-base mb-4">Create yield Investment Plan</h2>
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
                    className="form-input text-xs"
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
                    className="form-input text-xs"
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
                    className="form-input text-xs"
                    value={newPlan.apy}
                    onChange={(e) => setNewPlan({ ...newPlan, apy: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Investment ($)</label>
                  <input
                    type="number"
                    required
                    className="form-input text-xs"
                    value={newPlan.minInvestment}
                    onChange={(e) => setNewPlan({ ...newPlan, minInvestment: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary text-xs py-2.5"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List Table */}
      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <h2 className="font-display font-bold text-brand-secondary text-base mb-4">Active Yield Portfolios</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                <th className="py-3 pr-4">Plan Code</th>
                <th className="py-3 pr-4">Investment Plan</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">APY / Return</th>
                <th className="py-3 pr-4">AUM (Managed)</th>
                <th className="py-3 pr-4">Risk Grade</th>
                <th className="py-3 text-right">Subscribers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-4 font-mono font-semibold text-brand-secondary">{plan.id}</td>
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-brand-secondary">{plan.name}</div>
                    <div className="text-[10px] text-gray-400">Min: ${plan.minInvestment.toLocaleString()}</div>
                  </td>
                  <td className="py-4 pr-4 font-medium text-gray-600">{plan.category}</td>
                  <td className="py-4 pr-4 text-emerald-600 font-bold">{plan.apy.toFixed(2)}%</td>
                  <td className="py-4 pr-4 font-semibold text-brand-secondary">${plan.totalAum.toLocaleString()}</td>
                  <td className="py-4 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit ${
                      plan.risk === "Low" ? "bg-green-50 text-green-700 border border-green-150" :
                      plan.risk === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                      "bg-red-50 text-red-700 border border-red-150"
                    }`}>
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

      {/* Real-time Crypto Order Ledger */}
      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-base">Global Crypto Order Desk</h2>
            <p className="text-xs text-gray-400 mt-0.5">Live database logs of customer asset orders.</p>
          </div>
          <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-200">
            Audit Stream
          </span>
        </div>

        {loadingCrypto ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Fetching order stream...</span>
          </div>
        ) : cryptoOrders.length > 0 ? (
          <div className="space-y-3 mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Asset</th>
                    <th className="py-2.5">Quantity</th>
                    <th className="py-2.5 text-right">Total (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-brand-secondary font-medium">
                  {cryptoOrders.map((o) => {
                    const isBuy = o.type === "buy";
                    const date = new Date(o.createdAt);
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono text-[10px] text-gray-500">
                          {date.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <div className="font-bold">{o.user?.fullName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{o.user?.email}</div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isBuy ? "bg-green-50 text-green-700 border border-green-250" : "bg-red-50 text-red-700 border border-red-250"
                          }`}>
                            {o.type}
                          </span>
                        </td>
                        <td className="py-3 font-semibold uppercase font-mono">
                          {o.coinSymbol}
                        </td>
                        <td className="py-3 font-mono">{parseFloat(o.quantity).toFixed(6)}</td>
                        <td className="py-3 font-mono text-right font-bold text-brand-primary">
                          ${parseFloat(o.totalUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {ordersTotalPages > 1 && (
              <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-xs">
                <span className="text-gray-400">Page {ordersPage} of {ordersTotalPages}</span>
                <div className="flex gap-2">
                  <button 
                    disabled={ordersPage === 1}
                    onClick={() => setOrdersPage(ordersPage - 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={ordersPage === ordersTotalPages}
                    onClick={() => setOrdersPage(ordersPage + 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            No cryptocurrency orders have been completed on the platform yet.
          </div>
        )}
      </div>
    </div>
  );
}
