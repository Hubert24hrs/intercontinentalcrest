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
  History,
  Activity,
  Lock,
  Globe,
  Zap,
} from "lucide-react";
import { walletsApi, cryptoApi, transactionsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const COIN_GRADIENTS: Record<string, string> = {
  BTC:  "from-orange-400 to-yellow-500",
  ETH:  "from-violet-500 to-indigo-600",
  BNB:  "from-yellow-400 to-amber-500",
  SOL:  "from-purple-500 to-pink-500",
  XRP:  "from-blue-400 to-cyan-500",
  USDT: "from-emerald-500 to-teal-500",
  USDC: "from-blue-500 to-indigo-500",
  ADA:  "from-blue-600 to-indigo-700",
  DOGE: "from-yellow-400 to-orange-400",
  DOT:  "from-pink-500 to-rose-600",
};

function coinGradient(symbol: string) {
  return COIN_GRADIENTS[symbol.toUpperCase()] ?? "from-brand-primary to-brand-secondary";
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"deposit" | "withdraw" | "history">("deposit");

  const [copied, setCopied] = useState(false);

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

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedCoinMarket = selectedWallet ? markets.find((m) => m.id === selectedWallet.coinId) : null;
  const currentPrice = selectedCoinMarket ? selectedCoinMarket.current_price : 1.00;
  const balanceUsd = selectedWallet ? parseFloat(selectedWallet.balance) * currentPrice : 0;
  const change24h: number = selectedCoinMarket?.price_change_percentage_24h ?? 0;

  const totalPortfolioUsd = wallets.reduce((sum, w) => {
    const cm = markets.find((m) => m.id === w.coinId);
    const price = cm ? cm.current_price : 1.00;
    return sum + parseFloat(w.balance) * price;
  }, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (!selectedWallet) return false;
    return (t.description || "").toLowerCase().includes(selectedWallet.coinSymbol.toLowerCase());
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
    if (isNaN(amt) || amt <= 0) { setDepositError("Enter a valid deposit amount greater than 0"); return; }
    setIsDepositing(true); setDepositError(null); setDepositSuccess(null);
    try {
      await walletsApi.depositCrypto({ coinId: selectedWallet.coinId, amount: amt });
      setDepositSuccess(`${amt} ${selectedWallet.coinSymbol} deposited to your custody wallet.`);
      setDepositAmount("");
      await loadData();
    } catch (err: any) {
      setDepositError(err.message || "Deposit failed. Please try again.");
    } finally { setIsDepositing(false); }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) { setWithdrawError("Enter a valid withdrawal amount"); return; }
    if (amt > parseFloat(selectedWallet.balance)) { setWithdrawError("Insufficient balance — you cannot withdraw more than your wallet holds"); return; }
    if (!destinationAddress || destinationAddress.trim() === "") { setWithdrawError("Destination address is required"); return; }
    setIsWithdrawing(true); setWithdrawError(null); setWithdrawSuccess(null);
    try {
      await walletsApi.withdrawCrypto({ coinId: selectedWallet.coinId, amount: amt, destinationAddress: destinationAddress.trim() });
      setWithdrawSuccess(`${amt} ${selectedWallet.coinSymbol} withdrawn to ${destinationAddress.trim().slice(0, 12)}...`);
      setWithdrawAmount(""); setDestinationAddress("");
      await loadData();
    } catch (err: any) {
      setWithdrawError(err.message || "Withdrawal failed. Check your balance and try again.");
    } finally { setIsWithdrawing(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A2342] to-[#1a3a6e] flex items-center justify-center shadow-lg animate-pulse">
          <Globe className="w-7 h-7 text-brand-primary" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Retrieving secure cryptographic nodes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs text-brand-secondary">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-[#0A2342] flex items-center justify-center shadow-md">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            Crypto Custody Wallets
          </h1>
          <p className="text-gray-500 text-sm mt-0.5 ml-10.5">
            Manage deposit addresses, track live crypto assets, and run transfer simulations.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left column: portfolio summary + wallet list ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Portfolio summary card */}
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0A2342] to-[#0d3060]" />
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brand-primary/20 blur-3xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl translate-y-8 -translate-x-8" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
            />
            <div className="relative p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                  <Activity className="w-3 h-3 text-brand-primary" />
                </div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Portfolio Overview</span>
              </div>
              <div className="font-display font-extrabold text-3xl tracking-tight">
                ${totalPortfolioUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-white/40 text-[10px] mt-1.5 font-mono flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {wallets.length} custodian wallets active
              </div>
            </div>
          </div>

          {/* Wallet list */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-display font-bold text-brand-secondary text-xs uppercase tracking-wider">Custodian Wallets</h2>
              <span className="text-[9px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                {wallets.length} assets
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {wallets.map((w) => {
                const cm = markets.find((m) => m.id === w.coinId);
                const price = cm ? cm.current_price : 1.00;
                const usd = parseFloat(w.balance) * price;
                const active = w.id === selectedWalletId;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedWalletId(w.id);
                      setDepositSuccess(null); setDepositError(null);
                      setWithdrawSuccess(null); setWithdrawError(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-all border-l-[3px] ${
                      active
                        ? "bg-gradient-to-r from-brand-primary/8 to-transparent border-brand-primary"
                        : "hover:bg-gray-50/80 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${coinGradient(w.coinSymbol)} flex items-center justify-center font-bold text-white text-[11px] shadow-md flex-shrink-0`}>
                        {w.coinSymbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-[11px] truncate ${active ? "text-brand-primary" : "text-brand-secondary"}`}>
                          {w.coinName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{w.coinSymbol}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-bold font-mono text-[11px] ${active ? "text-brand-primary" : "text-brand-secondary"}`}>
                        {parseFloat(w.balance).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      </div>
                      <div className="text-[9px] font-mono text-gray-400">
                        ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right column: wallet detail ── */}
        <div className="lg:col-span-8 space-y-5">
          {selectedWallet ? (
            <>
              {/* Hero custody card */}
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#040d1a] via-[#0A2342] to-[#0e3468]" />
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-brand-primary/15 blur-3xl -translate-y-20 translate-x-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl translate-y-20 -translate-x-20" />
                <div
                  className="absolute inset-0 opacity-[0.035]"
                  style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                />
                {/* Diagonal accent line */}
                <div className="absolute top-0 right-24 w-px h-full bg-gradient-to-b from-brand-primary/20 via-brand-primary/5 to-transparent rotate-12 origin-top" />

                <div className="relative text-white p-6 md:p-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${coinGradient(selectedWallet.coinSymbol)} flex items-center justify-center font-bold text-white text-sm shadow-lg`}>
                          {selectedWallet.coinSymbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-brand-primary/25 text-brand-primary border border-brand-primary/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Custody Node
                            </span>
                            <span className="text-[9px] bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                              {selectedWallet.coinSymbol}
                            </span>
                          </div>
                          <h2 className="font-display font-bold text-xl mt-1">{selectedWallet.coinName} Custody Account</h2>
                        </div>
                      </div>
                    </div>
                    <div className="text-right bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 justify-end mb-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">Live Price</span>
                      </div>
                      <span className="font-mono font-bold text-base text-emerald-400">
                        ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      {change24h !== 0 && (
                        <div className={`text-[9px] font-mono font-bold mt-0.5 ${change24h >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
                          {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-7 pt-5 border-t border-white/10 grid grid-cols-2 gap-4 items-end">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-widest font-bold mb-1.5">Custody Balance</span>
                      <div className="font-display font-extrabold text-2xl md:text-3xl font-mono tracking-tight leading-none">
                        {parseFloat(selectedWallet.balance).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                        <span className="text-brand-primary font-bold ml-2 text-base md:text-lg">{selectedWallet.coinSymbol}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm text-right">
                      <span className="text-white/40 block text-[9px] uppercase tracking-widest font-bold mb-1">USD Valuation</span>
                      <span className="font-mono font-bold text-xl">
                        ${balanceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-[10px] text-emerald-400/80 font-semibold">
                      256-bit encrypted custody node · Verifiable on-chain
                    </span>
                  </div>
                </div>
              </div>

              {/* Action tabs card */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                {/* Tab bar */}
                <div className="flex items-center gap-1 p-2 bg-gray-50/80 border-b border-gray-100">
                  {[
                    { id: "deposit",  label: "Receive & Deposit", icon: ArrowDownLeft },
                    { id: "withdraw", label: "Send & Withdraw",   icon: ArrowUpRight  },
                    { id: "history",  label: "Wallet Logs",       icon: History       },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all text-xs cursor-pointer flex-1 justify-center ${
                        activeSubTab === tab.id
                          ? "bg-white text-brand-primary shadow-sm border border-gray-100"
                          : "text-gray-400 hover:text-brand-secondary hover:bg-white/60"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-5 md:p-6">
                  <AnimatePresence mode="wait">

                    {activeSubTab === "deposit" && (
                      <motion.div
                        key="deposit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-5"
                      >
                        {/* Warning banner */}
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl p-4">
                          <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-amber-900 text-xs mb-0.5 flex items-center gap-1.5">
                              Important Deposit Instructions
                            </h3>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              Send only <strong className="text-amber-950">{selectedWallet.coinSymbol}</strong> to this address.
                              Sending other assets will result in permanent loss.
                              Payouts are credited instantly after 1 block confirmation.
                            </p>
                          </div>
                        </div>

                        {/* Terminal address display */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-brand-secondary flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-brand-primary" />
                              Your {selectedWallet.coinSymbol} Deposit Address
                            </label>
                            <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Encrypted
                            </span>
                          </div>
                          <div className="flex gap-2 items-stretch">
                            <div className="flex-1 bg-[#060f1e] border border-brand-primary/20 rounded-xl p-4 font-mono text-[11px] text-emerald-400 break-all leading-relaxed select-all shadow-inner">
                              {selectedWallet.address}
                            </div>
                            <button
                              onClick={handleCopyAddress}
                              className={`px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-w-[58px] border ${
                                copied
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5"
                              }`}
                              title="Copy to clipboard"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span className="text-[9px]">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span className="text-[9px]">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                            Or credit via simulation
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
                        </div>

                        {/* Deposit form */}
                        <form onSubmit={handleDeposit} className="space-y-4">
                          <h4 className="font-bold text-brand-secondary text-xs flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-brand-primary" />
                            Deposit / Credit Wallet
                          </h4>

                          {depositSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span>{depositSuccess}</span>
                            </div>
                          )}
                          {depositError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <span>{depositError}</span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-gray-600 font-semibold text-xs block">
                              Deposit Amount ({selectedWallet.coinSymbol})
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                required
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="e.g. 0.25"
                                className="form-input pr-16"
                              />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-gray-400 text-xs">
                                {selectedWallet.coinSymbol}
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isDepositing}
                            className="w-full btn-primary py-3 justify-center text-xs"
                          >
                            {isDepositing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                Crediting node...
                              </>
                            ) : (
                              "Confirm Deposit"
                            )}
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {activeSubTab === "withdraw" && (
                      <motion.div
                        key="withdraw"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.18 }}
                      >
                        <form onSubmit={handleWithdrawal} className="space-y-4 max-w-xl">
                          <h4 className="font-bold text-brand-secondary text-xs flex items-center gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5 text-brand-primary" />
                            Withdraw / Transfer Out
                          </h4>

                          {withdrawSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span>{withdrawSuccess}</span>
                            </div>
                          )}
                          {withdrawError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <span>{withdrawError}</span>
                            </div>
                          )}

                          {/* Balance chip */}
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${coinGradient(selectedWallet.coinSymbol)} flex items-center justify-center text-white font-bold text-[9px]`}>
                              {selectedWallet.coinSymbol.slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-gray-500 font-semibold">Available balance</span>
                              <div className="font-mono font-bold text-brand-secondary text-xs">
                                {parseFloat(selectedWallet.balance).toLocaleString("en-US", { maximumFractionDigits: 8 })} {selectedWallet.coinSymbol}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">
                              ≈ ${balanceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-gray-600 font-semibold text-xs block">Destination Wallet Address</label>
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
                            <label className="text-gray-600 font-semibold text-xs block">
                              Withdrawal Amount ({selectedWallet.coinSymbol})
                            </label>
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
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-gray-400 text-xs">
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
                                Send Max
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
                      </motion.div>
                    )}

                    {activeSubTab === "history" && (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4"
                      >
                        <h4 className="font-bold text-brand-secondary text-sm flex items-center gap-1.5">
                          <History className="w-4 h-4 text-brand-primary" />
                          Audit Ledger — {selectedWallet.coinSymbol}
                        </h4>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <th className="px-4 py-3">Reference</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Operation</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Value (USD)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-[11px] font-semibold">
                              {filteredTransactions.map((tx) => {
                                const isDep = tx.type === "crypto_deposit";
                                const date = new Date(tx.createdAt);
                                return (
                                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-4 py-3 font-mono text-brand-primary truncate max-w-[100px]" title={tx.transactionReference}>
                                      {tx.transactionReference}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{date.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1.5 text-brand-secondary">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDep ? "bg-emerald-50" : "bg-red-50"}`}>
                                          {isDep
                                            ? <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                            : <ArrowUpRight className="w-3 h-3 text-red-500" />
                                          }
                                        </div>
                                        <span className="truncate max-w-[180px]" title={tx.description}>{tx.description}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold uppercase">
                                        {tx.status}
                                      </span>
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold font-mono ${isDep ? "text-emerald-600" : "text-red-500"}`}>
                                      {isDep ? "+" : "-"}${parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                              {filteredTransactions.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 font-medium text-[11px]">
                                    No transaction records logged on ledger for this crypto asset.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 text-sm shadow-sm">
              Select a custody wallet to view address details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
