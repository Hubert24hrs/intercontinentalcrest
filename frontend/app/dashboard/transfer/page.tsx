"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight, ArrowLeftRight, Loader2, CheckCircle2, AlertTriangle,
  User, Building2, Globe, ChevronDown, Info
} from "lucide-react";
import { accountsApi, transactionsApi, beneficiariesApi } from "@/lib/api";

type TransferType = "internal" | "domestic" | "international";

const TRANSFER_TYPES: { value: TransferType; label: string; icon: any; fee: string; description: string }[] = [
  { value: "internal",      label: "Internal Transfer",      icon: ArrowLeftRight, fee: "Free",    description: "Move funds between your own accounts or to another Intercontinental Crest account" },
  { value: "domestic",      label: "Domestic Bank Transfer", icon: Building2,      fee: "Free",    description: "Send to any US bank account by routing & account number" },
  { value: "international", label: "International Wire",     icon: Globe,          fee: "$3.00",   description: "Send to overseas accounts — flat $3.00 wire fee applies" },
];

export default function TransferPage() {
  const [accounts, setAccounts]           = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [dataLoading, setDataLoading]     = useState(true);

  const [transferType, setTransferType]   = useState<TransferType>("internal");
  const [senderAccountId, setSenderAccountId] = useState("");
  const [toMode, setToMode]               = useState<"manual" | "beneficiary">("manual");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const [receiverAccountNumber, setReceiverAccountNumber] = useState("");
  const [amount, setAmount]               = useState("");
  const [description, setDescription]    = useState("");

  const [submitting, setSubmitting]       = useState(false);
  const [success, setSuccess]             = useState<any>(null);
  const [error, setError]                 = useState("");

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
  const transferAmount   = parseFloat(amount) || 0;
  const fee = transferType === "international" ? 3.00 : 0;
  const totalDeducted = transferAmount + fee;
  const hasFunds = transferAmount > 0 && totalDeducted <= availableBalance;

  const resolvedReceiverNumber = useMemo(() => {
    if (toMode === "beneficiary") {
      const b = beneficiaries.find(b => b.id === selectedBeneficiaryId);
      return b?.accountNumber || "";
    }
    return receiverAccountNumber.trim();
  }, [toMode, selectedBeneficiaryId, receiverAccountNumber, beneficiaries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFunds) {
      setError("Insufficient funds. Please check your balance and try a smaller amount.");
      return;
    }
    if (!resolvedReceiverNumber) {
      setError("Please enter a destination account number.");
      return;
    }

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
      // Refresh accounts to reflect new balance
      accountsApi.getAccounts().then(accs => setAccounts(accs || [])).catch(() => {});
    } catch (err: any) {
      setError(err.message || "Transfer failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading your accounts...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="font-display font-bold text-brand-secondary text-xl mb-2">No Accounts Found</h2>
        <p className="text-gray-500 text-sm">You need at least one active bank account to make a transfer.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="dashboard-card text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display font-bold text-brand-secondary text-xl">Transfer Successful</h2>
          <p className="text-gray-500 text-sm">
            <strong className="text-brand-primary">${transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> has been sent successfully.
          </p>
          {success.transactionReference && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-500 border border-gray-100">
              Ref: {success.transactionReference}
            </div>
          )}
          <button
            onClick={() => setSuccess(null)}
            className="btn-primary mx-auto"
          >
            New Transfer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-brand-primary" />
          Transfer Funds
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Send money internally, domestically, or internationally.</p>
      </div>

      {/* Transfer type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRANSFER_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTransferType(t.value)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              transferType === t.value
                ? "border-brand-primary bg-brand-primary/5"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${transferType === t.value ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-500"}`}>
              <t.icon className="w-4 h-4" />
            </div>
            <div className={`text-xs font-bold ${transferType === t.value ? "text-brand-secondary" : "text-gray-700"}`}>{t.label}</div>
            <div className={`text-[10px] mt-0.5 font-semibold ${t.fee === "Free" ? "text-green-600" : "text-amber-600"}`}>{t.fee}</div>
          </button>
        ))}
      </div>

      <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 flex items-start gap-2 text-xs text-brand-secondary">
        <Info className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
        {TRANSFER_TYPES.find(t => t.value === transferType)?.description}
      </div>

      <form onSubmit={handleSubmit} className="dashboard-card space-y-5">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* From account */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Account</label>
          <select
            className="form-input"
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
          <p className="text-[11px] text-gray-400 mt-1">
            Available balance: <span className="font-semibold text-brand-secondary">${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {/* To: mode toggle (manual vs saved beneficiary) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">To</label>
          <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => setToMode("manual")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${toMode === "manual" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400"}`}
            >
              <User className="w-3.5 h-3.5" />
              Enter Account Number
            </button>
            {beneficiaries.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setToMode("beneficiary");
                  if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
                    setSelectedBeneficiaryId(beneficiaries[0].id);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${toMode === "beneficiary" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400"}`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Saved Beneficiary
              </button>
            )}
          </div>

          {toMode === "manual" ? (
            <input
              type="text"
              className="form-input font-mono"
              placeholder="Account / IBAN / Routing number"
              value={receiverAccountNumber}
              onChange={(e) => setReceiverAccountNumber(e.target.value)}
              required
              autoComplete="off"
            />
          ) : (
            <select
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
            </select>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="form-input pl-8"
              placeholder="0.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              required
            />
            <button
              type="button"
              onClick={() => setAmount((availableBalance - fee).toFixed(2))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-primary hover:underline"
            >
              MAX
            </button>
          </div>

          {/* Balance validation feedback */}
          {transferAmount > 0 && (
            <div className={`mt-2 p-3 rounded-xl text-xs flex items-center justify-between ${hasFunds ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              <span>{hasFunds ? "Sufficient balance" : "Insufficient funds — please top up your account or reduce the amount"}</span>
              {fee > 0 && (
                <span className="font-semibold text-amber-600 ml-2">+${fee.toFixed(2)} wire fee</span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Rent payment, Invoice #1234..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Summary */}
        {transferAmount > 0 && hasFunds && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Transfer amount</span>
              <span className="font-mono font-bold text-brand-secondary">${transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Wire fee</span>
                <span className="font-mono font-bold text-amber-600">${fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-brand-secondary">
              <span>Total deducted</span>
              <span className="font-mono text-brand-primary">${totalDeducted.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Remaining balance after</span>
              <span className="font-mono">${(availableBalance - totalDeducted).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !hasFunds || !resolvedReceiverNumber}
          className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Send ${transferAmount > 0 ? transferAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
