"use client";

import { Search, ArrowUpRight, ArrowDownLeft, Eye, Filter, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/api";

const statusColors: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border border-green-200",
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  failed: "bg-red-50 text-red-600 border border-red-200",
  reversed: "bg-gray-50 text-gray-600 border border-gray-200",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions({
        page,
        limit: 15,
        status: filterStatus === "all" ? undefined : filterStatus
      });
      setTransactions(res.transactions || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load admin transactions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [page, filterStatus]);

  // Client side search matching ID, sender email, or receiver email
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = 
        t.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
        (t.senderAccount?.user?.fullName && t.senderAccount.user.fullName.toLowerCase().includes(search.toLowerCase())) ||
        (t.receiverAccount?.user?.fullName && t.receiverAccount.user.fullName.toLowerCase().includes(search.toLowerCase())) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [transactions, search]);

  const summaries = useMemo(() => {
    let volume = 0;
    let pendingCount = 0;
    let completedCount = 0;

    transactions.forEach((t) => {
      const val = parseFloat(t.amount);
      volume += val;
      if (t.status === "pending") pendingCount++;
      if (t.status === "completed") completedCount++;
    });

    return {
      volume,
      pendingCount,
      completedCount
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Transaction Ledger Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Audit, track, and monitor all platform currency transactions.</p>
        </div>
        <button 
          onClick={loadTransactions}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 bg-white shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Refresh Ledger
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Visible Volume Ledger", value: `$${summaries.volume.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: "Value of transactions shown" },
          { label: "Pending Wire Audits", value: summaries.pendingCount, sub: "Requires clearance" },
          { label: "Processed Operations", value: summaries.completedCount, sub: "Settled successfully" },
        ].map((s) => (
          <div key={s.label} className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <div className="font-display font-bold text-2xl text-brand-secondary">{s.value}</div>
            <div className="font-semibold text-gray-600 text-xs mt-1">{s.label}</div>
            <div className="text-gray-400 text-[10px] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="form-input pl-10" placeholder="Search by reference, sender or receiver..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {["all", "completed", "pending", "failed"].map((f) => (
              <button key={f} onClick={() => { setFilterStatus(f); setPage(1); }} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${filterStatus === f ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Fetching transactions list...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                  <th className="py-3 pr-4">Transaction Ref</th>
                  <th className="py-3 pr-4">Sender Account</th>
                  <th className="py-3 pr-4">Receiver Account</th>
                  <th className="py-3 pr-4 hidden md:table-cell">Date</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filtered.map((tx) => {
                  const date = new Date(tx.createdAt);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors text-gray-700">
                      <td className="py-3.5 pr-4 font-mono font-bold text-brand-secondary">{tx.transactionReference}</td>
                      <td className="py-3.5 pr-4">
                        {tx.senderAccount ? (
                          <>
                            <div className="font-semibold text-brand-secondary">{tx.senderAccount.user?.fullName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{tx.senderAccount.accountNumber} ({tx.senderAccount.accountType.toUpperCase()})</div>
                          </>
                        ) : (
                          <span className="text-gray-400 font-semibold italic">External Account</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        {tx.receiverAccount ? (
                          <>
                            <div className="font-semibold text-brand-secondary">{tx.receiverAccount.user?.fullName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{tx.receiverAccount.accountNumber} ({tx.receiverAccount.accountType.toUpperCase()})</div>
                          </>
                        ) : (
                          <span className="text-gray-400 font-semibold italic">External Account</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-gray-500 font-mono hidden md:table-cell">{date.toLocaleString()}</td>
                      <td className="py-3.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[tx.status]}`}>{tx.status}</span>
                      </td>
                      <td className="py-3.5 text-right font-display font-bold text-sm text-brand-secondary">
                        ${parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-gray-400 font-normal text-xs">{tx.currency}</span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">No wire transaction logs match selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pager */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs mt-4">
            <span className="text-gray-400">Page {page} of {totalPages} (Total {totalCount} records)</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
