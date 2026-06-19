"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ShieldAlert, CheckCircle, XCircle, Filter, DollarSign, Calendar, Landmark, Loader2 } from "lucide-react";
import { loansApi } from "@/lib/api";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actingLoanId, setActingLoanId] = useState<string | null>(null);

  // Fetch loans from backend
  async function loadLoans() {
    setLoading(true);
    try {
      const res = await loansApi.getAllLoans({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter
      });
      setLoans(res.loans || res.records || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load platform loans", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoans();
  }, [page, statusFilter]);

  const handleApprove = async (id: string) => {
    setActingLoanId(id);
    try {
      await loansApi.approveLoan(id);
      await loadLoans();
    } catch (err) {
      alert("Failed to approve loan");
    } finally {
      setActingLoanId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingLoanId(id);
    try {
      await loansApi.rejectLoan(id);
      await loadLoans();
    } catch (err) {
      alert("Failed to reject loan");
    } finally {
      setActingLoanId(null);
    }
  };

  // Perform client-side filter for searches
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const customerName = l.user?.fullName || "";
      const email = l.user?.email || "";
      const matchesSearch = 
        customerName.toLowerCase().includes(search.toLowerCase()) || 
        email.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase()) ||
        l.loanType.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [loans, search]);

  // Derived metrics from loan data
  const metrics = useMemo(() => {
    let disbursed = 0;
    let activeBorrowers = 0;
    let pending = 0;
    let rejected = 0;

    loans.forEach((l) => {
      const amt = parseFloat(l.principalAmount);
      if (l.status === "approved" || l.status === "active") {
        disbursed += amt;
        activeBorrowers += 1;
      } else if (l.status === "pending") {
        pending += 1;
      } else if (l.status === "rejected") {
        rejected += 1;
      }
    });

    return {
      disbursed,
      activeBorrowers,
      pending,
      rejected
    };
  }, [loans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Loan Portfolio Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Approve lending requests, audit outstanding debts, and manage rates.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Capital Disbursed</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              ${metrics.disbursed.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Borrowers</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              {metrics.activeBorrowers}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending Review</div>
            <div className="font-display font-bold text-2xl text-yellow-600 mt-1">
              {metrics.pending}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Rejected Requests</div>
            <div className="font-display font-bold text-2xl text-red-600 mt-1">
              {metrics.rejected}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search loans, clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            className="form-input text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Loan Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Loan List */}
      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Fetching loan filings...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                  <th className="py-3 pr-4">Loan ID</th>
                  <th className="py-3 pr-4">Customer Details</th>
                  <th className="py-3 pr-4">Financing Terms</th>
                  <th className="py-3 pr-4">Principal Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors text-gray-700">
                    <td className="py-4 pr-4 font-mono font-semibold text-brand-secondary">{loan.id.slice(0, 8)}...</td>
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-brand-secondary">{loan.user?.fullName || "Client"}</div>
                      <div className="text-gray-400 font-mono text-[10px]">{loan.user?.email || "N/A"}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-medium text-brand-secondary capitalize">{loan.loanType}</div>
                      <div className="text-gray-400">{loan.termMonths} Months @ {parseFloat(loan.interestRate).toFixed(1)}%</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-bold text-brand-secondary">${parseFloat(loan.principalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      <div className="text-gray-400 font-mono">${parseFloat(loan.monthlyPayment || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}/mo</div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        loan.status === "approved" || loan.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                        loan.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        loan.status === "rejected" ? "bg-gray-50 text-gray-700 border-gray-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {loan.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(loan.id)}
                            disabled={actingLoanId === loan.id}
                            className="p-1.5 rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                            title="Approve & Fund"
                          >
                            {actingLoanId === loan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(loan.id)}
                            disabled={actingLoanId === loan.id}
                            className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            {actingLoanId === loan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold">Audit Checked</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No lending applications matched the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
