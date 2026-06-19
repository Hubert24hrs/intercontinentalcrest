"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Zap, Wifi, Droplets, Flame, Phone, CheckCircle2, ArrowRight,
  Loader2, Coins, Landmark, AlertTriangle
} from "lucide-react";
import { cryptoApi, accountsApi, transactionsApi } from "@/lib/api";

const billers = [
  { id: "electric", icon: Zap,      label: "Electricity",    color: "bg-yellow-100 text-yellow-600",  providers: ["ConEd", "Duke Energy", "Pacific Gas"] },
  { id: "internet", icon: Wifi,     label: "Internet",       color: "bg-blue-100 text-blue-600",      providers: ["Comcast", "AT&T", "Verizon"] },
  { id: "water",    icon: Droplets, label: "Water",          color: "bg-cyan-100 text-cyan-600",      providers: ["City Water Board", "American Water"] },
  { id: "gas",      icon: Flame,    label: "Gas",            color: "bg-orange-100 text-orange-600",  providers: ["National Gas", "SoCal Gas"] },
  { id: "mobile",   icon: Phone,    label: "Mobile Top-Up",  color: "bg-purple-100 text-purple-600",  providers: ["T-Mobile", "AT&T", "Verizon", "Sprint"] },
];

export default function BillsPage() {
  const [selected, setSelected]           = useState<string | null>(null);
  const [form, setForm]                   = useState({ provider: "", account: "", amount: "" });
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "crypto">("bank");
  const [paid, setPaid]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [payError, setPayError]           = useState("");

  // Bank account data
  const [accounts, setAccounts]           = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  // Crypto data
  const [holdings, setHoldings]           = useState<any[]>([]);
  const [markets, setMarkets]             = useState<any[]>([]);
  const [selectedHoldingId, setSelectedHoldingId] = useState("");
  const [dataLoading, setDataLoading]     = useState(false);

  const selectedBiller = billers.find(b => b.id === selected);

  // Load accounts + portfolio when a biller is selected
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
      if (mktRes.status === "fulfilled") {
        setMarkets(mktRes.value || []);
      }
    }).finally(() => setDataLoading(false));
  }, [selected]);

  // Active crypto holding and its live price
  const activeHolding = useMemo(() => {
    return holdings.find(h => h.id === selectedHoldingId) || holdings[0] || null;
  }, [holdings, selectedHoldingId]);

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

  const cryptoBalance = useMemo(() => {
    return activeHolding ? parseFloat(activeHolding.quantity) : 0;
  }, [activeHolding]);

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
        // Deduct from the selected bank account — external payee, no internal receiver
        await transactionsApi.initiateTransfer({
          senderAccountId: selectedAccountId,
          receiverAccountNumber: `EXT-BILL-${selectedBiller?.id?.toUpperCase()}-${Date.now()}`,
          amount: parseFloat(form.amount),
          description: `${selectedBiller?.label} Bill — ${form.provider} (Ref: ${form.account})`,
          type: "bill_payment",
        });
      } else {
        // Sell the exact crypto amount required; proceeds go to the selected bank account
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
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Bill Payments</h1>
        <p className="text-gray-500 text-sm mt-0.5">Pay utilities, subscriptions, and top up mobile — with bank funds or crypto</p>
      </div>

      {/* Biller selection grid */}
      {!selected ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {billers.map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelected(b.id); setPaid(false); setForm({ provider: "", account: "", amount: "" }); setPaymentMethod("bank"); }}
              className="dashboard-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 text-center p-6 cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-2xl ${b.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <b.icon className="w-7 h-7" />
              </div>
              <div className="font-display font-bold text-brand-secondary text-sm">{b.label}</div>
            </button>
          ))}
        </div>

      /* Payment success screen */
      ) : paid ? (
        <div className="dashboard-card text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display font-bold text-brand-secondary text-xl">Payment Successful!</h2>
          <p className="text-gray-500 text-sm">
            Your {selectedBiller?.label} bill of{" "}
            <strong className="text-brand-primary">${parseFloat(form.amount).toFixed(2)}</strong>
            {paymentMethod === "crypto" && activeHolding
              ? <> was paid using <strong className="text-brand-primary">{cryptoRequired.toFixed(6)} {activeHolding.coinSymbol}</strong></>
              : <> was paid from your bank account</>
            }
            .
          </p>
          <button onClick={resetForm} className="btn-outline text-sm">Pay Another Bill</button>
        </div>

      /* Payment form */
      ) : (
        <div className="dashboard-card space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-sm">← Back</button>
            <div className={`w-10 h-10 rounded-xl ${selectedBiller?.color} flex items-center justify-center`}>
              {selectedBiller && <selectedBiller.icon className="w-5 h-5" />}
            </div>
            <h2 className="font-display font-bold text-brand-secondary">{selectedBiller?.label} Payment</h2>
          </div>

          {/* Payment method toggle */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Payment Method</p>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${paymentMethod === "bank" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400 hover:text-brand-secondary"}`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Bank Account
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("crypto")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${paymentMethod === "crypto" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400 hover:text-brand-secondary"}`}
              >
                <Coins className="w-3.5 h-3.5" />
                Pay with Crypto
              </button>
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            {/* Provider */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="bill-provider">Provider</label>
              <select
                id="bill-provider"
                className="form-input"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                required
              >
                <option value="">Select provider...</option>
                {selectedBiller?.providers.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Customer account number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="bill-account">Account / Customer Number</label>
              <input
                id="bill-account"
                type="text"
                className="form-input font-mono"
                placeholder="Enter account number"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="bill-amount">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                <input
                  id="bill-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  className="form-input pl-8"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* ── BANK ACCOUNT section ── */}
            {paymentMethod === "bank" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Debit From Account</label>
                {dataLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts...
                  </div>
                ) : accounts.length > 0 ? (
                  <>
                    <select
                      className="form-input"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      required
                    >
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName || acc.accountType.toUpperCase()} (···{acc.accountNumber.slice(-4)}) — ${parseFloat(acc.availableBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                    {form.amount && (
                      <p className={`text-xs mt-1.5 font-medium ${hasSufficientBank ? "text-green-600" : "text-red-500"}`}>
                        {hasSufficientBank
                          ? `Available balance sufficient ($${bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })})`
                          : `Insufficient balance — available: $${bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        }
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400">No bank accounts found.</p>
                )}
              </div>
            )}

            {/* ── CRYPTO section ── */}
            {paymentMethod === "crypto" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pay From Crypto Asset</label>
                  {dataLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading your holdings...
                    </div>
                  ) : holdings.length > 0 ? (
                    <>
                      <select
                        className="form-input"
                        value={selectedHoldingId}
                        onChange={(e) => setSelectedHoldingId(e.target.value)}
                        required
                      >
                        {holdings.map((h: any) => {
                          const coin = markets.find(m => m.id === h.coinId);
                          const price = coin?.current_price ?? parseFloat(h.avgBuyPrice ?? "0");
                          const qty   = parseFloat(h.quantity);
                          const val   = qty * price;
                          return (
                            <option key={h.id} value={h.id}>
                              {h.coinName} ({h.coinSymbol}) — {qty.toFixed(6)} ≈ ${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </option>
                          );
                        })}
                      </select>

                      {/* Conversion summary box */}
                      {form.amount && activeHolding && (
                        <div className={`mt-3 p-4 rounded-xl border text-xs space-y-2 ${hasSufficientCrypto ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Bill amount</span>
                            <span className="font-bold text-brand-secondary">${parseFloat(form.amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Live price ({activeHolding.coinSymbol})</span>
                            <span className="font-mono font-bold text-brand-secondary">${activeCoinPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-500">Crypto required</span>
                            <span className={`font-mono font-bold ${hasSufficientCrypto ? "text-green-700" : "text-red-600"}`}>
                              {cryptoRequired.toFixed(6)} {activeHolding.coinSymbol}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Your balance</span>
                            <span className="font-mono font-bold text-brand-secondary">
                              {cryptoBalance.toFixed(6)} {activeHolding.coinSymbol}
                            </span>
                          </div>
                          {!hasSufficientCrypto && (
                            <p className="text-red-600 font-semibold pt-1">Insufficient {activeHolding.coinSymbol} balance for this payment.</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
                      You have no crypto holdings. Visit the{" "}
                      <a href="/dashboard/crypto" className="font-bold underline">Crypto Marketplace</a>{" "}
                      to purchase digital assets first.
                    </div>
                  )}
                </div>
              </div>
            )}

            {payError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{payError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (paymentMethod === "bank"   && !!form.amount && !hasSufficientBank) ||
                (paymentMethod === "crypto" && (holdings.length === 0 || (!!form.amount && !hasSufficientCrypto)))
              }
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <>
                    <span>
                      {paymentMethod === "crypto" && cryptoRequired > 0
                        ? `Pay ${cryptoRequired.toFixed(6)} ${activeHolding?.coinSymbol || "Crypto"}`
                        : `Pay Now`
                      }
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
              }
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
