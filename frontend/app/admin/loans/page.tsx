"use client";

import { useState } from "react";
import { Search, ShieldAlert, CheckCircle, XCircle, Filter, DollarSign, Calendar, Landmark } from "lucide-react";

interface Loan {
  id: string;
  customerName: string;
  email: string;
  type: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: "pending" | "approved" | "active" | "rejected" | "defaulted";
  appliedDate: string;
}

const initialLoans: Loan[] = [
  { id: "L-9081", customerName: "David Sterling", email: "david.sterling@example.com", type: "Commercial Mortgage", principal: 450000, interestRate: 4.8, termMonths: 180, monthlyPayment: 3512, status: "pending", appliedDate: "2026-06-12" },
  { id: "L-9082", customerName: "Jane Doe", email: "jane.doe@example.com", type: "Personal Loan", principal: 25000, interestRate: 7.2, termMonths: 36, monthlyPayment: 774, status: "active", appliedDate: "2026-04-10" },
  { id: "L-9083", customerName: "Marcus Vance", email: "marcus.vance@example.com", type: "Business Expansion", principal: 150000, interestRate: 5.5, termMonths: 60, monthlyPayment: 2865, status: "active", appliedDate: "2026-02-15" },
  { id: "L-9084", customerName: "Olivia Henderson", email: "olivia.h@example.com", type: "Education Loan", principal: 40000, interestRate: 3.5, termMonths: 48, monthlyPayment: 894, status: "pending", appliedDate: "2026-06-15" },
  { id: "L-9085", customerName: "Robert Chen", email: "robert.chen@example.com", type: "Auto Loan", principal: 35000, interestRate: 6.0, termMonths: 60, monthlyPayment: 676, status: "rejected", appliedDate: "2026-05-20" },
  { id: "L-9086", customerName: "Arthur Pendelton", email: "arthur.p@example.com", type: "Home Improvement", principal: 60000, interestRate: 5.2, termMonths: 72, monthlyPayment: 972, status: "defaulted", appliedDate: "2025-09-11" }
];

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleStatusChange = (id: string, newStatus: "active" | "rejected" | "approved") => {
    setLoans(prev => prev.map(loan => loan.id === id ? { ...loan, status: newStatus } : loan));
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          loan.id.toLowerCase().includes(search.toLowerCase()) ||
                          loan.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = loans
    .filter(l => l.status === "active" || l.status === "defaulted")
    .reduce((sum, l) => sum + l.principal, 0);

  const pendingCount = loans.filter(l => l.status === "pending").length;
  const defaultedCount = loans.filter(l => l.status === "defaulted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Loan Portfolio Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Approve lending requests, audit outstanding debts, and manage rates.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Capital Disbursed</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              ${totalDisbursed.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Active Borrowers</div>
            <div className="font-display font-bold text-2xl text-brand-secondary mt-1">
              {loans.filter(l => l.status === "active").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Pending Approvals</div>
            <div className="font-display font-bold text-2xl text-yellow-600 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        <div className="dashboard-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">Non-Performing Loans</div>
            <div className="font-display font-bold text-2xl text-red-600 mt-1">
              {defaultedCount}
            </div>
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
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Loan Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="active">Active Portfolio</option>
            <option value="rejected">Rejected</option>
            <option value="defaulted">Defaulted / Delinquent</option>
          </select>
        </div>
      </div>

      {/* Main Loan List */}
      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Application ID</th>
                <th className="text-left py-3 pr-4 font-medium">Customer Details</th>
                <th className="text-left py-3 pr-4 font-medium">Loan Details</th>
                <th className="text-left py-3 pr-4 font-medium">Financing Summary</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                  <td className="py-4 pr-4 font-mono font-semibold text-brand-secondary">{loan.id}</td>
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-brand-secondary">{loan.customerName}</div>
                    <div className="text-xs text-gray-400">{loan.email}</div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="font-medium text-brand-secondary">{loan.type}</div>
                    <div className="text-xs text-gray-400">{loan.termMonths} Months @ {loan.interestRate}%</div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="font-bold text-brand-secondary">${loan.principal.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">${loan.monthlyPayment.toLocaleString()}/mo</div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      loan.status === "active" ? "bg-green-100 text-green-700" :
                      loan.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      loan.status === "rejected" ? "bg-gray-100 text-gray-700" :
                      loan.status === "defaulted" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {loan.status === "pending" ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleStatusChange(loan.id, "active")}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Approve & Fund"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(loan.id, "rejected")}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">None Required</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                    No loan applications matching the selected criteria.
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
