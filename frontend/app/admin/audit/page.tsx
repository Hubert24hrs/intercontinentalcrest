"use client";

import { useState } from "react";
import { Search, Calendar, RefreshCw, Eye, ShieldAlert, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

interface AuditLog {
  id: string;
  email: string;
  role: "customer" | "admin" | "super_admin" | "support";
  action: string;
  entityType: string;
  ipAddress: string;
  timestamp: string;
  status: "success" | "warning" | "failed";
  details: string;
}

const initialLogs: AuditLog[] = [
  { id: "LOG-1021", email: "admin@intercontinentalcrest.com", role: "super_admin", action: "ROLE_UPDATE", entityType: "users", ipAddress: "192.168.1.45", timestamp: "2026-06-17 12:11:05", status: "success", details: "Changed role of sarah.m@example.com to support agent" },
  { id: "LOG-1022", email: "john.doe@example.com", role: "customer", action: "TRANSFER_FUNDS", entityType: "transactions", ipAddress: "82.44.112.5", timestamp: "2026-06-17 12:09:41", status: "success", details: "Transferred $2,500.00 to Sarah Mitchell" },
  { id: "LOG-1023", email: "guest_user@unknown.com", role: "customer", action: "AUTH_LOGIN_FAILED", entityType: "users", ipAddress: "14.220.10.89", timestamp: "2026-06-17 12:05:12", status: "failed", details: "Failed password attempt on admin account (lockout threat)" },
  { id: "LOG-1024", email: "support.agent@intercrest.com", role: "support", action: "KYC_DOCUMENT_REJECT", entityType: "kyc_documents", ipAddress: "192.168.1.102", timestamp: "2026-06-17 11:58:30", status: "warning", details: "Rejected utility bill proof for client ID U-8812 due to blurriness" },
  { id: "LOG-1025", email: "clara.oswald@example.com", role: "customer", action: "2FA_ENABLED", entityType: "users", ipAddress: "109.112.56.74", timestamp: "2026-06-17 10:14:22", status: "success", details: "Successfully linked Google Authenticator app for 2FA" },
  { id: "LOG-1026", email: "admin@intercontinentalcrest.com", role: "super_admin", action: "SETTINGS_UPDATE", entityType: "system_settings", ipAddress: "192.168.1.45", timestamp: "2026-06-17 09:30:00", status: "success", details: "Enabled maintenance mode for investment microservice (duration: 30m)" }
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.email.toLowerCase().includes(search.toLowerCase()) || 
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.details.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Audit & Security Logs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track chronological administrative actions, compliance queries, and login alerts.</p>
        </div>
        <button
          onClick={() => setLogs(initialLogs)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 bg-white shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Refresh Log
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Log Entries (24h)</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">1,492</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-brand-primary" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Suspicious Activities / Violations</div>
            <div className="font-display font-bold text-2xl text-amber-600 mt-1">12</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Critical Failures / Alerts</div>
            <div className="font-display font-bold text-2xl text-red-600 mt-1">1</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search email, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            className="form-input text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Audit Statuses</option>
            <option value="success">Success Only</option>
            <option value="warning">Warnings / Flags</option>
            <option value="failed">Failed Operations</option>
          </select>
        </div>
      </div>

      {/* Log Details Modal / Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="font-display font-bold text-brand-secondary text-lg">Detailed Audit Record</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                selectedLog.status === "success" ? "bg-green-100 text-green-700" :
                selectedLog.status === "warning" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {selectedLog.status}
              </span>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 font-medium">Operator IP Address</div>
                  <div className="font-mono mt-0.5 font-semibold">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Record Timestamp</div>
                  <div className="mt-0.5 font-semibold">{selectedLog.timestamp}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-medium">Performing Identity</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-semibold text-brand-secondary">{selectedLog.email}</span>
                  <span className="px-2 py-0.2 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold rounded">
                    {selectedLog.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 font-medium">Action Event ID</div>
                  <div className="mt-0.5 font-mono text-brand-primary font-bold">{selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Target Entity Type</div>
                  <div className="mt-0.5 font-semibold uppercase">{selectedLog.entityType}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs text-gray-400 font-medium mb-1">Details & Payload</div>
                <p className="font-medium text-gray-700 leading-relaxed">{selectedLog.details}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full btn-primary text-sm py-2.5 justify-center"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Audit List */}
      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Log ID</th>
                <th className="text-left py-3 pr-4 font-medium">Timestamp</th>
                <th className="text-left py-3 pr-4 font-medium">Operator Details</th>
                <th className="text-left py-3 pr-4 font-medium">Event Action</th>
                <th className="text-left py-3 pr-4 font-medium">IP Address</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                  <td className="py-4 pr-4 font-mono font-semibold text-brand-secondary">{log.id}</td>
                  <td className="py-4 pr-4 text-xs text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-brand-secondary flex items-center gap-1.5">
                      {log.email}
                      <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 text-gray-500 rounded font-bold uppercase">
                        {log.role}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono text-xs bg-blue-50 text-brand-primary px-2 py-0.5 rounded font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-gray-500">{log.ipAddress}</td>
                  <td className="py-4 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                      log.status === "success" ? "bg-green-50 text-green-700" :
                      log.status === "warning" ? "bg-yellow-50 text-yellow-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {log.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                       log.status === "warning" ? <AlertTriangle className="w-3.5 h-3.5" /> : 
                       <ShieldAlert className="w-3.5 h-3.5" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
