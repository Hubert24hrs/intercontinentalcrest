"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar, Loader2, AlertCircle } from "lucide-react";
import { accountsApi } from "@/lib/api";

export default function StatementsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statementsLoading, setStatementsLoading] = useState(false);
  const [downloadingPeriod, setDownloadingPeriod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const accs = await accountsApi.getAccounts();
        setAccounts(accs || []);
        if (accs && accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching accounts:", err);
        setError("Failed to load accounts. Please try again.");
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;

    async function fetchStatements() {
      setStatementsLoading(true);
      setError(null);
      try {
        const stats = await accountsApi.getMonthlyStatements(selectedAccountId);
        setStatements(stats || []);
      } catch (err: any) {
        console.error("Error fetching statements:", err);
        setError("Failed to load statement cycles.");
      } finally {
        setStatementsLoading(false);
        setLoading(false);
      }
    }

    fetchStatements();
  }, [selectedAccountId]);

  const handleDownloadPdf = async (s: any) => {
    setDownloadingPeriod(`${s.year}-${s.month}`);
    try {
      await accountsApi.downloadStatementPdf(selectedAccountId, s.year, s.month);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to generate and download statement PDF. Please try again.");
    } finally {
      setDownloadingPeriod(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Retrieving statement schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Statements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Download official monthly statements for your records</p>
        </div>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Account:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-brand-secondary font-medium outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 shadow-sm cursor-pointer min-w-[220px]"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountType.toUpperCase()} (***{acc.accountNumber.slice(-4)}) - ${parseFloat(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {statementsLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary mb-2" />
          <p className="text-xs">Recalculating account statement records...</p>
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left py-3 pr-4 font-medium">Period</th>
                  <th className="text-left py-3 pr-4 font-medium hidden sm:table-cell">Transactions</th>
                  <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Credits</th>
                  <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Debits</th>
                  <th className="text-left py-3 pr-4 font-medium">Closing Balance</th>
                  <th className="text-right py-3 font-medium">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statements.map((s) => {
                  const isDownloading = downloadingPeriod === `${s.year}-${s.month}`;
                  return (
                    <tr key={s.period} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-brand-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-brand-secondary text-sm">{s.period}</div>
                            <div className="text-gray-400 text-xs">{s.from} — {s.to}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-gray-600 text-sm hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {s.txCount} transaction{s.txCount !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-green-600 font-semibold text-sm hidden md:table-cell">
                        {s.credits > 0 ? `+$${s.credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="py-4 pr-4 text-red-500 font-semibold text-sm hidden md:table-cell">
                        {s.debits > 0 ? `-$${s.debits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                      </td>
                      <td className="py-4 pr-4 font-display font-bold text-brand-secondary text-sm">
                        ${s.closing.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleDownloadPdf(s)}
                            disabled={downloadingPeriod !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50 cursor-pointer font-medium"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            {isDownloading ? "Generating..." : "Download PDF"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {statements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                      No statement records found for this account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
