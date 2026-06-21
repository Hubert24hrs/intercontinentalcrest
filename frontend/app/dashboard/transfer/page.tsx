"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight, ArrowLeftRight, Loader2, CheckCircle2, AlertTriangle,
  User, Building2, Globe, Info, ArrowUpRight, Wallet, ShieldCheck,
  Zap, Clock, ChevronRight
} from "lucide-react";
import { accountsApi, transactionsApi, beneficiariesApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type TransferType = "internal" | "domestic" | "international";

const TRANSFER_TYPES = [
  {
    value: "internal" as TransferType,
    label: "Internal Transfer",
    icon: ArrowLeftRight,
    fee: "Free",
    time: "Instant",
    description: "Move funds between your accounts or to another Intercontinental Crest account",
    gradient: "from-brand-primary to-blue-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "domestic" as TransferType,
    label: "Domestic Transfer",
    icon: Building2,
    fee: "Free",
    time: "1-2 Business Days",
    description: "Send to any US bank account by routing & account number",
    gradient: "from-violet-500 to-purple-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "international" as TransferType,
    label: "International Wire",
    icon: Globe,
    fee: "$3.00",
    time: "3-5 Business Days",
    description: "Send to overseas accounts — flat $3.00 SWIFT wire fee applies",
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-700",
  },
];

export default function TransferPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [transferType, setTransferType] = useState<TransferType>("internal");
  const [senderAccountId, setSenderAccountId] = useState("");
  const [toMode, setToMode] = useState<"manual" | "beneficiary">("manual");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const [receiverAccountNumber, setReceiverAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([
      accountsApi.getAccounts(),
      beneficiariesApi.getBeneficiaries(),
    ]).then(([accRes, benRes]) => {
      const accs = accRes.status === "fulfilled" ? accRes.value || [] : [];
      const bens = benRes.status === "fulfilled" ? benRes.value || [] : [];
      setAccounts(accs);
      setBeneficiaries(bens);
      if (accs.length > 0) setSenderAccountId(accs[0].id);
    }).finally(() => setDataLoading(false));
  }, []);

  const senderAccount = accounts.find(a => a.id === senderAccountId);
  const availableBalance = senderAccount ? parseFloat(senderAccount.availableBalance) : 0;
  const transferAmount = parseFloat(amount) || 0;
  const fee = transferType === "international" ? 3.00 : 0;
  const totalDeducted = transferAmount + fee;
  const hasFunds = transferAmount > 0 && totalDeducted <= availableBalance;
  const remaining = availableBalance - totalDeducted;
  const progressPct = availableBalance > 0 ? Math.min(100, (totalDeducted / availableBalance) * 100) : 0;

  const resolvedReceiverNumber = useMemo(() => {
    if (toMode === "beneficiary") {
      const b = beneficiaries.find(b => b.id === selectedBeneficiaryId);
      return b?.accountNumber || "";
    }
    return receiverAccountNumber.trim();
  }, [toMode, selectedBeneficiaryId, receiverAccountNumber, beneficiaries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFunds) { setError("Insufficient funds for this transfer."); return; }
    if (!resolvedReceiverNumber) { setError("Please enter a destination account number."); return; }
    setSubmitting(true);
    setError("");
    setSuccess(null);
    try {
      const result = await transactionsApi.initiateTransfer({
        senderAccountId,
        receiverAccountNumber: resolvedReceiverNumber,
        amount: transferAmount,
        description: description.trim() || "Fund Transfer",
        type: transferType === "international" ? "international_transfer" : "transfer",
      });
      setSuccess(result);
      setAmount("");
      setDescription("");
      setReceiverAccountNumber("");
      accountsApi.getAccounts().then(accs => setAccounts(accs || [])).catch(() => {});
    } catch (err: any) {
      setError(err.message || "Transfer failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A2342] to-brand-primary flex items-center justify-center shadow-lg animate-pulse">
          <ArrowLeftRight className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Connecting to secure ledger lines...
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="font-display font-bold text-brand-secondary text-xl mb-2">No Accounts Found</h2>
        <p className="text-gray-500 text-sm">You need at least one active bank account to make a transfer.</p>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0A2342] to-[#0d3060]" />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl -translate-y-12 translate-x-12" />
          <div className="relative text-white p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-white">Transfer Successful</h2>
              <p className="text-white/60 text-sm mt-1">Your funds have been dispatched securely.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Amount Sent</span>
                <span className="font-bold text-emerald-400">${transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              {success.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-white/40">Reference</span>
                  <span className="font-mono text-xs text-white/70">{success.transactionReference}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="btn-primary mx-auto"
            >
              New Transfer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const activeType = TRANSFER_TYPES.find(t => t.value === transferType)!;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-4"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-[#0078B3] flex items-center justify-center shadow-lg flex-shrink-0">
          <ArrowLeftRight className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Transfer Funds</h1>
          <p className="text-gray-500 text-sm mt-0.5">Send money instantly, domestically, or internationally.</p>
        </div>
      </motion.div>

      {/* Transfer type selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {TRANSFER_TYPES.map((t, i) => (
          <motion.button
            key={t.value}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 + i * 0.05 }}
            type="button"
            onClick={() => setTransferType(t.value)}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden group ${
              transferType === t.value
                ? "border-brand-primary bg-brand-primary/5 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            {transferType === t.value && (
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${t.gradient}`} />
            )}
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3 shadow-md`}>
              <t.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-xs font-bold text-brand-secondary">{t.label}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.badge}`}>{t.fee}</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />{t.time}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Info banner */}
      <motion.div
        key={transferType}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-2.5 bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 text-xs text-brand-secondary"
      >
        <Info className="w-3.5 h-3.5 text-brand-primary flex-shrink-0 mt-0.5" />
        {activeType.description}
      </motion.div>

      {/* Main form + preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-5"
      >
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* From account */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">From Account</label>
            <select
              className="form-input text-sm"
              value={senderAccountId}
              onChange={(e) => setSenderAccountId(e.target.value)}
              required
            >
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName || acc.accountType.toUpperCase()} (···{acc.accountNumber.slice(-4)}) — ${parseFloat(acc.availableBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })} available
                </option>
              ))}
            </select>
            {/* Balance progress bar */}
            {transferAmount > 0 && (
              <div className="space-y-1 mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${hasFunds ? "bg-brand-primary" : "bg-red-500"}`}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-mono">
                  Using {progressPct.toFixed(1)}% of available balance
                </p>
              </div>
            )}
          </div>

          {/* To */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">To</label>
            <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setToMode("manual")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${toMode === "manual" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400"}`}
              >
                <User className="w-3.5 h-3.5" /> Enter Number
              </button>
              {beneficiaries.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setToMode("beneficiary"); if (beneficiaries.length > 0 && !selectedBeneficiaryId) setSelectedBeneficiaryId(beneficiaries[0].id); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${toMode === "beneficiary" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400"}`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Saved Payee
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {toMode === "manual" ? (
                <motion.input
                  key="manual"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="text"
                  className="form-input font-mono text-sm"
                  placeholder={transferType === "international" ? "IBAN / Account Number" : "Account / Routing Number"}
                  value={receiverAccountNumber}
                  onChange={(e) => setReceiverAccountNumber(e.target.value)}
                  required
                  autoComplete="off"
                />
              ) : (
                <motion.select
                  key="beneficiary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="form-input"
                  value={selectedBeneficiaryId}
                  onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                  required
                >
                  {beneficiaries.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.beneficiaryName} — {b.accountNumber}{b.bankName ? ` (${b.bankName})` : ""}
                    </option>
                  ))}
                </motion.select>
              )}
            </AnimatePresence>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="form-input pl-9 text-xl font-display font-bold text-brand-secondary"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                required
              />
              <button
                type="button"
                onClick={() => setAmount((availableBalance - fee).toFixed(2))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-primary hover:underline bg-brand-primary/10 px-2 py-0.5 rounded-full"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">Reference <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rent payment, Invoice #1234..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !hasFunds || !resolvedReceiverNumber}
            className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Send {transferAmount > 0 ? `$${transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Now"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ── Right: Live Preview Card ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0A2342] to-[#0d3060]" />
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brand-primary/10 blur-3xl -translate-y-10 translate-x-10" />
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
            />
            <div className="relative text-white p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Transfer Preview</span>
              </div>

              {/* From */}
              <div className="space-y-1">
                <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">From</span>
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{senderAccount?.accountName || senderAccount?.accountType?.toUpperCase() || "Select Account"}</div>
                    <div className="text-white/40 text-[10px] font-mono">···{senderAccount?.accountNumber?.slice(-4) || "----"}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-emerald-400 font-mono font-bold text-sm">${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    <div className="text-white/30 text-[9px]">available</div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* Amount display */}
              <div className="text-center space-y-1">
                <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold block">Transfer Amount</span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={amount}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="font-display font-extrabold text-3xl text-white"
                  >
                    ${transferAmount > 0 ? transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Fee breakdown */}
              {transferAmount > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Transfer amount</span>
                    <span className="font-mono font-semibold">${transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Wire fee</span>
                      <span className="font-mono text-amber-400">${fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                    <span className="text-white/60">Total deducted</span>
                    <span className={`font-mono ${hasFunds ? "text-brand-primary" : "text-red-400"}`}>
                      ${totalDeducted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Remaining balance</span>
                    <span className={`font-mono ${hasFunds ? "text-white/50" : "text-red-400"}`}>
                      ${Math.max(0, remaining).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Security badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 border-t border-white/5 pt-3">
                <ShieldCheck className="w-3 h-3" />
                256-bit encrypted transfer · Bank-grade security
              </div>
            </div>
          </div>

          {/* Speed info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-primary" />
              Transfer Details
            </div>
            {[
              { label: "Method", value: activeType.label },
              { label: "Processing Time", value: activeType.time },
              { label: "Fee", value: activeType.fee },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-brand-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
