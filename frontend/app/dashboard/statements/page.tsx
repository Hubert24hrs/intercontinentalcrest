"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText, Calendar, Loader2, AlertCircle, Coins, Download,
  TrendingUp, TrendingDown, FileBarChart, BarChart3
} from "lucide-react";
import { accountsApi, cryptoApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "bank" | "crypto";

export default function StatementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("bank");

  const [accounts, setAccounts]               = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [statements, setStatements]           = useState<any[]>([]);
  const [bankLoading, setBankLoading]         = useState(true);
  const [statementsLoading, setStatementsLoading] = useState(false);
  const [downloadingPeriod, setDownloadingPeriod] = useState<string | null>(null);
  const [bankError, setBankError]             = useState<string | null>(null);

  const [cryptoOrders, setCryptoOrders]   = useState<any[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  useEffect(() => {
    accountsApi.getAccounts()
      .then(accs => { setAccounts(accs || []); if (accs && accs.length > 0) setSelectedAccountId(accs[0].id); else setBankLoading(false); })
      .catch(() => { setBankError("Failed to load accounts."); setBankLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    setStatementsLoading(true);
    setBankError(null);
    accountsApi.getMonthlyStatements(selectedAccountId)
      .then(data => setStatements(data || []))
      .catch(() => setBankError("Failed to load statement periods."))
      .finally(() => { setStatementsLoading(false); setBankLoading(false); });
  }, [selectedAccountId]);

  useEffect(() => {
    setCryptoLoading(true);
    cryptoApi.getMyOrders(1, 500)
      .then(res => setCryptoOrders(res?.orders || []))
      .catch(() => setCryptoOrders([]))
      .finally(() => setCryptoLoading(false));
  }, []);

  const cryptoMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; orders: any[]; bought: number; sold: number; fees: number }>();
    cryptoOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, { key, label, orders: [], bought: 0, sold: 0, fees: 0 });
      const entry = map.get(key)!;
      entry.orders.push(o);
      const usd = parseFloat(o.totalUsd || "0");
      const fee = parseFloat(o.fee || "0");
      if (o.type === "buy") entry.bought += usd; else entry.sold += usd;
      entry.fees += fee;
    });
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [cryptoOrders]);

  const handleCryptoCSV = (monthEntry: typeof cryptoMonths[number]) => {
    const headers = ["ID", "Type", "Coin", "Symbol", "Quantity", "Price/Unit (USD)", "Total (USD)", "Fee (USD)", "Status", "Date"];
    const rows = monthEntry.orders.map(o => [o.id, o.type.toUpperCase(), o.coinName, o.coinSymbol?.toUpperCase(), parseFloat(o.quantity).toFixed(8), parseFloat(o.priceAtTime).toFixed(2), parseFloat(o.totalUsd).toFixed(2), parseFloat(o.fee || "0").toFixed(2), o.status, new Date(o.createdAt).toLocaleString()]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `ic_crypto_${monthEntry.key}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleDownloadPdf = async (s: any) => {
    setDownloadingPeriod(`${s.year}-${s.month}`);
    try { await accountsApi.downloadStatementPdf(selectedAccountId, s.year, s.month); }
    catch { alert("Failed to generate statement PDF. Please try again."); }
    finally { setDownloadingPeriod(null); }
  };

  if (bankLoading && activeTab === "bank") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A2342] to-brand-primary flex items-center justify-center shadow-lg animate-pulse">
          <FileBarChart className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />Retrieving statement schedules...
        </div>
      </div>
    );
  }

  const totalCryptoBought = cryptoOrders.filter(o => o.type === "buy").reduce((s, o) => s + parseFloat(o.totalUsd), 0);
  const totalCryptoSold = cryptoOrders.filter(o => o.type === "sell").reduce((s, o) => s + parseFloat(o.totalUsd), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-[#0078B3] flex items-center justify-center shadow-lg">
            <FileBarChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Statements</h1>
            <p className="text-gray-500 text-sm mt-0.5">Download official monthly statements and crypto activity reports</p>
          </div>
        </div>
        {activeTab === "bank" && accounts.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 font-semibold uppercase">Account:</span>
            <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-brand-secondary font-medium outline-none focus:border-brand-primary shadow-sm cursor-pointer min-w-[220px]">
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.accountType.toUpperCase()} (***{acc.accountNumber.slice(-4)}) — ${parseFloat(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</option>
              ))}
            </select>
          </div>
        )}
      </motion.div>

      {/* Tab toggle */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab("bank")} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "bank" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <FileText className="w-3.5 h-3.5" />Bank Statements
        </button>
        <button onClick={() => setActiveTab("crypto")} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "crypto" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Coins className="w-3.5 h-3.5" />Crypto Activity
          {cryptoOrders.length > 0 && <span className="bg-indigo-100 text-indigo-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{cryptoOrders.length}</span>}
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── BANK STATEMENTS ── */}
        {activeTab === "bank" && (
          <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {bankError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /><p>{bankError}</p>
              </div>
            )}
            {statementsLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary mb-2" />
                <p className="text-xs">Recalculating account statement records...</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-brand-secondary text-sm">Monthly Statements</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Download PDF for any period</p>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">{statements.length} periods</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] text-gray-400 border-b border-gray-100 font-bold uppercase tracking-wide">
                        <th className="text-left py-3 px-5">Period</th>
                        <th className="text-left py-3 pr-4 hidden sm:table-cell">Transactions</th>
                        <th className="text-left py-3 pr-4 hidden md:table-cell">Credits</th>
                        <th className="text-left py-3 pr-4 hidden md:table-cell">Debits</th>
                        <th className="text-left py-3 pr-4">Closing Balance</th>
                        <th className="text-right py-3 pr-5">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {statements.map((s, i) => {
                        const isDownloading = downloadingPeriod === `${s.year}-${s.month}`;
                        return (
                          <motion.tr key={s.period} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Calendar className="w-4 h-4 text-brand-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold text-brand-secondary text-sm">{s.period}</div>
                                  <div className="text-gray-400 text-xs">{s.from} — {s.to}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4 hidden sm:table-cell">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{s.txCount} tx{s.txCount !== 1 ? "s" : ""}</span>
                            </td>
                            <td className="py-4 pr-4 text-emerald-600 font-semibold text-sm hidden md:table-cell">{s.credits > 0 ? `+$${s.credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}</td>
                            <td className="py-4 pr-4 text-red-500 font-semibold text-sm hidden md:table-cell">{s.debits > 0 ? `-$${s.debits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}</td>
                            <td className="py-4 pr-4 font-display font-bold text-brand-secondary text-sm">${s.closing.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 pr-5 text-right">
                              <button onClick={() => handleDownloadPdf(s)} disabled={downloadingPeriod !== null}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 font-semibold ml-auto">
                                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" /> : <FileText className="w-3.5 h-3.5" />}
                                {isDownloading ? "Generating..." : "PDF"}
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                      {statements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No statement records found for this account.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── CRYPTO ACTIVITY ── */}
        {activeTab === "crypto" && (
          <motion.div key="crypto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            {cryptoLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                <p className="text-xs">Loading crypto trade history...</p>
              </div>
            ) : cryptoMonths.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
                <Coins className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No crypto trades yet. Buy or sell crypto to see activity here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Bought", value: `$${totalCryptoBought.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "text-red-500", bg: "bg-red-50", border: "border-red-100", icon: TrendingDown },
                    { label: "Total Sold", value: `$${totalCryptoSold.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: TrendingUp },
                    { label: "Total Trades", value: cryptoOrders.length.toString(), colorClass: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", icon: Coins },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`${s.bg} border ${s.border} rounded-2xl p-4 shadow-sm`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <s.icon className={`w-3.5 h-3.5 ${s.colorClass}`} />
                        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{s.label}</div>
                      </div>
                      <div className={`font-display font-bold text-lg leading-tight ${s.colorClass}`}>{s.value}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-display font-bold text-brand-secondary text-sm">Monthly Crypto Reports</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Export each month's trades as CSV for tax reporting</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] text-gray-400 border-b border-gray-100 font-bold uppercase tracking-wide">
                          <th className="text-left py-3 px-5">Period</th>
                          <th className="text-left py-3 pr-4">Trades</th>
                          <th className="text-left py-3 pr-4 hidden sm:table-cell">Bought (USD)</th>
                          <th className="text-left py-3 pr-4 hidden sm:table-cell">Sold (USD)</th>
                          <th className="text-left py-3 pr-4 hidden md:table-cell">Fees Paid</th>
                          <th className="text-right py-3 pr-5">Export</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {cryptoMonths.map((m, i) => (
                          <motion.tr key={m.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                  <Coins className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div className="font-semibold text-brand-secondary text-sm">{m.label}</div>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{m.orders.length} trade{m.orders.length !== 1 ? "s" : ""}</span>
                            </td>
                            <td className="py-4 pr-4 text-red-500 font-semibold text-sm hidden sm:table-cell">{m.bought > 0 ? `$${m.bought.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</td>
                            <td className="py-4 pr-4 text-emerald-600 font-semibold text-sm hidden sm:table-cell">{m.sold > 0 ? `$${m.sold.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</td>
                            <td className="py-4 pr-4 text-gray-500 text-sm hidden md:table-cell">{m.fees > 0 ? `$${m.fees.toFixed(2)}` : "—"}</td>
                            <td className="py-4 pr-5 text-right">
                              <button onClick={() => handleCryptoCSV(m)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all font-semibold ml-auto">
                                <Download className="w-3.5 h-3.5" />CSV
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
