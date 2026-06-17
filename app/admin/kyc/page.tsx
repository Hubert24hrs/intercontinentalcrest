"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Eye, FileText, User, Upload } from "lucide-react";
import Image from "next/image";

const kycApplications = [
  { id: "KYC001", name: "Priya Sharma", email: "priya.sharma@infosys.com", country: "India", submitted: "2025-06-15", status: "pending", docType: "Passport", selfie: true, risk: "low" },
  { id: "KYC002", name: "Mohammed Al-Farsi", email: "mfarsi@qatarpost.qa", country: "Qatar", submitted: "2025-06-14", status: "pending", docType: "National ID", selfie: true, risk: "medium" },
  { id: "KYC003", name: "Elena Vasquez", email: "e.vasquez@latamcorp.mx", country: "Mexico", submitted: "2025-06-13", status: "pending", docType: "Driver License", selfie: false, risk: "low" },
  { id: "KYC004", name: "James Okonkwo", email: "james.okonkwo@gmail.com", country: "Nigeria", submitted: "2025-06-10", status: "approved", docType: "Passport", selfie: true, risk: "low" },
  { id: "KYC005", name: "Ahmed Al-Rashid", email: "ahmed.rashid@kmail.com", country: "Saudi Arabia", submitted: "2025-06-08", status: "rejected", docType: "National ID", selfie: true, risk: "high" },
  { id: "KYC006", name: "Anna Kowalski", email: "anna.k@waw.pl", country: "Poland", submitted: "2025-06-07", status: "approved", docType: "Passport", selfie: true, risk: "low" },
];

const statusMap: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { color: "bg-red-100 text-red-600", icon: XCircle },
};

const riskMap: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-600",
};

export default function AdminKycPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<(typeof kycApplications)[0] | null>(null);

  const counts = { all: kycApplications.length, pending: kycApplications.filter(k => k.status === "pending").length, approved: kycApplications.filter(k => k.status === "approved").length, rejected: kycApplications.filter(k => k.status === "rejected").length };
  const filtered = kycApplications.filter(k => filter === "all" || k.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">KYC Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Review and approve customer identity verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(counts).map(([key, val]) => (
          <button key={key} onClick={() => setFilter(key)} className={`dashboard-card text-center cursor-pointer transition-all ${filter === key ? "border-2 border-brand-primary" : ""}`}>
            <div className="font-display font-bold text-2xl text-brand-secondary">{val}</div>
            <div className="text-gray-500 text-xs capitalize">{key}</div>
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Table */}
        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left py-3 pr-4 font-medium">Applicant</th>
                  <th className="text-left py-3 pr-4 font-medium hidden sm:table-cell">Document</th>
                  <th className="text-left py-3 pr-4 font-medium">Risk</th>
                  <th className="text-left py-3 pr-4 font-medium">Status</th>
                  <th className="text-right py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((k) => {
                  const { color, icon: StatusIcon } = statusMap[k.status];
                  return (
                    <tr key={k.id} className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selected?.id === k.id ? "bg-brand-primary/5" : ""}`} onClick={() => setSelected(selected?.id === k.id ? null : k)}>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                            {k.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-brand-secondary text-sm">{k.name}</div>
                            <div className="text-gray-400 text-xs">{k.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-gray-600 text-xs hidden sm:table-cell">{k.docType}</td>
                      <td className="py-3.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskMap[k.risk]}`}>{k.risk}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review panel */}
        {selected && (
          <div className="dashboard-card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-brand-secondary">Review Application</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">Close ×</button>
            </div>

            {/* Applicant info */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              {[
                ["ID", selected.id],
                ["Name", selected.name],
                ["Email", selected.email],
                ["Country", selected.country],
                ["Document", selected.docType],
                ["Submitted", selected.submitted],
                ["Selfie", selected.selfie ? "✓ Submitted" : "✗ Missing"],
                ["Risk Level", selected.risk.toUpperCase()],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs">{label}</span>
                  <span className="font-semibold text-brand-secondary text-xs">{val}</span>
                </div>
              ))}
            </div>

            {/* Document placeholders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300">
                <FileText className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">ID Document</span>
              </div>
              <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300">
                <User className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">Selfie</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Review Notes</label>
              <textarea rows={3} className="form-input resize-none" placeholder="Add reviewer notes..." />
            </div>

            {/* Actions */}
            {selected.status === "pending" && (
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Approve KYC
                </button>
                <button className="flex-1 py-3 rounded-xl bg-red-100 text-red-600 text-sm font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
