"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Globe, Building2, Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { accountsApi, transactionsApi, beneficiariesApi } from "@/lib/api";

export default function TransferPage() {
  const [type, setType] = useState<"domestic" | "international">("domestic");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([]);

  // Form states
  const [senderAccountId, setSenderAccountId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [accList, benList] = await Promise.all([
          accountsApi.getAccounts(),
          beneficiariesApi.getBeneficiaries()
        ]);
        setAccounts(accList);
        setSavedBeneficiaries(benList);
        
        if (accList && accList.length > 0) {
          setSenderAccountId(accList[0].id);
        }
      } catch (err) {
        console.error("Failed to load transfer page data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectSavedBeneficiary = (ben: any) => {
    setBeneficiaryName(ben.beneficiaryName);
    setAccountNumber(ben.accountNumber);
    setIban(ben.iban || "");
    setSwiftCode(ben.swiftCode || "");
    setBankName(ben.bankName || "");
    setCurrency(ben.currency || "USD");
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate balance
    const activeAcc = accounts.find((a) => a.id === senderAccountId);
    const balance = activeAcc ? parseFloat(activeAcc.availableBalance) : 0;
    const reqAmount = parseFloat(amount);

    if (isNaN(reqAmount) || reqAmount <= 0) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    const fee = type === "domestic" ? 0 : 3.00;
    if (balance < reqAmount + fee) {
      setErrorMsg("Insufficient funds in the selected account");
      return;
    }

    setStep("confirm");
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Submit transfer to backend
      const res = await transactionsApi.initiateTransfer({
        senderAccountId,
        receiverAccountNumber: type === "domestic" ? accountNumber : iban,
        amount: parseFloat(amount),
        description: description || `Transfer to ${beneficiaryName}`,
        type: type
      });

      // 2. Save beneficiary if checked
      if (saveAsBeneficiary) {
        try {
          await beneficiariesApi.createBeneficiary({
            beneficiaryName,
            accountNumber: type === "domestic" ? accountNumber : iban,
            bankName: bankName || undefined,
            swiftCode: swiftCode || undefined,
            iban: type === "international" ? iban : undefined,
            currency,
            isInternational: type === "international"
          });
        } catch (benErr) {
          console.error("Failed to save beneficiary silently", benErr);
        }
      }

      setSuccessRef(res.transactionReference || res.id);
      setStep("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete transfer");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  const activeBankAccount = useMemo(() => {
    return accounts.find((a) => a.id === senderAccountId);
  }, [accounts, senderAccountId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Setting up secure transfer tunnels...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Fund Transfer</h1>
        <p className="text-gray-500 text-sm mt-0.5">Send money instantly across accounts or internationally.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Transfer type tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {(["domestic", "international"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setStep("form"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${type === t ? "bg-white text-brand-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "domestic" ? <Building2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            {t.charAt(0).toUpperCase() + t.slice(1)} Transfer
          </button>
        ))}
      </div>

      {step === "form" && (
        <form onSubmit={handleReview} className="dashboard-card space-y-5 bg-white border border-gray-100 p-6 rounded-2xl">
          {/* Sender Account */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Funding Source</label>
            <select 
              className="form-input" 
              value={senderAccountId} 
              onChange={(e) => setSenderAccountId(e.target.value)} 
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName || acc.accountType.toUpperCase()} - {acc.accountNumber} (Bal: ${parseFloat(acc.availableBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Select Beneficiary */}
          {savedBeneficiaries.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quick Select Saved Beneficiary</label>
              <div className="flex gap-2 overflow-x-auto pb-1.5 pr-1 select-none">
                {savedBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectSavedBeneficiary(b)}
                    className="flex-shrink-0 text-xs px-3 py-2 bg-gray-50 border border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    {b.beneficiaryName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-beneficiary">Beneficiary Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="tf-beneficiary" type="text" className="form-input pl-10" placeholder="Beneficiary Full Name" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} required />
            </div>
          </div>

          {type === "domestic" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-account">Account Number</label>
                <input id="tf-account" type="text" className="form-input font-mono" placeholder="0000 0000 0000 0000" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-bank">Bank Name</label>
                <input id="tf-bank" type="text" className="form-input" placeholder="e.g. Chase Bank, Barclays" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-iban">IBAN / Account Number</label>
                <input id="tf-iban" type="text" className="form-input font-mono" placeholder="GB82 WEST 1234 5698 7654 32" value={iban} onChange={(e) => setIban(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-swift">SWIFT / BIC Code</label>
                <input id="tf-swift" type="text" className="form-input font-mono uppercase" placeholder="BOFAUS3N" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value.toUpperCase())} required />
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-amount">Amount</label>
              <input id="tf-amount" type="number" min="0.01" step="0.01" className="form-input" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-currency">Currency</label>
              <select id="tf-currency" className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-reference">Reference / Narration (optional)</label>
            <input id="tf-reference" type="text" className="form-input" placeholder="What's this transfer for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input id="tf-save" type="checkbox" className="w-4 h-4 rounded text-brand-primary" checked={saveAsBeneficiary} onChange={(e) => setSaveAsBeneficiary(e.target.checked)} />
            <label htmlFor="tf-save" className="text-xs text-gray-600">Save as beneficiary for future transfers</label>
          </div>

          {/* Fee info */}
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-secondary">Transfer Details:</strong>{" "}
                {type === "domestic" ? "Free instant domestic transfer." : "$3.00 flat fee. Delivery takes 1-3 business days."}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center">
            Proceed to Review
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === "confirm" && (
        <div className="dashboard-card space-y-5 bg-white border border-gray-100 p-6 rounded-2xl">
          <h2 className="font-display font-bold text-brand-secondary text-lg">Review Transfer Details</h2>
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            {[
              ["Transfer Type", type === "domestic" ? "Domestic" : "International"],
              ["Sender Account", activeBankAccount ? `${activeBankAccount.accountName || activeBankAccount.accountType.toUpperCase()} (${activeBankAccount.accountNumber.slice(-4)})` : ""],
              ["Beneficiary", beneficiaryName],
              [type === "domestic" ? "Receiver Account" : "IBAN", accountNumber || iban],
              ["Amount", `${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`],
              ["Fee", type === "domestic" ? "Free" : "$3.00"],
              ["Total Debit", `${(parseFloat(amount) + (type === "international" ? 3.00 : 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`],
              ["Delivery", type === "domestic" ? "Instant" : "1-3 business days"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm border-b border-gray-200/40 pb-2 last:border-0 last:pb-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-brand-secondary">{val}</span>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
            Please verify all details before confirming. Transfers cannot be reversed once processed.
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setStep("form")} 
              disabled={submitting}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              Edit Details
            </button>
            <button onClick={handleConfirm} disabled={submitting} className="flex-1 btn-primary justify-center">
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  Processing...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="dashboard-card text-center py-10 space-y-4 bg-white border border-gray-100 p-6 rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-2xl mb-2">Transfer Initiated!</h2>
            <p className="text-gray-500 text-sm">Your transfer of <strong className="text-brand-primary">{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}</strong> to <strong className="text-brand-secondary">{beneficiaryName}</strong> has been processed successfully.</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-5 py-3 inline-block border border-gray-100">
            <div className="text-xs text-gray-500">Transaction Reference</div>
            <div className="font-mono font-bold text-brand-secondary text-sm">{successRef}</div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep("form"); setAmount(""); setBeneficiaryName(""); setAccountNumber(""); setIban(""); }} className="btn-outline text-sm">
              New Transfer
            </button>
            <a href="/dashboard/transactions" className="btn-primary text-sm">
              View Transactions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
