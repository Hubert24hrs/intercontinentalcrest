"use client";

import { useState } from "react";
import { Zap, Wifi, Droplets, Flame, Phone, CheckCircle2, ArrowRight } from "lucide-react";

const billers = [
  { id: "electric", icon: Zap, label: "Electricity", color: "bg-yellow-100 text-yellow-600", providers: ["ConEd", "Duke Energy", "Pacific Gas"] },
  { id: "internet", icon: Wifi, label: "Internet", color: "bg-blue-100 text-blue-600", providers: ["Comcast", "AT&T", "Verizon"] },
  { id: "water", icon: Droplets, label: "Water", color: "bg-cyan-100 text-cyan-600", providers: ["City Water Board", "American Water"] },
  { id: "gas", icon: Flame, label: "Gas", color: "bg-orange-100 text-orange-600", providers: ["National Gas", "SoCal Gas"] },
  { id: "mobile", icon: Phone, label: "Mobile Top-Up", color: "bg-purple-100 text-purple-600", providers: ["T-Mobile", "AT&T", "Verizon", "Sprint"] },
];

export default function BillsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ provider: "", account: "", amount: "" });
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedBiller = billers.find(b => b.id === selected);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setPaid(true); }, 1500);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Bill Payments</h1>
        <p className="text-gray-500 text-sm mt-0.5">Pay utilities, subscriptions, and top up mobile</p>
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {billers.map((b) => (
            <button key={b.id} onClick={() => { setSelected(b.id); setPaid(false); setForm({ provider: "", account: "", amount: "" }); }}
              className="dashboard-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 text-center p-6 cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl ${b.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <b.icon className="w-7 h-7" />
              </div>
              <div className="font-display font-bold text-brand-secondary text-sm">{b.label}</div>
            </button>
          ))}
        </div>
      ) : paid ? (
        <div className="dashboard-card text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display font-bold text-brand-secondary text-xl">Payment Successful!</h2>
          <p className="text-gray-500 text-sm">Your {selectedBiller?.label} bill of <strong className="text-brand-primary">${form.amount}</strong> has been paid.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setSelected(null)} className="btn-outline text-sm">Pay Another Bill</button>
          </div>
        </div>
      ) : (
        <div className="dashboard-card space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-sm">← Back</button>
            <div className={`w-10 h-10 rounded-xl ${selectedBiller?.color} flex items-center justify-center`}>
              {selectedBiller && <selectedBiller.icon className="w-5 h-5" />}
            </div>
            <h2 className="font-display font-bold text-brand-secondary">{selectedBiller?.label} Payment</h2>
          </div>
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="bill-provider">Provider</label>
              <select id="bill-provider" className="form-input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} required>
                <option value="">Select provider...</option>
                {selectedBiller?.providers.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="bill-account">Account / Customer Number</label>
              <input id="bill-account" type="text" className="form-input font-mono" placeholder="Enter account number" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="bill-amount">Amount (USD)</label>
              <input id="bill-amount" type="number" min="1" step="0.01" className="form-input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Pay Now</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
