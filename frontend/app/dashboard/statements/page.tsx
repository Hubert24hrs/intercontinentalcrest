"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Calendar, Loader2, AlertCircle, Coins, Download, TrendingUp, TrendingDown } from "lucide-react";
import { accountsApi, cryptoApi } from "@/lib/api";

type Tab = "bank" | "crypto";

export default function StatementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("bank");

  // Bank state
  const [accounts, setAccounts]               = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [statements, setStatements]           = useState<any[]>([]);
  const [bankLoading, setBankLoading]         = useState(true);
  const [statementsLoading, setStatementsLoading] = useState(false);
  const [downloadingPeriod, setDownloadingPeriod] = useState<string | null>(null);
  const [bankError, setBankError]             = useState<string | null>(null);

  // Crypto state
  const [cryptoOrders, setCryptoOrders]       = useState<any[]>([]);
  const [cryptoLoading, setCryptoLoading]     = useState(true);

  // ── Load bank accounts ─────────────────────────────────────────────────────
  useEffect(() => {
    accountsApi.getAccounts()
      .then((accs) => {
        setAccounts(accs || []);
        if (accs && accs.length > 0) setSelectedAccountId(accs[0].id);
        else setBankLoading(false);
      })
      .catch(() => {
        setBankError("Failed to load accounts.");
        setBankLoading(false);
      });
  }, []);

  // ── Load bank statements when account changes ─────────────────────────────
  useEffect(() => {
    if (!selectedAccountId) return;
    setStatementsLoading(true);
    setBankError(null);
    accountsApi.getMonthlyStatements(selectedAccountId)
      .then((data) => setStatements(data || []))
      .catch(() => setBankError("Failed to load statement periods."))
      .finally(() => { setStatementsLoading(false); setBankLoading(false); });
  }, [selectedAccountId]);

  // ── Load all crypto orders ─────────────────────────────────────────────────
  useEffect(() => {
    setCryptoLoading(true);
    cryptoApi.getMyOrders(1, 500)
      .then((res) => setCryptoOrders(res?.orders || []))
      .catch(() => setCryptoOrders([]))
      .finally(() => setCryptoLoading(false));
  }, []);

  // ── Group crypto orders by YYYY-MM ────────────────────────────────────────
  const cryptoMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; orders: any[]; bought: number; sold: number; fees: number }>();

    cryptoOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!map.has(key)) map.set(key, { key, label, orders: [], bought: 0, sold: 0, fees: 0 });
      const entry = map.get(key)!;
      entry.orders.push(o);
      const usd = parseFloat(o.totalUsd || "0");
      const fee = parseFloat(o.fee || "0");
      if (o.type === "buy") entry.bought += usd;
      else entry.sold += usd;
      entry.fees += fee;
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [cryptoOrders]);

  // ── CSV export for a crypto month ─────────────────────────────────────────
  const handleCryptoCSV = (monthEntry: typeof cryptoMonths[number]) => {
    const headers = ["ID", "Type", "Coin", "Symbol", "Quantity", "Price/Unit (USD)", "Total (USD)", "Fee (USD)", "Status", "Date"];
    const rows = monthEntry.orders.map((o) => [
      o.id,
      o.type.toUpperCase(),
      o.coinName,
      o.coinSymbol?.toUpperCase(),
      parseFloat(o.quantity).toFixed(8),
      parseFloat(o.priceAtTime).toFixed(2),
      parseFloat(o.totalUsd).toFixed(2),
      parseFloat(o.fee || "0").toFixed(2),
      o.status,
      new Date(o.createdAt).toLocaleString(),
    ]);
    const csv = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `ic_crypto_${monthEntry.key}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async (s: any) => {
    setDownloadingPeriod(`${s.year}-${s.month}`);
    try {
      await accountsApi.downloadStatementPdf(selectedAccountId, s.year, s.month);
    } catch {
      alert("Failed to generate statement PDF. Please try again.");
    } finally {
      setDownloadingPeriod(null);
    }
  };

  const isLoading = activeTab === "bank" ? bankLoading : cryptoLoading;

  if (isLoading && activeTab === "bank" && bankLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Retrieving statement schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Statements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Download official monthly statements and crypto activity reports</p>
        </div>

        {/* Account selector (bank tab only) */}
        {activeTab === "bank" && accounts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Account:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-brand-secondary font-medium outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 shadow-sm cursor-pointer min-w-[220px] appearance-auto"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountType.toUpperCase()} (***{acc.accountNumber.slice(-4)}) — ${parseFloat(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "bank" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <FileText className="w-3.5 h-3.5" />
          Bank Statements
        </button>
        <button
          onClick={() => setActiveTab("crypto")}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "crypto" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Coins className="w-3.5 h-3.5" />
          Crypto Activity
          {cryptoOrders.length > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{cryptoOrders.length}</span>
          )}
        </button>
      </div>

      {/* ── BANK STATEMENTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "bank" && (
        <>
          {bankError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{bankError}</p>
            </div>
          )}

          {statementsLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary mb-2" />
              <p className="text-xs">Recalculating account statement records...</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
                    {statements.map((s) => {
                      const isDownloading = downloadingPeriod === `${s.year}-${s.month}`;
                      return (
                        <tr key={s.period} className="hover:bg-gray-50/50 transition-colors">
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
                          <td className="py-4 pr-4 text-gray-600 text-sm hidden sm:table-cell">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {s.txCount} tx{s.txCount !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-emerald-600 font-semibold text-sm hidden md:table-cell">
                            {s.credits > 0 ? `+$${s.credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                          </td>
                          <td className="py-4 pr-4 text-red-500 font-semibold text-sm hidden md:table-cell">
                            {s.debits > 0 ? `-$${s.debits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                          </td>
                          <td className="py-4 pr-4 font-display font-bold text-brand-secondary text-sm">
                            ${s.closing.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 pr-5 text-right">
                            <button
                              onClick={() => handleDownloadPdf(s)}
                              disabled={downloadingPeriod !== null}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50 font-medium ml-auto"
                            >
                              {isDownloading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                                : <FileText className="w-3.5 h-3.5" />
                              }
                              {isDownloading ? "Generating..." : "PDF"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {statements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                          No statement records found for this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CRYPTO ACTIVITY TAB ─────────────────────────────────────────────── */}
      {activeTab === "crypto" && (
        <>
          {cryptoLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs">Loading crypto trade history...</p>
            </div>
          ) : cryptoMonths.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm shadow-sm">
              <Coins className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              No crypto trades found. Buy or sell crypto to see activity here.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total Bought",
                    value: `$${cryptoOrders.filter(o => o.type === "buy").reduce((s, o) => s + parseFloat(o.totalUsd), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    color: "text-red-500", bg: "bg-red-50", icon: TrendingDown,
                  },
                  {
                    label: "Total Sold",
                    value: `$${cryptoOrders.filter(o => o.type === "sell").reduce((s, o) => s + parseFloat(o.totalUsd), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp,
                  },
                  {
                    label: "Total Trades",
                    value: cryptoOrders.length.toString(),
                    color: "text-indigo-600", bg: "bg-indigo-50", icon: Coins,
                  },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100 shadow-sm`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{s.label}</div>
                    </div>
                    <div className={`font-display font-bold text-lg leading-tight ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Monthly breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="font-display font-bold text-brand-secondary text-sm">Monthly Crypto Reports</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Download CSV for each month's trades</p>
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
                      {cryptoMonths.map((m) => (
                        <tr key={m.key} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <Coins className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div className="font-semibold text-brand-secondary text-sm">{m.label}</div>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
                              {m.orders.length} trade{m.orders.length !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-red-500 font-semibold text-sm hidden sm:table-cell">
                            {m.bought > 0 ? `$${m.bought.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="py-4 pr-4 text-emerald-600 font-semibold text-sm hidden sm:table-cell">
                            {m.sold > 0 ? `$${m.sold.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="py-4 pr-4 text-gray-500 text-sm hidden md:table-cell">
                            {m.fees > 0 ? `$${m.fees.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-4 pr-5 text-right">
                            <button
                              onClick={() => handleCryptoCSV(m)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium ml-auto"
                            >
                              <Download className="w-3.5 h-3.5" />
                              CSV
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
