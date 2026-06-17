"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Globe, Building2, Search, Star } from "lucide-react";

const initialBeneficiaries = [
  { id: "B001", name: "Sarah Mitchell", accountNumber: "****4521", bank: "Chase Bank", country: "USA", currency: "USD", international: false, starred: true },
  { id: "B002", name: "Ahmed Al-Farsi", accountNumber: "GB82WEST12345698765432", bank: "HSBC UK", country: "UK", currency: "GBP", international: true, starred: false },
  { id: "B003", name: "David Chen", accountNumber: "****8892", bank: "DBS Bank", country: "Singapore", currency: "SGD", international: true, starred: true },
  { id: "B004", name: "Maria Lopez", accountNumber: "****3310", bank: "Wells Fargo", country: "USA", currency: "USD", international: false, starred: false },
];

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newB, setNewB] = useState({ name: "", accountNumber: "", bank: "", country: "USA", currency: "USD", international: false });

  const filtered = beneficiaries.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.bank.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setBeneficiaries([...beneficiaries, { ...newB, id: `B${Date.now()}`, starred: false }]);
    setNewB({ name: "", accountNumber: "", bank: "", country: "USA", currency: "USD", international: false });
    setShowAdd(false);
  };

  const toggleStar = (id: string) => setBeneficiaries(beneficiaries.map(b => b.id === id ? { ...b, starred: !b.starred } : b));
  const remove = (id: string) => setBeneficiaries(beneficiaries.filter(b => b.id !== id));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Beneficiaries</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your saved recipients</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm px-4 py-2.5">
          <Plus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="dashboard-card">
          <h2 className="font-display font-bold text-brand-secondary mb-4">New Beneficiary</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="ben-name">Full Name</label>
              <input id="ben-name" type="text" className="form-input" placeholder="Beneficiary name" value={newB.name} onChange={(e) => setNewB({ ...newB, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="ben-account">Account Number / IBAN</label>
              <input id="ben-account" type="text" className="form-input font-mono" placeholder="Account or IBAN" value={newB.accountNumber} onChange={(e) => setNewB({ ...newB, accountNumber: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="ben-bank">Bank Name</label>
              <input id="ben-bank" type="text" className="form-input" placeholder="Bank name" value={newB.bank} onChange={(e) => setNewB({ ...newB, bank: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="ben-currency">Currency</label>
              <select id="ben-currency" className="form-input" value={newB.currency} onChange={(e) => setNewB({ ...newB, currency: e.target.value })}>
                {["USD", "EUR", "GBP", "JPY", "SGD", "NGN"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary text-sm px-5">Save Beneficiary</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" className="form-input pl-10" placeholder="Search beneficiaries..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((b) => (
          <div key={b.id} className="dashboard-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-lg flex-shrink-0">
              {b.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-brand-secondary text-sm">{b.name}</span>
                {b.international ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"><Globe className="w-3 h-3" /> International</span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"><Building2 className="w-3 h-3" /> Domestic</span>
                )}
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{b.bank} · {b.accountNumber} · {b.currency}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleStar(b.id)} className={`p-1.5 rounded-lg transition-colors ${b.starred ? "text-yellow-400 hover:text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}>
                <Star className="w-4 h-4" fill={b.starred ? "currentColor" : "none"} />
              </button>
              <a href="/dashboard/transfer" className="p-1.5 rounded-lg hover:bg-brand-primary/10 text-brand-primary transition-colors text-xs font-semibold px-3 py-1.5 border border-brand-primary/30 rounded-lg">
                Send
              </a>
              <button onClick={() => remove(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No beneficiaries found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
