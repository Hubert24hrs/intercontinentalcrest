"use client";

import { useState } from "react";
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from "lucide-react";

const allTx = [
  { id: "TXN001", type: "credit", desc: "Salary Deposit - Acme Corp", amount: 7200.00, date: "2025-06-01", category: "Income", status: "completed", ref: "SAL-20250601" },
  { id: "TXN002", type: "debit", desc: "Netflix Subscription", amount: 15.99, date: "2025-06-03", category: "Entertainment", status: "completed", ref: "SUB-NFLX-003" },
  { id: "TXN003", type: "debit", desc: "Whole Foods Market", amount: 142.50, date: "2025-06-05", category: "Food & Dining", status: "completed", ref: "POS-WFM-005" },
  { id: "TXN004", type: "credit", desc: "Freelance Design Project", amount: 850.00, date: "2025-06-07", category: "Income", status: "completed", ref: "FRL-20250607" },
  { id: "TXN005", type: "debit", desc: "International Wire - EUR", amount: 2500.00, date: "2025-06-08", category: "Transfer", status: "pending", ref: "WIRE-EUR-008" },
  { id: "TXN006", type: "debit", desc: "ConEd Electric Bill", amount: 89.40, date: "2025-06-10", category: "Utilities", status: "completed", ref: "BILL-CONED-010" },
  { id: "TXN007", type: "debit", desc: "Uber Ride Share", amount: 24.80, date: "2025-06-11", category: "Transport", status: "completed", ref: "UBER-20250611" },
  { id: "TXN008", type: "credit", desc: "Investment Dividend", amount: 312.00, date: "2025-06-12", category: "Investment", status: "completed", ref: "DIV-20250612" },
  { id: "TXN009", type: "debit", desc: "Amazon Prime Purchase", amount: 67.99, date: "2025-06-13", category: "Shopping", status: "completed", ref: "AMZ-20250613" },
  { id: "TXN010", type: "debit", desc: "Gym Membership - FitLife", amount: 49.99, date: "2025-06-14", category: "Health", status: "completed", ref: "GYM-FIT-014" },
  { id: "TXN011", type: "credit", desc: "ATM Cash Deposit", amount: 500.00, date: "2025-06-15", category: "Cash", status: "completed", ref: "ATM-DEP-015" },
  { id: "TXN012", type: "debit", desc: "Restaurant - The Capital", amount: 78.20, date: "2025-06-16", category: "Food & Dining", status: "completed", ref: "REST-CAP-016" },
];

const PAGE_SIZE = 8;

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(1);

  const filtered = allTx.filter((tx) => {
    const matchSearch = tx.desc.toLowerCase().includes(search.toLowerCase()) || tx.ref.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || tx.type === filterType;
    return matchSearch && matchType;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Transaction History</h1>
          <p className="text-gray-500 text-sm mt-0.5">All your account transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Credits", amount: allTx.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0), color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Debits", amount: allTx.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0), color: "text-red-500", bg: "bg-red-50" },
          { label: "Net Flow", amount: allTx.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0) - allTx.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0), color: "text-brand-primary", bg: "bg-brand-primary/5" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`font-display font-bold text-xl ${s.color}`}>
              ${Math.abs(s.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "credit", "debit"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilterType(f); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === f ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Transaction</th>
                <th className="text-left py-3 pr-4 font-medium hidden sm:table-cell">Reference</th>
                <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Date</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                        {tx.type === "credit" ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <div className="font-medium text-brand-secondary text-sm">{tx.desc}</div>
                        <div className="text-gray-400 text-xs">{tx.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-500 text-xs font-mono hidden sm:table-cell">{tx.ref}</td>
                  <td className="py-3.5 pr-4 text-gray-500 text-xs hidden md:table-cell">{tx.date}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className={`py-3.5 text-right font-display font-bold text-sm ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
