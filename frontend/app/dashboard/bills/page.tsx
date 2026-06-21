"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Zap, Wifi, Droplets, Flame, Phone, CheckCircle2, ArrowRight,
  Loader2, Coins, Landmark, AlertTriangle, ChevronRight, ArrowLeft,
  ShieldCheck, Clock, Receipt, BadgeCheck, Info
} from "lucide-react";
import { cryptoApi, accountsApi, transactionsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const BILLERS = [
  { id: "electric", icon: Zap,      label: "Electricity",   gradient: "from-yellow-400 to-amber-500",  providers: ["ConEd", "Duke Energy", "Pacific Gas", "Florida Power & Light"] },
  { id: "internet", icon: Wifi,     label: "Internet",      gradient: "from-blue-500 to-cyan-500",     providers: ["Comcast", "AT&T Fiber", "Verizon Fios", "Spectrum"] },
  { id: "water",    icon: Droplets, label: "Water",         gradient: "from-cyan-500 to-teal-500",     providers: ["City Water Board", "American Water", "Aqua America"] },
  { id: "gas",      icon: Flame,    label: "Natural Gas",   gradient: "from-orange-500 to-red-500",    providers: ["National Gas", "SoCal Gas", "Nicor Gas"] },
  { id: "mobile",   icon: Phone,    label: "Mobile Top-Up", gradient: "from-purple-500 to-pink-500",   providers: ["T-Mobile", "AT&T", "Verizon", "Sprint", "Boost Mobile"] },
];

export default function BillsPage() {
  const [selected, setSelected]           = useState<string | null>(null);
  const [form, setForm]                   = useState({ provider: "", account: "", amount: "" });
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "crypto">("bank");
  const [paid, setPaid]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [payError, setPayError]           = useState("");

  const [accounts, setAccounts]               = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [holdings, setHoldings]           = useState<any[]>([]);
  const [markets, setMarkets]             = useState<any[]>([]);
  const [selectedHoldingId, setSelectedHoldingId] = useState("");
  const [dataLoading, setDataLoading]     = useState(false);

  const selectedBiller = BILLERS.find(b => b.id === selected);

  useEffect(() => {
    if (!selected) return;
    setDataLoading(true);
    Promise.allSettled([
      accountsApi.getAccounts(),
      cryptoApi.getPortfolio(),
      cryptoApi.getMarkets(),
    ]).then(([accRes, portRes, mktRes]) => {
      if (accRes.status === "fulfilled") {
        const accs = accRes.value || [];
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccountId(accs[0].id);
      }
      if (portRes.status === "fulfilled") {
        const h = portRes.value?.holdings || [];
        setHoldings(h);
        if (h.length > 0) setSelectedHoldingId(h[0].id);
      }
      if (mktRes.status === "fulfilled") setMarkets(mktRes.value || []);
    }).finally(() => setDataLoading(false));
  }, [selected]);

  const activeHolding = useMemo(() => holdings.find(h => h.id === selectedHoldingId) || holdings[0] || null, [holdings, selectedHoldingId]);
  const activeCoinPrice = useMemo(() => {
    if (!activeHolding) return 0;
    const coin = markets.find(m => m.id === activeHolding.coinId);
    return coin?.current_price ?? parseFloat(activeHolding.avgBuyPrice ?? "0");
  }, [activeHolding, markets]);
  const cryptoRequired = useMemo(() => {
    const usd = parseFloat(form.amount);
    if (!usd || !activeCoinPrice) return 0;
    return usd / activeCoinPrice;
  }, [form.amount, activeCoinPrice]);
  const cryptoBalance = useMemo(() => activeHolding ? parseFloat(activeHolding.quantity) : 0, [activeHolding]);
  const hasSufficientCrypto = cryptoRequired > 0 && cryptoRequired <= cryptoBalance;
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const bankBalance = selectedAccount ? parseFloat(selectedAccount.availableBalance) : 0;
  const billAmount  = parseFloat(form.amount) || 0;
  const hasSufficientBank = billAmount > 0 && billAmount <= bankBalance;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "crypto" && !hasSufficientCrypto) return;
    if (paymentMethod === "bank"   && !hasSufficientBank)   return;
    setLoading(true);
    setPayError("");
    try {
      if (paymentMethod === "bank") {
        await transactionsApi.initiateTransfer({
          senderAccountId: selectedAccountId,
          receiverAccountNumber: `EXT-BILL-${selectedBiller?.id?.toUpperCase()}-${Date.now()}`,
          amount: parseFloat(form.amount),
          description: `${selectedBiller?.label} Bill — ${form.provider} (Ref: ${form.account})`,
          type: "bill_payment",
        });
      } else {
        await cryptoApi.sellCrypto({
          coinId: activeHolding.coinId,
          coinSymbol: activeHolding.coinSymbol,
          coinName: activeHolding.coinName,
          quantity: cryptoRequired,
          toAccountId: selectedAccountId,
        });
      }
      setPaid(true);
    } catch (err: any) {
      setPayError(err.message || "Payment failed. Please check your balance and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setPaid(false);
    setForm({ provider: "", account: "", amount: "" });
    setPaymentMethod("bank");
    setPayError("");
  };

  if (paid && selectedBiller) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0A2342] to-[#0d3060]" />
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-r ${selectedBiller.gradient} opacity-10 blur-3xl -translate-y-16 translate-x-16`} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
          <div className="relative text-white p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <BadgeCheck className="w-9 h-9 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl">Payment Successful!</h2>
              <p className="text-white/50 text-sm mt-1">Your {selectedBiller.label} bill has been paid.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-white/40">Provider</span>
                <span className="font-semibold">{form.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Account #</span>
                <span className="font-mono text-xs">{form.account}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/40">Amount Paid</span>
                <span className="text-emerald-400 font-bold font-mono">${billAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              {paymentMethod === "crypto" && activeHolding && (
                <div className="flex justify-between">
                  <span className="text-white/40">Crypto Used</span>
                  <span className="font-mono text-xs text-amber-300">{cryptoRequired.toFixed(6)} {activeHolding.coinSymbol}</span>
                </div>
              )}
            </div>
            <button onClick={resetForm} className="btn-primary mx-auto">
              Pay Another Bill <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-4">
        {selected && (
          <button onClick={resetForm} className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${selectedBiller ? selectedBiller.gradient : "from-brand-primary to-[#0078B3]"} flex items-center justify-center shadow-lg flex-shrink-0`}>
            {selectedBiller ? <selectedBiller.icon className="w-5 h-5 text-white" /> : <Receipt className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h1 className="font-display font-bold text-brand-secondary text-2xl">
              {selected ? `Pay ${selectedBiller?.label} Bill` : "Bill Payments"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {selected ? "Complete your payment below" : "Pay utilities and services securely from your account"}
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selected ? (
          /* Biller Grid */
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: "Instant Processing", icon: Clock, color: "text-emerald-500" },
                { label: "5 Services Available", icon: Receipt, color: "text-brand-primary" },
                { label: "Encrypted Payments", icon: ShieldCheck, color: "text-violet-500" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-2.5">
                  <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                  <span className="text-xs font-semibold text-gray-600">{s.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BILLERS.map((b, i) => (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 + i * 0.06 }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelected(b.id); setPaid(false); setForm({ provider: b.providers[0], account: "", amount: "" }); setPaymentMethod("bank"); }}
                  className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 text-left shadow-sm hover:shadow-md transition-all group"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${b.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center shadow-md mb-4`}>
                    <b.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-display font-bold text-brand-secondary text-base">{b.label}</div>
                  <div className="text-gray-400 text-xs mt-1 mb-4">{b.providers.length} providers available</div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Instant · Secure</div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-primary transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Payment Form */
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Form */}
            <div className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              {/* Payment method toggle */}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-700 mb-2">Pay With</p>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setPaymentMethod("bank")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${paymentMethod === "bank" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400"}`}>
                    <Landmark className="w-3.5 h-3.5" /> Bank Account
                  </button>
                  <button type="button" onClick={() => setPaymentMethod("crypto")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${paymentMethod === "crypto" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400"}`}>
                    <Coins className="w-3.5 h-3.5" /> Pay with Crypto
                  </button>
                </div>
              </div>

              <form onSubmit={handlePay} className="space-y-4">
                {payError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{payError}</span>
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Provider</label>
                  <select className="form-input" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} required>
                    <option value="">Select provider...</option>
                    {selectedBiller?.providers.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Account / Customer Number</label>
                  <input type="text" className="form-input font-mono" placeholder="Enter account number" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} required />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                    <input type="number" min="1" step="0.01" className="form-input pl-9 text-xl font-display font-bold text-brand-secondary" placeholder="0.00" value={form.amount} onChange={e => { setForm({ ...form, amount: e.target.value }); setPayError(""); }} required />
                  </div>
                </div>

                {/* Bank account selector */}
                {paymentMethod === "bank" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">Debit From Account</label>
                    {dataLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-4 h-4 animate-spin" />Loading accounts...</div>
                    ) : accounts.length > 0 ? (
                      <>
                        <select className="form-input" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} required>
                          {accounts.map((acc: any) => (
                            <option key={acc.id} value={acc.id}>{acc.accountName || acc.accountType.toUpperCase()} (···{acc.accountNumber.slice(-4)}) — ${parseFloat(acc.availableBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</option>
                          ))}
                        </select>
                        {form.amount && (
                          <p className={`text-xs mt-1 font-medium ${hasSufficientBank ? "text-emerald-600" : "text-red-500"}`}>
                            {hasSufficientBank ? `✓ Balance sufficient ($${bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })})` : `✗ Insufficient — available: $${bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                          </p>
                        )}
                      </>
                    ) : <p className="text-xs text-gray-400">No bank accounts found.</p>}
                  </div>
                )}

                {/* Crypto selector */}
                {paymentMethod === "crypto" && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-700">Pay From Crypto Asset</label>
                    {dataLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-4 h-4 animate-spin" />Loading holdings...</div>
                    ) : holdings.length > 0 ? (
                      <>
                        <select className="form-input" value={selectedHoldingId} onChange={e => setSelectedHoldingId(e.target.value)} required>
                          {holdings.map((h: any) => {
                            const coin = markets.find(m => m.id === h.coinId);
                            const price = coin?.current_price ?? parseFloat(h.avgBuyPrice ?? "0");
                            const qty = parseFloat(h.quantity);
                            return <option key={h.id} value={h.id}>{h.coinName} ({h.coinSymbol}) — {qty.toFixed(6)} ≈ ${(qty * price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</option>;
                          })}
                        </select>
                        {form.amount && activeHolding && (
                          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${hasSufficientCrypto ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                            <div className="flex justify-between"><span className="text-gray-500">Bill amount</span><span className="font-bold">${parseFloat(form.amount).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Live price ({activeHolding.coinSymbol})</span><span className="font-mono font-bold">${activeCoinPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between border-t border-current/10 pt-2">
                              <span className="text-gray-500">Crypto needed</span>
                              <span className={`font-mono font-bold ${hasSufficientCrypto ? "text-emerald-700" : "text-red-600"}`}>{cryptoRequired.toFixed(6)} {activeHolding.coinSymbol}</span>
                            </div>
                            <div className="flex justify-between"><span className="text-gray-500">Your balance</span><span className="font-mono font-bold">{cryptoBalance.toFixed(6)} {activeHolding.coinSymbol}</span></div>
                            {!hasSufficientCrypto && <p className="text-red-600 font-semibold">Insufficient {activeHolding.coinSymbol} balance.</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
                        <Info className="w-4 h-4 inline-block mr-1" />No crypto holdings. Visit the <a href="/dashboard/crypto" className="font-bold underline">Marketplace</a> to buy crypto first.
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (paymentMethod === "bank" && !!form.amount && !hasSufficientBank) || (paymentMethod === "crypto" && (holdings.length === 0 || (!!form.amount && !hasSufficientCrypto)))}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                    {paymentMethod === "crypto" && cryptoRequired > 0 ? `Pay ${cryptoRequired.toFixed(6)} ${activeHolding?.coinSymbol || "Crypto"}` : `Pay $${billAmount > 0 ? billAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"} Now`}
                    <ArrowRight className="w-4 h-4" />
                  </>}
                </button>
              </form>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0A2342] to-[#0d3060]" />
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-r ${selectedBiller?.gradient} opacity-15 blur-3xl -translate-y-10 translate-x-10`} />
                <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                <div className="relative text-white p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Payment Summary</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedBiller?.gradient} flex items-center justify-center shadow-lg`}>
                      {selectedBiller && <selectedBiller.icon className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-white">{selectedBiller?.label}</div>
                      <div className="text-white/40 text-xs">{form.provider || "Select provider"}</div>
                    </div>
                  </div>
                  {form.account && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-white/40">Service Account</span><span className="font-mono text-white/80">{form.account}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Pay With</span><span className="text-white/80">{paymentMethod === "bank" ? "Bank Account" : `Crypto (${activeHolding?.coinSymbol || ""})`}</span></div>
                      <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                        <span className="text-white/60">Total Due</span>
                        <span className="text-emerald-400 font-mono">${billAmount > 0 ? billAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 text-[10px] text-white/30 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />Processed instantly</div>
                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" />Bank-level encryption</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" />Confirmation receipt emailed</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
