"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { transactionsApi } from "@/lib/api";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [loading, setLoading] = useState(true);

  // Fetch transactions from API
  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      try {
        const res = await transactionsApi.getTransactions({
          page,
          limit: PAGE_SIZE,
          type: filterType === "all" ? undefined : filterType
        });
        setTransactions(res.transactions || []);
        setTotalCount(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, [page, filterType]);

  // Calculate flow summaries for the current visible items
  const summaries = useMemo(() => {
    let credits = 0;
    let debits = 0;

    transactions.forEach((tx) => {
      const amt = parseFloat(tx.amount);
      const isCredit = tx.type === "credit" || (tx.type === "transfer" && !tx.senderAccountId); // crude heuristic if needed
      
      // Let's check senderAccountId/receiverAccountId if available
      // If we are sender, it's a debit. If we are receiver, it's a credit.
      // Wait, in transfer, is it debit or credit? Usually a transfer is a debit for sender, credit for receiver.
      // Let's write robust logic based on presence of senderAccount/receiverAccount or the type field.
      // In the database model, we have `amount` and `type` (e.g. "credit", "debit", "transfer", "domestic", "international").
      // If tx.type === "credit", it's a credit. If tx.type === "debit", it's a debit.
      // For transfers, if there's no senderAccountId, or receiverAccountId matches user account (let's check if the API shows receiverAccountNumber/senderAccountNumber).
      // Let's check: in getTransactionsByUserId, we fetch where senderAccountId in userAccounts OR receiverAccountId in userAccounts.
      // Since we don't have user account list here, let's treat "credit" type as credit, and other types as debits unless specified. Or just check `tx.type === "credit"`.
      // Actually, let's just make it simple: we classify by tx.type or check if the senderAccountId is present.
      if (tx.type === "credit") {
        credits += amt;
      } else {
        debits += amt;
      }
    });

    return {
      credits,
      debits,
      net: credits - debits
    };
  }, [transactions]);

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ["ID", "Reference", "Type", "Amount", "Fee", "Description", "Status", "Date"];
    const rows = transactions.map(t => [
      t.id,
      t.transactionReference,
      t.type,
      t.amount,
      t.fee,
      t.description || "",
      t.status,
      new Date(t.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ic_transactions_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Transaction History</h1>
          <p className="text-gray-500 text-sm mt-0.5">All your account transactions and wire activities</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Credits (This Page)", amount: summaries.credits, color: "text-green-600", bg: "bg-green-50" },
          { label: "Debits (This Page)", amount: summaries.debits, color: "text-red-500", bg: "bg-red-50" },
          { label: "Net Flow (This Page)", amount: summaries.net, color: "text-brand-primary", bg: "bg-brand-primary/5" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`font-display font-bold text-xl ${s.color}`}>
              {s.amount < 0 ? "-" : ""}${Math.abs(s.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & History Table */}
      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h3 className="font-display font-bold text-brand-secondary text-sm">Account Ledger</h3>
          <div className="flex gap-2">
            {(["all", "credit", "debit"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilterType(f); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filterType === f ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Fetching ledger details...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 text-left font-semibold">
                  <th className="py-3 pr-4">Transaction</th>
                  <th className="py-3 pr-4 hidden sm:table-cell">Reference</th>
                  <th className="py-3 pr-4 hidden md:table-cell">Date</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => {
                  const isCredit = tx.type === "credit";
                  const date = new Date(tx.createdAt);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-secondary text-sm">{tx.description || "Fund Transfer"}</div>
                            <div className="text-gray-400 text-xs uppercase">{tx.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-gray-500 text-xs font-mono hidden sm:table-cell">{tx.transactionReference}</td>
                      <td className="py-3.5 pr-4 text-gray-500 text-xs hidden md:table-cell">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          tx.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`py-3.5 text-right font-display font-bold text-sm ${isCredit ? "text-green-600" : "text-red-500"}`}>
                        {isCredit ? "+" : "-"}${parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                      No transactions found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Showing page {page} of {totalPages} (Total {totalCount} records)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(page - 1)} 
                disabled={page === 1} 
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(page + 1)} 
                disabled={page === totalPages} 
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
