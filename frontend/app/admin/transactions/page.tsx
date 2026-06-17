"use client";

import { Search, ArrowUpRight, ArrowDownLeft, Flag, Eye, Filter } from "lucide-react";
import { useState } from "react";

const txData = [
  { id: "TXN-8821", from: "James Okonkwo", to: "External — UK", amount: 15000, currency: "USD", status: "flagged", date: "2025-06-16 14:23", risk: "high" },
  { id: "TXN-8820", from: "Sarah Mitchell", to: "Investment Account", amount: 50000, currency: "USD", status: "completed", date: "2025-06-16 12:10", risk: "low" },
  { id: "TXN-8819", from: "David Chen", to: "Priya Sharma", amount: 2500, currency: "SGD", status: "completed", date: "2025-06-16 09:45", risk: "low" },
  { id: "TXN-8818", from: "Unknown IP", to: "Ahmed Al-Rashid", amount: 8500, currency: "USD", status: "flagged", date: "2025-06-15 22:18", risk: "high" },
  { id: "TXN-8817", from: "Michael Torres", to: "Bank of America", amount: 12000, currency: "USD", status: "pending", date: "2025-06-15 16:32", risk: "medium" },
  { id: "TXN-8816", from: "Lisa Bergmann", to: "Salary Payroll", amount: 9800, currency: "EUR", status: "completed", date: "2025-06-15 11:00", risk: "low" },
];

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  flagged: "bg-red-100 text-red-600",
};

const riskColors: Record<string, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

export default function AdminTransactionsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = txData.filter(t => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Transaction Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Monitor, flag, and manage all platform transactions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Today", value: "$284,920", sub: "1,842 transactions" },
          { label: "Flagged", value: "38", sub: "Requires review", alert: true },
          { label: "Pending", value: "127", sub: "Awaiting processing" },
        ].map((s) => (
          <div key={s.label} className={`dashboard-card ${s.alert ? "border-l-4 border-red-500" : ""}`}>
            <div className="font-display font-bold text-2xl text-brand-secondary">{s.value}</div>
            <div className="font-medium text-gray-600 text-sm">{s.label}</div>
            <div className="text-gray-400 text-xs">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="form-input pl-10" placeholder="Search by ID or sender..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {["all", "completed", "pending", "flagged"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${filter === f ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Transaction ID</th>
                <th className="text-left py-3 pr-4 font-medium">From → To</th>
                <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Date</th>
                <th className="text-left py-3 pr-4 font-medium">Risk</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-xs text-brand-secondary font-bold">{tx.id}</td>
                  <td className="py-3.5 pr-4">
                    <div className="text-sm text-gray-700">{tx.from}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />{tx.to}</div>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-500 text-xs hidden md:table-cell">{tx.date}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`text-xs font-bold uppercase ${riskColors[tx.risk]}`}>{tx.risk}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>{tx.status}</span>
                  </td>
                  <td className="py-3.5 text-right font-display font-bold text-sm text-brand-secondary">
                    ${tx.amount.toLocaleString()} <span className="text-gray-400 font-normal text-xs">{tx.currency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
