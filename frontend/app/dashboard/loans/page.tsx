"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  DollarSign,
  Calendar,
  Percent,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { loansApi, accountsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Apply form state
  const [loanType, setLoanType] = useState("personal");
  const [principalAmount, setPrincipalAmount] = useState("5000");
  const [termMonths, setTermMonths] = useState("12");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Rates mapping by type
  const interestRates: Record<string, number> = {
    personal: 8.5,
    business: 7.25,
    mortgage: 5.75,
    auto: 6.0,
    education: 4.5
  };

  const activeRate = interestRates[loanType] || 6.0;

  async function loadData() {
    try {
      const [loansList, accountsList] = await Promise.all([
        loansApi.getMyLoans(),
        accountsApi.getAccounts()
      ]);
      setLoans(loansList || []);
      setAccounts(accountsList || []);
      if (accountsList && accountsList.length > 0 && !selectedAccountId) {
        // Default to checking account if available
        const checking = accountsList.find((a: any) => a.accountType === "checking");
        setSelectedAccountId(checking ? checking.id : accountsList[0].id);
      }
    } catch (err) {
      console.error("Failed to load loan dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Preview calculations
  const previewData = useMemo(() => {
    const principal = parseFloat(principalAmount);
    const months = parseInt(termMonths);
    if (isNaN(principal) || principal <= 0 || isNaN(months) || months <= 0) {
      return { monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 };
    }

    const monthlyRate = activeRate / 100 / 12;
    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalRepayment = monthlyPayment * months;
    const totalInterest = totalRepayment - principal;

    return {
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      totalRepayment: parseFloat(totalRepayment.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2))
    };
  }, [principalAmount, termMonths, activeRate]);

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmount);
    const months = parseInt(termMonths);

    if (isNaN(principal) || principal < 500) {
      setApplyError("Minimum loan application amount is $500");
      return;
    }
    if (principal > 1000000) {
      setApplyError("Maximum loan limit exceeded ($1,000,000)");
      return;
    }

    setIsApplying(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      await loansApi.applyLoan({
        loanType,
        principalAmount: principal,
        interestRate: activeRate,
        termMonths: months,
        accountId: selectedAccountId
      });

      setApplySuccess("Lending application submitted successfully! Pending administrator verification.");
      await loadData();
      
      // Reset form fields
      setPrincipalAmount("5000");
      setTermMonths("12");
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit loan application");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Accessing credit registry records...</p>
      </div>
    );
  }

  // Calculate metrics
  const activeLoans = loans.filter((l: any) => l.status === "approved" || l.status === "active");
  const pendingLoans = loans.filter((l: any) => l.status === "pending");
  const totalDebt = activeLoans.reduce((sum: number, l: any) => sum + parseFloat(l.outstandingBalance || l.principalAmount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs text-brand-secondary">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl flex items-center gap-2">
            <Landmark className="w-6 h-6 text-brand-primary" />
            Lending &amp; Credit
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Apply for self-directed loans, review pending approvals, and view outstanding custody balances.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Clock className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Records
        </button>
      </div>

      {/* Lending Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Debt Balance</div>
            <div className="font-display font-bold text-xl text-brand-secondary mt-1 font-mono">
              ${totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-red-500" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Lines of Credit</div>
            <div className="font-display font-bold text-xl text-brand-secondary mt-1">
              {activeLoans.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>

        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Applications Pending Review</div>
            <div className="font-display font-bold text-xl text-brand-secondary mt-1">
              {pendingLoans.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Main Grid: Apply form & Active loans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Loan Application & Calculator Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 border-b border-gray-50 pb-3">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <h2 className="font-display font-bold text-brand-secondary text-sm">Request Credit Financing</h2>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-4">
              {applySuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{applySuccess}</span>
                </div>
              )}

              {applyError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* Loan type select */}
              <div className="space-y-1.5">
                <label className="text-gray-600 font-semibold block">Select Loan Category</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="form-input text-xs"
                  required
                >
                  <option value="personal">Personal Loan (APY {interestRates.personal}%)</option>
                  <option value="business">Business Financing (APY {interestRates.business}%)</option>
                  <option value="mortgage">Home Mortgage (APY {interestRates.mortgage}%)</option>
                  <option value="auto">Auto / Vehicles Loan (APY {interestRates.auto}%)</option>
                  <option value="education">Student / Education (APY {interestRates.education}%)</option>
                </select>
              </div>

              {/* Amount field */}
              <div className="space-y-1.5">
                <label className="text-gray-600 font-semibold block">Lending Principal (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    min="500"
                    max="1000000"
                    step="100"
                    required
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    className="form-input pl-7"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block font-mono">Min. $500 — Max. $1,000,000</span>
              </div>

              {/* Term selection */}
              <div className="space-y-1.5">
                <label className="text-gray-600 font-semibold block">Repayment Duration</label>
                <select
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  className="form-input text-xs"
                  required
                >
                  <option value="6">6 Months (Short term)</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="48">48 Months (4 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                </select>
              </div>

              {/* Recipient Account selection */}
              <div className="space-y-1.5">
                <label className="text-gray-600 font-semibold block">Disbursement Account Destination</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="form-input text-xs"
                  required
                >
                  {accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName || acc.accountType.toUpperCase()} - {acc.accountNumber}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-400 block">Funds will be credited automatically here upon approval.</span>
              </div>

              {/* Calculations Box */}
              <div className="bg-[#0A2342]/5 border border-[#0A2342]/10 p-4 rounded-2xl space-y-2.5 font-mono text-[11px] text-brand-secondary">
                <div className="flex justify-between items-center">
                  <span>Interest rate (APY):</span>
                  <strong className="text-brand-primary">{activeRate.toFixed(2)}%</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Monthly repayment:</span>
                  <strong className="text-brand-secondary text-sm">
                    ${previewData.monthlyPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between items-center border-t border-[#0A2342]/10 pt-2 text-gray-500">
                  <span>Total repayment:</span>
                  <span>${previewData.totalRepayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>Total cost of loan:</span>
                  <span>${previewData.totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="w-full btn-primary py-3 justify-center text-xs"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Submitting Filing...
                  </>
                ) : (
                  "Submit Lending Application"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Active Loan Portfolio & History list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-brand-secondary text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-primary" />
              Lending Filing Records ({loans.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-400 border-b border-gray-100 font-bold uppercase">
                    <th className="py-2.5">Loan ID</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Financing Details</th>
                    <th className="py-2.5">Outstanding Balance</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] font-semibold text-brand-secondary">
                  {loans.map((l: any) => {
                    const status = l.status;
                    const date = new Date(l.createdAt);
                    const outstanding = parseFloat(l.outstandingBalance || l.principalAmount);
                    const principal = parseFloat(l.principalAmount);
                    const monthly = parseFloat(l.monthlyPayment || "0");

                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5">
                          <span className="font-mono text-brand-primary" title={l.id}>
                            {l.id.slice(0, 8)}...
                          </span>
                          <span className="block text-[9px] text-gray-400 font-medium">
                            {date.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 capitalize font-medium">{l.loanType}</td>
                        <td className="py-3.5">
                          <div>
                            Principal: <strong className="font-mono text-gray-700">${principal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
                          </div>
                          <div className="text-gray-400 font-normal">
                            {l.termMonths}mo @ {parseFloat(l.interestRate).toFixed(2)}% APY
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-gray-800">
                          <div>${outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                          <span className="text-[10px] text-gray-400 font-normal">
                            Payment: ${monthly.toLocaleString("en-US", { minimumFractionDigits: 2 })}/mo
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            status === "approved" || status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                            status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            status === "rejected" ? "bg-gray-50 text-gray-700 border-gray-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                        You have not submitted any lending or credit applications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Compliance Notice */}
          <div className="bg-gradient-to-br from-[#0A2342]/5 to-[#1e3a8a]/5 border border-gray-150 rounded-2xl p-5 space-y-2 text-gray-600 leading-normal">
            <h4 className="font-bold text-brand-secondary text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Lending Custodian Disclosures:
            </h4>
            <p className="text-[10px]">
              Intercontinental Crest provides structured self-directed credit services. Lending approvals are subjected to credit worthiness and documentation audits. Funds are disbursed immediately to your Checking Account upon approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
