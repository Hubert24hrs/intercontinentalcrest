"use client";

import { useState } from "react";
import { ArrowRight, Globe, Building2, Users, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TransferPage() {
  const [type, setType] = useState<"domestic" | "international">("domestic");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [form, setForm] = useState({
    beneficiary: "", accountNumber: "", bank: "", amount: "", currency: "USD",
    swiftCode: "", iban: "", reference: "", saveAsBeneficiary: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("confirm");
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("success"); }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Fund Transfer</h1>
        <p className="text-gray-500 text-sm mt-0.5">Send money domestically or internationally</p>
      </div>

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
        <form onSubmit={handleSubmit} className="dashboard-card space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-beneficiary">Beneficiary Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="tf-beneficiary" type="text" className="form-input pl-10" placeholder="Full name" value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} required />
            </div>
          </div>

          {type === "domestic" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-account">Account Number</label>
                <input id="tf-account" type="text" className="form-input font-mono" placeholder="0000 0000 0000 0000" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-bank">Bank Name</label>
                <select id="tf-bank" className="form-input" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} required>
                  <option value="">Select bank...</option>
                  <option>Chase Bank</option>
                  <option>Bank of America</option>
                  <option>Wells Fargo</option>
                  <option>Citibank</option>
                  <option>Other</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-iban">IBAN / Account Number</label>
                <input id="tf-iban" type="text" className="form-input font-mono" placeholder="GB82 WEST 1234 5698 7654 32" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-swift">SWIFT / BIC Code</label>
                <input id="tf-swift" type="text" className="form-input font-mono uppercase" placeholder="BOFAUS3N" value={form.swiftCode} onChange={(e) => setForm({ ...form, swiftCode: e.target.value.toUpperCase() })} required />
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-amount">Amount</label>
              <input id="tf-amount" type="number" min="1" step="0.01" className="form-input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-currency">Currency</label>
              <select id="tf-currency" className="form-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
                <option>NGN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="tf-reference">Reference / Narration (optional)</label>
            <input id="tf-reference" type="text" className="form-input" placeholder="What's this payment for?" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>

          <div className="flex items-center gap-2">
            <input id="tf-save" type="checkbox" className="w-4 h-4 rounded" checked={form.saveAsBeneficiary} onChange={(e) => setForm({ ...form, saveAsBeneficiary: e.target.checked })} />
            <label htmlFor="tf-save" className="text-xs text-gray-600">Save as beneficiary for future transfers</label>
          </div>

          {/* Fee info */}
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-secondary">Transfer Fee:</strong>{" "}
                {type === "domestic" ? "Free (unlimited domestic transfers)" : form.amount && parseFloat(form.amount) > 10000 ? "$5.00 flat fee" : "$3.00 flat fee"}.
                Estimated delivery: {type === "domestic" ? "Instant" : "1-3 business days"}.
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
        <div className="dashboard-card space-y-5">
          <h2 className="font-display font-bold text-brand-secondary text-lg">Review Transfer Details</h2>
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            {[
              ["Transfer Type", type === "domestic" ? "Domestic" : "International"],
              ["Beneficiary", form.beneficiary],
              [type === "domestic" ? "Account Number" : "IBAN", form.accountNumber || form.iban],
              ["Amount", `${form.amount} ${form.currency}`],
              ["Fee", type === "domestic" ? "Free" : "$3.00"],
              ["Total Debit", `${(parseFloat(form.amount || "0") + (type === "international" ? 3 : 0)).toFixed(2)} ${form.currency}`],
              ["Delivery", type === "domestic" ? "Instant" : "1-3 business days"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-brand-secondary">{val}</span>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
            Please verify all details before confirming. Transfers cannot be reversed once processed.
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("form")} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors">
              Edit Details
            </button>
            <button onClick={handleConfirm} disabled={loading} className="flex-1 btn-primary justify-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Transfer"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="dashboard-card text-center py-10 space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-2xl mb-2">Transfer Initiated!</h2>
            <p className="text-gray-500 text-sm">Your transfer of <strong className="text-brand-primary">{form.amount} {form.currency}</strong> to <strong className="text-brand-secondary">{form.beneficiary}</strong> has been initiated successfully.</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-5 py-3 inline-block">
            <div className="text-xs text-gray-500">Transaction Reference</div>
            <div className="font-mono font-bold text-brand-secondary text-sm">IC-TXN-{Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep("form"); setForm({ ...form, amount: "", beneficiary: "", accountNumber: "", iban: "" }); }} className="btn-outline text-sm">
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
