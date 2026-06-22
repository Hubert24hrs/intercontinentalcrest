"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Eye, FileText, User, Loader2, AlertCircle } from "lucide-react";
import { kycApi } from "@/lib/api";

const statusMap: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-yellow-50 text-yellow-700 border border-yellow-200", icon: Clock },
  approved: { color: "bg-green-50 text-green-700 border border-green-200", icon: CheckCircle2 },
  rejected: { color: "bg-red-50 text-red-600 border border-red-200", icon: XCircle },
};

export default function AdminKycPage() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  // Selected KYC document for detail sidebar
  const [selected, setSelected] = useState<any | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadKyc() {
    setLoading(true);
    try {
      const res = await kycApi.getAllKyc({
        page,
        limit: 15,
        status: filter === "all" ? undefined : filter
      });
      setKycList(res.kycDocuments || res.records || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load KYC lists", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKyc();
  }, [page, filter]);

  const handleReviewAction = async (id: string, status: "approved" | "rejected") => {
    setReviewing(true);
    setErrorMsg(null);
    try {
      await kycApi.reviewKyc(id, {
        status,
        reviewerNotes: reviewerNotes || undefined
      });
      
      setReviewerNotes("");
      setSelected(null);
      
      // Reload KYC documents
      await loadKyc();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update review status");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">KYC Identification Audits</h1>
        <p className="text-gray-500 text-sm mt-0.5">Review and approve customer identity verifications.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {["all", "pending", "approved", "rejected"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => { setFilter(tab); setPage(1); setSelected(null); }} 
            className={`px-5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === tab ? "bg-white text-brand-secondary shadow-sm" : "text-gray-500 hover:text-brand-secondary"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Table */}
        <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
              <span className="text-xs">Fetching audits...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                    <th className="py-3 pr-4">Applicant</th>
                    <th className="py-3 pr-4">Document</th>
                    <th className="py-3 pr-4">Submitted At</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {kycList.map((k) => {
                    const mapped = statusMap[k.status] || { color: "bg-gray-100 text-gray-600", icon: Clock };
                    const { color, icon: StatusIcon } = mapped;
                    const date = new Date(k.submittedAt || k.createdAt);
                    
                    return (
                      <tr 
                        key={k.id} 
                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selected?.id === k.id ? "bg-brand-primary/5" : ""}`} 
                        onClick={() => { setSelected(selected?.id === k.id ? null : k); setErrorMsg(null); }}
                      >
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0 uppercase">
                              {k.user?.fullName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <div className="font-semibold text-brand-secondary text-sm">{k.user?.fullName || "Client"}</div>
                              <div className="text-gray-400 text-xs font-mono">{k.user?.email || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-600 font-semibold">{k.documentType}</td>
                        <td className="py-3.5 pr-4 text-gray-500 font-mono">
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {k.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {kycList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">No identity verification filings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review panel */}
        {selected && (
          <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-brand-secondary text-sm">Review Identification File</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase">Close ×</button>
            </div>

            {/* Applicant details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100 text-xs text-brand-secondary">
              {[
                ["Filing ID", selected.id],
                ["Client Name", selected.user?.fullName || "Client"],
                ["Email", selected.user?.email || "N/A"],
                ["Document Type", selected.documentType],
                ["Submitted Date", new Date(selected.submittedAt || selected.createdAt).toLocaleDateString()],
                ["Document front URL", selected.documentFrontUrl || "Not uploaded"],
                ["Document back URL", selected.documentBackUrl || "Not uploaded"],
                ["Proof of address URL", selected.proofOfAddressUrl || "Not uploaded"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400 font-semibold">{label}</span>
                  <span className="font-mono text-gray-600 font-bold truncate max-w-xs">{val}</span>
                </div>
              ))}
            </div>

            {/* Document details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300">
                <FileText className="w-6 h-6 text-gray-400" />
                <span className="text-gray-400">Front Copy</span>
                {selected.documentFrontUrl && (
                  <span className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer" onClick={() => window.open(selected.documentFrontUrl, "_blank")}>Open File</span>
                )}
              </div>
              <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300">
                <User className="w-6 h-6 text-gray-400" />
                <span className="text-gray-400">Selfie Copy</span>
                {selected.selfieUrl && (
                  <span className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer" onClick={() => window.open(selected.selfieUrl, "_blank")}>Open File</span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assessor Remarks / Audit Notes</label>
              <textarea 
                rows={3} 
                className="form-input resize-none" 
                placeholder="Include description for approval or reasons for rejection..." 
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            {selected.status === "pending" && (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleReviewAction(selected.id, "approved")}
                  disabled={reviewing}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve KYC File
                </button>
                <button 
                  onClick={() => handleReviewAction(selected.id, "rejected")}
                  disabled={reviewing}
                  className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
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
