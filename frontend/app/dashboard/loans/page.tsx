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
  Landmark,
  Clock,
  Sparkles,
  ShieldCheck,
  Bitcoin,
  Building2,
  Wallet,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";
import { loansApi, accountsApi } from "@/lib/api";
import { motion } from "framer-motion";

const LOAN_TYPES = [
  { value: "crypto",    label: "Crypto Loan",           rate: 9.5,  rateType: "APY" },
  { value: "personal",  label: "Personal Loan",         rate: 9.25, rateType: "APR" },
  { value: "business",  label: "Business Financing",    rate: 8.5,  rateType: "APR" },
  { value: "mortgage",  label: "Home Mortgage",         rate: 7.15, rateType: "APR" },
  { value: "auto",      label: "Auto / Vehicles Loan",  rate: 7.25, rateType: "APR" },
  { value: "education", label: "Student / Education",   rate: 5.5,  rateType: "APR" },
  { value: "others",    label: "Others",                rate: 10.0, rateType: "APR" },
];

const CRYPTO_OPTIONS = [
  "Bitcoin (BTC)", "Ethereum (ETH)", "USDT (Tether)", "BNB", "Solana (SOL)",
  "XRP (Ripple)", "USDC", "Cardano (ADA)", "Dogecoin (DOGE)", "Polygon (MATIC)",
];

type DisbursementMode = "bank" | "crypto_wallet" | "external_bank";

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [loanType, setLoanType] = useState("crypto");
  const [principalAmount, setPrincipalAmount] = useState("5000");
  const [termMonths, setTermMonths] = useState("12");
  const [ssn, setSsn] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Crypto-loan specific
  const [selectedCrypto, setSelectedCrypto] = useState("Bitcoin (BTC)");

  // Disbursement mode
  const [disbursementMode, setDisbursementMode] = useState<DisbursementMode>("bank");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState("");
  const [extBankName, setExtBankName] = useState("");
  const [extAccountNumber, setExtAccountNumber] = useState("");
  const [extRoutingNumber, setExtRoutingNumber] = useState("");

  const activeType = LOAN_TYPES.find(t => t.value === loanType) || LOAN_TYPES[0];
  const activeRate = activeType.rate;
  const rateLabel = activeType.rateType;

  async function loadData() {
    try {
      const [loansList, accountsList] = await Promise.all([
        loansApi.getMyLoans(),
        accountsApi.getAccounts(),
      ]);
      setLoans(loansList || []);
      setAccounts(accountsList || []);
      if (accountsList?.length && !selectedAccountId) {
        const checking = accountsList.find((a: any) => a.accountType === "checking");
        setSelectedAccountId(checking ? checking.id : accountsList[0].id);
      }
    } catch (err) {
      console.error("Failed to load loan data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const previewData = useMemo(() => {
    const principal = parseFloat(principalAmount);
    const months = parseInt(termMonths);
    if (isNaN(principal) || principal <= 0 || isNaN(months) || months <= 0) {
      return { monthlyPayment: 0, totalRepayment: 0, totalInterest: 0 };
    }
    const monthlyRate = activeRate / 100 / 12;
    const monthlyPayment = monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalRepayment = monthlyPayment * months;
    return {
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      totalRepayment: parseFloat(totalRepayment.toFixed(2)),
      totalInterest: parseFloat((totalRepayment - principal).toFixed(2)),
    };
  }, [principalAmount, termMonths, activeRate]);

  // Format SSN as user types: 123-45-6789
  const handleSsnChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 9);
    let formatted = digits;
    if (digits.length > 5) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    setSsn(formatted);
  };

  const buildDisbursementPayload = () => {
    if (disbursementMode === "bank") {
      return { accountId: selectedAccountId, disbursementType: "bank", disbursementDestination: selectedAccountId };
    }
    if (disbursementMode === "crypto_wallet") {
      return { disbursementType: "crypto_wallet", disbursementDestination: cryptoWalletAddress };
    }
    // external_bank
    const dest = JSON.stringify({ bankName: extBankName, accountNumber: extAccountNumber, routingNumber: extRoutingNumber });
    return { disbursementType: "external_bank", disbursementDestination: dest };
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmount);
    const months = parseInt(termMonths);

    if (isNaN(principal) || principal < 500) { setApplyError("Minimum loan amount is $500"); return; }
    if (principal > 1000000) { setApplyError("Maximum loan limit exceeded ($1,000,000)"); return; }
    if (!ssn || ssn.replace(/\D/g, "").length < 9) { setApplyError("Please enter a valid 9-digit SSN (XXX-XX-XXXX)"); return; }
    if (disbursementMode === "crypto_wallet" && !cryptoWalletAddress.trim()) {
      setApplyError("Please enter a crypto wallet address"); return;
    }
    if (disbursementMode === "external_bank" && (!extBankName || !extAccountNumber)) {
      setApplyError("Please fill in all external bank details"); return;
    }

    setIsApplying(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      const { accountId, ...disbursement } = buildDisbursementPayload();
      await loansApi.applyLoan({
        loanType,
        principalAmount: principal,
        interestRate: activeRate,
        termMonths: months,
        accountId,
        ssn,
        selectedCrypto: loanType === "crypto" ? selectedCrypto : undefined,
        ...disbursement,
      });

      setApplySuccess("Your lending application has been submitted successfully! You will receive a decision within 72 hours. A confirmation email has been sent to your registered address.");
      await loadData();
      setPrincipalAmount("5000");
      setTermMonths("12");
      setSsn("");
      setCryptoWalletAddress("");
      setExtBankName("");
      setExtAccountNumber("");
      setExtRoutingNumber("");
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit loan application");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A2342] to-brand-primary flex items-center justify-center shadow-lg animate-pulse">
          <Landmark className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Accessing credit registry records...
        </div>
      </div>
    );
  }

  const activeLoans = loans.filter((l: any) => l.status === "approved" || l.status === "active");
  const pendingLoans = loans.filter((l: any) => l.status === "pending");
  const totalDebt = activeLoans.reduce((s: number, l: any) => s + parseFloat(l.outstandingBalance || l.principalAmount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs text-brand-secondary">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-[#0078B3] flex items-center justify-center shadow-lg flex-shrink-0">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-brand-secondary text-2xl">Lending &amp; Credit</h1>
            <p className="text-gray-500 text-sm mt-0.5">Apply for self-directed loans and view outstanding balances.</p>
          </div>
        </div>
        <button
          onClick={() => { setRefreshing(true); loadData(); }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Clock className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Records
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Debt Balance", value: `$${totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
          { label: "Active Lines of Credit", value: activeLoans.length, icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
          { label: "Applications Pending Review", value: pendingLoans.length, icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-50" },
        ].map(({ label, value, icon, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
              <div className="font-display font-bold text-xl text-brand-secondary mt-1 font-mono">{value}</div>
            </div>
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Application Form */}
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

              {/* Loan Category */}
              <div className="space-y-1.5">
                <label className="text-gray-600 font-semibold block">Select Loan Category</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="form-input text-xs"
                  required
                >
                  {LOAN_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.rateType} {t.rate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Crypto-specific: select coin */}
              {loanType === "crypto" && (
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-semibold block flex items-center gap-1.5">
                    <Bitcoin className="w-3.5 h-3.5 text-orange-500" />
                    Select Cryptocurrency to Borrow
                  </label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="form-input text-xs"
                    required
                  >
                    {CRYPTO_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400 block">Crypto will be disbursed at market rate at time of approval.</span>
                </div>
              )}

              {/* Principal Amount */}
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

              {/* Term */}
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

              {/* SSN */}
              <div className="space-y-1.5">
                <label className="text-gray-600 font-semibold block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                  Social Security Number (SSN)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ssn}
                  onChange={(e) => handleSsnChange(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  required
                  className="form-input tracking-widest font-mono"
                />
                <span className="text-[10px] text-gray-400 block">Required for credit verification. Stored securely.</span>
              </div>

              {/* Disbursement Destination */}
              <div className="space-y-2">
                <label className="text-gray-600 font-semibold block">Disbursement Account Destination</label>

                {/* Mode toggle tabs */}
                <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-xl p-1">
                  {[
                    { mode: "bank" as DisbursementMode, icon: <Building2 className="w-3 h-3" />, label: "My Account" },
                    { mode: "crypto_wallet" as DisbursementMode, icon: <Wallet className="w-3 h-3" />, label: "Crypto Wallet" },
                    { mode: "external_bank" as DisbursementMode, icon: <CreditCard className="w-3 h-3" />, label: "External Bank" },
                  ].map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDisbursementMode(mode)}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        disbursementMode === mode
                          ? "bg-white text-brand-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>

                {/* Bank Account dropdown */}
                {disbursementMode === "bank" && (
                  <div>
                    {accounts.length > 0 ? (
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="form-input text-xs w-full"
                        required={disbursementMode === "bank"}
                      >
                        {accounts.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>
                            {(acc.accountName || acc.accountType.toUpperCase())} — {acc.accountNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[10px] text-gray-400 p-2">No linked accounts found.</p>
                    )}
                    <span className="text-[10px] text-gray-400 block mt-1">Funds will be credited automatically upon approval.</span>
                  </div>
                )}

                {/* Crypto wallet address */}
                {disbursementMode === "crypto_wallet" && (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={cryptoWalletAddress}
                        onChange={(e) => setCryptoWalletAddress(e.target.value)}
                        placeholder="Paste your crypto wallet address here"
                        className="form-input text-xs font-mono w-full pr-10"
                        required={disbursementMode === "crypto_wallet"}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                      {cryptoWalletAddress && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 block">Paste your wallet address. Double-check before submitting.</span>
                  </div>
                )}

                {/* External bank details */}
                {disbursementMode === "external_bank" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={extBankName}
                      onChange={(e) => setExtBankName(e.target.value)}
                      placeholder="Bank name"
                      className="form-input text-xs w-full"
                      required={disbursementMode === "external_bank"}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={extAccountNumber}
                      onChange={(e) => setExtAccountNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Account number"
                      className="form-input text-xs font-mono w-full"
                      required={disbursementMode === "external_bank"}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={extRoutingNumber}
                      onChange={(e) => setExtRoutingNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Routing / SWIFT / Sort code (optional)"
                      className="form-input text-xs font-mono w-full"
                    />
                    <span className="text-[10px] text-gray-400 block">External bank details will be verified before disbursement.</span>
                  </div>
                )}
              </div>

              {/* Calculations */}
              <div className="bg-[#0A2342]/5 border border-[#0A2342]/10 p-4 rounded-2xl space-y-2.5 font-mono text-[11px] text-brand-secondary">
                <div className="flex justify-between items-center">
                  <span>Interest rate ({rateLabel}):</span>
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
                  <><Loader2 className="w-4 h-4 animate-spin text-white" /> Submitting Application...</>
                ) : (
                  "Submit Lending Application"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Loan History */}
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
                    <th className="py-2.5">Outstanding</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] font-semibold text-brand-secondary">
                  {loans.map((l: any) => {
                    const date = new Date(l.createdAt);
                    const outstanding = parseFloat(l.outstandingBalance || l.principalAmount);
                    const principal = parseFloat(l.principalAmount);
                    const monthly = parseFloat(l.monthlyPayment || "0");
                    const loanMeta = LOAN_TYPES.find(t => t.value === l.loanType);
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5">
                          <span className="font-mono text-brand-primary">{l.id.slice(0, 8)}…</span>
                          <span className="block text-[9px] text-gray-400 font-medium">{date.toLocaleDateString()}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-medium capitalize">{loanMeta?.label || l.loanType}</span>
                          {l.selectedCrypto && (
                            <span className="block text-[9px] text-orange-500">{l.selectedCrypto}</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <div>Principal: <strong className="font-mono">${principal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong></div>
                          <div className="text-gray-400 font-normal">
                            {l.termMonths}mo @ {parseFloat(l.interestRate).toFixed(2)}% {loanMeta?.rateType || "APR"}
                          </div>
                        </td>
                        <td className="py-3.5 font-mono">
                          <div>${outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                          <span className="text-[10px] text-gray-400 font-normal">${monthly.toLocaleString("en-US", { minimumFractionDigits: 2 })}/mo</span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            l.status === "approved" || l.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                            l.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            l.status === "rejected" ? "bg-gray-50 text-gray-700 border-gray-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {l.status === "pending" ? "⏳ Pending 72h" : l.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                        No lending applications submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclosure */}
          <div className="bg-gradient-to-br from-[#0A2342]/5 to-[#1e3a8a]/5 border border-gray-100 rounded-2xl p-5 space-y-2 text-gray-600 leading-normal">
            <h4 className="font-bold text-brand-secondary text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Lending Custodian Disclosures:
            </h4>
            <p className="text-[10px]">
              All lending applications are reviewed within 72 hours. Approval is subject to credit worthiness and documentation audits. Funds are disbursed to your designated account upon approval. Crypto loans are subject to market volatility; collateral requirements may apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
