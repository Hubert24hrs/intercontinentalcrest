"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, ArrowLeftRight, FileCheck, CreditCard, TrendingUp,
  AlertTriangle, Clock, Loader2, RefreshCw, Layers
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { adminApi } from "@/lib/api";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    try {
      const statsData = await adminApi.getStats();
      setData(statsData);
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const statCards = useMemo(() => {
    if (!data?.stats) return [];
    
    const s = data.stats;
    return [
      { label: "Total Platform Users", value: s.totalUsers, color: "text-blue-600", bg: "bg-blue-50", icon: Users, href: "/admin/customers" },
      { label: "Active Depositors", value: s.activeUsers, color: "text-green-600", bg: "bg-green-50", icon: Users, href: "/admin/customers" },
      { label: "Pending KYC Audits", value: s.pendingKyc, color: "text-amber-600", bg: "bg-amber-50", icon: FileCheck, href: "/admin/kyc" },
      { label: "Active Loans Approved", value: s.activeLoans, color: "text-indigo-600", bg: "bg-indigo-50", icon: CreditCard, href: "/admin/loans" },
      { label: "Total Client Deposits", value: `$${(s.totalDeposits || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-cyan-600", bg: "bg-cyan-50", icon: TrendingUp, href: "/admin/customers" },
      { label: "Total Fund Investments", value: `$${(s.totalInvestments || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-purple-600", bg: "bg-purple-50", icon: Layers, href: "/admin/investments" },
    ];
  }, [data]);

  // Formulate dummy chart data based on loaded statistics for nice platform visualizations
  const chartData = useMemo(() => {
    if (!data?.stats) return [];
    const baseUsers = data.stats.totalUsers || 10;
    const baseTx = data.stats.totalCryptoOrders || 15;
    return [
      { name: "Mon", users: Math.round(baseUsers * 0.7), tx: Math.round(baseTx * 0.8) },
      { name: "Tue", users: Math.round(baseUsers * 0.75), tx: Math.round(baseTx * 0.9) },
      { name: "Wed", users: Math.round(baseUsers * 0.82), tx: Math.round(baseTx * 1.1) },
      { name: "Thu", users: Math.round(baseUsers * 0.88), tx: Math.round(baseTx * 0.95) },
      { name: "Fri", users: Math.round(baseUsers * 0.95), tx: Math.round(baseTx * 1.2) },
      { name: "Sat", users: Math.round(baseUsers * 0.98), tx: Math.round(baseTx * 0.7) },
      { name: "Sun", users: baseUsers, tx: baseTx },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Fetching system stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Admin Control Center</h1>
          <p className="text-gray-500 text-sm mt-0.5">Global ledger monitoring and security configurations.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="dashboard-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group bg-white p-5 border border-gray-100 rounded-2xl block">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary flex items-center justify-center transition-colors">
                <s.icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
              </div>
            </div>
            <div className="font-display font-bold text-2xl text-brand-secondary mb-1">{s.value}</div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="dashboard-card bg-white p-5 border border-gray-100 rounded-2xl">
          <h2 className="font-display font-bold text-brand-secondary text-base mb-4">Platform User Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="users" fill="#00B7F1" radius={[4, 4, 0, 0]} name="Active Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card bg-white p-5 border border-gray-100 rounded-2xl">
          <h2 className="font-display font-bold text-brand-secondary text-base mb-4">Platform Transaction Rates</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
              <Line type="monotone" dataKey="tx" stroke="#0A2342" strokeWidth={2.5} dot={{ fill: "#0A2342", r: 4 }} name="Total Operations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split details layout: Recent Users vs Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent users list */}
        <div className="dashboard-card bg-white p-5 border border-gray-100 rounded-2xl space-y-4">
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-base">Recent Registrations</h2>
            <p className="text-gray-500 text-xs">Newest clients who signed up today</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto pr-1 space-y-3">
            {data?.recentUsers && data.recentUsers.length > 0 ? (
              data.recentUsers.map((ru: any) => (
                <div key={ru.id} className="flex items-center justify-between py-2 hover:bg-gray-50/55 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-xs uppercase">
                      {ru.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-brand-secondary text-xs">{ru.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{ru.email}</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      ru.status === "active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {ru.status}
                    </span>
                    <div className="text-gray-400 mt-1 font-mono">{new Date(ru.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs text-center py-6">No registrations logged today</p>
            )}
          </div>
        </div>

        {/* Recent transactions list */}
        <div className="dashboard-card bg-white p-5 border border-gray-100 rounded-2xl space-y-4">
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-base">Ledger Wire Activity</h2>
            <p className="text-gray-500 text-xs">Latest bank wire operations processed</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto pr-1 space-y-3">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((rt: any) => {
                const amt = parseFloat(rt.amount);
                return (
                  <div key={rt.id} className="flex justify-between items-center py-2 hover:bg-gray-50/55 rounded-xl px-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        rt.type === "credit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {rt.type === "credit" ? "CR" : "DR"}
                      </div>
                      <div>
                        <div className="font-bold text-brand-secondary text-xs truncate max-w-xs">{rt.description || "Transfer"}</div>
                        <div className="text-[9px] text-gray-400 font-mono">{rt.transactionReference}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-brand-secondary">${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      <div className="text-[9px] text-gray-400 font-mono">{new Date(rt.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-xs text-center py-6">No wire operations found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
