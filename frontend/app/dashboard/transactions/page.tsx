"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Download, ArrowUpRight, ArrowDownLeft,
  ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown,
  Coins, ArrowLeftRight, RefreshCw, Activity
} from "lucide-react";
import { transactionsApi, cryptoApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 15;
type TxSource = "all" | "bank" | "crypto";
type TxFlow   = "all" | "credit" | "debit";

function normaliseBankTx(tx: any) {
  return {
    id: tx.id, source: "bank" as const,
    reference: tx.transactionReference,
    description: tx.description || "Fund Transfer",
    subLabel: tx.type?.replace(/_/g, " ").toUpperCase(),
    amount: parseFloat(tx.amount), fee: parseFloat(tx.fee || "0"),
    flow: tx.type === "credit" ? "credit" : "debit",
    status: tx.status || "completed", date: new Date(tx.createdAt), raw: tx,
  };
}

function normaliseCryptoTx(order: any) {
  const isBuy = order.type === "buy";
  return {
    id: order.id, source: "crypto" as const,
    reference: order.id.slice(0, 8).toUpperCase(),
    description: `${isBuy ? "Bought" : "Sold"} ${order.coinName} (${order.coinSymbol?.toUpperCase()})`,
    subLabel: `${parseFloat(order.quantity).toFixed(6)} ${order.coinSymbol?.toUpperCase()} @ $${parseFloat(order.priceAtTime).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    amount: parseFloat(order.totalUsd), fee: parseFloat(order.fee || "0"),
    flow: isBuy ? "debit" : "credit",
    status: order.status || "completed", date: new Date(order.createdAt),
    coinSymbol: order.coinSymbol, coinName: order.coinName, raw: order,
  };
}

export default function TransactionsPage() {
  const [bankTxs, setBankTxs]         = useState<any[]>([]);
  const [cryptoOrders, setCryptoOrders] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [sourceFilter, setSourceFilter] = useState<TxSource>("all");
  const [flowFilter, setFlowFilter]   = useState<TxFlow>("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);

  async function loadAll(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [bankRes, cryptoRes] = await Promise.allSettled([
        transactionsApi.getTransactions({ page: 1, limit: 200 }),
        cryptoApi.getMyOrders(1, 200),
      ]);
      if (bankRes.status === "fulfilled") setBankTxs(bankRes.value.transactions || []);
      if (cryptoRes.status === "fulfilled") setCryptoOrders(cryptoRes.value.orders || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const unified = useMemo(() => [
    ...bankTxs.map(normaliseBankTx),
    ...cryptoOrders.map(normaliseCryptoTx),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()), [bankTxs, cryptoOrders]);

  const filtered = useMemo(() => unified.filter((tx) => {
    if (sourceFilter !== "all" && tx.source !== sourceFilter) return false;
    if (flowFilter !== "all" && tx.flow !== flowFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!tx.description.toLowerCase().includes(q) && !tx.reference.toLowerCase().includes(q) && !('coinSymbol' in tx && (tx as any).coinSymbol?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [unified, sourceFilter, flowFilter, search]);

  const totalFiltered = filtered.length;
  const totalFilteredPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summaries = useMemo(() => {
    let credits = 0, debits = 0;
    filtered.forEach(tx => { if (tx.flow === "credit") credits += tx.amount; else debits += tx.amount; });
    return { credits, debits, net: credits - debits, count: filtered.length };
  }, [filtered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["ID", "Source", "Reference", "Description", "Type", "Amount (USD)", "Fee", "Status", "Date"];
    const rows = filtered.map(t => [t.id, t.source, t.reference, t.description, t.flow, t.amount.toFixed(2), t.fee.toFixed(2), t.status, t.date.toLocaleDateString()]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `ic_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const applyFilter = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-[#0078B3] flex items-center justify-center shadow-lg flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-brand-secondary text-2xl">Transaction History</h1>
            <p className="text-gray-500 text-sm mt-0.5">All banking & crypto activity in one unified ledger</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => loadAll(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleExportCSV} disabled={filtered.length === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-colors shadow-sm disabled:opacity-50">
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: summaries.count.toString(), colorClass: "text-brand-secondary", bg: "bg-white", border: "border-gray-100", icon: ArrowLeftRight },
          { label: "Money In", value: `+$${summaries.credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: TrendingUp },
          { label: "Money Out", value: `-$${summaries.debits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "text-red-500", bg: "bg-red-50", border: "border-red-100", icon: TrendingDown },
          { label: "Net Flow", value: `${summaries.net >= 0 ? "+" : ""}$${Math.abs(summaries.net).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: summaries.net >= 0 ? "text-brand-primary" : "text-red-500", bg: "bg-brand-primary/5", border: "border-brand-primary/10", icon: Coins },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`${s.bg} border ${s.border} rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <s.icon className={`w-3.5 h-3.5 ${s.colorClass}`} />
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{s.label}</div>
            </div>
            <div className={`font-display font-bold text-lg leading-tight ${s.colorClass}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "bank", "crypto"] as TxSource[]).map(s => (
            <button key={s} onClick={() => applyFilter(() => setSourceFilter(s))}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${sourceFilter === s ? s === "crypto" ? "bg-indigo-600 text-white shadow-md" : "bg-brand-primary text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "crypto" && <Coins className="w-3.5 h-3.5" />}
              {s === "bank" && <ArrowLeftRight className="w-3.5 h-3.5" />}
              {s === "all" ? "All Activity" : s === "bank" ? "Bank Transfers" : "Crypto Trades"}
            </button>
          ))}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["all", "credit", "debit"] as TxFlow[]).map(f => (
              <button key={f} onClick={() => applyFilter(() => setFlowFilter(f))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${flowFilter === f ? "bg-brand-secondary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {f === "all" ? "All" : f === "credit" ? "Money In" : "Money Out"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={search} onChange={e => applyFilter(() => setSearch(e.target.value))} placeholder="Search by name, coin, reference..." className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors" />
          </div>
        </div>
      </motion.div>

      {/* Transaction List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-brand-secondary text-sm">
            {sourceFilter === "crypto" ? "Crypto Trade Ledger" : sourceFilter === "bank" ? "Bank Ledger" : "Unified Ledger"}
          </h3>
          <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{totalFiltered} records</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Loading transactions...</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-14 text-center">
            <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No transactions found for the selected filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-gray-400 border-b border-gray-100 text-left font-bold uppercase tracking-wide">
                    <th className="py-3 px-5">Transaction</th>
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((tx, i) => (
                    <motion.tr
                      key={`${tx.source}-${tx.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.source === "crypto" ? tx.flow === "debit" ? "bg-indigo-100" : "bg-purple-100" : tx.flow === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                            {tx.source === "crypto" ? tx.flow === "debit" ? <TrendingDown className="w-4 h-4 text-indigo-600" /> : <TrendingUp className="w-4 h-4 text-purple-600" /> : tx.flow === "credit" ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-brand-secondary text-sm leading-tight">{tx.description}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {tx.source === "crypto" && <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full font-bold uppercase">Crypto</span>}
                              <div className="text-gray-400 text-[10px] truncate">{tx.subLabel}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-gray-400 text-[11px] font-mono">{tx.reference}</td>
                      <td className="py-3.5 pr-4 text-gray-500 text-xs">
                        {tx.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        <div className="text-[10px] text-gray-400">{tx.date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : tx.status === "failed" ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`py-3.5 pr-5 text-right font-display font-bold text-sm ${tx.flow === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.flow === "credit" ? "+" : "−"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        {tx.fee > 0 && <div className="text-[9px] text-gray-400 font-normal">Fee: ${tx.fee.toFixed(2)}</div>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginated.map((tx, i) => (
                <motion.div key={`m-${tx.source}-${tx.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.source === "crypto" ? tx.flow === "debit" ? "bg-indigo-100" : "bg-purple-100" : tx.flow === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                    {tx.source === "crypto" ? tx.flow === "debit" ? <TrendingDown className="w-4 h-4 text-indigo-600" /> : <TrendingUp className="w-4 h-4 text-purple-600" /> : tx.flow === "credit" ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brand-secondary text-sm leading-tight truncate">{tx.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tx.source === "crypto" && <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full font-bold">CRYPTO</span>}
                      <span className="text-[10px] text-gray-400">{tx.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-display font-bold text-sm ${tx.flow === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.flow === "credit" ? "+" : "−"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`text-[10px] font-bold ${tx.status === "completed" ? "text-emerald-600" : tx.status === "failed" ? "text-red-500" : "text-amber-600"}`}>{tx.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {!loading && totalFilteredPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {page} of {totalFilteredPages} · {totalFiltered} records</span>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalFilteredPages, p + 1))} disabled={page === totalFilteredPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
