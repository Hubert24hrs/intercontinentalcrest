"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, RefreshCw, Eye, ShieldAlert, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2, X } from "lucide-react";
import { adminApi } from "@/lib/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  async function loadLogs(pageNum = page) {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs(pageNum, 20);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [page]);

  const handleManualRefresh = () => {
    setPage(1);
    loadLogs(1);
  };

  // Client side search matching action, entityType, or operator email
  function safeJson(str: string | null | undefined) {
    if (!str) return "";
    try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
  }

  const filteredLogs = logs.filter((log) => {
    const action = log.action || "";
    const email = log.user?.email || "";
    const text = search.toLowerCase();
    return action.toLowerCase().includes(text) || email.toLowerCase().includes(text);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Audit & Security Logs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Chronological record of administrative operations, policy changes, and auth alerts.</p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 bg-white shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search email, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Audit List */}
      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Loading ledger audits...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                  <th className="py-3 pr-4">Timestamp</th>
                  <th className="py-3 pr-4">Operator</th>
                  <th className="py-3 pr-4">Event Action</th>
                  <th className="py-3 pr-4">IP Address</th>
                  <th className="py-3 pr-4">Target Entity</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-brand-secondary font-medium">
                {filteredLogs.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors text-gray-700">
                      <td className="py-4 pr-4 font-mono text-[10px] text-gray-500 whitespace-nowrap">
                        {date.toLocaleString()}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-brand-secondary">{log.user?.fullName || "SYSTEM"}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{log.user?.email || "internal@crestdock.com"}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-mono text-xs bg-blue-50 text-brand-primary border border-blue-100 px-2 py-0.5 rounded font-bold uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 pr-4 font-mono text-[10px] text-gray-500">{log.ipAddress || "Internal/Local"}</td>
                      <td className="py-4 pr-4 text-xs font-semibold text-gray-600 uppercase">
                        {log.entityType} ({log.entityId?.slice(0, 8) || "N/A"})
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No security logs matching search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs">
            <span className="text-gray-400">Page {page} of {totalPages} (Total {total} entries)</span>
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-brand-secondary text-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="font-display font-bold text-lg">Detailed Audit Payload</h2>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-gray-400 font-semibold uppercase">Event Timestamp</div>
                  <div className="font-semibold mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-semibold uppercase">Operator IP Address</div>
                  <div className="font-mono mt-0.5 font-semibold text-gray-700">{selectedLog.ipAddress || "Internal"}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Target Entity Details</div>
                <div className="mt-0.5 flex gap-2">
                  <span className="font-bold text-brand-primary uppercase">{selectedLog.entityType}</span>
                  <span className="font-mono font-semibold text-gray-500">ID: {selectedLog.entityId || "N/A"}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Operator Identity</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-bold">{selectedLog.user?.fullName || "SYSTEM"}</span>
                  <span className="text-gray-500 font-mono">({selectedLog.user?.email || "internal@crestdock.com"})</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 font-bold uppercase rounded text-[10px]">{selectedLog.user?.role || "system"}</span>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Before State values</div>
                  <pre className="font-mono text-xs bg-white border border-gray-200 p-2.5 rounded-lg overflow-x-auto max-h-32 text-gray-700 select-all">
                    {safeJson(selectedLog.oldValues)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Applied Change values</div>
                  <pre className="font-mono text-xs bg-white border border-gray-200 p-2.5 rounded-lg overflow-x-auto max-h-32 text-gray-700 select-all">
                    {safeJson(selectedLog.newValues)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-primary text-xs py-2 px-5"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
