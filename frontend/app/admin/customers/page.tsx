"use client";

import { useState, useEffect } from "react";
import {
  Search, UserCheck, UserX, Eye, Loader2, RefreshCw, X,
  ShieldAlert, Trash2, DollarSign, ArrowUpCircle, ArrowDownCircle,
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import { adminApi } from "@/lib/api";

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700 border border-green-200",
  suspended: "bg-red-50 text-red-600 border border-red-200",
  inactive: "bg-gray-50 text-gray-600 border border-gray-200",
  pending_verification: "bg-yellow-50 text-yellow-700 border border-yellow-200",
};

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Selected customer for modal inspect
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // ── Adjust Balance Modal State ────────────────────────────────────────────
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustRef, setAdjustRef] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState("");
  const [adjustError, setAdjustError] = useState("");

  const parsedAmount = parseFloat(adjustAmount) || 0;
  const previewBalance = adjustAccount
    ? adjustType === "credit"
      ? parseFloat(adjustAccount.balance) + parsedAmount
      : parseFloat(adjustAccount.balance) - parsedAmount
    : 0;

  function openAdjustModal(acc: any) {
    setAdjustAccount(acc);
    setAdjustType("credit");
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustRef("");
    setAdjustSuccess("");
    setAdjustError("");
    setAdjustModalOpen(true);
  }

  function closeAdjustModal() {
    setAdjustModalOpen(false);
    setAdjustAccount(null);
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustAccount || !selectedCustomerId) return;

    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) {
      setAdjustError("Please enter a valid positive amount.");
      return;
    }
    if (adjustReason.trim().length < 5) {
      setAdjustError("Reason must be at least 5 characters.");
      return;
    }

    const currentBal = parseFloat(adjustAccount.balance);
    const action = adjustType === "credit"
      ? `credit $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} to`
      : `debit $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} from`;

    if (
      !confirm(
        `Are you sure you want to ${action} account ${adjustAccount.accountNumber}?\n\n` +
        `Current balance: $${currentBal.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n` +
        `New balance: $${previewBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n\n` +
        `Reason: ${adjustReason.trim()}\n\nThis action will be fully logged in the audit trail.`
      )
    ) return;

    setAdjusting(true);
    setAdjustError("");
    setAdjustSuccess("");
    try {
      const result = await adminApi.adjustBalance(selectedCustomerId, {
        type: adjustType,
        amount,
        accountId: adjustAccount.id,
        reason: adjustReason.trim(),
        reference: adjustRef.trim() || undefined,
      });
      setAdjustSuccess(
        `✓ Account ${adjustType === "credit" ? "credited" : "debited"} successfully. ` +
        `New balance: $${Number(result.updatedBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      );
      setAdjustAmount("");
      setAdjustReason("");
      setAdjustRef("");
      // Refresh customer detail so balances update live
      await handleViewDetail(selectedCustomerId);
      setTimeout(() => setAdjustSuccess(""), 6000);
    } catch (err: any) {
      setAdjustError(err?.message || "Failed to adjust balance.");
    } finally {
      setAdjusting(false);
    }
  }

  // Load clients list
  async function loadCustomers(pageNum = page) {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: pageNum,
        limit: 15,
        search: search || undefined,
        status: filterStatus === "all" ? undefined : filterStatus
      });
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load customer list", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [page, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers(1);
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      await loadCustomers();
      if (selectedCustomerId === userId) {
        handleViewDetail(userId);
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      await loadCustomers();
      if (selectedCustomerId === userId) {
        handleViewDetail(userId);
      }
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!confirm(`Permanently delete "${fullName}"? This cannot be undone.`)) return;
    setDeletingUser(true);
    try {
      await adminApi.deleteUser(userId);
      setSelectedCustomerId(null);
      setCustomerDetail(null);
      await loadCustomers();
    } catch (err: any) {
      alert(err?.message || "Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleToggleFreeze = async (accountId: string, currentFrozen: boolean) => {
    try {
      await adminApi.toggleAccountFreeze(accountId, !currentFrozen);
      if (selectedCustomerId) {
        handleViewDetail(selectedCustomerId);
      }
    } catch (err) {
      alert("Failed to change account freeze state");
    }
  };

  const handleViewDetail = async (userId: string) => {
    setSelectedCustomerId(userId);
    setLoadingDetail(true);
    try {
      const detail = await adminApi.getUserDetail(userId);
      setCustomerDetail(detail);
    } catch (err) {
      console.error("Failed to load customer details", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Customer Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total registered clients on record</p>
        </div>
      </div>

      {/* Filters form */}
      <form onSubmit={handleSearchSubmit} className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input max-w-xs"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
            <option value="pending_verification">Pending verification</option>
          </select>
          <button type="submit" className="btn-primary text-sm px-5 py-2.5">
            Search
          </button>
        </div>
      </form>

      {/* List content */}
      <div className="dashboard-card bg-white border border-gray-100 p-6 rounded-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
            <span className="text-xs">Fetching clients index...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 font-semibold">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4 hidden md:table-cell">Phone</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4 hidden lg:table-cell">Created At</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {users.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0 uppercase">
                          {c.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-brand-secondary text-sm">{c.fullName}</div>
                          <div className="text-gray-400 text-xs font-mono">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600 font-mono hidden md:table-cell">{c.phone || "Not Set"}</td>
                    <td className="py-3.5 pr-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase">{c.role}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-500 hidden lg:table-cell">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleViewDetail(c.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 hover:border-brand-primary hover:text-brand-primary rounded-xl font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">No client accounts found matching the criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Inspector Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between text-brand-secondary">
              <h2 className="font-display font-bold text-lg">Customer Account Inspector</h2>
              <button onClick={() => setSelectedCustomerId(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
                  <span>Loading ledger connections...</span>
                </div>
              ) : customerDetail ? (
                <div className="space-y-6">
                  {/* General Profile Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Full Client Name</div>
                      <div className="font-bold text-brand-secondary text-sm mt-0.5">{customerDetail.fullName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Email & Phone</div>
                      <div className="font-mono text-xs text-brand-secondary mt-0.5">{customerDetail.email}</div>
                      <div className="font-mono text-xs text-gray-500">{customerDetail.phone || "No phone number"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Global Status / Role</div>
                      <div className="flex gap-2 items-center mt-1">
                        <select
                          value={customerDetail.status}
                          onChange={(e) => handleUpdateStatus(customerDetail.id, e.target.value)}
                          className="bg-white border border-gray-200 text-xs px-2 py-1 rounded font-bold"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <select
                          value={customerDetail.role}
                          onChange={(e) => handleUpdateRole(customerDetail.id, e.target.value)}
                          className="bg-white border border-gray-200 text-xs px-2 py-1 rounded font-bold"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                          <option value="support">Support</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bank Accounts list */}
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-brand-secondary text-sm">Funding & Checking Accounts</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customerDetail.accounts?.map((acc: any) => (
                        <div key={acc.id} className="p-4 border border-gray-100 rounded-2xl shadow-sm bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-bold text-brand-secondary text-xs uppercase">{acc.accountType} Account</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{acc.accountNumber}</div>
                              <div className="font-mono font-bold text-brand-primary text-sm mt-1">
                                ${parseFloat(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleFreeze(acc.id, acc.isFrozen)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                                acc.isFrozen
                                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              }`}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {acc.isFrozen ? "Frozen" : "Freeze"}
                            </button>
                          </div>
                          {/* Adjust Balance Button */}
                          <button
                            onClick={() => openAdjustModal(acc)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary/8 border border-brand-primary/20 text-brand-primary rounded-xl font-bold text-xs hover:bg-brand-primary hover:text-white transition-all"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Adjust Balance
                          </button>
                        </div>
                      ))}
                      {(!customerDetail.accounts || customerDetail.accounts.length === 0) && (
                        <p className="text-xs text-gray-400 col-span-2">This customer has no active bank accounts.</p>
                      )}
                    </div>
                  </div>

                  {/* Crypto Holdings list */}
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-brand-secondary text-sm">Crypto Asset Holdings</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {customerDetail.cryptoHoldings?.map((ch: any) => {
                        const qty = parseFloat(ch.quantity || 0);
                        const avg = parseFloat(ch.avgBuyPrice || 0);
                        return (
                          <div key={ch.id} className="p-3.5 bg-gray-50 border border-gray-200/50 rounded-2xl text-xs">
                            <div className="font-bold text-brand-secondary flex items-baseline gap-1.5">
                              {ch.coinName}
                              <span className="text-[9px] text-gray-400 uppercase font-mono">{ch.coinSymbol}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1 font-mono">
                              Qty: {qty.toFixed(6)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Avg cost: ${avg.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        );
                      })}
                      {(!customerDetail.cryptoHoldings || customerDetail.cryptoHoldings.length === 0) && (
                        <p className="text-xs text-gray-400 col-span-3">This customer holds no cryptocurrency.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">Failed to retrieve details.</div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-55 flex items-center justify-between">
              {customerDetail && (
                <button
                  onClick={() => handleDeleteUser(customerDetail.id, customerDetail.fullName)}
                  disabled={deletingUser}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors text-xs disabled:opacity-50"
                >
                  {deletingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Account
                </button>
              )}
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-5 py-2.5 bg-brand-secondary text-white rounded-full font-semibold hover:bg-brand-primary transition-colors text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Adjust Balance Modal ─────────────────────────────────────────────── */}
      {adjustModalOpen && adjustAccount && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-brand-secondary text-sm">Adjust Account Balance</h3>
                  <p className="text-[10px] text-gray-400 font-mono">{adjustAccount.accountNumber}</p>
                </div>
              </div>
              <button onClick={closeAdjustModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="p-5 space-y-4">
              {/* Success / Error banners */}
              {adjustSuccess && (
                <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{adjustSuccess}</span>
                </div>
              )}
              {adjustError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{adjustError}</span>
                </div>
              )}

              {/* Current balance info */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-mono font-bold text-brand-secondary">
                    ${parseFloat(adjustAccount.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {parsedAmount > 0 && (
                  <div className="flex justify-between mt-1.5 pt-1.5 border-t border-gray-200">
                    <span className="text-gray-500">After Adjustment</span>
                    <span className={`font-mono font-bold text-sm ${adjustType === "credit" ? "text-green-600" : previewBalance < 0 ? "text-red-600" : "text-amber-600"}`}>
                      ${previewBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Credit / Debit Toggle */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAdjustType("credit"); setAdjustError(""); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      adjustType === "credit"
                        ? "bg-green-50 border-green-400 text-green-700"
                        : "bg-white border-gray-200 text-gray-500 hover:border-green-300"
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Credit (Add Funds)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdjustType("debit"); setAdjustError(""); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      adjustType === "debit"
                        ? "bg-red-50 border-red-400 text-red-600"
                        : "bg-white border-gray-200 text-gray-500 hover:border-red-300"
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Debit (Remove Funds)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    max="500000"
                    step="0.01"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input pl-7 font-mono"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">Max single adjustment: $500,000</span>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Manual deposit correction, Bonus credit, Chargeback reversal..."
                  className="form-input resize-none text-xs"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Min 5 characters. Stored in audit log.</span>
              </div>

              {/* Reference (optional) */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Internal Reference / Ticket # <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  placeholder="e.g. TICKET-1234, TKT-20260711"
                  className="form-input text-xs font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-60 ${
                    adjustType === "credit"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {adjusting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                  ) : adjustType === "credit" ? (
                    <><ArrowUpCircle className="w-3.5 h-3.5" /> Confirm Credit</>
                  ) : (
                    <><ArrowDownCircle className="w-3.5 h-3.5" /> Confirm Debit</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
