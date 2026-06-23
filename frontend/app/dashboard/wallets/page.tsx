"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Loader2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  History
} from "lucide-react";
import { walletsApi, cryptoApi, transactionsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"deposit" | "withdraw" | "history">("deposit");

  // Copy status
  const [copied, setCopied] = useState(false);

  // Deposit / Withdrawal forms
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  async function loadData() {
    try {
      const [walletList, marketList, txListRes] = await Promise.all([
        walletsApi.getWallets(),
        cryptoApi.getMarkets(),
        transactionsApi.getTransactions({ limit: 100 })
      ]);
      
      setWallets(walletList || []);
      setMarkets(marketList || []);
      
      // Filter transactions related to crypto wallets (deposit & withdrawal)
      const walletTxs = (txListRes.transactions || []).filter(
        (t: any) => t.type === "crypto_deposit" || t.type === "crypto_withdrawal"
      );
      setTransactions(walletTxs);

      if (walletList && walletList.length > 0 && !selectedWalletId) {
        setSelectedWalletId(walletList[0].id);
      }
    } catch (err) {
      console.error("Failed to load wallets dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedCoinMarket = selectedWallet
    ? markets.find((m) => m.id === selectedWallet.coinId)
    : null;

  const currentPrice = selectedCoinMarket ? selectedCoinMarket.current_price : 1.00;
  const balanceUsd = selectedWallet
    ? parseFloat(selectedWallet.balance) * currentPrice
    : 0;

  // Filter transactions for the selected coin
  const filteredTransactions = transactions.filter((t) => {
    if (!selectedWallet) return false;
    const desc = (t.description || "").toLowerCase();
    return desc.includes(selectedWallet.coinSymbol.toLowerCase());
  });

  const handleCopyAddress = () => {
    if (!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError("Enter a valid deposit amount greater than 0");
      return;
    }

    setIsDepositing(true);
    setDepositError(null);
    setDepositSuccess(null);

    try {
      await walletsApi.depositCrypto({
        coinId: selectedWallet.coinId,
        amount: amt
      });
      setDepositSuccess(`${amt} ${selectedWallet.coinSymbol} deposited to your custody wallet.`);
      setDepositAmount("");
      await loadData();
    } catch (err: any) {
      setDepositError(err.message || "Deposit failed. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError("Enter a valid withdrawal amount");
      return;
    }
    if (amt > parseFloat(selectedWallet.balance)) {
      setWithdrawError("Insufficient balance — you cannot withdraw more than your wallet holds");
      return;
    }
    if (!destinationAddress || destinationAddress.trim() === "") {
      setWithdrawError("Destination address is required");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      await walletsApi.withdrawCrypto({
        coinId: selectedWallet.coinId,
        amount: amt,
        destinationAddress: destinationAddress.trim()
      });
      setWithdrawSuccess(`${amt} ${selectedWallet.coinSymbol} withdrawn to ${destinationAddress.trim().slice(0, 12)}...`);
      setWithdrawAmount("");
      setDestinationAddress("");
      await loadData();
    } catch (err: any) {
      setWithdrawError(err.message || "Withdrawal failed. Please check your balance and try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs text-brand-secondary">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-primary" />
            Crypto Custody Wallets
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your deposit addresses and track live crypto assets.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Nodes
        </button>
      </div>

      {/* Main Grid: Left sidebar wallets list, Right interactive card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Wallets navigation list */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h2 className="font-display font-bold text-brand-secondary text-sm mb-3">Custodian Wallets</h2>
            <div className="space-y-2">
              {wallets.map((w) => {
                const coinMarket = markets.find((m) => m.id === w.coinId);
                const price = coinMarket ? coinMarket.current_price : 1.00;
                const usd = parseFloat(w.balance) * price;
                const active = w.id === selectedWalletId;

                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedWalletId(w.id);
                      setDepositSuccess(null);
                      setDepositError(null);
                      setWithdrawSuccess(null);
                      setWithdrawError(null);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? "bg-[#0A2342] text-white border-[#0A2342] shadow-md"
                        : "bg-white border-gray-100 hover:bg-gray-50 text-brand-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        active ? "bg-white/10 text-white" : "bg-brand-primary/10 text-brand-primary"
                      }`}>
                        {w.coinSymbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{w.coinName}</div>
                        <div className={`text-[10px] ${active ? "text-white/60" : "text-gray-400"}`}>
                          {w.coinSymbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold font-mono">
                        {parseFloat(w.balance).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                      </div>
                      <div className={`text-[10px] font-mono ${active ? "text-white/60" : "text-gray-400"}`}>
                        ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Wallet details, Address details, deposit/withdraw tabs */}
        <div className="lg:col-span-8 space-y-6">
          {selectedWallet ? (
            <>
              {/* Premium Header Card */}
              <div className="bg-gradient-to-br from-[#0A2342] to-[#1e3a8a] text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Custody Node: {selectedWallet.coinSymbol}
                    </span>
                    <h2 className="font-display font-bold text-lg mt-1">{selectedWallet.coinName} Custody Account</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">Live {selectedWallet.coinSymbol} Price</span>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-5 border-t border-white/10">
                  <div>
                    <span className="text-white/40 block text-[10px]">Custody Balance</span>
                    <span className="font-display font-extrabold text-2xl font-mono">
                      {parseFloat(selectedWallet.balance).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 })} {selectedWallet.coinSymbol}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
                    <span className="text-white/40 block text-[9px]">USD Valuation</span>
                    <span className="font-mono font-bold text-base">
                      ${balanceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Tabs Card */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5">
                <div className="flex gap-2 border-b border-gray-100 pb-3">
                  {[
                    { id: "deposit", label: "Receive & Deposit", icon: ArrowDownLeft },
                    { id: "withdraw", label: "Send & Withdraw", icon: ArrowUpRight },
                    { id: "history", label: "Wallet Logs", icon: History }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                        activeSubTab === tab.id
                          ? "bg-brand-primary/10 text-brand-primary"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub Tab Contents */}
                <div>
                  {activeSubTab === "deposit" && (
                    <div className="space-y-5 max-w-xl">
                      {/* Wallet address row */}
                      <div className="space-y-1.5">
                        <label className="text-gray-500 font-semibold block text-[10px] uppercase tracking-wide flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          Your {selectedWallet.coinSymbol} Deposit Address
                        </label>
                        <div className="flex gap-2">
                          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl font-mono text-[11px] text-brand-secondary break-all flex-1 select-all leading-relaxed">
                            {selectedWallet.address}
                          </div>
                          <button
                            onClick={handleCopyAddress}
                            className="px-3.5 bg-gray-50 border border-gray-200 hover:border-brand-primary rounded-xl text-gray-600 hover:text-brand-primary transition-all flex items-center justify-center shadow-sm cursor-pointer shrink-0"
                            title="Copy to clipboard"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Important notice */}
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl space-y-1.5 leading-relaxed">
                        <h3 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Important Deposit Instructions:
                        </h3>
                        <p className="text-[11px] font-medium">
                          Send only <strong className="text-amber-950">{selectedWallet.coinSymbol}</strong> to this address. Sending other assets will result in permanent loss. Payouts are credited instantly after 1 block confirmation.
                        </p>
                      </div>

                      {/* Deposit form */}
                      <form onSubmit={handleDeposit} className="space-y-4">
                        <h4 className="font-bold text-brand-secondary text-xs flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-brand-primary" />
                          Deposit Amount
                        </h4>

                        {depositSuccess && (
                          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{depositSuccess}</span>
                          </div>
                        )}

                        {depositError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span>{depositError}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-gray-600 font-semibold block">Amount ({selectedWallet.coinSymbol})</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0.000001"
                              required
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="e.g. 0.25"
                              className="form-input pr-16"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-gray-400">
                              {selectedWallet.coinSymbol}
                            </span>
                          </div>
                          {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              ≈ ${(parseFloat(depositAmount) * currentPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD at current price
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isDepositing}
                          className="w-full btn-primary py-3 justify-center text-xs"
                        >
                          {isDepositing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              Processing deposit...
                            </>
                          ) : (
                            "Confirm Deposit"
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  {activeSubTab === "withdraw" && (
                    <form onSubmit={handleWithdrawal} className="space-y-4 max-w-xl">
                      <h4 className="font-bold text-brand-secondary text-xs flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-brand-primary" />
                        Withdraw / Transfer Out
                      </h4>

                      {withdrawSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{withdrawSuccess}</span>
                        </div>
                      )}

                      {withdrawError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>{withdrawError}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-gray-600 font-semibold block">Destination Wallet Address</label>
                        <input
                          type="text"
                          required
                          value={destinationAddress}
                          onChange={(e) => setDestinationAddress(e.target.value)}
                          placeholder={`Enter destination ${selectedWallet.coinSymbol} address`}
                          className="form-input font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-600 font-semibold block">Withdrawal Amount ({selectedWallet.coinSymbol})</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="e.g. 0.05"
                            className="form-input pr-16"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-gray-400">
                            {selectedWallet.coinSymbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-0.5">
                          <span>Custodian Fee: 0.00000000 {selectedWallet.coinSymbol}</span>
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(selectedWallet.balance)}
                            className="text-brand-primary font-bold hover:underline cursor-pointer"
                          >
                            Send Max ({parseFloat(selectedWallet.balance).toLocaleString("en-US", { maximumFractionDigits: 8 })} {selectedWallet.coinSymbol})
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isWithdrawing}
                        className="w-full btn-primary py-3 justify-center text-xs"
                      >
                        {isWithdrawing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            Broadcasting to blockchain...
                          </>
                        ) : (
                              "Confirm Withdrawal"
                        )}
                      </button>
                    </form>
                  )}

                  {activeSubTab === "history" && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-brand-secondary text-sm flex items-center gap-1.5">
                        <History className="w-4 h-4 text-brand-primary" />
                        Audit Ledger logs for {selectedWallet.coinSymbol}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] text-gray-400 border-b border-gray-100 font-bold uppercase">
                              <th className="py-2.5">Reference</th>
                              <th className="py-2.5">Date</th>
                              <th className="py-2.5">Operation</th>
                              <th className="py-2.5">Status</th>
                              <th className="py-2.5 text-right">Value (USD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-[11px] font-semibold">
                            {filteredTransactions.map((tx) => {
                              const isDep = tx.type === "crypto_deposit";
                              const date = new Date(tx.createdAt);
                              return (
                                <tr key={tx.id} className="hover:bg-gray-50/30">
                                  <td className="py-3 font-mono text-brand-primary truncate max-w-[100px]" title={tx.transactionReference}>
                                    {tx.transactionReference}
                                  </td>
                                  <td className="py-3 text-gray-500">{date.toLocaleString()}</td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-1.5 text-brand-secondary">
                                      {isDep ? (
                                        <ArrowDownLeft className="w-3.5 h-3.5 text-green-600 bg-green-50 rounded-full p-0.5" />
                                      ) : (
                                        <ArrowUpRight className="w-3.5 h-3.5 text-red-600 bg-red-50 rounded-full p-0.5" />
                                      )}
                                      <span className="truncate max-w-[200px]" title={tx.description}>{tx.description}</span>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-green-50 border border-green-150 text-green-700 rounded-full text-[9px] font-bold uppercase">
                                      {tx.status}
                                    </span>
                                  </td>
                                  <td className={`py-3 text-right font-bold ${isDep ? "text-green-600" : "text-red-500"}`}>
                                    {isDep ? "+" : "-"}${parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredTransactions.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium text-[11px]">
                                  No transaction records logged on ledger for this crypto asset.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 text-sm shadow-sm">
              Please select a custody wallet to view address details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
